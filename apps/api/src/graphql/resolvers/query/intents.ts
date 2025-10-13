import type { Prisma } from '@prisma/client';
import { prisma } from '../../../lib/prisma';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import { QueryResolvers } from '../../__generated__/resolvers-types';
import { mapIntent } from '../helpers';

export const intentsQuery: QueryResolvers['intents'] = resolverWithMetrics(
  'Query',
  'intents',
  async (_p, args) => {
    const take = Math.max(1, Math.min(args.limit ?? 20, 100));
    const skip = Math.max(0, args.offset ?? 0);

    const where: Prisma.IntentWhereInput = {};
    if (args.visibility) where.visibility = args.visibility;
    if (args.authorId) where.authorId = args.authorId;
    if (args.upcomingAfter) where.startAt = { gte: args.upcomingAfter as Date };
    if (args.categoryIds?.length) {
      where.categories = { some: { id: { in: args.categoryIds } } };
    }
    if (args.tagIds?.length) {
      where.tags = { some: { id: { in: args.tagIds } } };
    }
    if (args.levels?.length) {
      // Postgres enum[] contains-any
      where.levels = { hasSome: args.levels };
    }

    const items = await prisma.intent.findMany({
      where,
      take,
      skip,
      orderBy: [{ startAt: 'asc' }, { createdAt: 'desc' }],
      include: { author: true, categories: true, tags: true },
    });

    return items.map(mapIntent);
  }
);

export const intentQuery: QueryResolvers['intent'] = resolverWithMetrics(
  'Query',
  'intent',
  async (_p, { id }) => {
    const row = await prisma.intent.findUnique({
      where: { id },
      include: { author: true, categories: true, tags: true },
    });
    return row ? mapIntent(row) : null;
  }
);
