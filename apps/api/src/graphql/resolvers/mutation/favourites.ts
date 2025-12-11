/**
 * Event Favourites Mutation Resolvers
 *
 * Authorization: AUTH (SELF)
 */

import { GraphQLError } from 'graphql';
import { prisma } from '../../../lib/prisma';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import type {
  MutationResolvers,
  User as GQLUser,
  Event as GQLEvent,
} from '../../__generated__/resolvers-types';
import { requireAuth } from '../shared/auth-guards';

/**
 * Mutation: Toggle favourite (add if not exists, remove if exists)
 * Authorization: AUTH (SELF)
 */
export const toggleFavouriteMutation: MutationResolvers['toggleFavourite'] =
  resolverWithMetrics(
    'Mutation',
    'toggleFavourite',
    async (_p, { eventId }, ctx) => {
      const userId = requireAuth(ctx);

      // Check if event exists
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
          userId_eventId: { userId, eventId },
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
            data: { userId, eventId },
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
          user: null as unknown as GQLUser, // Field resolver
          event: null as unknown as GQLEvent, // Field resolver
        };
      }
    }
  );
