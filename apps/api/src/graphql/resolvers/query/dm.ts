/**
 * DM Query Resolvers
 *
 * Authorization: SELF (user must be participant in thread)
 */

import type { Prisma } from '@prisma/client';
import { GraphQLError } from 'graphql';
import { prisma } from '../../../lib/prisma';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import type { QueryResolvers } from '../../__generated__/resolvers-types';
import { createPairKey, mapDmMessage, mapDmThread } from '../helpers';
import { requireAuth } from '../shared/auth-guards';

const DM_THREAD_INCLUDE = {
  aUser: true,
  bUser: true,
  messages: {
    include: {
      sender: true,
    },
    orderBy: { createdAt: 'desc' as const },
    take: 1,
  },
  mutes: true,
} satisfies Prisma.DmThreadInclude;

const DM_MESSAGE_INCLUDE = {
  sender: true,
  thread: {
    include: {
      aUser: true,
      bUser: true,
    },
  },
  replyTo: {
    include: {
      sender: true,
    },
  },
} satisfies Prisma.DmMessageInclude;

/**
 * Query: Get all DM threads for current user
 * Authorization: AUTH (SELF)
 */
export const dmThreadsQuery: QueryResolvers['dmThreads'] = resolverWithMetrics(
  'Query',
  'dmThreads',
  async (_p, args, ctx) => {
    const userId = requireAuth(ctx);

    const take = Math.max(1, Math.min(args.limit ?? 20, 100));
    const skip = Math.max(0, args.offset ?? 0);

    const where: Prisma.DmThreadWhereInput = {
      OR: [{ aUserId: userId }, { bUserId: userId }],
    };

    // Filter for unread threads
    if (args.unreadOnly) {
      where.messages = {
        some: {
          senderId: { not: userId },
          readAt: null,
          deletedAt: null,
        },
      };
    }

    const total = await prisma.dmThread.count({ where });

    const threads = await prisma.dmThread.findMany({
      where,
      take,
      skip,
      orderBy: [{ lastMessageAt: 'desc' }, { updatedAt: 'desc' }],
      include: {
        ...DM_THREAD_INCLUDE,
        reads: {
          where: { userId },
        },
      },
    });

    // Calculate unread count for each thread using DmRead
    const threadsWithUnread = await Promise.all(
      threads.map(async (t) => {
        const lastReadAt =
          t.reads.find((r) => r.userId === userId)?.lastReadAt || new Date(0);

        const unreadCount = await prisma.dmMessage.count({
          where: {
            threadId: t.id,
            senderId: { not: userId },
            deletedAt: null,
            createdAt: { gt: lastReadAt },
          },
        });

        return { ...t, unreadCount };
      })
    );

    return {
      items: threadsWithUnread.map((t) => mapDmThread(t as any, userId)),
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
 * Query: Get a specific DM thread
 * Authorization: AUTH (SELF - must be participant)
 */
export const dmThreadQuery: QueryResolvers['dmThread'] = resolverWithMetrics(
  'Query',
  'dmThread',
  async (_p, { id, otherUserId }, ctx) => {
    const userId = requireAuth(ctx);

    let thread;

    if (id) {
      // Find by thread ID
      thread = await prisma.dmThread.findUnique({
        where: { id },
        include: {
          ...DM_THREAD_INCLUDE,
          reads: { where: { userId } },
        },
      });

      // Verify user is participant
      if (thread && thread.aUserId !== userId && thread.bUserId !== userId) {
        throw new GraphQLError('Access denied.', {
          extensions: { code: 'FORBIDDEN' },
        });
      }
    } else if (otherUserId) {
      // Find by other user ID
      const pairKey = createPairKey(userId, otherUserId);
      thread = await prisma.dmThread.findUnique({
        where: { pairKey },
        include: {
          ...DM_THREAD_INCLUDE,
          reads: { where: { userId } },
        },
      });
    }

    if (!thread) {
      return null;
    }

    // Calculate unread count using DmRead
    const lastReadAt =
      thread.reads.find((r) => r.userId === userId)?.lastReadAt || new Date(0);

    const unreadCount = await prisma.dmMessage.count({
      where: {
        threadId: thread.id,
        senderId: { not: userId },
        deletedAt: null,
        createdAt: { gt: lastReadAt },
      },
    });

    return mapDmThread({ ...thread, unreadCount } as any, userId);
  }
);

/**
 * Encode cursor for pagination
 */
function encodeCursor(createdAt: Date, id: string): string {
  return Buffer.from(`${createdAt.getTime()}:${id}`).toString('base64');
}

/**
 * Decode cursor for pagination
 */
function decodeCursor(cursor: string): { createdAt: Date; id: string } | null {
  try {
    const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
    const [timestamp, id] = decoded.split(':');
    if (!timestamp || !id) return null;
    return { createdAt: new Date(parseInt(timestamp, 10)), id };
  } catch {
    return null;
  }
}

/**
 * Query: Get messages in a thread (cursor-based)
 * Authorization: AUTH (SELF - must be participant)
 */
export const dmMessagesQuery: QueryResolvers['dmMessages'] =
  resolverWithMetrics(
    'Query',
    'dmMessages',
    async (_p, { threadId, first = 20, before, after }, ctx) => {
      const userId = requireAuth(ctx);

      // Verify user has access to this thread
      const thread = await prisma.dmThread.findUnique({
        where: { id: threadId },
        select: { aUserId: true, bUserId: true },
      });

      if (!thread) {
        throw new GraphQLError('Thread not found.', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      if (thread.aUserId !== userId && thread.bUserId !== userId) {
        throw new GraphQLError('Access denied.', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      const take = Math.max(1, Math.min(first, 100));

      const where: Prisma.DmMessageWhereInput = {
        threadId,
      };

      // Cursor-based pagination
      if (before) {
        const decoded = decodeCursor(before);
        if (decoded) {
          where.OR = [
            { createdAt: { lt: decoded.createdAt } },
            {
              createdAt: decoded.createdAt,
              id: { lt: decoded.id },
            },
          ];
        }
      }

      if (after) {
        const decoded = decodeCursor(after);
        if (decoded) {
          where.OR = [
            { createdAt: { gt: decoded.createdAt } },
            {
              createdAt: decoded.createdAt,
              id: { gt: decoded.id },
            },
          ];
        }
      }

      // Fetch one extra to determine hasNextPage/hasPreviousPage
      const messages = await prisma.dmMessage.findMany({
        where,
        take: take + 1,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], // Newest first for cursor logic
        include: DM_MESSAGE_INCLUDE,
      });

      const hasMore = messages.length > take;
      const items = hasMore ? messages.slice(0, take) : messages;

      // Reverse to get oldest-to-newest for display
      items.reverse();

      // Get the other user's lastReadAt to determine if messages are read
      const otherParticipantId =
        thread.aUserId === userId ? thread.bUserId : thread.aUserId;

      const otherUserRead = await prisma.dmRead.findUnique({
        where: {
          threadId_userId: {
            threadId,
            userId: otherParticipantId,
          },
        },
        select: { lastReadAt: true },
      });

      // Build edges
      const edges = items.map((msg) => {
        const readAt =
          msg.senderId === userId &&
          otherUserRead?.lastReadAt &&
          msg.createdAt <= otherUserRead.lastReadAt
            ? otherUserRead.lastReadAt
            : null;

        return {
          node: {
            ...mapDmMessage(msg),
            readAt,
          },
          cursor: encodeCursor(msg.createdAt, msg.id),
        };
      });

      // Determine pageInfo
      const startCursor = edges.length > 0 ? edges[0]!.cursor : null;
      const endCursor =
        edges.length > 0 ? edges[edges.length - 1]!.cursor : null;

      // Check if there are older messages (hasPreviousPage)
      let hasPreviousPage = false;
      if (edges.length > 0 && !after) {
        const oldestMessage = items[0];
        if (oldestMessage) {
          const olderCount = await prisma.dmMessage.count({
            where: {
              threadId,
              OR: [
                { createdAt: { lt: oldestMessage.createdAt } },
                {
                  createdAt: oldestMessage.createdAt,
                  id: { lt: oldestMessage.id },
                },
              ],
            },
          });
          hasPreviousPage = olderCount > 0;
        }
      }

      // hasNextPage is true if we fetched more than requested
      const hasNextPage = before ? hasMore : false;

      return {
        edges,
        pageInfo: {
          hasNextPage,
          hasPreviousPage,
          startCursor,
          endCursor,
        },
      };
    }
  );
