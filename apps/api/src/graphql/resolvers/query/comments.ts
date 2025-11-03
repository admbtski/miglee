import type { Prisma } from '@prisma/client';
import { GraphQLError } from 'graphql';
import { prisma } from '../../../lib/prisma';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import type { QueryResolvers } from '../../__generated__/resolvers-types';
import { mapComment } from '../helpers';

const COMMENT_INCLUDE = {
  author: true,
  intent: true,
  parent: true,
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
 * Query: Get comments for an intent
 */
export const commentsQuery: QueryResolvers['comments'] = resolverWithMetrics(
  'Query',
  'comments',
  async (_p, args, { user }) => {
    const { intentId, limit, offset, threadId, parentId } = args;

    const take = Math.max(1, Math.min(limit ?? 50, 200));
    const skip = Math.max(0, offset ?? 0);

    const where: Prisma.CommentWhereInput = {
      intentId,
      deletedAt: null,
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
      include: COMMENT_INCLUDE,
    });

    return {
      items: comments.map((c) => mapComment(c as any)),
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
      include: COMMENT_INCLUDE,
    });

    if (!comment) {
      return null;
    }

    if (comment.deletedAt) {
      return null;
    }

    return mapComment(comment as any);
  }
);
