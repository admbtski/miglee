/**
 * Admin User Management Query Resolvers
 */

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
  if (user.role !== 'ADMIN') {
    throw new GraphQLError('Admin access required.', {
      extensions: { code: 'FORBIDDEN' },
    });
  }
}

/**
 * Query: Get user's comments (admin)
 */
export const adminUserCommentsQuery: QueryResolvers['adminUserComments'] =
  resolverWithMetrics(
    'Query',
    'adminUserComments',
    async (_p, { userId, limit = 20, offset = 0 }, { user }) => {
      requireAdmin(user);

      const take = Math.max(1, Math.min(limit, 100));
      const skip = Math.max(0, offset);

      const where = {
        authorId: userId,
      };

      const total = await prisma.comment.count({ where });

      const comments = await prisma.comment.findMany({
        where,
        include: {
          author: true,
          intent: true,
          parent: true,
          replies: { include: { author: true } },
          _count: { select: { replies: true } },
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
 * Query: Get user's reviews (admin)
 */
export const adminUserReviewsQuery: QueryResolvers['adminUserReviews'] =
  resolverWithMetrics(
    'Query',
    'adminUserReviews',
    async (_p, { userId, limit = 20, offset = 0 }, { user }) => {
      requireAdmin(user);

      const take = Math.max(1, Math.min(limit, 100));
      const skip = Math.max(0, offset);

      const where = {
        authorId: userId,
      };

      const total = await prisma.review.count({ where });

      const reviews = await prisma.review.findMany({
        where,
        include: {
          author: true,
          intent: true,
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

/**
 * Query: Get user's memberships (admin)
 */
export const adminUserMembershipsQuery: QueryResolvers['adminUserMemberships'] =
  resolverWithMetrics(
    'Query',
    'adminUserMemberships',
    async (_p, { userId, limit = 20, offset = 0 }, { user }) => {
      requireAdmin(user);

      const take = Math.max(1, Math.min(limit, 100));
      const skip = Math.max(0, offset);

      const where = {
        userId,
      };

      const total = await prisma.intentMember.count({ where });

      const memberships = await prisma.intentMember.findMany({
        where,
        include: {
          user: true,
          addedBy: true,
          intent: {
            include: {
              categories: true,
              tags: true,
              members: { include: { user: true, addedBy: true } },
              owner: true,
              canceledBy: true,
              deletedBy: true,
            },
          },
        },
        orderBy: { joinedAt: 'desc' },
        take,
        skip,
      });

      return {
        items: memberships.map((m: any) => ({
          id: m.id,
          status: m.status,
          role: m.role,
          joinedAt: m.joinedAt,
          intent: {
            id: m.intent.id,
            title: m.intent.title,
            startAt: m.intent.startAt,
          },
        })),
        pageInfo: {
          total,
          hasMore: skip + take < total,
        },
      };
    }
  );

/**
 * Query: Get user's created intents (admin)
 */
export const adminUserIntentsQuery: QueryResolvers['adminUserIntents'] =
  resolverWithMetrics(
    'Query',
    'adminUserIntents',
    async (_p, { userId, limit = 20, offset = 0 }, { user }) => {
      requireAdmin(user);

      const take = Math.max(1, Math.min(limit, 100));
      const skip = Math.max(0, offset);

      const where = {
        ownerId: userId,
      };

      const total = await prisma.intent.count({ where });

      const intents = await prisma.intent.findMany({
        where,
        include: {
          members: true,
          _count: { select: { members: true } },
        },
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      });

      return {
        items: intents.map((i: any) => ({
          id: i.id,
          title: i.title,
          startAt: i.startAt,
          status: i.canceledAt
            ? 'CANCELED'
            : i.deletedAt
              ? 'DELETED'
              : new Date() > new Date(i.endAt ?? i.startAt)
                ? 'PAST'
                : 'AVAILABLE',
          joinedCount: i.members.filter((m: any) => m.status === 'JOINED')
            .length,
        })),
        pageInfo: {
          total,
          hasMore: skip + take < total,
        },
      };
    }
  );

/**
 * Query: Admin User DM Threads
 */
export const adminUserDmThreadsQuery: QueryResolvers['adminUserDmThreads'] =
  resolverWithMetrics(
    'Query',
    'adminUserDmThreads',
    async (_p, { userId, limit = 50, offset = 0 }, { user }) => {
      requireAdmin(user);

      const take = Math.min(limit, 100);
      const skip = offset;

      // Get DM threads where user is either userA or userB
      const [threads, total] = await Promise.all([
        prisma.dmThread.findMany({
          where: {
            OR: [{ userAId: userId }, { userBId: userId }],
          },
          include: {
            userA: true,
            userB: true,
            _count: {
              select: { messages: true },
            },
          },
          orderBy: {
            lastMessageAt: 'desc',
          },
          take,
          skip,
        }),
        prisma.dmThread.count({
          where: {
            OR: [{ userAId: userId }, { userBId: userId }],
          },
        }),
      ]);

      // Map threads to include the "other user" (not the current userId)
      const items = threads.map((thread) => ({
        id: thread.id,
        createdAt: thread.createdAt,
        lastMessageAt: thread.lastMessageAt,
        messageCount: thread._count.messages,
        otherUser:
          thread.userAId === userId
            ? mapUser(thread.userB as any)
            : mapUser(thread.userA as any),
      }));

      return {
        items,
        pageInfo: {
          total,
          hasMore: skip + take < total,
        },
      };
    }
  );
