/**
 * Event Chat Query Resolvers
 */

import type { Prisma } from '@prisma/client';
import { GraphQLError } from 'graphql';
import { buildCursor, buildCursorWhere } from '../../../lib/chat-utils';
import { prisma } from '../../../lib/prisma';
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
 * Query: Get messages for an intent (cursor-based pagination, DESC)
 */
export const intentMessagesQuery: QueryResolvers['intentMessages'] =
  resolverWithMetrics(
    'Query',
    'intentMessages',
    async (_p, { intentId, after, limit = 50 }, { user }) => {
      if (!user?.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      // Guard: user must be JOINED
      await requireJoinedMember(user.id, intentId);

      // Build where clause for cursor pagination
      const cursorWhere = buildCursorWhere(after);

      // Fetch messages (DESC order)
      const messages = await prisma.intentChatMessage.findMany({
        where: {
          intentId,
          ...cursorWhere,
        },
        include: MESSAGE_INCLUDE,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: limit + 1, // Fetch one extra to check hasMore
      });

      const hasMore = messages.length > limit;
      const items = hasMore ? messages.slice(0, limit) : messages;

      const mappedItems = items.map((m) => mapIntentChatMessage(m));

      // Build cursor for last item
      const lastItem = items[items.length - 1];
      const endCursor = lastItem
        ? buildCursor({ createdAt: lastItem.createdAt, id: lastItem.id })
        : null;

      return {
        items: mappedItems,
        pageInfo: {
          hasNextPage: hasMore,
          endCursor,
        },
        hasMore,
      };
    }
  );

/**
 * Query: Get unread count for intent chat
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

      return unreadCount;
    }
  );
