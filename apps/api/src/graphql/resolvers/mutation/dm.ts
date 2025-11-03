import type { Prisma } from '@prisma/client';
import {
  NotificationKind as PrismaNotificationKind,
  NotificationEntity as PrismaNotificationEntity,
} from '@prisma/client';
import { GraphQLError } from 'graphql';
import { prisma } from '../../../lib/prisma';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import type { MutationResolvers } from '../../__generated__/resolvers-types';
import {
  mapDmMessage,
  mapDmMute,
  mapDmThread,
  createPairKey,
  mapNotification,
} from '../helpers';
import { createDmPairKey } from '../../../lib/chat-utils';
import { checkDmAllowed } from '../chat-guards';

const DM_MESSAGE_INCLUDE = {
  sender: true,
  thread: {
    include: {
      aUser: true,
      bUser: true,
    },
  },
} satisfies Prisma.DmMessageInclude;

const NOTIFICATION_INCLUDE = {
  recipient: true,
  actor: true,
  intent: {
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

      return mapDmThread(thread as any);
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

      const { recipientId, content } = input;

      // Validate content
      if (!content || content.trim().length === 0) {
        throw new GraphQLError('Message content cannot be empty.', {
          extensions: { code: 'BAD_USER_INPUT', field: 'content' },
        });
      }

      if (content.length > 5000) {
        throw new GraphQLError(
          'Message content too long (max 5000 characters).',
          {
            extensions: { code: 'BAD_USER_INPUT', field: 'content' },
          }
        );
      }

      // Cannot message yourself
      if (recipientId === user.id) {
        throw new GraphQLError('Cannot send message to yourself.', {
          extensions: { code: 'BAD_USER_INPUT', field: 'recipientId' },
        });
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
            content: content.trim(),
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
              title: `New message from ${user.name}`,
              body: content.substring(0, 100),
              dedupeKey: `dm_message:${recipientId}:${message.id}`,
            },
            include: NOTIFICATION_INCLUDE,
          });

          // Publish notification via WebSocket
          await pubsub?.publish({
            topic: `NOTIFICATION_ADDED:${recipientId}`,
            payload: {
              notificationAdded: mapNotification(notification as any),
            },
          });

          await pubsub?.publish({
            topic: `NOTIFICATION_BADGE:${recipientId}`,
            payload: { notificationBadgeChanged: { recipientId } },
          });
        }

        return message;
      });

      return mapDmMessage(result as any);
    }
  );

/**
 * Mutation: Update a DM message
 */
export const updateDmMessageMutation: MutationResolvers['updateDmMessage'] =
  resolverWithMetrics(
    'Mutation',
    'updateDmMessage',
    async (_p, { id, input }, { user }) => {
      if (!user?.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const { content } = input;

      // Validate content
      if (!content || content.trim().length === 0) {
        throw new GraphQLError('Message content cannot be empty.', {
          extensions: { code: 'BAD_USER_INPUT', field: 'content' },
        });
      }

      if (content.length > 5000) {
        throw new GraphQLError(
          'Message content too long (max 5000 characters).',
          {
            extensions: { code: 'BAD_USER_INPUT', field: 'content' },
          }
        );
      }

      // Find message and verify ownership
      const existing = await prisma.dmMessage.findUnique({
        where: { id },
        select: { senderId: true, deletedAt: true },
      });

      if (!existing) {
        throw new GraphQLError('Message not found.', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      if (existing.senderId !== user.id) {
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
        data: { content: content.trim() },
        include: DM_MESSAGE_INCLUDE,
      });

      return mapDmMessage(updated as any);
    }
  );

/**
 * Mutation: Delete a DM message (soft delete)
 */
export const deleteDmMessageMutation: MutationResolvers['deleteDmMessage'] =
  resolverWithMetrics(
    'Mutation',
    'deleteDmMessage',
    async (_p, { id }, { user }) => {
      if (!user?.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const existing = await prisma.dmMessage.findUnique({
        where: { id },
        select: { senderId: true, deletedAt: true },
      });

      if (!existing) {
        return false; // Idempotent
      }

      if (existing.senderId !== user.id) {
        throw new GraphQLError('Cannot delete messages from other users.', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      if (existing.deletedAt) {
        return true; // Already deleted
      }

      await prisma.dmMessage.update({
        where: { id },
        data: { deletedAt: new Date() },
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
 */
export const markDmThreadReadMutation: MutationResolvers['markDmThreadRead'] =
  resolverWithMetrics(
    'Mutation',
    'markDmThreadRead',
    async (_p, { threadId }, { user }) => {
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

      const result = await prisma.dmMessage.updateMany({
        where: {
          threadId,
          senderId: { not: user.id },
          readAt: null,
          deletedAt: null,
        },
        data: { readAt: new Date() },
      });

      return result.count;
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
