import type { Prisma } from '@prisma/client';
import { prisma } from '../../../lib/prisma';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import { QueryResolvers } from '../../__generated__/resolvers-types';
import { toJSONObject } from '../helpers';

export const categoriesQuery: QueryResolvers['categories'] =
  resolverWithMetrics(
    'Query',
    'categories',
    async (_p, { query: queryArg, limit }) => {
      const take = Math.max(1, Math.min(limit ?? 50, 200));
      const query = queryArg?.trim();
      const where: Prisma.CategoryWhereInput = query
        ? { OR: [{ slug: { contains: query, mode: 'insensitive' } }] }
        : {};
      const list = await prisma.category.findMany({
        where,
        take,
        orderBy: { slug: 'asc' },
      });
      return list.map((c) => ({
        id: c.id,
        slug: c.slug,
        names: toJSONObject(c.names),
        icon: c.icon,
        color: c.color,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      }));
    }
  );

export const categoryQuery: QueryResolvers['category'] = resolverWithMetrics(
  'Query',
  'category',
  async (_p, { id, slug }) => {
    if (id) {
      const c = await prisma.category.findFirst({
        where: { id },
      });
      return c
        ? {
            id: c.id,
            slug: c.slug,
            names: toJSONObject(c.names),
            icon: c.icon,
            color: c.color,
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
          }
        : null;
    }
    if (slug) {
      const c = await prisma.category.findFirst({
        where: { slug },
      });
      return c
        ? {
            id: c.id,
            slug: c.slug,
            names: toJSONObject(c.names),
            icon: c.icon,
            color: c.color,
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
          }
        : null;
    }
    return null;
  }
);
