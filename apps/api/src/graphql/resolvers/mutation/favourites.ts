/**
 * Intent Favourites Mutation Resolvers
 */

import { GraphQLError } from 'graphql';
import { prisma } from '../../../lib/prisma';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import type { MutationResolvers } from '../../__generated__/resolvers-types';

/**
 * Mutation: Toggle favourite (add if not exists, remove if exists)
 * Returns the favourite if added, null if removed
 */
export const toggleFavouriteMutation: MutationResolvers['toggleFavourite'] =
  resolverWithMetrics(
    'Mutation',
    'toggleFavourite',
    async (_p, { intentId }, { user }) => {
      if (!user?.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      // Check if intent exists
      const intent = await prisma.intent.findUnique({
        where: { id: intentId },
        select: { id: true, savedCount: true },
      });

      if (!intent) {
        throw new GraphQLError('Intent not found.', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Check if already favourited
      const existing = await prisma.intentFavourite.findUnique({
        where: {
          userId_intentId: {
            userId: user.id,
            intentId,
          },
        },
      });

      if (existing) {
        // Remove favourite
        await prisma.$transaction([
          prisma.intentFavourite.delete({
            where: { id: existing.id },
          }),
          prisma.intent.update({
            where: { id: intentId },
            data: { savedCount: { decrement: 1 } },
          }),
        ]);

        return null; // Removed
      } else {
        // Add favourite
        const [favourite] = await prisma.$transaction([
          prisma.intentFavourite.create({
            data: {
              userId: user.id,
              intentId,
            },
          }),
          prisma.intent.update({
            where: { id: intentId },
            data: { savedCount: { increment: 1 } },
          }),
        ]);

        return {
          id: favourite.id,
          userId: favourite.userId,
          intentId: favourite.intentId,
          createdAt: favourite.createdAt,
          user: null as any, // Will be resolved by field resolver if needed
          intent: null as any, // Will be resolved by field resolver if needed
        };
      }
    }
  );
