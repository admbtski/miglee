/**
 * Admin Intent Management Mutations
 */

import { GraphQLError } from 'graphql';
import { prisma } from '../../../lib/prisma.js';
import { resolverWithMetrics } from '../../../lib/resolver-metrics.js';
import type { MutationResolvers } from '../../__generated__/resolvers-types';

/**
 * Helper: Check if user is admin
 */
function requireAdmin(user: any) {
  if (!user?.id) {
    throw new GraphQLError('Authentication required.', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
  if (user.role !== 'ADMIN') {
    throw new GraphQLError('Admin role required.', {
      extensions: { code: 'FORBIDDEN' },
    });
  }
}

/**
 * Mutation: Admin update intent
 */
export const adminUpdateIntentMutation: MutationResolvers['adminUpdateIntent'] =
  resolverWithMetrics(
    'Mutation',
    'adminUpdateIntent',
    async (_p, { id, input }, { user }) => {
      requireAdmin(user);

      // Check if intent exists
      const intent = await prisma.intent.findUnique({
        where: { id },
      });

      if (!intent) {
        throw new GraphQLError('Intent not found.', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Update intent
      const updated = await prisma.intent.update({
        where: { id },
        data: {
          ...input,
          categorySlugs: input.categorySlugs
            ? { set: input.categorySlugs }
            : undefined,
          tagIds: input.tagIds ? { set: input.tagIds } : undefined,
          levels: input.levels ? { set: input.levels } : undefined,
        },
        include: {
          owner: true,
          members: {
            where: { status: 'JOINED' },
          },
        },
      });

      return updated as any;
    }
  );

/**
 * Mutation: Admin delete intent (soft delete)
 */
export const adminDeleteIntentMutation: MutationResolvers['adminDeleteIntent'] =
  resolverWithMetrics(
    'Mutation',
    'adminDeleteIntent',
    async (_p, { id }, { user }) => {
      requireAdmin(user);

      // Check if intent exists
      const intent = await prisma.intent.findUnique({
        where: { id },
      });

      if (!intent) {
        throw new GraphQLError('Intent not found.', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Soft delete
      await prisma.intent.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          deletedById: user.id,
        },
      });

      return true;
    }
  );

/**
 * Mutation: Admin cancel intent
 */
export const adminCancelIntentMutation: MutationResolvers['adminCancelIntent'] =
  resolverWithMetrics(
    'Mutation',
    'adminCancelIntent',
    async (_p, { id, reason }, { user }) => {
      requireAdmin(user);

      // Check if intent exists
      const intent = await prisma.intent.findUnique({
        where: { id },
      });

      if (!intent) {
        throw new GraphQLError('Intent not found.', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Cancel intent
      const updated = await prisma.intent.update({
        where: { id },
        data: {
          canceledAt: new Date(),
          canceledById: user.id,
          cancelReason: reason || 'Canceled by admin',
        },
        include: {
          owner: true,
          members: {
            where: { status: 'JOINED' },
          },
        },
      });

      return updated as any;
    }
  );

/**
 * Mutation: Admin restore intent
 */
export const adminRestoreIntentMutation: MutationResolvers['adminRestoreIntent'] =
  resolverWithMetrics(
    'Mutation',
    'adminRestoreIntent',
    async (_p, { id }, { user }) => {
      requireAdmin(user);

      // Check if intent exists
      const intent = await prisma.intent.findUnique({
        where: { id },
      });

      if (!intent) {
        throw new GraphQLError('Intent not found.', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Restore intent
      const updated = await prisma.intent.update({
        where: { id },
        data: {
          canceledAt: null,
          canceledById: null,
          cancelReason: null,
          deletedAt: null,
          deletedById: null,
        },
        include: {
          owner: true,
          members: {
            where: { status: 'JOINED' },
          },
        },
      });

      return updated as any;
    }
  );

/**
 * Mutation: Admin change intent owner
 */
export const adminChangeIntentOwnerMutation: MutationResolvers['adminChangeIntentOwner'] =
  resolverWithMetrics(
    'Mutation',
    'adminChangeIntentOwner',
    async (_p, { intentId, newOwnerId }, { user }) => {
      requireAdmin(user);

      // Check if intent exists
      const intent = await prisma.intent.findUnique({
        where: { id: intentId },
        include: {
          owner: true,
        },
      });

      if (!intent) {
        throw new GraphQLError('Intent not found.', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Check if new owner exists
      const newOwner = await prisma.user.findUnique({
        where: { id: newOwnerId },
      });

      if (!newOwner) {
        throw new GraphQLError('New owner not found.', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Update owner
      const updated = await prisma.intent.update({
        where: { id: intentId },
        data: {
          ownerId: newOwnerId,
        },
        include: {
          owner: true,
          members: {
            where: { status: 'JOINED' },
          },
        },
      });

      // Ensure new owner has a membership record
      await prisma.intentMember.upsert({
        where: {
          intentId_userId: {
            intentId,
            userId: newOwnerId,
          },
        },
        create: {
          intentId,
          userId: newOwnerId,
          status: 'JOINED',
          role: 'MODERATOR',
        },
        update: {
          status: 'JOINED',
          role: 'MODERATOR',
        },
      });

      return updated as any;
    }
  );

/**
 * Mutation: Admin bulk update intents
 */
export const adminBulkUpdateIntentsMutation: MutationResolvers['adminBulkUpdateIntents'] =
  resolverWithMetrics(
    'Mutation',
    'adminBulkUpdateIntents',
    async (_p, { ids, input }, { user }) => {
      requireAdmin(user);

      let success = 0;
      let failed = 0;
      const errors: string[] = [];

      for (const id of ids) {
        try {
          await prisma.intent.update({
            where: { id },
            data: {
              visibility: input.visibility || undefined,
              joinManuallyClosed: input.joinManuallyClosed ?? undefined,
              joinManualCloseReason: input.joinManualCloseReason || undefined,
            },
          });
          success++;
        } catch (error: any) {
          failed++;
          errors.push(`Intent ${id}: ${error.message}`);
        }
      }

      return {
        success,
        failed,
        errors,
      };
    }
  );
