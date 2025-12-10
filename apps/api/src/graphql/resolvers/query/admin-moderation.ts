/**
 * Admin Content Moderation Query Resolvers
 *
 * Authorization: ADMIN_ONLY
 */

import type { Prisma } from '@prisma/client';
import { prisma } from '../../../lib/prisma';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import type { QueryResolvers } from '../../__generated__/resolvers-types';
import { mapComment, mapReview } from '../helpers';
import { requireAdmin } from '../shared/auth-guards';

/**
 * Query: Get all comments (admin)
 */
export const adminCommentsQuery: QueryResolvers['adminComments'] =
  resolverWithMetrics(
    'Query',
    'adminComments',
    async (_p, { limit = 50, offset = 0, eventId, userId }, { user }) => {
      requireAdmin(user);

      const take = Math.max(1, Math.min(limit!, 100));
      const skip = Math.max(0, offset!);

      const where: Prisma.CommentWhereInput = {};

      if (eventId) {
        where.eventId = eventId;
      }

      if (userId) {
        where.authorId = userId;
      }

      const total = await prisma.comment.count({ where });

      const comments = await prisma.comment.findMany({
        where,
        include: {
          author: true,
          event: {
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
      { limit = 50, offset = 0, eventId, userId, rating },
      { user }
    ) => {
      requireAdmin(user);

      const take = Math.max(1, Math.min(limit!, 100));
      const skip = Math.max(0, offset!);

      const where: Prisma.ReviewWhereInput = {};

      if (eventId) {
        where.eventId = eventId;
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
          event: {
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
        items: reviews.map((r) => mapReview(r as any, user?.id)),
        pageInfo: {
          total,
          hasMore: skip + take < total,
        },
      };
    }
  );
