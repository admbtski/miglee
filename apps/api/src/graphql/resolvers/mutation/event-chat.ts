/**
 * Event Chat Mutation Resolvers
 */

import type { Prisma } from '../../../prisma-client/client';
import {
  EventMemberRole,
  EventMemberStatus,
  NotificationEntity as PrismaNotificationEntity,
  NotificationKind as PrismaNotificationKind,
  Role,
} from '../../../prisma-client/enums';
import { GraphQLError } from 'graphql';
import {
  assertEventChatSendRateLimit,
  assertEditRateLimit,
  assertDeleteRateLimit,
} from '../../../lib/rate-limit/domainRateLimiter';
import {
  canEdit,
  canSoftDelete,
  sanitizeMessageContent,
} from '../../../lib/chat-utils';
import { logger } from '../../../lib/pino';
import { prisma } from '../../../lib/prisma';
import { healthRedis } from '../../../lib/redis';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import type { MutationResolvers } from '../../__generated__/resolvers-types';
import { requireEventChatModerator, requireJoinedMember } from '../chat-guards';
import {
  mapEventChatMessage,
  type EventChatMessageWithGraph,
} from '../helpers';
import { isAdminOrModerator } from '../shared/auth-guards';

const MESSAGE_INCLUDE = {
  author: true,
  event: true,
  replyTo: {
    include: {
      author: true,
    },
  },
} satisfies Prisma.EventChatMessageInclude;

/**
 * Mutation: Send a message in event chat
 */
export const sendEventMessageMutation: MutationResolvers['sendEventMessage'] =
  resolverWithMetrics(
    'Mutation',
    'sendEventMessage',
    async (_p, { input }, { user, pubsub }) => {
      if (!user?.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const { eventId, content, replyToId } = input;

      // Guard: EVENT_PARTICIPANT or APP_MOD_OR_ADMIN
      if (!isAdminOrModerator(user)) {
        await requireJoinedMember(user.id, eventId);
      }

      // Rate limit
      await assertEventChatSendRateLimit(eventId, user.id);

      // Sanitize content
      const sanitizedContent = sanitizeMessageContent(content);

      // Validate replyTo if provided
      if (replyToId) {
        const replyTo = await prisma.eventChatMessage.findUnique({
          where: { id: replyToId },
          select: { eventId: true, deletedAt: true },
        });

        if (!replyTo || replyTo.eventId !== eventId) {
          throw new GraphQLError('Reply target not found in this event.', {
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
        const msg = await tx.eventChatMessage.create({
          data: {
            eventId,
            authorId: user.id,
            content: sanitizedContent,
            replyToId: replyToId || null,
          },
          include: MESSAGE_INCLUDE,
        });

        // Update event messagesCount
        await tx.event.update({
          where: { id: eventId },
          data: { messagesCount: { increment: 1 } },
        });

        return msg;
      });

      // Publish to WebSocket subscribers
      await pubsub.publish({
        topic: `eventMessageAdded:${eventId}`,
        payload: {
          eventMessageAdded: mapEventChatMessage(
            message as EventChatMessageWithGraph
          ),
        },
      });

      // Create notifications for other JOINED members (skip muted users)
      const members = await prisma.eventMember.findMany({
        where: {
          eventId,
          status: 'JOINED',
          userId: { not: user.id },
        },
        select: { userId: true },
      });

      // Get muted users
      const mutes = await prisma.eventMute.findMany({
        where: {
          eventId,
          muted: true,
        },
        select: { userId: true },
      });

      const mutedUserIds = new Set(mutes?.map((m) => m.userId) ?? []);

      // Fetch event title for notification data
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: { title: true },
      });

      // Create notifications for non-muted members
      const notificationsToCreate = (members ?? [])
        .filter((m) => !mutedUserIds.has(m.userId))
        .map((m) => ({
          kind: PrismaNotificationKind.EVENT_CHAT_MESSAGE,
          recipientId: m.userId,
          actorId: user.id,
          entityType: PrismaNotificationEntity.EVENT,
          entityId: eventId,
          eventId,
          title: null,
          body: null,
          dedupeKey: `event-chat:${eventId}:${message.id}`,
          data: {
            eventId,
            eventTitle: event?.title,
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

      return mapEventChatMessage(message as EventChatMessageWithGraph);
    }
  );

/**
 * Mutation: Edit a message (within 5 minutes)
 */
export const editEventMessageMutation: MutationResolvers['editEventMessage'] =
  resolverWithMetrics(
    'Mutation',
    'editEventMessage',
    async (_p, { id, input }, { user, pubsub }) => {
      if (!user?.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const { content } = input;

      // Rate limit
      await assertEditRateLimit(user.id);

      // Fetch message
      const existing = await prisma.eventChatMessage.findUnique({
        where: { id },
        select: {
          authorId: true,
          eventId: true,
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

      // SELF or EVENT_MOD_OR_OWNER or APP_MOD_OR_ADMIN
      const isAuthor = existing.authorId === user.id;
      const isGlobalMod = isAdminOrModerator(user);

      // Check if event mod/owner
      let isEventMod = false;
      if (!isAuthor && !isGlobalMod) {
        const membership = await prisma.eventMember.findUnique({
          where: {
            eventId_userId: { eventId: existing.eventId, userId: user.id },
          },
          select: { role: true, status: true },
        });
        isEventMod =
          membership?.status === EventMemberStatus.JOINED &&
          (membership?.role === EventMemberRole.OWNER ||
            membership?.role === EventMemberRole.MODERATOR);
      }

      if (!isAuthor && !isGlobalMod && !isEventMod) {
        throw new GraphQLError('You can only edit your own messages.', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      // Check time window (5 minutes) - only applies to author, not moderators
      if (
        isAuthor &&
        !isGlobalMod &&
        !isEventMod &&
        !canEdit(existing.createdAt)
      ) {
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
      const updated = await prisma.eventChatMessage.update({
        where: { id },
        data: {
          content: sanitizedContent,
          editedAt: new Date(),
        },
        include: MESSAGE_INCLUDE,
      });

      const result = mapEventChatMessage(updated as EventChatMessageWithGraph);

      // Publish update to WebSocket
      await pubsub.publish({
        topic: `eventMessageUpdated:${existing.eventId}`,
        payload: {
          eventMessageUpdated: result,
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
export const deleteEventMessageMutation: MutationResolvers['deleteEventMessage'] =
  resolverWithMetrics(
    'Mutation',
    'deleteEventMessage',
    async (_p, { id, soft = true }, { user, pubsub }) => {
      if (!user?.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      // Rate limit
      await assertDeleteRateLimit(user.id);

      // Fetch message
      const existing = await prisma.eventChatMessage.findUnique({
        where: { id },
        select: {
          authorId: true,
          eventId: true,
          createdAt: true,
          deletedAt: true,
          event: {
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
      const isOwner = existing.event.ownerId === user.id;
      const isAdmin = user.role === Role.ADMIN;
      const isGlobalMod = isAdminOrModerator(user);

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
        } else if (!isGlobalMod) {
          // Event Moderator/Owner can soft-delete anytime (global mod already has access)
          await requireEventChatModerator(user.id, existing.eventId);
        }

        if (existing.deletedAt) {
          return true; // Already deleted
        }

        const deletedAt = new Date();
        await prisma.eventChatMessage.update({
          where: { id },
          data: { deletedAt },
        });

        // Publish delete event
        await pubsub.publish({
          topic: `eventMessageDeleted:${existing.eventId}`,
          payload: {
            eventMessageDeleted: {
              messageId: id,
              deletedAt: deletedAt.toISOString(),
            },
          },
        });

        return true;
      }

      // Hard delete: only Owner or Admin (global MODERATOR cannot hard-delete)
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
        await tx.eventChatMessage.delete({
          where: { id },
        });

        await tx.event.update({
          where: { id: existing.eventId },
          data: { messagesCount: { decrement: 1 } },
        });
      });

      return true;
    }
  );

/**
 * Mutation: Mark event chat as read
 */
export const markEventChatReadMutation: MutationResolvers['markEventChatRead'] =
  resolverWithMetrics(
    'Mutation',
    'markEventChatRead',
    async (_p, { eventId, at }, { user }) => {
      if (!user?.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      // Guard: EVENT_PARTICIPANT or APP_MOD_OR_ADMIN
      if (!isAdminOrModerator(user)) {
        await requireJoinedMember(user.id, eventId);
      }

      const timestamp = at ? new Date(at) : new Date();

      // Upsert EventChatRead
      await prisma.eventChatRead.upsert({
        where: {
          eventId_userId: {
            eventId,
            userId: user.id,
          },
        },
        create: {
          eventId,
          userId: user.id,
          lastReadAt: timestamp,
        },
        update: {
          lastReadAt: timestamp,
        },
      });

      // Invalidate unread count cache
      const cacheKey = `chat:event:unread:${eventId}:${user.id}`;
      try {
        await healthRedis.del(cacheKey);
      } catch (error) {
        // Log but don't fail on cache errors
        logger.error({ error }, 'Redis cache invalidation error');
      }

      return true;
    }
  );

/**
 * Publish typing indicator for event chat
 */
export const publishEventTypingMutation: MutationResolvers['publishEventTyping'] =
  resolverWithMetrics(
    'Mutation',
    'publishEventTyping',
    async (_p, { eventId, isTyping }, { user, pubsub }) => {
      if (!user?.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      // Guard: EVENT_PARTICIPANT or APP_MOD_OR_ADMIN
      if (!isAdminOrModerator(user)) {
        await requireJoinedMember(user.id, eventId);
      }

      // Publish typing event
      await pubsub?.publish({
        topic: `eventTyping:${eventId}`,
        payload: {
          eventTyping: {
            userId: user.id,
            isTyping,
          },
        },
      });

      return true;
    }
  );
