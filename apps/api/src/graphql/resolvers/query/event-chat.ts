/**
 * Event Chat Query Resolvers
 */

import type { Prisma } from '@prisma/client';
import { GraphQLError } from 'graphql';
import { buildCursor, buildCursorWhere } from '../../../lib/chat-utils';
import { prisma } from '../../../lib/prisma';
import { healthRedis } from '../../../lib/redis';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import type { QueryResolvers } from '../../__generated__/resolvers-types';
import { requireJoinedMember } from '../chat-guards';
import { mapIntentChatMessage } from '../helpers';

const MESSAGE_INCLUDE = {
  author: true,
  intent: true,
  replyTo: {
    include: {
      author: true,
    },
  },
} satisfies Prisma.IntentChatMessageInclude;

/**
 * Query: Get messages for an intent (cursor-based, reverse infinite scroll)
 * Default: returns newest 20 messages in ASC order (oldest to newest)
 * For loading older: use `before` cursor
 */
export const intentMessagesQuery: QueryResolvers['intentMessages'] =
  resolverWithMetrics(
    'Query',
    'intentMessages',
    async (_p, { intentId, first = 20, before, after }, { user }) => {
      if (!user?.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      // Guard: user must be JOINED
      await requireJoinedMember(user.id, intentId);

      const take = Math.max(1, Math.min(first, 100));

      // Build where clause for cursor pagination
      const cursorWhere = buildCursorWhere(before, after);

      // Fetch messages (DESC order to get newest first, then reverse)
      const messages = await prisma.intentChatMessage.findMany({
        where: {
          intentId,
          ...cursorWhere,
        },
        include: MESSAGE_INCLUDE,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: take + 1, // Fetch one extra to check hasMore
      });

      const hasMore = messages.length > take;
      const items = hasMore ? messages.slice(0, take) : messages;

      // Reverse to get oldest-to-newest for display
      items.reverse();

      // Build edges
      const edges = items.map((msg) => ({
        node: mapIntentChatMessage(msg),
        cursor: buildCursor({ createdAt: msg.createdAt, id: msg.id }),
      }));

      // Determine pageInfo
      const startCursor = edges.length > 0 ? edges[0]!.cursor : null;
      const endCursor =
        edges.length > 0 ? edges[edges.length - 1]!.cursor : null;

      // Check if there are older messages (hasPreviousPage)
      let hasPreviousPage = false;
      if (edges.length > 0 && !after) {
        const oldestMessage = items[0];
        if (oldestMessage) {
          const olderCount = await prisma.intentChatMessage.count({
            where: {
              intentId,
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

      // hasNextPage is true if we fetched more than requested (when using before)
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

/**
 * Query: Get unread count for intent chat
 * Uses Redis cache with 10s TTL to reduce DB load
 */
export const intentUnreadCountQuery: QueryResolvers['intentUnreadCount'] =
  resolverWithMetrics(
    'Query',
    'intentUnreadCount',
    async (_p, { intentId }, { user }) => {
      if (!user?.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      // Guard: user must be JOINED
      await requireJoinedMember(user.id, intentId);

      const cacheKey = `chat:intent:unread:${intentId}:${user.id}`;

      // Try to get from cache
      try {
        const cached = await healthRedis.get(cacheKey);
        if (cached !== null) {
          return parseInt(cached, 10);
        }
      } catch (error) {
        // Log but don't fail on cache errors
        console.error('Redis cache read error:', error);
      }

      // Get last read timestamp
      const chatRead = await prisma.intentChatRead.findUnique({
        where: {
          intentId_userId: {
            intentId,
            userId: user.id,
          },
        },
        select: {
          lastReadAt: true,
        },
      });

      const lastReadAt = chatRead?.lastReadAt || new Date(0);

      // Count unread messages (not from me, not deleted, after lastReadAt)
      const unreadCount = await prisma.intentChatMessage.count({
        where: {
          intentId,
          authorId: { not: user.id },
          deletedAt: null,
          createdAt: { gt: lastReadAt },
        },
      });

      // Cache the result for 10 seconds
      try {
        await healthRedis.setex(cacheKey, 10, unreadCount.toString());
      } catch (error) {
        // Log but don't fail on cache errors
        console.error('Redis cache write error:', error);
      }

      return unreadCount;
    }
  );
