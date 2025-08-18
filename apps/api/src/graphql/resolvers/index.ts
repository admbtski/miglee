import { Resolvers } from '../__generated__/resolvers-types';
import { prisma } from '../../lib/prisma';

export const resolvers: Resolvers = {
  DateTime: {
    serialize: (date: Date) => date.toISOString(),
    parseValue: (value: string) => new Date(value),
    parseLiteral: (ast) => {
      if (ast.kind === 'StringValue') {
        return new Date(ast.value);
      }
      return null;
    },
  },
  Query: {
    events: async (_parent, args) => {
      // Clamp limit between 1 and 100
      const limit = Math.max(1, Math.min(args.limit || 10, 100));

      const events = await prisma.event.findMany({
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      });

      return events;
    },
  },
};
