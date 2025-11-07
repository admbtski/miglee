import type { Prisma } from '@prisma/client';
import {
  NotificationKind as PrismaNotificationKind,
  NotificationEntity as PrismaNotificationEntity,
} from '@prisma/client';
import { GraphQLError } from 'graphql';
import { prisma } from '../../../lib/prisma';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import type { MutationResolvers } from '../../__generated__/resolvers-types';
import { mapReview } from '../helpers';

const REVIEW_INCLUDE = {
  author: true,
  intent: true,
} satisfies Prisma.ReviewInclude;

/**
 * Mutation: Create a review
 */
export const createReviewMutation: MutationResolvers['createReview'] =
  resolverWithMetrics(
    'Mutation',
    'createReview',
    async (_p, { input }, { user }) => {
      if (!user?.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const { intentId, rating, content } = input;

      // Validate rating
      if (rating < 1 || rating > 5) {
        throw new GraphQLError('Rating must be between 1 and 5.', {
          extensions: { code: 'BAD_USER_INPUT', field: 'rating' },
        });
      }

      // Validate content if provided
      if (content && content.length > 2000) {
        throw new GraphQLError(
          'Review content too long (max 2000 characters).',
          {
            extensions: { code: 'BAD_USER_INPUT', field: 'content' },
          }
        );
      }

      // Verify intent exists and is not deleted
      const intent = await prisma.intent.findUnique({
        where: { id: intentId },
        select: {
          id: true,
          deletedAt: true,
          endAt: true,
          ownerId: true,
        },
      });

      if (!intent || intent.deletedAt) {
        throw new GraphQLError('Intent not found.', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Check if intent has ended (optional: only allow reviews after event)
      const now = new Date();
      if (intent.endAt > now) {
        throw new GraphQLError('Cannot review intent before it ends.', {
          extensions: { code: 'FAILED_PRECONDITION' },
        });
      }

      // Check if user was a participant
      const membership = await prisma.intentMember.findUnique({
        where: {
          intentId_userId: {
            intentId,
            userId: user.id,
          },
        },
        select: { status: true },
      });

      if (!membership || membership.status !== 'JOINED') {
        throw new GraphQLError('Only participants can review this intent.', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      // Check if review already exists
      const existing = await prisma.review.findUnique({
        where: {
          intentId_authorId: {
            intentId,
            authorId: user.id,
          },
        },
      });

      if (existing && !existing.deletedAt) {
        throw new GraphQLError('You have already reviewed this intent.', {
          extensions: { code: 'FAILED_PRECONDITION' },
        });
      }

      const review = await prisma.review.create({
        data: {
          intentId,
          authorId: user.id,
          rating,
          content: content?.trim() || null,
        },
        include: REVIEW_INCLUDE,
      });

      // Optionally notify intent owner about new review
      if (intent.ownerId && intent.ownerId !== user.id) {
        await prisma.notification.create({
          data: {
            kind: PrismaNotificationKind.NEW_REVIEW,
            recipientId: intent.ownerId,
            actorId: user.id,
            entityType: PrismaNotificationEntity.REVIEW,
            entityId: review.id,
            title: 'New review on your intent',
            body: `${user.name} left a ${rating}-star review`,
            dedupeKey: `review:${intentId}:${review.id}`,
          },
        });
      }

      return mapReview(review);
    }
  );

/**
 * Mutation: Update a review
 */
export const updateReviewMutation: MutationResolvers['updateReview'] =
  resolverWithMetrics(
    'Mutation',
    'updateReview',
    async (_p, { id, input }, { user }) => {
      if (!user?.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const { rating, content } = input;

      // Validate rating if provided
      if (rating !== undefined && rating !== null) {
        if (rating < 1 || rating > 5) {
          throw new GraphQLError('Rating must be between 1 and 5.', {
            extensions: { code: 'BAD_USER_INPUT', field: 'rating' },
          });
        }
      }

      // Validate content if provided
      if (content && content.length > 2000) {
        throw new GraphQLError(
          'Review content too long (max 2000 characters).',
          {
            extensions: { code: 'BAD_USER_INPUT', field: 'content' },
          }
        );
      }

      // Verify ownership
      const existing = await prisma.review.findUnique({
        where: { id },
        select: { authorId: true, deletedAt: true },
      });

      if (!existing) {
        throw new GraphQLError('Review not found.', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      if (existing.authorId !== user.id) {
        throw new GraphQLError('Cannot edit reviews from other users.', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      if (existing.deletedAt) {
        throw new GraphQLError('Cannot edit deleted review.', {
          extensions: { code: 'FAILED_PRECONDITION' },
        });
      }

      const data: Prisma.ReviewUpdateInput = {};
      if (rating !== undefined && rating !== null) {
        data.rating = rating;
      }
      if (content !== undefined) {
        data.content = content?.trim() || null;
      }

      const updated = await prisma.review.update({
        where: { id },
        data,
        include: REVIEW_INCLUDE,
      });

      return mapReview(updated);
    }
  );

/**
 * Mutation: Delete a review (soft delete)
 */
export const deleteReviewMutation: MutationResolvers['deleteReview'] =
  resolverWithMetrics(
    'Mutation',
    'deleteReview',
    async (_p, { id }, { user }) => {
      if (!user?.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const existing = await prisma.review.findUnique({
        where: { id },
        select: { authorId: true, deletedAt: true },
      });

      if (!existing) {
        return false; // Idempotent
      }

      if (existing.authorId !== user.id) {
        throw new GraphQLError('Cannot delete reviews from other users.', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      if (existing.deletedAt) {
        return true; // Already deleted
      }

      await prisma.review.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      return true;
    }
  );
