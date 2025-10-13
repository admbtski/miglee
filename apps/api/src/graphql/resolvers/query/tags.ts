import type { Prisma } from '@prisma/client';
import { prisma } from '../../../lib/prisma';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import type {
  Tag as GQLTag,
  QueryResolvers,
} from '../../__generated__/resolvers-types';

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
    });

    return list.map((t) => ({
      id: t.id,
      label: t.label,
      slug: t.slug,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }));
  }
);

export const tagQuery: QueryResolvers['tag'] = resolverWithMetrics(
  'Query',
  'tag',
  async (_p, { id, slug }): Promise<GQLTag | null> => {
    if (id) {
      const t = await prisma.tag.findUnique({ where: { id } });
      return t
        ? {
            id: t.id,
            label: t.label,
            slug: t.slug,
            createdAt: t.createdAt,
            updatedAt: t.updatedAt,
          }
        : null;
    }

    if (slug) {
      const t = await prisma.tag.findFirst({ where: { slug } });
      return t
        ? {
            id: t.id,
            label: t.label,
            slug: t.slug,
            createdAt: t.createdAt,
            updatedAt: t.updatedAt,
          }
        : null;
    }

    return null;
  }
);
