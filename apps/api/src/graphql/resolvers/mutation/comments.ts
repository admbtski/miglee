import type { Prisma } from '@prisma/client';
import {
  NotificationKind as PrismaNotificationKind,
  NotificationEntity as PrismaNotificationEntity,
} from '@prisma/client';
import { GraphQLError } from 'graphql';
import { prisma } from '../../../lib/prisma';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import type { MutationResolvers } from '../../__generated__/resolvers-types';
import { mapComment, mapNotification } from '../helpers';
import { NOTIFICATION_INCLUDE } from './notifications';

/**
 * Include for Comment queries with full relations.
 */
const COMMENT_INCLUDE = {
  author: true,
  event: true,
  parent: {
    include: {
      author: true,
    },
  },
  deletedBy: true,
  hiddenBy: true,
  replies: {
    include: {
      author: true,
    },
    orderBy: { createdAt: 'asc' as const },
  },
  _count: {
    select: {
      replies: true,
    },
  },
} satisfies Prisma.CommentInclude;

/**
 * Mutation: Create a comment
 */
export const createCommentMutation: MutationResolvers['createComment'] =
  resolverWithMetrics(
    'Mutation',
    'createComment',
    async (_p, { input }, { user, pubsub }) => {
      if (!user?.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const { eventId, content, parentId } = input;

      // Validate content
      if (!content || content.trim().length === 0) {
        throw new GraphQLError('Comment content cannot be empty.', {
          extensions: { code: 'BAD_USER_INPUT', field: 'content' },
        });
      }

      if (content.length > 5000) {
        throw new GraphQLError(
          'Comment content too long (max 5000 characters).',
          {
            extensions: { code: 'BAD_USER_INPUT', field: 'content' },
          }
        );
      }

      // Verify event exists and get owner/mods
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: {
          id: true,
          deletedAt: true,
          title: true,
          members: {
            where: {
              role: { in: ['OWNER', 'MODERATOR'] },
              status: 'JOINED',
            },
            select: { userId: true },
          },
        },
      });

      if (!event || event.deletedAt) {
        throw new GraphQLError('Event not found.', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // If parentId provided, verify parent exists and belongs to same event
      let threadId = eventId; // Default thread is the event itself
      let parentAuthorId: string | null = null;
      if (parentId) {
        const parent = await prisma.comment.findUnique({
          where: { id: parentId },
          select: {
            eventId: true,
            threadId: true,
            deletedAt: true,
            authorId: true,
          },
        });

        if (!parent || parent.deletedAt) {
          throw new GraphQLError('Parent comment not found.', {
            extensions: { code: 'NOT_FOUND' },
          });
        }

        if (parent.eventId !== eventId) {
          throw new GraphQLError('Parent comment belongs to different event.', {
            extensions: { code: 'BAD_USER_INPUT' },
          });
        }

        threadId = parent.threadId;
        parentAuthorId = parent.authorId;
      }

      const comment = await prisma.comment.create({
        data: {
          eventId,
          authorId: user.id,
          content: content.trim(),
          parentId: parentId || null,
          threadId, // Set threadId to parent's thread or event id
        },
        include: COMMENT_INCLUDE,
      });

      // Update event commentsCount
      await prisma.event.update({
        where: { id: eventId },
        data: { commentsCount: { increment: 1 } },
      });

      // Send notifications
      const notificationRecipients = new Set<string>();

      if (parentId && parentAuthorId && parentAuthorId !== user.id) {
        // Reply notification to parent comment author
        notificationRecipients.add(parentAuthorId);
        const notif = await prisma.notification.create({
          data: {
            kind: PrismaNotificationKind.COMMENT_REPLY,
            title: null,
            body: null,
            entityType: PrismaNotificationEntity.EVENT,
            entityId: eventId,
            eventId,
            recipientId: parentAuthorId,
            actorId: user.id,
            data: {
              commentId: comment.id,
              eventId,
              eventTitle: event.title,
              actorName: user.name,
              commentContent: content.trim().slice(0, 100),
            },
            dedupeKey: `comment_reply:${comment.id}`,
          },
          include: NOTIFICATION_INCLUDE,
        });
        await pubsub?.publish({
          topic: `NOTIFICATION_ADDED:${parentAuthorId}`,
          payload: { notificationAdded: mapNotification(notif) },
        });
        await pubsub?.publish({
          topic: `NOTIFICATION_BADGE:${parentAuthorId}`,
          payload: {
            notificationBadgeChanged: { recipientId: parentAuthorId },
          },
        });
      } else {
        // New comment notification to owner/mods (not replies)
        for (const m of event.members) {
          if (m.userId !== user.id && !notificationRecipients.has(m.userId)) {
            notificationRecipients.add(m.userId);
            const notif = await prisma.notification.create({
              data: {
                kind: PrismaNotificationKind.EVENT_COMMENT_ADDED,
                title: null,
                body: null,
                entityType: PrismaNotificationEntity.EVENT,
                entityId: eventId,
                eventId,
                recipientId: m.userId,
                actorId: user.id,
                data: {
                  commentId: comment.id,
                  eventId,
                  eventTitle: event.title,
                  actorName: user.name,
                  commentContent: content.trim().slice(0, 100),
                },
                dedupeKey: `comment_added:${comment.id}:${m.userId}`,
              },
              include: NOTIFICATION_INCLUDE,
            });
            await pubsub?.publish({
              topic: `NOTIFICATION_ADDED:${m.userId}`,
              payload: { notificationAdded: mapNotification(notif) },
            });
            await pubsub?.publish({
              topic: `NOTIFICATION_BADGE:${m.userId}`,
              payload: { notificationBadgeChanged: { recipientId: m.userId } },
            });
          }
        }
      }

      return mapComment(comment);
    }
  );

/**
 * Mutation: Update a comment
 *
 * Permissions:
 * - App Admin: can edit any comment
 * - App Moderator: CANNOT edit (only hide/delete for moderation)
 * - Event Owner/Moderator: CANNOT edit others' comments
 * - Comment Author: can edit own comments
 */
export const updateCommentMutation: MutationResolvers['updateComment'] =
  resolverWithMetrics(
    'Mutation',
    'updateComment',
    async (_p, { id, input }, { user }) => {
      if (!user?.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const { content } = input;

      // Validate content
      if (!content || content.trim().length === 0) {
        throw new GraphQLError('Comment content cannot be empty.', {
          extensions: { code: 'BAD_USER_INPUT', field: 'content' },
        });
      }

      if (content.length > 5000) {
        throw new GraphQLError(
          'Comment content too long (max 5000 characters).',
          {
            extensions: { code: 'BAD_USER_INPUT', field: 'content' },
          }
        );
      }

      // Verify ownership
      const existing = await prisma.comment.findUnique({
        where: { id },
        select: { authorId: true, deletedAt: true },
      });

      if (!existing) {
        throw new GraphQLError('Comment not found.', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Permission check: Only App Admin or Comment Author can edit
      // App Moderators and Event Owner/Moderators should use hide/delete, not edit
      const isAppAdmin = user.role === 'ADMIN';
      const isAuthor = existing.authorId === user.id;

      if (!isAppAdmin && !isAuthor) {
        throw new GraphQLError('Cannot edit comments from other users.', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      if (existing.deletedAt) {
        throw new GraphQLError('Cannot edit deleted comment.', {
          extensions: { code: 'FAILED_PRECONDITION' },
        });
      }

      const updated = await prisma.comment.update({
        where: { id },
        data: { content: content.trim() },
        include: COMMENT_INCLUDE,
      });

      return mapComment(updated);
    }
  );

/**
 * Mutation: Delete a comment (soft delete)
 *
 * Permissions:
 * - App Admin: can delete any comment
 * - App Moderator: can delete any comment
 * - Event Owner/Moderator: can delete comments in their event
 * - Comment Author: can delete own comments
 */
export const deleteCommentMutation: MutationResolvers['deleteComment'] =
  resolverWithMetrics(
    'Mutation',
    'deleteComment',
    async (_p, { id }, { user }) => {
      if (!user?.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const existing = await prisma.comment.findUnique({
        where: { id },
        select: {
          authorId: true,
          deletedAt: true,
          hiddenAt: true,
          eventId: true,
          event: {
            select: {
              members: {
                where: {
                  userId: user.id,
                  role: { in: ['OWNER', 'MODERATOR'] },
                  status: 'JOINED',
                },
                select: { role: true },
              },
            },
          },
        },
      });

      if (!existing) {
        return false; // Idempotent
      }

      // Permission check
      const isAppAdmin = user.role === 'ADMIN';
      const isAppModerator = user.role === 'MODERATOR';
      const isEventOwnerOrMod = existing.event.members.length > 0;
      const isAuthor = existing.authorId === user.id;

      if (!isAppAdmin && !isAppModerator && !isEventOwnerOrMod && !isAuthor) {
        throw new GraphQLError('Cannot delete comments from other users.', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      if (existing.deletedAt) {
        return true; // Already deleted
      }

      await prisma.comment.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          deletedById: user.id,
        },
      });

      // Decrement event commentsCount only if not hidden
      if (!existing.hiddenAt) {
        await prisma.event.update({
          where: { id: existing.eventId },
          data: { commentsCount: { decrement: 1 } },
        });
      }

      return true;
    }
  );

/**
 * Mutation: Hide a comment (moderation - soft delete)
 */
export const hideCommentMutation: MutationResolvers['hideComment'] =
  resolverWithMetrics(
    'Mutation',
    'hideComment',
    async (_p, { id }, { user, pubsub }) => {
      if (!user?.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      // Check if user has moderation permissions
      const comment = await prisma.comment.findUnique({
        where: { id },
        select: {
          id: true,
          eventId: true,
          authorId: true,
          deletedAt: true,
          hiddenAt: true,
          event: {
            select: {
              members: {
                where: {
                  userId: user.id,
                  role: { in: ['OWNER', 'MODERATOR'] },
                },
                select: { role: true },
              },
            },
          },
        },
      });

      if (!comment) {
        throw new GraphQLError('Comment not found.', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Check permissions: app admin/moderator OR event owner/moderator
      const isAppAdmin = user.role === 'ADMIN';
      const isAppModerator = user.role === 'MODERATOR';
      const isEventModerator = comment.event.members.length > 0;

      if (!isAppAdmin && !isAppModerator && !isEventModerator) {
        throw new GraphQLError('Insufficient permissions to hide comments.', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      if (comment.hiddenAt) {
        return true; // Already hidden
      }

      await prisma.comment.update({
        where: { id },
        data: {
          hiddenAt: new Date(),
          hiddenById: user.id,
        },
      });

      // Decrement event commentsCount only if not already deleted
      if (!comment.deletedAt) {
        await prisma.event.update({
          where: { id: comment.eventId },
          data: { commentsCount: { decrement: 1 } },
        });
      }

      // Notify comment author that their comment was hidden
      if (comment.authorId !== user.id) {
        // Fetch event title for notification data
        const event = await prisma.event.findUnique({
          where: { id: comment.eventId },
          select: { title: true },
        });

        const notif = await prisma.notification.create({
          data: {
            kind: PrismaNotificationKind.COMMENT_HIDDEN,
            title: null,
            body: null,
            entityType: PrismaNotificationEntity.EVENT,
            entityId: comment.eventId,
            eventId: comment.eventId,
            recipientId: comment.authorId,
            actorId: user.id,
            data: {
              commentId: id,
              eventId: comment.eventId,
              eventTitle: event?.title,
              moderatorName: user.name,
            },
            dedupeKey: `comment_hidden:${id}`,
          },
          include: NOTIFICATION_INCLUDE,
        });
        await pubsub?.publish({
          topic: `NOTIFICATION_ADDED:${comment.authorId}`,
          payload: { notificationAdded: mapNotification(notif) },
        });
        await pubsub?.publish({
          topic: `NOTIFICATION_BADGE:${comment.authorId}`,
          payload: {
            notificationBadgeChanged: { recipientId: comment.authorId },
          },
        });
      }

      return true;
    }
  );

/**
 * Mutation: Unhide a comment (moderation)
 */
export const unhideCommentMutation: MutationResolvers['unhideComment'] =
  resolverWithMetrics(
    'Mutation',
    'unhideComment',
    async (_p, { id }, { user }) => {
      if (!user?.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      // Check if user has moderation permissions
      const comment = await prisma.comment.findUnique({
        where: { id },
        select: {
          id: true,
          eventId: true,
          deletedAt: true,
          hiddenAt: true,
          event: {
            select: {
              members: {
                where: {
                  userId: user.id,
                  role: { in: ['OWNER', 'MODERATOR'] },
                },
                select: { role: true },
              },
            },
          },
        },
      });

      if (!comment) {
        throw new GraphQLError('Comment not found.', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Check permissions: app admin/moderator OR event owner/moderator
      const isAppAdmin = user.role === 'ADMIN';
      const isAppModerator = user.role === 'MODERATOR';
      const isEventModerator = comment.event.members.length > 0;

      if (!isAppAdmin && !isAppModerator && !isEventModerator) {
        throw new GraphQLError('Insufficient permissions to unhide comments.', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      if (!comment.hiddenAt) {
        return true; // Not hidden
      }

      await prisma.comment.update({
        where: { id },
        data: {
          hiddenAt: null,
          hiddenById: null,
        },
      });

      // Increment event commentsCount only if not deleted
      if (!comment.deletedAt) {
        await prisma.event.update({
          where: { id: comment.eventId },
          data: { commentsCount: { increment: 1 } },
        });
      }

      return true;
    }
  );
