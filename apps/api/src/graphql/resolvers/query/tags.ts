import type { Prisma } from '@prisma/client';
import { prisma } from '../../../lib/prisma';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import type {
  Tag as GQLTag,
  QueryResolvers,
} from '../../__generated__/resolvers-types';

const tagSelect = {
  id: true,
  label: true,
  slug: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.TagSelect;

export const tagsQuery: QueryResolvers['tags'] = resolverWithMetrics(
  'Query',
  'tags',
  async (_p, { query: q, limit }): Promise<GQLTag[]> => {
    const take = Math.max(1, Math.min(limit ?? 50, 200));
    const query = q?.trim();

    const where: Prisma.TagWhereInput = query
      ? {
          OR: [
            { label: { contains: query, mode: 'insensitive' } },
            { slug: { contains: query, mode: 'insensitive' } },
          ],
        }
      : {};

    const list = await prisma.tag.findMany({
      where,
      take,
      orderBy: { label: 'asc' },
      select: tagSelect,
    });

    // Select już zwraca shape zgodny z GQLTag.
    return list;
  }
);

export const tagQuery: QueryResolvers['tag'] = resolverWithMetrics(
  'Query',
  'tag',
  async (_p, { id, slug }): Promise<GQLTag | null> => {
    if (id) {
      const t = await prisma.tag.findUnique({
        where: { id },
        select: tagSelect,
      });
      return t ?? null;
    }

    if (slug) {
      // slug jest unikalny – użyj findUnique
      const t = await prisma.tag.findUnique({
        where: { slug },
        select: tagSelect,
      });
      return t ?? null;
    }

    return null;
  }
);
