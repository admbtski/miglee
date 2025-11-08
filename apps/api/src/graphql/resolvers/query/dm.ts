import type { Prisma } from '@prisma/client';
import { GraphQLError } from 'graphql';
import { prisma } from '../../../lib/prisma';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import type { QueryResolvers } from '../../__generated__/resolvers-types';
import { createPairKey, mapDmMessage, mapDmThread } from '../helpers';

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
} satisfies Prisma.DmMessageInclude;

/**
 * Query: Get all DM threads for current user
 */
export const dmThreadsQuery: QueryResolvers['dmThreads'] = resolverWithMetrics(
  'Query',
  'dmThreads',
  async (_p, args, { user }) => {
    if (!user?.id) {
      throw new GraphQLError('Authentication required.', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    const take = Math.max(1, Math.min(args.limit ?? 20, 100));
    const skip = Math.max(0, args.offset ?? 0);

    const where: Prisma.DmThreadWhereInput = {
      OR: [{ aUserId: user.id }, { bUserId: user.id }],
    };

    // Filter for unread threads
    if (args.unreadOnly) {
      where.messages = {
        some: {
          senderId: { not: user.id },
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
          where: {
            userId: user.id,
          },
        },
      },
    });

    // Calculate unread count for each thread using DmRead
    const threadsWithUnread = await Promise.all(
      threads.map(async (t) => {
        const lastReadAt =
          t.reads.find((r) => r.userId === user.id)?.lastReadAt || new Date(0);

        const unreadCount = await prisma.dmMessage.count({
          where: {
            threadId: t.id,
            senderId: { not: user.id },
            deletedAt: null,
            createdAt: { gt: lastReadAt },
          },
        });

        return { ...t, unreadCount };
      })
    );

    return {
      items: threadsWithUnread.map((t) => mapDmThread(t as any, user.id)),
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
 */
export const dmThreadQuery: QueryResolvers['dmThread'] = resolverWithMetrics(
  'Query',
  'dmThread',
  async (_p, { id, otherUserId }, { user }) => {
    if (!user?.id) {
      throw new GraphQLError('Authentication required.', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    let thread;

    if (id) {
      // Find by thread ID
      thread = await prisma.dmThread.findUnique({
        where: { id },
        include: {
          ...DM_THREAD_INCLUDE,
          reads: {
            where: {
              userId: user.id,
            },
          },
        },
      });

      // Verify user is part of this thread
      if (thread && thread.aUserId !== user.id && thread.bUserId !== user.id) {
        throw new GraphQLError('Access denied.', {
          extensions: { code: 'FORBIDDEN' },
        });
      }
    } else if (otherUserId) {
      // Find by other user ID
      const pairKey = createPairKey(user.id, otherUserId);
      thread = await prisma.dmThread.findUnique({
        where: { pairKey },
        include: {
          ...DM_THREAD_INCLUDE,
          reads: {
            where: {
              userId: user.id,
            },
          },
        },
      });
    }

    if (!thread) {
      return null;
    }

    // Calculate unread count using DmRead
    const lastReadAt =
      thread.reads.find((r) => r.userId === user.id)?.lastReadAt || new Date(0);

    const unreadCount = await prisma.dmMessage.count({
      where: {
        threadId: thread.id,
        senderId: { not: user.id },
        deletedAt: null,
        createdAt: { gt: lastReadAt },
      },
    });

    return mapDmThread({ ...thread, unreadCount } as any, user.id);
  }
);

/**
 * Query: Get messages in a thread
 */
export const dmMessagesQuery: QueryResolvers['dmMessages'] =
  resolverWithMetrics(
    'Query',
    'dmMessages',
    async (_p, { threadId, limit, offset, beforeMessageId }, { user }) => {
      if (!user?.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

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

      if (thread.aUserId !== user.id && thread.bUserId !== user.id) {
        throw new GraphQLError('Access denied.', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      const take = Math.max(1, Math.min(limit ?? 50, 200));
      const skip = Math.max(0, offset ?? 0);

      const where: Prisma.DmMessageWhereInput = {
        threadId,
        // Don't filter deletedAt - we want to show deleted messages with "Usunięta wiadomość"
      };

      // Pagination before a specific message (for infinite scroll)
      if (beforeMessageId) {
        const beforeMessage = await prisma.dmMessage.findUnique({
          where: { id: beforeMessageId },
          select: { createdAt: true },
        });

        if (beforeMessage) {
          where.createdAt = { lt: beforeMessage.createdAt };
        }
      }

      const messages = await prisma.dmMessage.findMany({
        where,
        take,
        skip,
        orderBy: { createdAt: 'asc' }, // Oldest first for chat display
        include: DM_MESSAGE_INCLUDE,
      });

      // Get the other user's lastReadAt to determine if messages are read
      const otherUserId =
        thread.aUserId === user.id ? thread.bUserId : thread.aUserId;

      const otherUserRead = await prisma.dmRead.findUnique({
        where: {
          threadId_userId: {
            threadId,
            userId: otherUserId,
          },
        },
        select: { lastReadAt: true },
      });

      // Map messages with readAt based on other user's lastReadAt
      return messages.map((msg) => {
        // Only show readAt for messages sent by current user
        const readAt =
          msg.senderId === user.id &&
          otherUserRead?.lastReadAt &&
          msg.createdAt <= otherUserRead.lastReadAt
            ? otherUserRead.lastReadAt
            : null;

        return {
          ...mapDmMessage(msg),
          readAt,
        };
      });
    }
  );
