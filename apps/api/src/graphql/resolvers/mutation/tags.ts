import type { Prisma } from '../../../prisma-client/client';
import { Prisma as PrismaNS } from '../../../prisma-client/client';
import { GraphQLError } from 'graphql';
import { prisma } from '../../../lib/prisma';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import type { MutationResolvers } from '../../__generated__/resolvers-types';
import { requireAdminOrModerator } from '../shared/auth-guards';

/**
 * Normalize a slug to URL-safe lowercase.
 */
const normalizeSlug = (raw: string) =>
  raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-') // spaces → hyphen
    .replace(/-+/g, '-') // collapse consecutive hyphens
    .replace(/[^a-z0-9-]/g, ''); // strip unsafe characters

const tagSelect = {
  id: true,
  label: true,
  slug: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.TagSelect;

/**
 * Mutation: Create Tag
 * Required level: APP_MOD_OR_ADMIN
 */
export const createTagMutation: MutationResolvers['createTag'] =
  resolverWithMetrics(
    'Mutation',
    'createTag',
    async (_p, { input }, { user }) => {
      requireAdminOrModerator(user);

      const label = input.label?.trim();
      if (!label) {
        throw new GraphQLError('`label` cannot be empty.', {
          extensions: { code: 'BAD_USER_INPUT', field: 'label' },
        });
      }

      const slug = normalizeSlug(input.slug);
      if (!slug) {
        throw new GraphQLError('Slug cannot be empty after normalization.', {
          extensions: { code: 'BAD_USER_INPUT', field: 'slug' },
        });
      }

      try {
        const created = await prisma.tag.create({
          data: { label, slug },
          select: tagSelect,
        });

        return created;
      } catch (e: unknown) {
        if (e instanceof PrismaNS.PrismaClientKnownRequestError) {
          if (e.code === 'P2002') {
            // Unique constraint (slug) violated
            throw new GraphQLError('Tag with this slug already exists.', {
              extensions: { code: 'CONFLICT', target: e.meta?.target },
            });
          }
        }
        throw e;
      }
    }
  );

/**
 * Mutation: Update Tag
 * Required level: APP_MOD_OR_ADMIN
 */
export const updateTagMutation: MutationResolvers['updateTag'] =
  resolverWithMetrics(
    'Mutation',
    'updateTag',
    async (_p, { id, input }, { user }) => {
      requireAdminOrModerator(user);

      // Guard non-nullable scalars in Prisma (reject explicit nulls)
      if (input.label === null)
        throw new GraphQLError('`label` cannot be null.', {
          extensions: { code: 'BAD_USER_INPUT', field: 'label' },
        });
      if (input.slug === null)
        throw new GraphQLError('`slug` cannot be null.', {
          extensions: { code: 'BAD_USER_INPUT', field: 'slug' },
        });

      const data: Prisma.TagUpdateInput = {};

      if (typeof input.label === 'string') {
        const label = input.label.trim();
        if (!label) {
          throw new GraphQLError('`label` cannot be empty.', {
            extensions: { code: 'BAD_USER_INPUT', field: 'label' },
          });
        }
        data.label = label;
      }

      if (typeof input.slug === 'string') {
        const slug = normalizeSlug(input.slug);
        if (!slug) {
          throw new GraphQLError('Slug cannot be empty after normalization.', {
            extensions: { code: 'BAD_USER_INPUT', field: 'slug' },
          });
        }
        data.slug = slug;
      }

      try {
        const updated = await prisma.tag.update({
          where: { id },
          data,
          select: tagSelect,
        });

        return updated;
      } catch (e: unknown) {
        if (e instanceof PrismaNS.PrismaClientKnownRequestError) {
          if (e.code === 'P2002') {
            throw new GraphQLError('Tag with this slug already exists.', {
              extensions: { code: 'CONFLICT', target: e.meta?.target },
            });
          }
          if (e.code === 'P2025') {
            throw new GraphQLError('Tag not found.', {
              extensions: { code: 'NOT_FOUND', id },
            });
          }
        }
        throw e;
      }
    }
  );

/**
 * Mutation: Delete Tag
 * Required level: APP_MOD_OR_ADMIN
 */
export const deleteTagMutation: MutationResolvers['deleteTag'] =
  resolverWithMetrics('Mutation', 'deleteTag', async (_p, { id }, { user }) => {
    requireAdminOrModerator(user);

    try {
      await prisma.tag.delete({ where: { id } });
      return true;
    } catch (e: unknown) {
      if (e instanceof PrismaNS.PrismaClientKnownRequestError) {
        if (e.code === 'P2025') {
          // Record not found — return false for idempotent UX
          return false;
        }
        // Future: if you add FKs with RESTRICT:
        // if (e.code === 'P2003') {
        //   throw new GraphQLError('Cannot delete tag referenced by other records.', {
        //     extensions: { code: 'FAILED_PRECONDITION' },
        //   });
        // }
      }
      throw e;
    }
  });
