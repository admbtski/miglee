import { prisma } from '../../../lib/prisma';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import { QueryResolvers } from '../../__generated__/resolvers-types';

export const eventsQuery: QueryResolvers['events'] = resolverWithMetrics(
  'Query',
  'events',
  async (_p, { limit }) => {
    const take = Math.max(1, Math.min(limit ?? 10, 100));
    const rows = await prisma.event.findMany({
      take,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(({ id, title, createdAt }) => ({ id, title, createdAt }));
  }
);
