/**
 * Admin Content Moderation Mutation Resolvers
 */

import { Role } from '@prisma/client';
import { GraphQLError } from 'graphql';
import { prisma } from '../../../lib/prisma';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
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
  if (user.role !== Role.ADMIN) {
    throw new GraphQLError('Admin access required.', {
      extensions: { code: 'FORBIDDEN' },
    });
  }
}

/**
 * Mutation: Delete comment (admin)
 */
export const adminDeleteCommentMutation: MutationResolvers['adminDeleteComment'] =
  resolverWithMetrics(
    'Mutation',
    'adminDeleteComment',
    async (_p, { id }, { user }) => {
      requireAdmin(user);

      const comment = await prisma.comment.findUnique({
        where: { id },
      });

      if (!comment) {
        throw new GraphQLError('Comment not found.', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Soft delete
      await prisma.comment.update({
        where: { id },
        data: {
          deletedAt: new Date(),
        },
      });

      return true;
    }
  );

/**
 * Mutation: Delete review (admin)
 */
export const adminDeleteReviewMutation: MutationResolvers['adminDeleteReview'] =
  resolverWithMetrics(
    'Mutation',
    'adminDeleteReview',
    async (_p, { id }, { user }) => {
      requireAdmin(user);

      const review = await prisma.review.findUnique({
        where: { id },
      });

      if (!review) {
        throw new GraphQLError('Review not found.', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Soft delete
      await prisma.review.update({
        where: { id },
        data: {
          deletedAt: new Date(),
        },
      });

      return true;
    }
  );
