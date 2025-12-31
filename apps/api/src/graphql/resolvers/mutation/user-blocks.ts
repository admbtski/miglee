/**
 * User Blocks Mutation Resolvers
 *
 * Authorization: AUTH (SELF)
 */

import type { Prisma } from '../../../prisma-client/client';
import { GraphQLError } from 'graphql';
import { prisma } from '../../../lib/prisma';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import type { MutationResolvers } from '../../__generated__/resolvers-types';
import { mapUserBlock } from '../helpers';
import { requireAuth } from '../shared/auth-guards';

const USER_BLOCK_INCLUDE = {
  blocker: true,
  blocked: true,
} satisfies Prisma.UserBlockInclude;

/**
 * Mutation: Block a user
 * Authorization: AUTH (SELF)
 */
export const blockUserMutation: MutationResolvers['blockUser'] =
  resolverWithMetrics(
    'Mutation',
    'blockUser',
    async (_p, { userId: targetUserId }, ctx) => {
      const userId = requireAuth(ctx);

      if (targetUserId === userId) {
        throw new GraphQLError('Cannot block yourself.', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      // Check if user exists
      const targetUser = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: { id: true },
      });

      if (!targetUser) {
        throw new GraphQLError('User not found.', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Check if already blocked
      const existing = await prisma.userBlock.findUnique({
        where: {
          blockerId_blockedId: { blockerId: userId, blockedId: targetUserId },
        },
        include: USER_BLOCK_INCLUDE,
      });

      if (existing) {
        return mapUserBlock(existing);
      }

      // Create block
      const block = await prisma.userBlock.create({
        data: { blockerId: userId, blockedId: targetUserId },
        include: USER_BLOCK_INCLUDE,
      });

      return mapUserBlock(block);
    }
  );

/**
 * Mutation: Unblock a user
 * Authorization: AUTH (SELF)
 */
export const unblockUserMutation: MutationResolvers['unblockUser'] =
  resolverWithMetrics(
    'Mutation',
    'unblockUser',
    async (_p, { userId: targetUserId }, ctx) => {
      const userId = requireAuth(ctx);

      const block = await prisma.userBlock.findUnique({
        where: {
          blockerId_blockedId: { blockerId: userId, blockedId: targetUserId },
        },
      });

      if (!block) {
        return false; // Idempotent
      }

      await prisma.userBlock.delete({
        where: { id: block.id },
      });

      return true;
    }
  );
