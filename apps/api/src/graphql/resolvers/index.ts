import { Resolvers } from '../__generated__/resolvers-types';
import { prisma } from '../../lib/prisma';
import { GraphQLError, GraphQLScalarType, Kind } from 'graphql';

export const DateTimeScalar = new GraphQLScalarType<Date | null, string>({
  name: 'DateTime',
  description: 'ISO-8601 DateTime scalar (outputs Date -> ISO string)',
  serialize(value): string {
    const d = value instanceof Date ? value : new Date(value as any);
    if (Number.isNaN(d.getTime())) {
      throw new GraphQLError('DateTime.serialize: Invalid Date');
    }
    return d.toISOString();
  },
  parseValue(value): Date | null {
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      value instanceof Date
    ) {
      const d = value instanceof Date ? value : new Date(value);
      return Number.isNaN(d.getTime()) ? null : d;
    }
    return null;
  },
  parseLiteral(ast): Date | null {
    if (ast.kind === Kind.STRING || ast.kind === Kind.INT) {
      const d = new Date(ast.value as any);
      return Number.isNaN(d.getTime()) ? null : d;
    }
    return null;
  },
});

export const resolvers: Resolvers = {
  DateTime: DateTimeScalar,
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
