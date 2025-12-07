/**
 * Event Chat Mutation Resolvers
 */

import type { Prisma } from '@prisma/client';
import {
  NotificationEntity as PrismaNotificationEntity,
  NotificationKind as PrismaNotificationKind,
  Role,
} from '@prisma/client';
import { GraphQLError } from 'graphql';
import {
  checkDeleteRateLimit,
  checkEditRateLimit,
  checkEventChatSendRateLimit,
} from '../../../lib/chat-rate-limit';
import {
  canEdit,
  canSoftDelete,
  sanitizeMessageContent,
} from '../../../lib/chat-utils';
import { prisma } from '../../../lib/prisma';
import { healthRedis } from '../../../lib/redis';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import type { MutationResolvers } from '../../__generated__/resolvers-types';
import { requireEventChatModerator, requireJoinedMember } from '../chat-guards';
import {
  mapIntentChatMessage,
  type IntentChatMessageWithGraph,
} from '../helpers';

const MESSAGE_INCLUDE = {
  author: true,
  intent: true,
  replyTo: {
    include: {
      author: true,
    },
  },
} satisfies Prisma.IntentChatMessageInclude;

/**
 * Mutation: Send a message in event chat
 */
export const sendIntentMessageMutation: MutationResolvers['sendIntentMessage'] =
  resolverWithMetrics(
    'Mutation',
    'sendIntentMessage',
    async (_p, { input }, { user, pubsub }) => {
      if (!user?.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const { intentId, content, replyToId } = input;

      // Guard: user must be JOINED
      await requireJoinedMember(user.id, intentId);

      // Rate limit
      await checkEventChatSendRateLimit(user.id, intentId);

      // Sanitize content
      const sanitizedContent = sanitizeMessageContent(content);

      // Validate replyTo if provided
      if (replyToId) {
        const replyTo = await prisma.intentChatMessage.findUnique({
          where: { id: replyToId },
          select: { intentId: true, deletedAt: true },
        });

        if (!replyTo || replyTo.intentId !== intentId) {
          throw new GraphQLError('Reply target not found in this intent.', {
            extensions: { code: 'BAD_USER_INPUT', field: 'replyToId' },
          });
        }

        if (replyTo.deletedAt) {
          throw new GraphQLError('Cannot reply to deleted message.', {
            extensions: { code: 'BAD_USER_INPUT', field: 'replyToId' },
          });
        }
      }

      // Create message in transaction (update messagesCount)
      const message = await prisma.$transaction(async (tx) => {
        const msg = await tx.intentChatMessage.create({
          data: {
            intentId,
            authorId: user.id,
            content: sanitizedContent,
            replyToId: replyToId || null,
          },
          include: MESSAGE_INCLUDE,
        });

        // Update intent messagesCount
        await tx.intent.update({
          where: { id: intentId },
          data: { messagesCount: { increment: 1 } },
        });

        return msg;
      });

      // Publish to WebSocket subscribers
      await pubsub.publish({
        topic: `intentMessageAdded:${intentId}`,
        payload: {
          intentMessageAdded: mapIntentChatMessage(
            message as IntentChatMessageWithGraph
          ),
        },
      });

      // Create notifications for other JOINED members (skip muted users)
      const members = await prisma.intentMember.findMany({
        where: {
          intentId,
          status: 'JOINED',
          userId: { not: user.id },
        },
        select: { userId: true },
      });

      // Get muted users
      const mutes = await prisma.intentMute.findMany({
        where: {
          intentId,
          muted: true,
        },
        select: { userId: true },
      });

      const mutedUserIds = new Set(mutes?.map((m) => m.userId) ?? []);

      // Fetch intent title for notification data
      const intent = await prisma.intent.findUnique({
        where: { id: intentId },
        select: { title: true },
      });

      // Create notifications for non-muted members
      const notificationsToCreate = (members ?? [])
        .filter((m) => !mutedUserIds.has(m.userId))
        .map((m) => ({
          kind: PrismaNotificationKind.INTENT_CHAT_MESSAGE,
          recipientId: m.userId,
          actorId: user.id,
          entityType: PrismaNotificationEntity.INTENT,
          entityId: intentId,
          intentId,
          title: null,
          body: null,
          dedupeKey: `event-chat:${intentId}:${message.id}`,
          data: {
            intentId,
            intentTitle: intent?.title,
            actorName: user.name,
            messageContent: sanitizedContent.substring(0, 100),
          },
        }));

      if (notificationsToCreate.length > 0) {
        await prisma.notification.createMany({
          data: notificationsToCreate,
          skipDuplicates: true,
        });
      }

      return mapIntentChatMessage(message as IntentChatMessageWithGraph);
    }
  );

/**
 * Mutation: Edit a message (within 5 minutes)
 */
export const editIntentMessageMutation: MutationResolvers['editIntentMessage'] =
  resolverWithMetrics(
    'Mutation',
    'editIntentMessage',
    async (_p, { id, input }, { user, pubsub }) => {
      if (!user?.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const { content } = input;

      // Rate limit
      await checkEditRateLimit(user.id);

      // Fetch message
      const existing = await prisma.intentChatMessage.findUnique({
        where: { id },
        select: {
          authorId: true,
          intentId: true,
          createdAt: true,
          deletedAt: true,
        },
      });

      if (!existing) {
        throw new GraphQLError('Message not found.', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      if (existing.deletedAt) {
        throw new GraphQLError('Cannot edit deleted message.', {
          extensions: { code: 'FAILED_PRECONDITION' },
        });
      }

      if (existing.authorId !== user.id) {
        throw new GraphQLError('You can only edit your own messages.', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      // Check time window (5 minutes)
      if (!canEdit(existing.createdAt)) {
        throw new GraphQLError(
          'Messages can only be edited within 5 minutes of posting.',
          {
            extensions: { code: 'FAILED_PRECONDITION' },
          }
        );
      }

      // Sanitize content
      const sanitizedContent = sanitizeMessageContent(content);

      // Update message
      const updated = await prisma.intentChatMessage.update({
        where: { id },
        data: {
          content: sanitizedContent,
          editedAt: new Date(),
        },
        include: MESSAGE_INCLUDE,
      });

      const result = mapIntentChatMessage(
        updated as IntentChatMessageWithGraph
      );

      // Publish update to WebSocket
      await pubsub.publish({
        topic: `intentMessageUpdated:${existing.intentId}`,
        payload: {
          intentMessageUpdated: result,
        },
      });

      return result;
    }
  );

/**
 * Mutation: Delete a message
 * - Author can soft-delete within 15 minutes
 * - Moderator/Owner can soft-delete anytime
 * - Owner/Admin can hard-delete
 */
export const deleteIntentMessageMutation: MutationResolvers['deleteIntentMessage'] =
  resolverWithMetrics(
    'Mutation',
    'deleteIntentMessage',
    async (_p, { id, soft = true }, { user, pubsub }) => {
      if (!user?.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      // Rate limit
      await checkDeleteRateLimit(user.id);

      // Fetch message
      const existing = await prisma.intentChatMessage.findUnique({
        where: { id },
        select: {
          authorId: true,
          intentId: true,
          createdAt: true,
          deletedAt: true,
          intent: {
            select: {
              ownerId: true,
            },
          },
        },
      });

      if (!existing) {
        return false; // Idempotent
      }

      const isAuthor = existing.authorId === user.id;
      const isOwner = existing.intent.ownerId === user.id;
      const isAdmin = user.role === Role.ADMIN;

      // Check permissions for soft delete
      if (soft) {
        if (isAuthor) {
          // Author can soft-delete within 15 minutes
          if (!canSoftDelete(existing.createdAt)) {
            throw new GraphQLError(
              'You can only delete your messages within 15 minutes.',
              {
                extensions: { code: 'FAILED_PRECONDITION' },
              }
            );
          }
        } else {
          // Moderator/Owner can soft-delete anytime
          await requireEventChatModerator(user.id, existing.intentId);
        }

        if (existing.deletedAt) {
          return true; // Already deleted
        }

        const deletedAt = new Date();
        await prisma.intentChatMessage.update({
          where: { id },
          data: { deletedAt },
        });

        // Publish delete event
        await pubsub.publish({
          topic: `intentMessageDeleted:${existing.intentId}`,
          payload: {
            intentMessageDeleted: {
              messageId: id,
              deletedAt: deletedAt.toISOString(),
            },
          },
        });

        return true;
      }

      // Hard delete: only Owner or Admin
      if (!isOwner && !isAdmin) {
        throw new GraphQLError(
          'Only the event owner or admin can permanently delete messages.',
          {
            extensions: { code: 'FORBIDDEN' },
          }
        );
      }

      // Hard delete in transaction (decrement messagesCount)
      await prisma.$transaction(async (tx) => {
        await tx.intentChatMessage.delete({
          where: { id },
        });

        await tx.intent.update({
          where: { id: existing.intentId },
          data: { messagesCount: { decrement: 1 } },
        });
      });

      return true;
    }
  );

/**
 * Mutation: Mark intent chat as read
 */
export const markIntentChatReadMutation: MutationResolvers['markIntentChatRead'] =
  resolverWithMetrics(
    'Mutation',
    'markIntentChatRead',
    async (_p, { intentId, at }, { user }) => {
      if (!user?.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      // Guard: user must be JOINED
      await requireJoinedMember(user.id, intentId);

      const timestamp = at ? new Date(at) : new Date();

      // Upsert IntentChatRead
      await prisma.intentChatRead.upsert({
        where: {
          intentId_userId: {
            intentId,
            userId: user.id,
          },
        },
        create: {
          intentId,
          userId: user.id,
          lastReadAt: timestamp,
        },
        update: {
          lastReadAt: timestamp,
        },
      });

      // Invalidate unread count cache
      const cacheKey = `chat:intent:unread:${intentId}:${user.id}`;
      try {
        await healthRedis.del(cacheKey);
      } catch (error) {
        // Log but don't fail on cache errors
        console.error('Redis cache invalidation error:', error);
      }

      return true;
    }
  );

/**
 * Publish typing indicator for intent chat
 */
export const publishIntentTypingMutation: MutationResolvers['publishIntentTyping'] =
  resolverWithMetrics(
    'Mutation',
    'publishIntentTyping',
    async (_p, { intentId, isTyping }, { user, pubsub }) => {
      if (!user?.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      // Guard: user must be JOINED
      await requireJoinedMember(user.id, intentId);

      // Publish typing event
      await pubsub?.publish({
        topic: `intentTyping:${intentId}`,
        payload: {
          intentTyping: {
            userId: user.id,
            isTyping,
          },
        },
      });

      return true;
    }
  );
