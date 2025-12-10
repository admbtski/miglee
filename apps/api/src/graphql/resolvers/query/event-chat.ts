/**
 * Event Chat Query Resolvers
 *
 * Authorization levels:
 * - eventMessages: EVENT_PARTICIPANT or APP_MOD_OR_ADMIN
 * - eventUnreadCount: EVENT_PARTICIPANT or APP_MOD_OR_ADMIN
 */

import type { Prisma } from '@prisma/client';
import { buildCursor, buildCursorWhere } from '../../../lib/chat-utils';
import { prisma } from '../../../lib/prisma';
import { healthRedis } from '../../../lib/redis';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import type { QueryResolvers } from '../../__generated__/resolvers-types';
import { mapEventChatMessage } from '../helpers';
import {
  requireAuth,
  requireEventParticipantOrAppMod,
} from '../shared/auth-guards';

const MESSAGE_INCLUDE = {
  author: true,
  event: true,
  replyTo: {
    include: {
      author: true,
    },
  },
} satisfies Prisma.EventChatMessageInclude;

/**
 * Query: Get messages for an event (cursor-based, reverse infinite scroll)
 * Authorization: EVENT_PARTICIPANT or APP_MOD_OR_ADMIN
 */
export const eventMessagesQuery: QueryResolvers['eventMessages'] =
  resolverWithMetrics(
    'Query',
    'eventMessages',
    async (_p, { eventId, first = 20, before, after }, ctx) => {
      requireAuth(ctx);

      // EVENT_PARTICIPANT or APP_MOD_OR_ADMIN
      await requireEventParticipantOrAppMod(ctx.user, eventId);

      const take = Math.max(1, Math.min(first, 100));

      // Build where clause for cursor pagination
      const cursorWhere = buildCursorWhere(before, after);

      // Fetch messages (DESC order to get newest first, then reverse)
      const messages = await prisma.eventChatMessage.findMany({
        where: {
          eventId,
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
        node: mapEventChatMessage(msg),
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
          const olderCount = await prisma.eventChatMessage.count({
            where: {
              eventId,
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
 * Query: Get unread count for event chat
 * Authorization: EVENT_PARTICIPANT or APP_MOD_OR_ADMIN
 */
export const eventUnreadCountQuery: QueryResolvers['eventUnreadCount'] =
  resolverWithMetrics(
    'Query',
    'eventUnreadCount',
    async (_p, { eventId }, ctx) => {
      const userId = requireAuth(ctx);

      // EVENT_PARTICIPANT or APP_MOD_OR_ADMIN
      await requireEventParticipantOrAppMod(ctx.user, eventId);

      const cacheKey = `chat:event:unread:${eventId}:${userId}`;

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
      const chatRead = await prisma.eventChatRead.findUnique({
        where: {
          eventId_userId: {
            eventId,
            userId,
          },
        },
        select: {
          lastReadAt: true,
        },
      });

      const lastReadAt = chatRead?.lastReadAt || new Date(0);

      // Count unread messages (not from me, not deleted, after lastReadAt)
      const unreadCount = await prisma.eventChatMessage.count({
        where: {
          eventId,
          authorId: { not: userId },
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
