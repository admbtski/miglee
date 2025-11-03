import type { Prisma } from '@prisma/client';
import { GraphQLError } from 'graphql';
import { prisma } from '../../../lib/prisma';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import type { QueryResolvers } from '../../__generated__/resolvers-types';
import {
  mapDmThread,
  mapDmMessage,
  mapDmMute,
  createPairKey,
} from '../helpers';

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
        _count: {
          select: {
            messages: {
              where: {
                senderId: { not: user.id },
                readAt: null,
                deletedAt: null,
              },
            },
          },
        },
      },
    });

    return {
      items: threads.map((t) => mapDmThread(t as any, user.id)),
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
          _count: {
            select: {
              messages: {
                where: {
                  senderId: { not: user.id },
                  readAt: null,
                  deletedAt: null,
                },
              },
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
          _count: {
            select: {
              messages: {
                where: {
                  senderId: { not: user.id },
                  readAt: null,
                  deletedAt: null,
                },
              },
            },
          },
        },
      });
    }

    return thread ? mapDmThread(thread as any, user.id) : null;
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
        deletedAt: null,
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
        orderBy: { createdAt: 'desc' },
        include: DM_MESSAGE_INCLUDE,
      });

      return messages.map((m) => mapDmMessage(m as any));
    }
  );

/**
 * Query: Get mute status for a thread
 */
export const dmMuteQuery: QueryResolvers['dmMute'] = resolverWithMetrics(
  'Query',
  'dmMute',
  async (_p, { threadId }, { user }) => {
    if (!user?.id) {
      throw new GraphQLError('Authentication required.', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    const mute = await prisma.dmMute.findUnique({
      where: {
        threadId_userId: {
          threadId,
          userId: user.id,
        },
      },
      include: {
        user: true,
        thread: {
          include: {
            aUser: true,
            bUser: true,
          },
        },
      },
    });

    return mute ? mapDmMute(mute as any) : null;
  }
);
