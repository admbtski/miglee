/**
 * Event Favourites Query Resolvers
 *
 * Authorization: AUTH (SELF)
 */

import { prisma } from '../../../lib/prisma';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import type { QueryResolvers } from '../../__generated__/resolvers-types';
import { mapEvent, type EventWithGraph } from '../helpers';
import { requireAuth } from '../shared/auth-guards';

/**
 * Query: Get current user's favourite events
 * Authorization: AUTH (SELF)
 */
export const myFavouritesQuery: QueryResolvers['myFavourites'] =
  resolverWithMetrics(
    'Query',
    'myFavourites',
    async (_p, { limit = 20, offset = 0 }, ctx) => {
      const userId = requireAuth(ctx);

      // Fetch favourites with full event data
      const favourites = await prisma.eventFavourite.findMany({
        where: { userId },
        include: {
          event: {
            include: {
              categories: true,
              tags: true,
              owner: true,
              canceledBy: true,
              deletedBy: true,
              joinManuallyClosedBy: true,
              members: {
                where: { status: 'JOINED' },
                include: {
                  user: {
                    include: { profile: true },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' }, // Most recently saved first
        take: limit,
        skip: offset,
      });

      // Count total for pagination
      const total = await prisma.eventFavourite.count({
        where: { userId },
      });

      const items = favourites.map((fav) => ({
        id: fav.id,
        userId: fav.userId,
        eventId: fav.eventId,
        createdAt: fav.createdAt,
        user: null as any, // Will be resolved by field resolver if needed
        event: mapEvent(fav.event as EventWithGraph),
      }));

      return {
        items,
        pageInfo: {
          hasNext: offset + limit < total,
          hasPrev: offset > 0,
          total,
          limit,
          offset,
        },
      };
    }
  );

/**
 * Query: Check if current user has favourited a specific event
 * Authorization: ANY (returns false if not authenticated)
 */
export const isFavouriteQuery: QueryResolvers['isFavourite'] =
  resolverWithMetrics('Query', 'isFavourite', async (_p, { eventId }, ctx) => {
    if (!ctx.user?.id) {
      return false; // Not authenticated = not favourited
    }

    const favourite = await prisma.eventFavourite.findUnique({
      where: {
        userId_eventId: {
          userId: ctx.user.id,
          eventId,
        },
      },
    });

    return !!favourite;
  });
