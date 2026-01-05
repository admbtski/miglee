/**
 * Reviews Query Resolvers
 *
 * Authorization: ANY (public reviews) or AUTH (myReview)
 */

import type { Prisma } from '../../../prisma-client/client';
import { prisma } from '../../../lib/prisma';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import type { QueryResolvers } from '../../__generated__/resolvers-types';
import { mapReview, ReviewWithGraph } from '../helpers';
import { requireAuth } from '../shared/auth-guards';
import { trackReviewStats } from '../../../lib/observability';

const REVIEW_INCLUDE = {
  author: true,
  event: true,
} satisfies Prisma.ReviewInclude;

/**
 * Query: Get reviews for an event
 *
 * Visibility rules:
 * - ACTIVE reviews: visible to everyone
 * - DELETED reviews: visible to admin/moderator (content hidden for others)
 * - HIDDEN reviews: visible to admin/moderator/event owner (content hidden for others)
 * - Hidden has priority over deleted
 */
export const reviewsQuery: QueryResolvers['reviews'] = resolverWithMetrics(
  'Query',
  'reviews',
  async (_p, args, { user }) => {
    const { eventId, limit, offset, rating } = args;

    const take = Math.max(1, Math.min(limit ?? 20, 100));
    const skip = Math.max(0, offset ?? 0);

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

    const where: Prisma.ReviewWhereInput = {
      eventId,
      deletedAt: null, // Public users don't see deleted reviews at all
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

    // Map reviews with viewer context
    const viewerContext = {
      viewerId: user?.id,
      viewerRole: user?.role,
      isEventOwnerOrMod,
    };

    return {
      items: reviews.map((r) =>
        mapReview(r as unknown as ReviewWithGraph, undefined, viewerContext)
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
 * Query: Get a single review
 *
 * Visibility rules apply same as for reviews query
 */
export const reviewQuery: QueryResolvers['review'] = resolverWithMetrics(
  'Query',
  'review',
  async (_p, { id }, { user }) => {
    const review = await prisma.review.findUnique({
      where: { id },
      include: REVIEW_INCLUDE,
    });

    if (!review || review.deletedAt) {
      return null;
    }

    // Check if viewer is event owner or moderator
    let isEventOwnerOrMod = false;
    if (user?.id) {
      const membership = await prisma.eventMember.findUnique({
        where: {
          eventId_userId: { eventId: review.eventId, userId: user.id },
        },
        select: { role: true, status: true },
      });
      isEventOwnerOrMod =
        membership?.status === 'JOINED' &&
        (membership.role === 'OWNER' || membership.role === 'MODERATOR');
    }

    // Map review with viewer context
    const viewerContext = {
      viewerId: user?.id,
      viewerRole: user?.role,
      isEventOwnerOrMod,
    };

    return mapReview(
      review as unknown as ReviewWithGraph,
      undefined,
      viewerContext
    );
  }
);

/**
 * Query: Get review statistics for an event
 */
export const reviewStatsQuery: QueryResolvers['reviewStats'] =
  resolverWithMetrics('Query', 'reviewStats', async (_p, { eventId }) => {
    const queryStart = Date.now();

    const reviews = await prisma.review.findMany({
      where: {
        eventId,
        deletedAt: null,
      },
      select: {
        rating: true,
      },
    });

    const totalCount = reviews.length;
    const dbTime = Date.now() - queryStart;

    if (totalCount === 0) {
      // Track derivation stats for empty result
      trackReviewStats(eventId, dbTime, { count: 0, avgRating: null });
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

    // Track derivation stats
    trackReviewStats(eventId, dbTime, {
      count: totalCount,
      avgRating: averageRating,
    });

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
 * Query: Get current user's review for an event
 * Authorization: AUTH (SELF)
 */
export const myReviewQuery: QueryResolvers['myReview'] = resolverWithMetrics(
  'Query',
  'myReview',
  async (_p, { eventId }, ctx) => {
    const userId = requireAuth(ctx);

    const review = await prisma.review.findUnique({
      where: {
        eventId_authorId: {
          eventId,
          authorId: userId,
        },
      },
      include: REVIEW_INCLUDE,
    });

    if (!review || review.deletedAt) {
      return null;
    }

    // Author sees their own review (even if hidden by moderators)
    const viewerContext = {
      viewerId: userId,
      viewerRole: ctx.user?.role,
      isEventOwnerOrMod: false, // Not relevant for author's own review
    };

    return mapReview(
      review as unknown as ReviewWithGraph,
      undefined,
      viewerContext
    );
  }
);
