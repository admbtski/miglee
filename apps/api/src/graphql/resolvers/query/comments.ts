import type { Prisma } from '../../../prisma-client/client';
import { prisma } from '../../../lib/prisma';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import type { QueryResolvers } from '../../__generated__/resolvers-types';
import { mapComment } from '../helpers';

const commentInclude = {
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
 * Query: Get comments for an event
 *
 * Visibility rules:
 * - ACTIVE comments: visible to everyone
 * - DELETED comments: visible to admin/moderator, OR shown as placeholder if has replies
 * - HIDDEN comments: visible to admin/moderator/event owner, OR shown as placeholder if has replies
 * - Hidden has priority over deleted
 */
export const commentsQuery: QueryResolvers['comments'] = resolverWithMetrics(
  'Query',
  'comments',
  async (_p, args, { user }) => {
    const { eventId, limit, offset, threadId, parentId } = args;

    const take = Math.max(1, Math.min(limit ?? 50, 200));
    const skip = Math.max(0, offset ?? 0);

    // Check viewer permissions
    const isAdmin = user?.role === 'ADMIN';
    const isModerator = user?.role === 'MODERATOR';

    // Check if viewer is event owner or moderator
    let isEventOwnerOrMod = false;
    if (user?.id) {
      const membership = await prisma.eventMember.findUnique({
        where: {
          eventId_userId: { eventId, userId: user.id },
        },
        select: { role: true, status: true },
      });
      isEventOwnerOrMod =
        membership?.status === 'JOINED' &&
        (membership.role === 'OWNER' || membership.role === 'MODERATOR');
    }

    const where: Prisma.CommentWhereInput = {
      eventId,
    };

    // Filter by thread (root comments only if threadId specified)
    if (threadId) {
      where.threadId = threadId;
    }

    // Filter by parent (replies to specific comment)
    if (parentId !== undefined) {
      where.parentId = parentId;
    } else if (!threadId) {
      // If no threadId and no parentId, show only root comments
      where.parentId = null;
    }

    // For public users (non-moderators), exclude deleted/hidden comments without replies
    // Moderators and event owners see everything
    const canViewAll = isAdmin || isModerator || isEventOwnerOrMod;
    if (!canViewAll) {
      // Public users: show active OR (deleted/hidden WITH replies)
      // This is handled in post-processing to avoid complex DB queries
    }

    const total = await prisma.comment.count({ where });

    const comments = await prisma.comment.findMany({
      where,
      take,
      skip,
      orderBy: { createdAt: 'desc' },
      include: commentInclude,
    });

    // Filter comments for public users
    const filteredComments = canViewAll
      ? comments
      : comments.filter((c) => {
          // Show active comments
          if (!c.hiddenAt && !c.deletedAt) {
            return true;
          }
          // Show deleted/hidden comments ONLY if they have replies
          const hasReplies = (c._count?.replies ?? 0) > 0;
          return hasReplies;
        });

    // Map comments with viewer context
    const viewerContext = {
      viewerId: user?.id,
      viewerRole: user?.role,
      isEventOwnerOrMod,
    };

    return {
      items: filteredComments.map((c) =>
        mapComment(c, undefined, viewerContext)
      ),
      pageInfo: {
        total,
        limit: take,
        offset: skip,
        hasPrev: skip > 0,
        hasNext: skip + take < total,
      },
    };
  }
);

/**
 * Query: Get a single comment with replies
 *
 * Visibility rules apply same as for comments query
 */
export const commentQuery: QueryResolvers['comment'] = resolverWithMetrics(
  'Query',
  'comment',
  async (_p, { id }, { user }) => {
    const comment = await prisma.comment.findUnique({
      where: { id },
      include: commentInclude,
    });

    if (!comment) {
      return null;
    }

    // Check viewer permissions
    const isAdmin = user?.role === 'ADMIN';
    const isModerator = user?.role === 'MODERATOR';

    // Check if viewer is event owner or moderator
    let isEventOwnerOrMod = false;
    if (user?.id) {
      const membership = await prisma.eventMember.findUnique({
        where: {
          eventId_userId: { eventId: comment.eventId, userId: user.id },
        },
        select: { role: true, status: true },
      });
      isEventOwnerOrMod =
        membership?.status === 'JOINED' &&
        (membership.role === 'OWNER' || membership.role === 'MODERATOR');
    }

    const canViewAll = isAdmin || isModerator || isEventOwnerOrMod;

    // For public users, don't show deleted/hidden comments without replies
    if (!canViewAll && (comment.deletedAt || comment.hiddenAt)) {
      const hasReplies = (comment._count?.replies ?? 0) > 0;
      if (!hasReplies) {
        return null;
      }
    }

    // Map comment with viewer context
    const viewerContext = {
      viewerId: user?.id,
      viewerRole: user?.role,
      isEventOwnerOrMod,
    };

    return mapComment(comment, undefined, viewerContext);
  }
);
