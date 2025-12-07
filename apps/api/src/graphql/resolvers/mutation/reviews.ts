import type { Prisma } from '@prisma/client';
import {
  NotificationKind as PrismaNotificationKind,
  NotificationEntity as PrismaNotificationEntity,
} from '@prisma/client';
import { GraphQLError } from 'graphql';
import { prisma } from '../../../lib/prisma';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import type { MutationResolvers } from '../../__generated__/resolvers-types';
import { mapReview, mapNotification } from '../helpers';
import { NOTIFICATION_INCLUDE } from './notifications';

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
    async (_p, { input }, { user, pubsub }) => {
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
          title: true,
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

      // If a deleted review exists, restore it with new data
      // Otherwise, create a new review
      const review = existing
        ? await prisma.review.update({
            where: { id: existing.id },
            data: {
              rating,
              content: content?.trim() || null,
              deletedAt: null,
              updatedAt: new Date(),
            },
            include: REVIEW_INCLUDE,
          })
        : await prisma.review.create({
            data: {
              intentId,
              authorId: user.id,
              rating,
              content: content?.trim() || null,
            },
            include: REVIEW_INCLUDE,
          });

      // Notify intent owner about new review
      if (intent.ownerId && intent.ownerId !== user.id) {
        const notif = await prisma.notification.create({
          data: {
            kind: PrismaNotificationKind.INTENT_REVIEW_RECEIVED,
            recipientId: intent.ownerId,
            actorId: user.id,
            entityType: PrismaNotificationEntity.REVIEW,
            entityId: review.id,
            intentId,
            title: null,
            body: null,
            dedupeKey: `review:${intentId}:${review.id}`,
            data: {
              intentId,
              intentTitle: intent.title,
              actorName: user.name,
              rating,
              reviewContent: content?.slice(0, 100) || undefined,
            },
          },
          include: NOTIFICATION_INCLUDE,
        });
        await pubsub?.publish({
          topic: `NOTIFICATION_ADDED:${intent.ownerId}`,
          payload: { notificationAdded: mapNotification(notif) },
        });
        await pubsub?.publish({
          topic: `NOTIFICATION_BADGE:${intent.ownerId}`,
          payload: {
            notificationBadgeChanged: { recipientId: intent.ownerId },
          },
        });
      }

      return mapReview(review);
    }
  );

/**
 * Mutation: Update a review
 *
 * Permissions:
 * - App Admin: can edit any review (for exceptional cases like removing personal data)
 * - App Moderator: CANNOT edit (should use hide/delete for moderation)
 * - Intent Owner/Moderator: CANNOT edit others' reviews (protects review integrity)
 * - Review Author: can edit own review
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

      // Permission check: Only App Admin or Review Author can edit
      // App Moderators and Intent Owner/Moderators should NOT edit reviews
      const isAppAdmin = user.role === 'ADMIN';
      const isAuthor = existing.authorId === user.id;

      if (!isAppAdmin && !isAuthor) {
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
 *
 * Permissions:
 * - App Admin: can delete any review
 * - App Moderator: can delete any review
 * - Intent Owner/Moderator: CANNOT delete (protects review integrity - they can only report)
 * - Review Author: can delete own review
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
        select: { authorId: true, deletedAt: true, hiddenAt: true },
      });

      if (!existing) {
        return false; // Idempotent
      }

      // Permission check: Only App Admin, App Moderator, or Review Author can delete
      // Intent Owner/Moderators CANNOT delete reviews (protects review integrity)
      const isAppAdmin = user.role === 'ADMIN';
      const isAppModerator = user.role === 'MODERATOR';
      const isAuthor = existing.authorId === user.id;

      if (!isAppAdmin && !isAppModerator && !isAuthor) {
        throw new GraphQLError('Cannot delete reviews from other users.', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      if (existing.deletedAt) {
        return true; // Already deleted
      }

      await prisma.review.update({
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
 * Mutation: Hide a review (moderation - soft delete)
 *
 * Permissions:
 * - App Admin: can hide any review
 * - App Moderator: can hide any review
 * - Intent Owner/Moderator: CANNOT hide (protects review integrity - they can only report)
 *
 * Note: This is different from comments where Intent Owner/Mod can hide.
 * For reviews, only app-level moderators can hide to prevent organizers from
 * "polishing" their ratings.
 */
export const hideReviewMutation: MutationResolvers['hideReview'] =
  resolverWithMetrics(
    'Mutation',
    'hideReview',
    async (_p, { id }, { user, pubsub }) => {
      if (!user?.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const review = await prisma.review.findUnique({
        where: { id },
        select: {
          id: true,
          intentId: true,
          authorId: true,
          deletedAt: true,
          hiddenAt: true,
        },
      });

      if (!review) {
        throw new GraphQLError('Review not found.', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Permission check: Only App Admin or App Moderator can hide reviews
      // Intent Owner/Moderators CANNOT hide reviews (protects review integrity)
      const isAppAdmin = user.role === 'ADMIN';
      const isAppModerator = user.role === 'MODERATOR';

      if (!isAppAdmin && !isAppModerator) {
        throw new GraphQLError('Insufficient permissions to hide reviews.', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      if (review.hiddenAt) {
        return true; // Already hidden
      }

      await prisma.review.update({
        where: { id },
        data: {
          hiddenAt: new Date(),
          hiddenById: user.id,
        },
      });

      // Notify review author that their review was hidden
      if (review.authorId !== user.id) {
        // Fetch intent title for notification data
        const intent = await prisma.intent.findUnique({
          where: { id: review.intentId },
          select: { title: true },
        });

        const notif = await prisma.notification.create({
          data: {
            kind: PrismaNotificationKind.REVIEW_HIDDEN,
            title: null,
            body: null,
            entityType: PrismaNotificationEntity.REVIEW,
            entityId: id,
            intentId: review.intentId,
            recipientId: review.authorId,
            actorId: user.id,
            data: {
              reviewId: id,
              intentId: review.intentId,
              intentTitle: intent?.title,
              moderatorName: user.name,
            },
            dedupeKey: `review_hidden:${id}`,
          },
          include: NOTIFICATION_INCLUDE,
        });
        await pubsub?.publish({
          topic: `NOTIFICATION_ADDED:${review.authorId}`,
          payload: { notificationAdded: mapNotification(notif) },
        });
        await pubsub?.publish({
          topic: `NOTIFICATION_BADGE:${review.authorId}`,
          payload: {
            notificationBadgeChanged: { recipientId: review.authorId },
          },
        });
      }

      return true;
    }
  );

/**
 * Mutation: Unhide a review (moderation)
 *
 * Permissions:
 * - App Admin: can unhide any review
 * - App Moderator: can unhide any review
 * - Intent Owner/Moderator: CANNOT unhide (same as hide - only app-level mods)
 */
export const unhideReviewMutation: MutationResolvers['unhideReview'] =
  resolverWithMetrics(
    'Mutation',
    'unhideReview',
    async (_p, { id }, { user }) => {
      if (!user?.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const review = await prisma.review.findUnique({
        where: { id },
        select: {
          id: true,
          intentId: true,
          deletedAt: true,
          hiddenAt: true,
        },
      });

      if (!review) {
        throw new GraphQLError('Review not found.', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Permission check: Only App Admin or App Moderator can unhide reviews
      const isAppAdmin = user.role === 'ADMIN';
      const isAppModerator = user.role === 'MODERATOR';

      if (!isAppAdmin && !isAppModerator) {
        throw new GraphQLError('Insufficient permissions to unhide reviews.', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      if (!review.hiddenAt) {
        return true; // Not hidden
      }

      await prisma.review.update({
        where: { id },
        data: {
          hiddenAt: null,
          hiddenById: null,
        },
      });

      return true;
    }
  );
