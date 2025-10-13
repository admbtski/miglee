import type { Prisma } from '@prisma/client';
import { prisma } from '../../../lib/prisma';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import type { MutationResolvers } from '../../__generated__/resolvers-types';

export const createTagMutation: MutationResolvers['createTag'] =
  resolverWithMetrics('Mutation', 'createTag', async (_p, { input }) => {
    const created = await prisma.tag.create({
      data: {
        label: input.label,
        slug: input.slug,
      },
    });
    return {
      id: created.id,
      label: created.label,
      slug: created.slug,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    };
  });

export const updateTagMutation: MutationResolvers['updateTag'] =
  resolverWithMetrics('Mutation', 'updateTag', async (_p, { id, input }) => {
    // Pola non-nullable w Prisma — jeśli klient przyśle null, zareaguj jasno:
    if (input.label === null) {
      throw new Error('label cannot be null');
    }
    if (input.slug === null) {
      throw new Error('slug cannot be null');
    }

    const data: Prisma.TagUpdateInput = {
      ...(typeof input.label === 'string' ? { label: input.label } : {}),
      ...(typeof input.slug === 'string' ? { slug: input.slug } : {}),
    };

    const updated = await prisma.tag.update({
      where: { id },
      data,
    });

    return {
      id: updated.id,
      label: updated.label,
      slug: updated.slug,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  });

export const deleteTagMutation: MutationResolvers['deleteTag'] =
  resolverWithMetrics('Mutation', 'deleteTag', async (_p, { id }) => {
    await prisma.tag.delete({ where: { id } });
    return true;
  });
