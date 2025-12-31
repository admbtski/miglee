/**
 * User Blocks Query Resolvers
 *
 * Authorization: AUTH (SELF)
 */

import type { Prisma } from '../../../prisma-client/client';
import { prisma } from '../../../lib/prisma';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import type { QueryResolvers } from '../../__generated__/resolvers-types';
import { mapUserBlock } from '../helpers';
import { requireAuth } from '../shared/auth-guards';

const USER_BLOCK_INCLUDE = {
  blocker: true,
  blocked: true,
} satisfies Prisma.UserBlockInclude;

/**
 * Query: Get my blocks (users I've blocked)
 * Authorization: AUTH (SELF)
 */
export const myBlocksQuery: QueryResolvers['myBlocks'] = resolverWithMetrics(
  'Query',
  'myBlocks',
  async (_p, { limit = 50, offset = 0 }, ctx) => {
    const userId = requireAuth(ctx);

    const [blocks, total] = await Promise.all([
      prisma.userBlock.findMany({
        where: { blockerId: userId },
        include: USER_BLOCK_INCLUDE,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.userBlock.count({
        where: { blockerId: userId },
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
 * Authorization: AUTH (SELF)
 */
export const isBlockedQuery: QueryResolvers['isBlocked'] = resolverWithMetrics(
  'Query',
  'isBlocked',
  async (_p, { userId: targetUserId }, ctx) => {
    const userId = requireAuth(ctx);

    const block = await prisma.userBlock.findFirst({
      where: {
        OR: [
          { blockerId: userId, blockedId: targetUserId },
          { blockerId: targetUserId, blockedId: userId },
        ],
      },
    });

    return !!block;
  }
);
