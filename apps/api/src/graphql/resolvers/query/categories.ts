import type { Prisma } from '@prisma/client';
import { prisma } from '../../../lib/prisma';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import { QueryResolvers } from '../../__generated__/resolvers-types';
import { mapCategory } from '../helpers';

const categorySelect = {
  id: true,
  slug: true,
  names: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CategorySelect;

const SEARCH_LOCALES = ['pl', 'en', 'de'] as const;

export const categoriesQuery: QueryResolvers['categories'] =
  resolverWithMetrics(
    'Query',
    'categories',
    async (_p, { query: queryArg, limit }) => {
      const take = Math.max(1, Math.min(limit ?? 50, 200));
      const query = queryArg?.trim();

      const namePathFilters: Prisma.CategoryWhereInput[] = query
        ? SEARCH_LOCALES.map((loc) => ({
            // IMPORTANT: path + string_contains => Prisma wyciąga tekst (->>), więc case-insensitive zadziała
            names: {
              path: [loc],
              string_contains: query,
              mode: 'insensitive',
            },
          }))
        : [];

      const where: Prisma.CategoryWhereInput = query
        ? {
            OR: [
              { slug: { contains: query, mode: 'insensitive' } },
              ...namePathFilters,
            ],
          }
        : {};

      const list = await prisma.category.findMany({
        where,
        take,
        orderBy: { slug: 'asc' },
        select: categorySelect,
      });

      return list.map(mapCategory);
    }
  );

export const categoriesBySlugsQuery: QueryResolvers['categoriesBySlugs'] =
  resolverWithMetrics(
    'Query',
    'categoriesBySlugs',
    async (_p, { slugs, limit }) => {
      const take = Math.max(1, Math.min(limit ?? 100, 200));
      const uniqueSlugs = Array.isArray(slugs)
        ? Array.from(new Set(slugs.map((s) => s.trim()).filter(Boolean)))
        : [];

      const where: Prisma.CategoryWhereInput =
        uniqueSlugs.length > 0
          ? {
              slug: {
                in: uniqueSlugs,
              },
            }
          : {};

      const list = await prisma.category.findMany({
        where,
        take,
        orderBy: { slug: 'asc' },
        select: categorySelect,
      });

      return list.map(mapCategory);
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
      return c ? mapCategory(c) : null;
    }

    if (slug) {
      const c = await prisma.category.findUnique({
        where: { slug },
        select: categorySelect,
      });
      return c ? mapCategory(c) : null;
    }

    return null;
  }
);

export const checkCategorySlugAvailableQuery: QueryResolvers['checkCategorySlugAvailable'] =
  resolverWithMetrics(
    'Query',
    'checkCategorySlugAvailable',
    async (_p, { slug }) => {
      const trimmedSlug = slug.trim().toLowerCase();

      if (!trimmedSlug) {
        return false;
      }

      const existing = await prisma.category.findUnique({
        where: { slug: trimmedSlug },
        select: { id: true },
      });

      return !existing; // true if available (not found)
    }
  );

export const getCategoryUsageCountQuery: QueryResolvers['getCategoryUsageCount'] =
  resolverWithMetrics(
    'Query',
    'getCategoryUsageCount',
    async (_p, { slug }) => {
      const trimmedSlug = slug.trim();

      if (!trimmedSlug) {
        return 0;
      }

      // Count intents that use this category (many-to-many relation)
      const count = await prisma.intent.count({
        where: {
          categories: {
            some: {
              slug: trimmedSlug,
            },
          },
        },
      });

      return count;
    }
  );
