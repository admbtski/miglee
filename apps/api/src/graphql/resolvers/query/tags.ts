import type { Prisma } from '@prisma/client';
import { GraphQLError } from 'graphql';
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

export const tagsBySlugsQuery: QueryResolvers['tagsBySlugs'] =
  resolverWithMetrics(
    'Query',
    'tagsBySlugs',
    async (_p, { slugs, limit }): Promise<GQLTag[]> => {
      const take = Math.max(1, Math.min(limit ?? 100, 200));

      const uniqueSlugs = Array.isArray(slugs)
        ? Array.from(new Set(slugs.map((s) => s.trim()).filter(Boolean)))
        : [];

      const where: Prisma.TagWhereInput =
        uniqueSlugs.length > 0 ? { slug: { in: uniqueSlugs } } : {};

      const list = await prisma.tag.findMany({
        where,
        take,
        orderBy: { slug: 'asc' },
        select: {
          id: true,
          slug: true,
          label: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return list;
    }
  );

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

/**
 * Check if tag slug is available
 * Required level: AUTH (protection against mass scanning)
 */
export const checkTagSlugAvailableQuery: QueryResolvers['checkTagSlugAvailable'] =
  resolverWithMetrics(
    'Query',
    'checkTagSlugAvailable',
    async (_p, { slug }, { user }) => {
      // AUTH required
      if (!user?.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const trimmedSlug = slug.trim().toLowerCase();

      if (!trimmedSlug) {
        return false;
      }

      const existing = await prisma.tag.findUnique({
        where: { slug: trimmedSlug },
        select: { id: true },
      });

      return !existing; // true if available (not found)
    }
  );

/**
 * Get tag usage count
 * Required level: APP_MOD_OR_ADMIN (sensitive statistics)
 */
export const getTagUsageCountQuery: QueryResolvers['getTagUsageCount'] =
  resolverWithMetrics(
    'Query',
    'getTagUsageCount',
    async (_p, { slug }, { user }) => {
      // APP_MOD_OR_ADMIN required
      if (!user?.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      if (user.role !== 'ADMIN' && user.role !== 'MODERATOR') {
        throw new GraphQLError('Admin or moderator access required.', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      const trimmedSlug = slug.trim();

      if (!trimmedSlug) {
        return 0;
      }

      // Count events that use this tag (many-to-many relation)
      const count = await prisma.event.count({
        where: {
          tags: {
            some: {
              slug: trimmedSlug,
            },
          },
        },
      });

      return count;
    }
  );
