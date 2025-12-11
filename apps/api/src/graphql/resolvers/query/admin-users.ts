/**
 * Admin User Management Query Resolvers
 *
 * Authorization: ADMIN_ONLY
 */

import type { MercuriusContext } from 'mercurius';
import { prisma } from '../../../lib/prisma';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import type {
  QueryResolvers,
  NotificationsResult,
} from '../../__generated__/resolvers-types';
import {
  EventMemberStatus,
  EventMemberRole,
} from '../../__generated__/resolvers-types';
import {
  mapComment,
  mapReview,
  mapUser,
  CommentWithGraph,
  ReviewWithGraph,
} from '../helpers';
import { requireAdmin, requireAuthUser } from '../shared/auth-guards';

/**
 * Query: Get user's comments (admin)
 */
export const adminUserCommentsQuery: QueryResolvers['adminUserComments'] =
  resolverWithMetrics(
    'Query',
    'adminUserComments',
    async (_p, { userId, limit = 20, offset = 0 }, ctx: MercuriusContext) => {
      const currentUser = requireAuthUser(ctx);
      requireAdmin(currentUser);

      const take = Math.max(1, Math.min(limit ?? 20, 100));
      const skip = Math.max(0, offset ?? 0);

      const where = {
        authorId: userId,
      };

      const total = await prisma.comment.count({ where });

      const comments = await prisma.comment.findMany({
        where,
        include: {
          author: true,
          event: true,
          parent: { include: { author: true } },
          replies: { include: { author: true } },
          _count: { select: { replies: true } },
        },
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      });

      return {
        items: comments.map((c) =>
          mapComment(c as unknown as CommentWithGraph, currentUser.id)
        ),
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
    async (_p, { userId, limit = 20, offset = 0 }, ctx: MercuriusContext) => {
      const currentUser = requireAuthUser(ctx);
      requireAdmin(currentUser);

      const take = Math.max(1, Math.min(limit ?? 20, 100));
      const skip = Math.max(0, offset ?? 0);

      const where = {
        authorId: userId,
      };

      const total = await prisma.review.count({ where });

      const reviews = await prisma.review.findMany({
        where,
        include: {
          author: true,
          event: true,
        },
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      });

      return {
        items: reviews.map((r) =>
          mapReview(r as unknown as ReviewWithGraph, currentUser.id)
        ),
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
    async (_p, { userId, limit = 20, offset = 0 }, ctx: MercuriusContext) => {
      const currentUser = requireAuthUser(ctx);
      requireAdmin(currentUser);

      const take = Math.max(1, Math.min(limit ?? 20, 100));
      const skip = Math.max(0, offset ?? 0);

      const where = {
        userId,
      };

      const total = await prisma.eventMember.count({ where });

      const memberships = await prisma.eventMember.findMany({
        where,
        include: {
          user: true,
          addedBy: true,
          event: {
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
        items: memberships.map((m) => ({
          id: m.id,
          status: m.status as EventMemberStatus,
          role: m.role as EventMemberRole,
          joinedAt: m.joinedAt,
          event: {
            id: m.event.id,
            title: m.event.title,
            startAt: m.event.startAt,
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
 * Query: Get user's created events (admin)
 */
export const adminUserEventsQuery: QueryResolvers['adminUserEvents'] =
  resolverWithMetrics(
    'Query',
    'adminUserEvents',
    async (_p, { userId, limit = 20, offset = 0 }, ctx: MercuriusContext) => {
      const currentUser = requireAuthUser(ctx);
      requireAdmin(currentUser);

      const take = Math.max(1, Math.min(limit ?? 20, 100));
      const skip = Math.max(0, offset ?? 0);

      const where = {
        ownerId: userId,
      };

      const total = await prisma.event.count({ where });

      const events = await prisma.event.findMany({
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
        items: events.map((i) => ({
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
          joinedCount: i.members.filter(
            (m: { status: string }) => m.status === 'JOINED'
          ).length,
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
    async (_p, { userId, limit = 50, offset = 0 }, ctx: MercuriusContext) => {
      const currentUser = requireAuthUser(ctx);
      requireAdmin(currentUser);

      const take = Math.min(limit ?? 50, 100);
      const skip = offset ?? 0;

      // Get DM threads where user is either aUser or bUser
      const [threads, total] = await Promise.all([
        prisma.dmThread.findMany({
          where: {
            OR: [{ aUserId: userId }, { bUserId: userId }],
          },
          include: {
            aUser: true,
            bUser: true,
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
            OR: [{ aUserId: userId }, { bUserId: userId }],
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
          thread.aUserId === userId
            ? mapUser(thread.bUser)
            : mapUser(thread.aUser),
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

/**
 * Query: Admin User Notifications
 */
export const adminUserNotificationsQuery: QueryResolvers['adminUserNotifications'] =
  resolverWithMetrics(
    'Query',
    'adminUserNotifications',
    async (_p, { userId, limit = 50, offset = 0 }, ctx: MercuriusContext) => {
      const currentUser = requireAuthUser(ctx);
      requireAdmin(currentUser);

      const take = Math.min(limit ?? 50, 100);
      const skip = offset ?? 0;

      const where = {
        recipientId: userId,
      };

      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where,
          include: {
            recipient: true,
            actor: true,
            event: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take,
          skip,
        }),
        prisma.notification.count({ where }),
      ]);

      return {
        items: notifications.map((n) => ({
          id: n.id,
          kind: n.kind,
          title: n.title,
          body: n.body,
          data: n.data,
          readAt: n.readAt,
          createdAt: n.createdAt,
          entityType: n.entityType,
          entityId: n.entityId,
          recipient: mapUser(n.recipient),
          actor: n.actor ? mapUser(n.actor) : null,
          event: n.event || null,
        })),
        pageInfo: {
          total,
          limit: take,
          offset: skip,
          hasNext: skip + take < total,
          hasPrev: skip > 0,
        },
      } as unknown as NotificationsResult;
    }
  );
