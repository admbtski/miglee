import type { Prisma } from '@prisma/client';
import { prisma } from '../../../lib/prisma';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import { QueryResolvers } from '../../__generated__/resolvers-types';
import { toJSONObject } from '../helpers';

const categorySelect = {
  id: true,
  slug: true,
  names: true,
  icon: true,
  color: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CategorySelect;

export const categoriesQuery: QueryResolvers['categories'] =
  resolverWithMetrics(
    'Query',
    'categories',
    async (_p, { query: queryArg, limit }) => {
      const take = Math.max(1, Math.min(limit ?? 50, 200));
      const query = queryArg?.trim();

      const where: Prisma.CategoryWhereInput = query
        ? {
            OR: [
              { slug: { contains: query, mode: 'insensitive' } },
              // jeśli chcesz szukać także w JSON names (prosty LIKE po serializacji):
              // { names: { string_contains: query, mode: 'insensitive' } } // wymaga Prisma 5.13+ (JSON string ops)
            ],
          }
        : {};

      const list = await prisma.category.findMany({
        where,
        take,
        orderBy: { slug: 'asc' },
        select: categorySelect,
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
      const c = await prisma.category.findUnique({
        where: { id },
        select: categorySelect,
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
      const c = await prisma.category.findUnique({
        where: { slug },
        select: categorySelect,
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
