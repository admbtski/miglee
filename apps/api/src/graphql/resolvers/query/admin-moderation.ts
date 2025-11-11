/**
 * Admin Content Moderation Query Resolvers
 */

import type { Prisma } from '@prisma/client';
import { Role } from '@prisma/client';
import { GraphQLError } from 'graphql';
import { prisma } from '../../../lib/prisma';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import type { QueryResolvers } from '../../__generated__/resolvers-types';
import { mapComment, mapReview } from '../helpers';

/**
 * Helper: Check if user is admin
 */
function requireAdmin(user: any) {
  if (!user?.id) {
    throw new GraphQLError('Authentication required.', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
  if (user.role !== Role.ADMIN) {
    throw new GraphQLError('Admin access required.', {
      extensions: { code: 'FORBIDDEN' },
    });
  }
}

/**
 * Query: Get all comments (admin)
 */
export const adminCommentsQuery: QueryResolvers['adminComments'] =
  resolverWithMetrics(
    'Query',
    'adminComments',
    async (_p, { limit = 50, offset = 0, intentId, userId }, { user }) => {
      requireAdmin(user);

      const take = Math.max(1, Math.min(limit, 100));
      const skip = Math.max(0, offset);

      const where: Prisma.CommentWhereInput = {};

      if (intentId) {
        where.intentId = intentId;
      }

      if (userId) {
        where.authorId = userId;
      }

      const total = await prisma.comment.count({ where });

      const comments = await prisma.comment.findMany({
        where,
        include: {
          author: true,
          intent: {
            select: {
              id: true,
              title: true,
            },
          },
          parent: {
            include: {
              author: true,
            },
          },
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
        },
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      });

      return {
        items: comments.map((c) => mapComment(c as any, user.id)),
        pageInfo: {
          total,
          hasMore: skip + take < total,
        },
      };
    }
  );

/**
 * Query: Get all reviews (admin)
 */
export const adminReviewsQuery: QueryResolvers['adminReviews'] =
  resolverWithMetrics(
    'Query',
    'adminReviews',
    async (
      _p,
      { limit = 50, offset = 0, intentId, userId, rating },
      { user }
    ) => {
      requireAdmin(user);

      const take = Math.max(1, Math.min(limit, 100));
      const skip = Math.max(0, offset);

      const where: Prisma.ReviewWhereInput = {};

      if (intentId) {
        where.intentId = intentId;
      }

      if (userId) {
        where.authorId = userId;
      }

      if (rating) {
        where.rating = rating;
      }

      const total = await prisma.review.count({ where });

      const reviews = await prisma.review.findMany({
        where,
        include: {
          author: true,
          intent: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      });

      return {
        items: reviews.map((r) => mapReview(r as any, user.id)),
        pageInfo: {
          total,
          hasMore: skip + take < total,
        },
      };
    }
  );
