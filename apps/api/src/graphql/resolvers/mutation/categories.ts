import type { Prisma } from '../../../prisma-client/client';
import { Prisma as PrismaNS } from '../../../prisma-client/client';
import { GraphQLError } from 'graphql';
import { prisma } from '../../../lib/prisma';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import type { MutationResolvers } from '../../__generated__/resolvers-types';
import { toJSONObject } from '../helpers';
import { requireAdminOrModerator } from '../shared/auth-guards';

/**
 * Normalizes a slug to be URL-safe and lowercase.
 * - trims whitespace
 * - spaces -> hyphens
 * - collapses multiple hyphens
 * - strips non [a-z0-9-]
 */
const normalizeSlug = (raw: string) =>
  raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

const categorySelect = {
  id: true,
  slug: true,
  names: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CategorySelect;

/**
 * Mutation: Create Category
 * Required level: APP_MOD_OR_ADMIN
 */
export const createCategoryMutation: MutationResolvers['createCategory'] =
  resolverWithMetrics(
    'Mutation',
    'createCategory',
    async (_p, { input }, { user }) => {
      requireAdminOrModerator(user);

      const slug = normalizeSlug(input.slug);
      if (!slug) {
        throw new GraphQLError('Slug cannot be empty after normalization.', {
          extensions: { code: 'BAD_USER_INPUT', field: 'slug' },
        });
      }

      // names jest JSON (nienullowalne) — wymuś sensowną strukturę
      if (input.names == null || typeof input.names !== 'object') {
        throw new GraphQLError('`names` must be a JSON object.', {
          extensions: { code: 'BAD_USER_INPUT', field: 'names' },
        });
      }

      try {
        const created = await prisma.category.create({
          data: {
            slug,
            names: input.names, // GraphQL JSON -> Prisma.JsonValue
          },
          select: categorySelect,
        });

        return {
          id: created.id,
          slug: created.slug,
          names: toJSONObject(created.names),
          createdAt: created.createdAt,
          updatedAt: created.updatedAt,
        };
      } catch (e: unknown) {
        if (e instanceof PrismaNS.PrismaClientKnownRequestError) {
          if (e.code === 'P2002') {
            throw new GraphQLError('Category with this slug already exists.', {
              extensions: { code: 'CONFLICT', target: e.meta?.target },
            });
          }
        }
        throw e;
      }
    }
  );

/**
 * Mutation: Update Category
 * Required level: APP_MOD_OR_ADMIN
 */
export const updateCategoryMutation: MutationResolvers['updateCategory'] =
  resolverWithMetrics(
    'Mutation',
    'updateCategory',
    async (_p, { id, input }, { user }) => {
      requireAdminOrModerator(user);

      const data: Prisma.CategoryUpdateInput = {};

      // Slug normalization and validation
      if (typeof input.slug === 'string') {
        const slug = normalizeSlug(input.slug);
        if (!slug) {
          throw new GraphQLError('Slug cannot be empty after normalization.', {
            extensions: { code: 'BAD_USER_INPUT', field: 'slug' },
          });
        }
        data.slug = slug;
      }

      // names: pole JSON nienullowalne — brak wsparcia dla null, użyj np. {}
      if (input.names === null) {
        throw new GraphQLError(
          '`names` cannot be null. Use an empty object {} to clear.',
          {
            extensions: { code: 'BAD_USER_INPUT', field: 'names' },
          }
        );
      } else if (input.names !== undefined) {
        if (typeof input.names !== 'object') {
          throw new GraphQLError('`names` must be a JSON object.', {
            extensions: { code: 'BAD_USER_INPUT', field: 'names' },
          });
        }
        data.names = input.names;
      }

      try {
        const updated = await prisma.category.update({
          where: { id },
          data,
          select: categorySelect,
        });

        return {
          id: updated.id,
          slug: updated.slug,
          names: toJSONObject(updated.names),
          createdAt: updated.createdAt,
          updatedAt: updated.updatedAt,
        };
      } catch (e: unknown) {
        if (e instanceof PrismaNS.PrismaClientKnownRequestError) {
          if (e.code === 'P2002') {
            throw new GraphQLError('Category with this slug already exists.', {
              extensions: { code: 'CONFLICT', target: e.meta?.target },
            });
          }
          if (e.code === 'P2025') {
            throw new GraphQLError('Category not found.', {
              extensions: { code: 'NOT_FOUND', id },
            });
          }
        }
        throw e;
      }
    }
  );

/**
 * Mutation: Delete Category
 * Required level: APP_MOD_OR_ADMIN
 */
export const deleteCategoryMutation: MutationResolvers['deleteCategory'] =
  resolverWithMetrics(
    'Mutation',
    'deleteCategory',
    async (_p, { id }, { user }) => {
      requireAdminOrModerator(user);

      try {
        await prisma.category.delete({ where: { id } });
        return true;
      } catch (e: unknown) {
        if (e instanceof PrismaNS.PrismaClientKnownRequestError) {
          if (e.code === 'P2025') {
            // brak rekordu -> semantyka idempotentnego delete: false
            return false;
          }
          // przyszłościowo, gdy dodasz FK z ON RESTRICT:
          // if (e.code === 'P2003') {
          //   throw new GraphQLError('Cannot delete category referenced by other records.', {
          //     extensions: { code: 'FAILED_PRECONDITION' },
          //   });
          // }
        }
        throw e;
      }
    }
  );
