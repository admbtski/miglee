import type { Prisma } from '@prisma/client';
import { GraphQLError } from 'graphql';
import { prisma } from '../../../lib/prisma';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import type { QueryResolvers } from '../../__generated__/resolvers-types';
import { mapReview } from '../helpers';

const REVIEW_INCLUDE = {
  author: true,
  intent: true,
} satisfies Prisma.ReviewInclude;

/**
 * Query: Get reviews for an intent
 */
export const reviewsQuery: QueryResolvers['reviews'] = resolverWithMetrics(
  'Query',
  'reviews',
  async (_p, args) => {
    const { intentId, limit, offset, rating } = args;

    const take = Math.max(1, Math.min(limit ?? 20, 100));
    const skip = Math.max(0, offset ?? 0);

    const where: Prisma.ReviewWhereInput = {
      intentId,
      deletedAt: null,
    };

    if (rating !== undefined && rating !== null) {
      where.rating = rating;
    }

    const total = await prisma.review.count({ where });

    const reviews = await prisma.review.findMany({
      where,
      take,
      skip,
      orderBy: { createdAt: 'desc' },
      include: REVIEW_INCLUDE,
    });

    return {
      items: reviews.map((r) => mapReview(r as any)),
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
 * Query: Get a single review
 */
export const reviewQuery: QueryResolvers['review'] = resolverWithMetrics(
  'Query',
  'review',
  async (_p, { id }) => {
    const review = await prisma.review.findUnique({
      where: { id },
      include: REVIEW_INCLUDE,
    });

    if (!review || review.deletedAt) {
      return null;
    }

    return mapReview(review as any);
  }
);

/**
 * Query: Get review statistics for an intent
 */
export const reviewStatsQuery: QueryResolvers['reviewStats'] =
  resolverWithMetrics('Query', 'reviewStats', async (_p, { intentId }) => {
    const reviews = await prisma.review.findMany({
      where: {
        intentId,
        deletedAt: null,
      },
      select: {
        rating: true,
      },
    });

    const totalCount = reviews.length;

    if (totalCount === 0) {
      return {
        totalCount: 0,
        averageRating: 0,
        ratingDistribution: [
          { rating: 1, count: 0 },
          { rating: 2, count: 0 },
          { rating: 3, count: 0 },
          { rating: 4, count: 0 },
          { rating: 5, count: 0 },
        ],
      };
    }

    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    const averageRating = sum / totalCount;

    // Count distribution
    const distribution: Record<number, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };
    reviews.forEach((r) => {
      distribution[r.rating] = (distribution[r.rating] || 0) + 1;
    });

    const ratingDistribution = Object.entries(distribution).map(
      ([rating, count]) => ({
        rating: parseInt(rating, 10),
        count,
      })
    );

    return {
      totalCount,
      averageRating,
      ratingDistribution,
    };
  });

/**
 * Query: Get current user's review for an intent
 */
export const myReviewQuery: QueryResolvers['myReview'] = resolverWithMetrics(
  'Query',
  'myReview',
  async (_p, { intentId }, { user }) => {
    if (!user?.id) {
      throw new GraphQLError('Authentication required.', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    const review = await prisma.review.findUnique({
      where: {
        intentId_authorId: {
          intentId,
          authorId: user.id,
        },
      },
      include: REVIEW_INCLUDE,
    });

    if (!review || review.deletedAt) {
      return null;
    }

    return mapReview(review as any);
  }
);
