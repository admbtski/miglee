import type { Prisma } from '@prisma/client';
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
 */
export const commentsQuery: QueryResolvers['comments'] = resolverWithMetrics(
  'Query',
  'comments',
  async (_p, args, { user }) => {
    const { eventId, limit, offset, threadId, parentId } = args;

    const take = Math.max(1, Math.min(limit ?? 50, 200));
    const skip = Math.max(0, offset ?? 0);

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

    const total = await prisma.comment.count({ where });

    const comments = await prisma.comment.findMany({
      where,
      take,
      skip,
      orderBy: { createdAt: 'desc' },
      include: commentInclude,
    });

    console.dir({ comments });

    return {
      items: comments.map((c) => mapComment(c, user?.id)),
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
 */
export const commentQuery: QueryResolvers['comment'] = resolverWithMetrics(
  'Query',
  'comment',
  async (_p, { id }) => {
    const comment = await prisma.comment.findUnique({
      where: { id },
      include: commentInclude,
    });

    if (!comment) {
      return null;
    }

    if (comment.deletedAt) {
      return null;
    }

    return mapComment(comment);
  }
);
