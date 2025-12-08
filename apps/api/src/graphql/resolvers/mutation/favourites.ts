/**
 * Event Favourites Mutation Resolvers
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
    async (_p, { eventId }, { user }) => {
      if (!user?.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      // Check if eventexists
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: { id: true, savedCount: true },
      });

      if (!event) {
        throw new GraphQLError('Event not found.', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Check if already favourited
      const existing = await prisma.eventFavourite.findUnique({
        where: {
          userId_eventId: {
            userId: user.id,
            eventId,
          },
        },
      });

      if (existing) {
        // Remove favourite
        await prisma.$transaction([
          prisma.eventFavourite.delete({
            where: { id: existing.id },
          }),
          prisma.event.update({
            where: { id: eventId },
            data: { savedCount: { decrement: 1 } },
          }),
        ]);

        return null; // Removed
      } else {
        // Add favourite
        const [favourite] = await prisma.$transaction([
          prisma.eventFavourite.create({
            data: {
              userId: user.id,
              eventId,
            },
          }),
          prisma.event.update({
            where: { id: eventId },
            data: { savedCount: { increment: 1 } },
          }),
        ]);

        return {
          id: favourite.id,
          userId: favourite.userId,
          eventId: favourite.eventId,
          createdAt: favourite.createdAt,
          user: null as any, // Will be resolved by field resolver if needed
          event: null as any, // Will be resolved by field resolver if needed
        };
      }
    }
  );
