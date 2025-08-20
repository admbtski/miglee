import { prisma } from '../../lib/prisma';
import { Event, Resolvers } from '../__generated__/resolvers-types';

// codegen generates type for each entity, so we need to extract query, mutation and subscription
type ResolversType = Pick<Resolvers, 'Query'>;

export const resolvers: ResolversType = {
  Query: {
    events: async (_parent, args, ctx): Promise<Event[]> => {
      const limit = Math.max(1, Math.min(args.limit || 10, 100));

      const events = await prisma.event.findMany({
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      });

      return events.map(({ createdAt, id, title }) => ({
        id,
        title,
        createdAt,
      }));
    },
  },
};
