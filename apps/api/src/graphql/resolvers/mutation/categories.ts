import type { Prisma } from '@prisma/client';
import { Prisma as PrismaNS } from '@prisma/client';
import { prisma } from '../../../lib/prisma';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import type { MutationResolvers } from '../../__generated__/resolvers-types';
import { toJSONObject } from '../helpers';

export const createCategoryMutation: MutationResolvers['createCategory'] =
  resolverWithMetrics('Mutation', 'createCategory', async (_p, { input }) => {
    const created = await prisma.category.create({
      data: {
        slug: input.slug,
        names: input.names,
        icon: input.icon,
        color: input.color,
      },
    });
    return {
      id: created.id,
      slug: created.slug,
      names: toJSONObject(created.names),
      icon: created.icon,
      color: created.color,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    };
  });

export const updateCategoryMutation: MutationResolvers['updateCategory'] =
  resolverWithMetrics(
    'Mutation',
    'updateCategory',
    async (_p, { id, input }) => {
      const data: Prisma.CategoryUpdateInput = {
        ...(typeof input.slug === 'string' ? { slug: input.slug } : {}),
        ...(input.names === null
          ? { names: PrismaNS.JsonNull }
          : input.names !== undefined
            ? { names: input.names }
            : {}),
        ...(input.icon === null
          ? { icon: null }
          : input.icon !== undefined
            ? { icon: input.icon }
            : {}),
        ...(input.color === null
          ? { color: null }
          : input.color !== undefined
            ? { color: input.color }
            : {}),
      };

      const updated = await prisma.category.update({
        where: { id },
        data,
      });

      return {
        id: updated.id,
        slug: updated.slug,
        names: toJSONObject(updated.names),
        icon: updated.icon,
        color: updated.color,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      };
    }
  );

export const deleteCategoryMutation: MutationResolvers['deleteCategory'] =
  resolverWithMetrics('Mutation', 'deleteCategory', async (_p, { id }) => {
    await prisma.category.delete({ where: { id } });
    return true;
  });
