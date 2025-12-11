import type { Prisma } from '@prisma/client';
import {
  NotificationEntity as PrismaNotificationEntity,
  NotificationKind as PrismaNotificationKind,
} from '@prisma/client';
import { GraphQLError } from 'graphql';
import { createDmPairKey, sanitizeDmContent } from '../../../lib/chat-utils';
import { checkDmSendRateLimit } from '../../../lib/chat-rate-limit';
import { prisma } from '../../../lib/prisma';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import type { MutationResolvers } from '../../__generated__/resolvers-types';
import { checkDmAllowed } from '../chat-guards';
import {
  createPairKey,
  mapDmMessage,
  mapDmThread,
  mapNotification,
  DmThreadWithGraph,
  DmMessageWithGraph,
  NotificationWithGraph,
} from '../helpers';
import type { DmThread as GQLDmThread } from '../../__generated__/resolvers-types';
import { isAdminOrModerator } from '../shared/auth-guards';

/**
 * Include for DM Message queries.
 */
const DM_MESSAGE_INCLUDE = {
  sender: true,
  thread: {
    include: {
      aUser: true,
      bUser: true,
    },
  },
  replyTo: {
    include: {
      sender: true,
    },
  },
} satisfies Prisma.DmMessageInclude;

/**
 * Notification include for DM-related notifications.
 */
const NOTIFICATION_INCLUDE = {
  recipient: true,
  actor: true,
  event: {
    include: {
      categories: true,
      tags: true,
      members: { include: { user: true, addedBy: true } },
      owner: true,
      canceledBy: true,
      deletedBy: true,
    },
  },
} satisfies Prisma.NotificationInclude;

/**
 * Include for DM Thread queries.
 */
const DM_THREAD_INCLUDE = {
  aUser: true,
  bUser: true,
} satisfies Prisma.DmThreadInclude;

/**
 * Mutation: Create or get existing DM thread
 */
export const createOrGetDmThreadMutation: MutationResolvers['createOrGetDmThread'] =
  resolverWithMetrics(
    'Mutation',
    'createOrGetDmThread',
    async (_p, { userId }, { user }) => {
      if (!user?.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      // Check if DM is allowed (no blocks, not self)
      await checkDmAllowed(user.id, userId);

      // Create canonical pair key
      const pairKey = createDmPairKey(user.id, userId);
      const [aUserId, bUserId] = pairKey.split('|') as [string, string];

      // Find or create thread
      let thread = await prisma.dmThread.findUnique({
        where: { pairKey },
        include: DM_THREAD_INCLUDE,
      });

      if (!thread) {
        thread = await prisma.dmThread.create({
          data: {
            aUserId,
            bUserId,
            pairKey,
          },
          include: DM_THREAD_INCLUDE,
        });
      }

      return mapDmThread(thread as unknown as DmThreadWithGraph);
    }
  );

/**
 * Mutation: Send a DM message (creates thread if doesn't exist)
 */
export const sendDmMessageMutation: MutationResolvers['sendDmMessage'] =
  resolverWithMetrics(
    'Mutation',
    'sendDmMessage',
    async (_p, { input }, { user, pubsub }) => {
      if (!user?.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const { recipientId, content, replyToId } = input;

      // Cannot message yourself
      if (recipientId === user.id) {
        throw new GraphQLError('Cannot send message to yourself.', {
          extensions: { code: 'BAD_USER_INPUT', field: 'recipientId' },
        });
      }

      // Sanitize content (validates length and format)
      const sanitizedContent = sanitizeDmContent(content);

      // Validate replyToId if provided
      if (replyToId) {
        const replyMessage = await prisma.dmMessage.findUnique({
          where: { id: replyToId },
          select: { threadId: true },
        });

        if (!replyMessage) {
          throw new GraphQLError('Reply message not found.', {
            extensions: { code: 'NOT_FOUND', field: 'replyToId' },
          });
        }
      }

      // Verify recipient exists
      const recipient = await prisma.user.findUnique({
        where: { id: recipientId },
        select: { id: true },
      });

      if (!recipient) {
        throw new GraphQLError('Recipient not found.', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Check if sender is blocked by recipient
      const isBlocked = await prisma.userBlock.findUnique({
        where: {
          blockerId_blockedId: {
            blockerId: recipientId,
            blockedId: user.id,
          },
        },
      });

      if (isBlocked) {
        throw new GraphQLError('Cannot send message to this user.', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      const pairKey = createPairKey(user.id, recipientId);
      const [aUserId, bUserId] = pairKey.split('|');

      // Check rate limit (after validation, before DB writes)
      await checkDmSendRateLimit(user.id, pairKey);

      const result = await prisma.$transaction(async (tx) => {
        // Find or create thread
        let thread = await tx.dmThread.findUnique({
          where: { pairKey },
        });

        if (!thread) {
          thread = await tx.dmThread.create({
            data: {
              aUserId: aUserId!,
              bUserId: bUserId!,
              pairKey,
            },
          });
        }

        // Create message
        const message = await tx.dmMessage.create({
          data: {
            threadId: thread.id,
            senderId: user.id,
            content: sanitizedContent,
            replyToId: replyToId || undefined,
          },
          include: DM_MESSAGE_INCLUDE,
        });

        // Update thread lastMessageAt
        await tx.dmThread.update({
          where: { id: thread.id },
          data: { lastMessageAt: message.createdAt },
        });

        // Check if recipient has muted this thread
        const mute = await tx.dmMute.findUnique({
          where: {
            threadId_userId: {
              threadId: thread.id,
              userId: recipientId,
            },
          },
        });

        // Create notification if not muted
        if (!mute || !mute.muted) {
          const notification = await tx.notification.create({
            data: {
              kind: PrismaNotificationKind.NEW_MESSAGE,
              recipientId,
              actorId: user.id,
              entityType: PrismaNotificationEntity.MESSAGE,
              entityId: message.id,
              title: null,
              body: null,
              dedupeKey: `dm_message:${recipientId}:${message.id}`,
              data: {
                actorName: user.name,
                messageContent: sanitizedContent.substring(0, 100),
                threadId: thread.id,
              },
            },
            include: NOTIFICATION_INCLUDE,
          });

          // Publish notification via WebSocket
          await pubsub?.publish({
            topic: `NOTIFICATION_ADDED:${recipientId}`,
            payload: {
              notificationAdded: mapNotification(
                notification as unknown as NotificationWithGraph
              ),
            },
          });

          await pubsub?.publish({
            topic: `NOTIFICATION_BADGE:${recipientId}`,
            payload: { notificationBadgeChanged: { recipientId } },
          });
        }

        return message;
      });

      // Publish DM message to WebSocket subscribers
      await pubsub?.publish({
        topic: `dmMessageAdded:${result.threadId}`,
        payload: {
          dmMessageAdded: mapDmMessage(result as unknown as DmMessageWithGraph),
        },
      });

      return mapDmMessage(result as unknown as DmMessageWithGraph);
    }
  );

/**
 * Mutation: Update a DM message
 */
export const updateDmMessageMutation: MutationResolvers['updateDmMessage'] =
  resolverWithMetrics(
    'Mutation',
    'updateDmMessage',
    async (_p, { id, input }, { user, pubsub }) => {
      if (!user?.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const { content } = input;

      // Sanitize content (validates length and format)
      const sanitizedContent = sanitizeDmContent(content);

      // Find message and verify ownership
      const existing = await prisma.dmMessage.findUnique({
        where: { id },
        select: { senderId: true, deletedAt: true, threadId: true },
      });

      if (!existing) {
        throw new GraphQLError('Message not found.', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // SELF or APP_MOD_OR_ADMIN
      const isAuthor = existing.senderId === user.id;
      const isAppMod = isAdminOrModerator(user);
      if (!isAuthor && !isAppMod) {
        throw new GraphQLError('Cannot edit messages from other users.', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      if (existing.deletedAt) {
        throw new GraphQLError('Cannot edit deleted message.', {
          extensions: { code: 'FAILED_PRECONDITION' },
        });
      }

      const updated = await prisma.dmMessage.update({
        where: { id },
        data: {
          content: sanitizedContent,
          editedAt: new Date(),
        },
        include: DM_MESSAGE_INCLUDE,
      });

      const result = mapDmMessage(updated as unknown as DmMessageWithGraph);

      // Publish update event
      await pubsub.publish({
        topic: `dmMessageUpdated:${existing.threadId}`,
        payload: {
          dmMessageUpdated: result,
        },
      });

      return result;
    }
  );

/**
 * Mutation: Delete a DM message (soft delete)
 */
export const deleteDmMessageMutation: MutationResolvers['deleteDmMessage'] =
  resolverWithMetrics(
    'Mutation',
    'deleteDmMessage',
    async (_p, { id }, { user, pubsub }) => {
      if (!user?.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const existing = await prisma.dmMessage.findUnique({
        where: { id },
        select: { senderId: true, deletedAt: true, threadId: true },
      });

      if (!existing) {
        return false; // Idempotent
      }

      // SELF or APP_MOD_OR_ADMIN
      const isAuthor = existing.senderId === user.id;
      const isAppMod = isAdminOrModerator(user);
      if (!isAuthor && !isAppMod) {
        throw new GraphQLError('Cannot delete messages from other users.', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      if (existing.deletedAt) {
        return true; // Already deleted
      }

      const deletedAt = new Date();
      await prisma.dmMessage.update({
        where: { id },
        data: { deletedAt },
      });

      // Publish delete event
      await pubsub.publish({
        topic: `dmMessageDeleted:${existing.threadId}`,
        payload: {
          dmMessageDeleted: {
            messageId: id,
            deletedAt: deletedAt.toISOString(),
          },
        },
      });

      return true;
    }
  );

/**
 * Mutation: Mark a single message as read
 */
export const markDmMessageReadMutation: MutationResolvers['markDmMessageRead'] =
  resolverWithMetrics(
    'Mutation',
    'markDmMessageRead',
    async (_p, { id }, { user }) => {
      if (!user?.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const message = await prisma.dmMessage.findUnique({
        where: { id },
        include: {
          thread: {
            select: { aUserId: true, bUserId: true },
          },
        },
      });

      if (!message) {
        return false;
      }

      // Verify user is part of thread
      if (
        message.thread.aUserId !== user.id &&
        message.thread.bUserId !== user.id
      ) {
        throw new GraphQLError('Access denied.', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      // Can only mark messages from others as read
      if (message.senderId === user.id) {
        return true; // Own messages are always "read"
      }

      if (message.readAt) {
        return true; // Already read
      }

      await prisma.dmMessage.update({
        where: { id },
        data: { readAt: new Date() },
      });

      return true;
    }
  );

/**
 * Mutation: Mark all messages in a thread as read
 * Uses DmRead table to track lastReadAt timestamp per user
 */
export const markDmThreadReadMutation: MutationResolvers['markDmThreadRead'] =
  resolverWithMetrics(
    'Mutation',
    'markDmThreadRead',
    async (_p, { threadId }, { user, pubsub }) => {
      if (!user?.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const thread = await prisma.dmThread.findUnique({
        where: { id: threadId },
        select: { aUserId: true, bUserId: true },
      });

      if (!thread) {
        throw new GraphQLError('Thread not found.', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      if (thread.aUserId !== user.id && thread.bUserId !== user.id) {
        throw new GraphQLError('Access denied.', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      const now = new Date();

      // Upsert DmRead record
      await prisma.dmRead.upsert({
        where: {
          threadId_userId: {
            threadId,
            userId: user.id,
          },
        },
        create: {
          threadId,
          userId: user.id,
          lastReadAt: now,
        },
        update: {
          lastReadAt: now,
        },
      });

      // Count how many messages were marked as read (for backwards compatibility)
      const unreadCount = await prisma.dmMessage.count({
        where: {
          threadId,
          senderId: { not: user.id },
          deletedAt: null,
          createdAt: {
            gt:
              (
                await prisma.dmRead.findUnique({
                  where: {
                    threadId_userId: {
                      threadId,
                      userId: user.id,
                    },
                  },
                  select: { lastReadAt: true },
                })
              )?.lastReadAt || new Date(0),
          },
        },
      });

      // Publish read event to notify other user (sender) about read status
      // This allows real-time "Seen" updates
      await pubsub?.publish({
        topic: `dmMessageAdded:${threadId}`,
        payload: {
          dmMessageAdded: {
            // Dummy message to trigger invalidation
            id: 'read-event',
            threadId,
            senderId: user.id,
            content: '',
            createdAt: now,
            readAt: now,
            deletedAt: null,
            sender: { id: user.id, name: '', avatarKey: null },
            thread: null as unknown as GQLDmThread, // Will be resolved by field
            reactions: [],
          },
        },
      });

      return unreadCount;
    }
  );

/**
 * Mutation: Delete entire thread
 */
export const deleteDmThreadMutation: MutationResolvers['deleteDmThread'] =
  resolverWithMetrics(
    'Mutation',
    'deleteDmThread',
    async (_p, { id }, { user }) => {
      if (!user?.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const thread = await prisma.dmThread.findUnique({
        where: { id },
        select: { aUserId: true, bUserId: true },
      });

      if (!thread) {
        return false; // Idempotent
      }

      if (thread.aUserId !== user.id && thread.bUserId !== user.id) {
        throw new GraphQLError('Access denied.', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      // Soft delete all messages in thread
      await prisma.dmMessage.updateMany({
        where: {
          threadId: id,
          senderId: user.id,
          deletedAt: null,
        },
        data: { deletedAt: new Date() },
      });

      // Note: We don't actually delete the thread, just the user's messages
      // This allows the other user to still see their messages
      return true;
    }
  );

/**
 * Publish typing indicator for DM thread
 */
export const publishDmTypingMutation: MutationResolvers['publishDmTyping'] =
  resolverWithMetrics(
    'Mutation',
    'publishDmTyping',
    async (_p, { threadId, isTyping }, { user, pubsub }) => {
      if (!user?.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      // Verify user has access to thread
      const thread = await prisma.dmThread.findUnique({
        where: { id: threadId },
      });

      if (!thread) {
        throw new GraphQLError('Thread not found.', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Check if user is part of the thread
      if (thread.aUserId !== user.id && thread.bUserId !== user.id) {
        throw new GraphQLError('Access denied.', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      // Publish typing event
      await pubsub?.publish({
        topic: `dmTyping:${threadId}`,
        payload: {
          dmTyping: {
            userId: user.id,
            isTyping,
          },
        },
      });

      return true;
    }
  );
