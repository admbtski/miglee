/**
 * Reviews Mutation Resolvers
 *
 * Authorization:
 * - createReview: EVENT_PARTICIPANT (after event ends)
 * - updateReview: SELF or ADMIN
 * - deleteReview: SELF or APP_MOD_OR_ADMIN
 * - hideReview/unhideReview: APP_MOD_OR_ADMIN
 */

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
import {
  requireAuth,
  isAdmin,
  isAdminOrModerator,
  requireSelfOrAppMod,
} from '../shared/auth-guards';
import { createAuditLog, type CreateAuditLogInput } from '../../../lib/audit';

// Temporary type aliases until prisma generate is run
type AuditScope = CreateAuditLogInput['scope'];
type AuditAction = CreateAuditLogInput['action'];

const REVIEW_INCLUDE = {
  author: true,
  event: true,
} satisfies Prisma.ReviewInclude;

/**
 * Mutation: Create a review
 * Authorization: EVENT_PARTICIPANT (must have been JOINED, event must have ended)
 */
export const createReviewMutation: MutationResolvers['createReview'] =
  resolverWithMetrics(
    'Mutation',
    'createReview',
    async (_p, { input }, ctx) => {
      const userId = requireAuth(ctx);

      const { eventId, rating, content } = input;

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

      // Verify event exists and is not deleted
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: {
          id: true,
          deletedAt: true,
          endAt: true,
          ownerId: true,
          title: true,
        },
      });

      if (!event || event.deletedAt) {
        throw new GraphQLError('Event not found.', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Check if event has ended (optional: only allow reviews after event)
      const now = new Date();
      if (event.endAt > now) {
        throw new GraphQLError('Cannot review event before it ends.', {
          extensions: { code: 'FAILED_PRECONDITION' },
        });
      }

      // Check if user was a participant
      const membership = await prisma.eventMember.findUnique({
        where: {
          eventId_userId: { eventId, userId },
        },
        select: { status: true },
      });

      if (!membership || membership.status !== 'JOINED') {
        throw new GraphQLError('Only participants can review this event.', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      // Check if review already exists
      const existing = await prisma.review.findUnique({
        where: {
          eventId_authorId: { eventId, authorId: userId },
        },
      });

      if (existing && !existing.deletedAt) {
        throw new GraphQLError('You have already reviewed this event.', {
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
              eventId,
              authorId: userId,
              rating,
              content: content?.trim() || null,
            },
            include: REVIEW_INCLUDE,
          });

      // Audit log: REVIEW/CREATE (severity 2)
      await createAuditLog(prisma, {
        eventId,
        actorId: userId,
        actorRole: null,
        scope: 'REVIEW' as AuditScope,
        action: 'CREATE' as AuditAction,
        entityType: 'Review',
        entityId: review.id,
        meta: { rating },
        severity: 2,
      });

      // Notify event owner about new review
      if (event.ownerId && event.ownerId !== userId) {
        const notif = await prisma.notification.create({
          data: {
            kind: PrismaNotificationKind.EVENT_REVIEW_RECEIVED,
            recipientId: event.ownerId,
            actorId: userId,
            entityType: PrismaNotificationEntity.REVIEW,
            entityId: review.id,
            eventId,
            title: null,
            body: null,
            dedupeKey: `review:${eventId}:${review.id}`,
            data: {
              eventId,
              eventTitle: event.title,
              actorName: ctx.user!.name,
              rating,
              reviewContent: content?.slice(0, 100) || undefined,
            },
          },
          include: NOTIFICATION_INCLUDE,
        });
        await ctx.pubsub?.publish({
          topic: `NOTIFICATION_ADDED:${event.ownerId}`,
          payload: { notificationAdded: mapNotification(notif) },
        });
        await ctx.pubsub?.publish({
          topic: `NOTIFICATION_BADGE:${event.ownerId}`,
          payload: {
            notificationBadgeChanged: { recipientId: event.ownerId },
          },
        });
      }

      return mapReview(review);
    }
  );

/**
 * Mutation: Update a review
 * Authorization: SELF or ADMIN (author can edit own, admin can edit any)
 */
export const updateReviewMutation: MutationResolvers['updateReview'] =
  resolverWithMetrics(
    'Mutation',
    'updateReview',
    async (_p, { id, input }, ctx) => {
      const userId = requireAuth(ctx);

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

      // Permission check: Only Admin or Author can edit (not Moderator)
      const isAuthor = existing.authorId === userId;
      if (!isAdmin(ctx.user) && !isAuthor) {
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

      // Audit log: REVIEW/UPDATE (severity 2)
      await createAuditLog(prisma, {
        eventId: updated.eventId,
        actorId: userId,
        actorRole: ctx.user?.role,
        scope: 'REVIEW' as AuditScope,
        action: 'UPDATE' as AuditAction,
        entityType: 'Review',
        entityId: id,
        meta: {
          ratingChanged: rating !== undefined,
          contentEdited: content !== undefined,
        },
        severity: 2,
      });

      return mapReview(updated);
    }
  );

/**
 * Mutation: Delete a review (soft delete)
 * Authorization: SELF or APP_MOD_OR_ADMIN
 */
export const deleteReviewMutation: MutationResolvers['deleteReview'] =
  resolverWithMetrics('Mutation', 'deleteReview', async (_p, { id }, ctx) => {
    const userId = requireAuth(ctx);

    const existing = await prisma.review.findUnique({
      where: { id },
      select: { authorId: true, deletedAt: true, hiddenAt: true },
    });

    if (!existing) {
      return false; // Idempotent
    }

    // Permission check: SELF or APP_MOD_OR_ADMIN
    requireSelfOrAppMod(ctx.user, existing.authorId);

    if (existing.deletedAt) {
      return true; // Already deleted
    }

    // Get review with eventId for audit log
    const review = await prisma.review.findUnique({
      where: { id },
      select: { eventId: true },
    });

    await prisma.review.update({
      where: { id },
      data: { deletedAt: new Date(), deletedById: userId },
    });

    // Audit log: REVIEW/DELETE (severity 3)
    if (review?.eventId) {
      await createAuditLog(prisma, {
        eventId: review.eventId,
        actorId: userId,
        actorRole: ctx.user?.role,
        scope: 'REVIEW' as AuditScope,
        action: 'DELETE' as AuditAction,
        entityType: 'Review',
        entityId: id,
        meta: { by: existing.authorId === userId ? 'author' : 'moderator' },
        severity: 3,
      });
    }

    return true;
  });

/**
 * Mutation: Hide a review (moderation)
 * Authorization: APP_MOD_OR_ADMIN
 */
export const hideReviewMutation: MutationResolvers['hideReview'] =
  resolverWithMetrics('Mutation', 'hideReview', async (_p, { id }, ctx) => {
    const userId = requireAuth(ctx);

    // Only APP_MOD_OR_ADMIN can hide reviews
    if (!isAdminOrModerator(ctx.user)) {
      throw new GraphQLError('Insufficient permissions to hide reviews.', {
        extensions: { code: 'FORBIDDEN' },
      });
    }

    const review = await prisma.review.findUnique({
      where: { id },
      select: {
        id: true,
        eventId: true,
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

    if (review.hiddenAt) {
      return true; // Already hidden
    }

    await prisma.review.update({
      where: { id },
      data: { hiddenAt: new Date(), hiddenById: userId },
    });

    // Notify review author that their review was hidden
    if (review.authorId !== userId) {
      const event = await prisma.event.findUnique({
        where: { id: review.eventId },
        select: { title: true },
      });

      const notif = await prisma.notification.create({
        data: {
          kind: PrismaNotificationKind.REVIEW_HIDDEN,
          title: null,
          body: null,
          entityType: PrismaNotificationEntity.REVIEW,
          entityId: id,
          eventId: review.eventId,
          recipientId: review.authorId,
          actorId: userId,
          data: {
            reviewId: id,
            eventId: review.eventId,
            eventTitle: event?.title,
            moderatorName: ctx.user!.name,
          },
          dedupeKey: `review_hidden:${id}`,
        },
        include: NOTIFICATION_INCLUDE,
      });
      await ctx.pubsub?.publish({
        topic: `NOTIFICATION_ADDED:${review.authorId}`,
        payload: { notificationAdded: mapNotification(notif) },
      });
      await ctx.pubsub?.publish({
        topic: `NOTIFICATION_BADGE:${review.authorId}`,
        payload: {
          notificationBadgeChanged: { recipientId: review.authorId },
        },
      });
    }

    // Audit log: MODERATION/HIDE (severity 4)
    await createAuditLog(prisma, {
      eventId: review.eventId,
      actorId: userId,
      actorRole: ctx.user?.role,
      scope: 'MODERATION' as AuditScope,
      action: 'HIDE' as AuditAction,
      entityType: 'Review',
      entityId: id,
      severity: 4,
    });

    return true;
  });

/**
 * Mutation: Unhide a review (moderation)
 * Authorization: APP_MOD_OR_ADMIN
 */
export const unhideReviewMutation: MutationResolvers['unhideReview'] =
  resolverWithMetrics('Mutation', 'unhideReview', async (_p, { id }, ctx) => {
    requireAuth(ctx);

    // Only APP_MOD_OR_ADMIN can unhide reviews
    if (!isAdminOrModerator(ctx.user)) {
      throw new GraphQLError('Insufficient permissions to unhide reviews.', {
        extensions: { code: 'FORBIDDEN' },
      });
    }

    const review = await prisma.review.findUnique({
      where: { id },
      select: { id: true, eventId: true, deletedAt: true, hiddenAt: true },
    });

    if (!review) {
      throw new GraphQLError('Review not found.', {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    if (!review.hiddenAt) {
      return true; // Not hidden
    }

    await prisma.review.update({
      where: { id },
      data: { hiddenAt: null, hiddenById: null },
    });

    // Audit log: MODERATION/UNHIDE (severity 4)
    await createAuditLog(prisma, {
      eventId: review.eventId,
      actorId: ctx.user!.id,
      actorRole: ctx.user?.role,
      scope: 'MODERATION' as AuditScope,
      action: 'UNHIDE' as AuditAction,
      entityType: 'Review',
      entityId: id,
      severity: 4,
    });

    return true;
  });
