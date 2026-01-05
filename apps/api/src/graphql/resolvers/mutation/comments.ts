import type { Prisma } from '../../../prisma-client/client';
import {
  NotificationKind as PrismaNotificationKind,
  NotificationEntity as PrismaNotificationEntity,
} from '../../../prisma-client/enums';
import { GraphQLError } from 'graphql';
import { prisma } from '../../../lib/prisma';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import type { MutationResolvers } from '../../__generated__/resolvers-types';
import { mapComment, mapNotification } from '../helpers';
import { NOTIFICATION_INCLUDE } from './notifications';
import { createAuditLog, type CreateAuditLogInput } from '../../../lib/audit';
import { trackCommentVisibility } from '../../../lib/observability';
import { isAdmin, isModerator, requireAuthUser } from '../shared/auth-guards';

// Temporary type aliases until prisma generate is run
type AuditScope = CreateAuditLogInput['scope'];
type AuditAction = CreateAuditLogInput['action'];

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
    async (_p, { input }, ctx) => {
      const user = requireAuthUser(ctx);
      const { pubsub } = ctx;

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

      // Author sees their new comment (always active at creation)
      const viewerContext = {
        viewerId: user.id,
        viewerRole: user.role,
        isEventOwnerOrMod: false, // Not relevant for newly created comment
      };
      return mapComment(comment, undefined, viewerContext);
    }
  );

/**
 * Mutation: Update a comment
 *
 * Permissions:
 * - Comment Author: can edit own comments
 * - App Admin: CANNOT edit
 * - App Moderator: CANNOT edit (only hide/delete for moderation)
 * - Event Owner/Moderator: CANNOT edit
 */
export const updateCommentMutation: MutationResolvers['updateComment'] =
  resolverWithMetrics(
    'Mutation',
    'updateComment',
    async (_p, { id, input }, ctx) => {
      const user = requireAuthUser(ctx);
      const { content } = input;

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

      const isAuthor = existing.authorId === user.id;

      // Only author can edit - no exceptions
      if (!isAuthor) {
        throw new GraphQLError('Only the author can edit their own comments.', {
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

      // Author sees their updated comment
      const viewerContext = {
        viewerId: user.id,
        viewerRole: user.role,
        isEventOwnerOrMod: false, // Not relevant for author's own comment
      };
      return mapComment(updated, undefined, viewerContext);
    }
  );

/**
 * Mutation: Delete a comment (soft delete)
 *
 * Permissions:
 * - App Admin: can delete any comment
 * - App Moderator: can delete any comment
 * - Comment Author: can delete own comments
 * - Event Owner/Moderator: CANNOT delete (only hide)
 */
export const deleteCommentMutation: MutationResolvers['deleteComment'] =
  resolverWithMetrics('Mutation', 'deleteComment', async (_p, { id }, ctx) => {
    const user = requireAuthUser(ctx);

    const existing = await prisma.comment.findUnique({
      where: { id },
      select: {
        authorId: true,
        deletedAt: true,
        hiddenAt: true,
        eventId: true,
      },
    });

    if (!existing) {
      return false; // Idempotent
    }

    // Permission check: App Admin, App Moderator, or Author
    const _isAdmin = isAdmin(user);
    const _isModerator = isModerator(user);
    const isAuthor = existing.authorId === user.id;

    if (!_isAdmin && !_isModerator && !isAuthor) {
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
  });

/**
 * Mutation: Hide a comment (moderation)
 *
 * Permissions:
 * - App Admin: can hide any comment
 * - App Moderator: can hide any comment
 * - Event Owner/Moderator: can hide comments in their event
 * - Comment Author: CANNOT hide (not a moderation action)
 */
export const hideCommentMutation: MutationResolvers['hideComment'] =
  resolverWithMetrics('Mutation', 'hideComment', async (_p, { id }, ctx) => {
    const user = requireAuthUser(ctx);
    const { pubsub } = ctx;

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
                status: 'JOINED',
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
    const _isAdmin = isAdmin(user);
    const _isModerator = isModerator(user);
    const isEventModerator = comment.event.members.length > 0;

    if (!_isAdmin && !_isModerator && !isEventModerator) {
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

    // Audit log: MODERATION/HIDE (severity 4)
    await createAuditLog(prisma, {
      eventId: comment.eventId,
      actorId: user.id,
      actorRole: _isAdmin ? 'ADMIN' : _isModerator ? 'MODERATOR' : 'MODERATOR',
      scope: 'MODERATION' as AuditScope,
      action: 'HIDE' as AuditAction,
      entityType: 'Comment',
      entityId: id,
      severity: 4,
    });

    // Track visibility change
    trackCommentVisibility.hide(
      user.id,
      id,
      comment.eventId,
      undefined,
      _isAdmin ? 'admin' : _isModerator ? 'moderator' : 'moderator'
    );

    return true;
  });

/**
 * Mutation: Unhide a comment (moderation)
 *
 * Permissions:
 * - App Admin: can unhide any comment
 * - App Moderator: can unhide any comment
 * - Event Owner/Moderator: can unhide comments in their event
 * - Comment Author: CANNOT unhide (not a moderation action)
 */
export const unhideCommentMutation: MutationResolvers['unhideComment'] =
  resolverWithMetrics('Mutation', 'unhideComment', async (_p, { id }, ctx) => {
    const user = requireAuthUser(ctx);

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
                status: 'JOINED',
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
    const _isAdmin = isAdmin(user);
    const _isModerator = isModerator(user);
    const isEventModerator = comment.event.members.length > 0;

    if (!_isAdmin && !_isModerator && !isEventModerator) {
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

    // Audit log: MODERATION/UNHIDE (severity 4)
    await createAuditLog(prisma, {
      eventId: comment.eventId,
      actorId: user.id,
      actorRole: _isAdmin ? 'ADMIN' : _isModerator ? 'MODERATOR' : 'MODERATOR',
      scope: 'MODERATION' as AuditScope,
      action: 'UNHIDE' as AuditAction,
      entityType: 'Comment',
      entityId: id,
      severity: 4,
    });

    // Track visibility change
    trackCommentVisibility.unhide(
      user.id,
      id,
      comment.eventId,
      _isAdmin ? 'admin' : _isModerator ? 'moderator' : 'moderator'
    );

    return true;
  });
