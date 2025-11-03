/**
 * User Blocks Query Resolvers
 */

import type { Prisma } from '@prisma/client';
import { GraphQLError } from 'graphql';
import { prisma } from '../../../lib/prisma';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import type { QueryResolvers } from '../../__generated__/resolvers-types';
import { mapUserBlock } from '../helpers';

const USER_BLOCK_INCLUDE = {
  blocker: true,
  blocked: true,
} satisfies Prisma.UserBlockInclude;

/**
 * Query: Get my blocks (users I've blocked)
 */
export const myBlocksQuery: QueryResolvers['myBlocks'] = resolverWithMetrics(
  'Query',
  'myBlocks',
  async (_p, { limit = 50, offset = 0 }, { user }) => {
    if (!user?.id) {
      throw new GraphQLError('Authentication required.', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    const [blocks, total] = await Promise.all([
      prisma.userBlock.findMany({
        where: { blockerId: user.id },
        include: USER_BLOCK_INCLUDE,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.userBlock.count({
        where: { blockerId: user.id },
      }),
    ]);

    const items = blocks.map((b) => mapUserBlock(b));

    return {
      items,
      pageInfo: {
        total,
        limit,
        offset,
        hasNext: offset + limit < total,
        hasPrev: offset > 0,
      },
    };
  }
);

/**
 * Query: Check if a user is blocked (by me or blocking me)
 */
export const isBlockedQuery: QueryResolvers['isBlocked'] = resolverWithMetrics(
  'Query',
  'isBlocked',
  async (_p, { userId }, { user }) => {
    if (!user?.id) {
      throw new GraphQLError('Authentication required.', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    const block = await prisma.userBlock.findFirst({
      where: {
        OR: [
          { blockerId: user.id, blockedId: userId },
          { blockerId: userId, blockedId: user.id },
        ],
      },
    });

    return !!block;
  }
);
