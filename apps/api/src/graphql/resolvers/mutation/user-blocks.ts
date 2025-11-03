/**
 * User Blocks Mutation Resolvers
 */

import type { Prisma } from '@prisma/client';
import { GraphQLError } from 'graphql';
import { prisma } from '../../../lib/prisma';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import type { MutationResolvers } from '../../__generated__/resolvers-types';
import { mapUserBlock, type UserBlockWithGraph } from '../helpers';

const USER_BLOCK_INCLUDE = {
  blocker: true,
  blocked: true,
} satisfies Prisma.UserBlockInclude;

/**
 * Mutation: Block a user
 */
export const blockUserMutation: MutationResolvers['blockUser'] =
  resolverWithMetrics(
    'Mutation',
    'blockUser',
    async (_p, { userId }, { user }) => {
      if (!user?.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      if (userId === user.id) {
        throw new GraphQLError('Cannot block yourself.', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      // Check if user exists
      const targetUser = await prisma.user.findUnique({
        where: { id: userId },
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
          blockerId_blockedId: {
            blockerId: user.id,
            blockedId: userId,
          },
        },
      });

      if (existing) {
        // Already blocked, return existing
        const block = await prisma.userBlock.findUnique({
          where: { id: existing.id },
          include: USER_BLOCK_INCLUDE,
        });
        return mapUserBlock(block as UserBlockWithGraph);
      }

      // Create block
      const block = await prisma.userBlock.create({
        data: {
          blockerId: user.id,
          blockedId: userId,
        },
        include: USER_BLOCK_INCLUDE,
      });

      return mapUserBlock(block as UserBlockWithGraph);
    }
  );

/**
 * Mutation: Unblock a user
 */
export const unblockUserMutation: MutationResolvers['unblockUser'] =
  resolverWithMetrics(
    'Mutation',
    'unblockUser',
    async (_p, { userId }, { user }) => {
      if (!user?.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const block = await prisma.userBlock.findUnique({
        where: {
          blockerId_blockedId: {
            blockerId: user.id,
            blockedId: userId,
          },
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
