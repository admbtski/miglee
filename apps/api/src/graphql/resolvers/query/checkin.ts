/**
 * Check-in Query Resolvers
 *
 * Queries for check-in logs and statistics.
 *
 * TYPE SAFETY NOTE:
 * eventCheckinLogs uses `Promise<any>` because it returns Prisma EventCheckinLog[]
 * that EventCheckinLog field resolvers convert to GraphQL types. This is standard
 * GraphQL pattern - queries return raw DB data, field resolvers transform it.
 */

import type { QueryResolvers } from '../../__generated__/resolvers-types';
import { GraphQLError } from 'graphql';
import { validateModeratorAccess } from '../helpers/checkin';

export const eventCheckinLogs: QueryResolvers['eventCheckinLogs'] = async (
  _,
  { eventId, limit: limitArg, offset: offsetArg, action, method, memberId },
  { prisma, userId }
): Promise<any> => {
  const limit = limitArg ?? 50;
  const offset = offsetArg ?? 0;
  // Return type intentionally 'any' - field resolvers handle conversion
  if (!userId) {
    throw new GraphQLError('Not authenticated', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }

  try {
    // Validate moderator access
    await validateModeratorAccess(prisma, eventId, userId);

    // Build where clause
    const where: any = {
      eventId,
    };

    if (action) {
      where.action = action;
    }

    if (method) {
      where.method = method;
    }

    if (memberId) {
      where.memberId = memberId;
    }

    // Fetch logs with pagination
    const [items, total] = await Promise.all([
      prisma.eventCheckinLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          actor: true,
        },
      }),
      prisma.eventCheckinLog.count({ where }),
    ]);

    return {
      items, // Prisma EventCheckinLog[], field resolvers will convert enums/relations
      pageInfo: {
        total,
        limit,
        offset,
        hasNext: offset + limit < total,
        hasPrev: offset > 0,
      },
    };
  } catch (error) {
    if (error instanceof GraphQLError) {
      throw error;
    }
    throw new GraphQLError('Failed to fetch check-in logs', {
      extensions: { code: 'INTERNAL_SERVER_ERROR' },
    });
  }
};
