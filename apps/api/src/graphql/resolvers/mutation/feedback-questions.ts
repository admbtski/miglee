import {
  NotificationKind as PrismaNotificationKind,
  NotificationEntity as PrismaNotificationEntity,
} from '@prisma/client';
import { GraphQLError } from 'graphql';
import { logger } from '../../../lib/pino';
import { prisma } from '../../../lib/prisma';
import type {
  MutationResolvers,
  EventFeedbackQuestion,
  SubmitReviewAndFeedbackResult,
} from '../../__generated__/resolvers-types';
import { mapNotification } from '../helpers';
import { NOTIFICATION_INCLUDE } from './notifications';
import { enqueueFeedbackRequestNow } from '../../../workers/feedback/queue';
import {
  assertFeedbackRateLimit,
  assertFeedbackSendRateLimit,
} from '../../../lib/rate-limit/domainRateLimiter';
import { createAuditLog, type CreateAuditLogInput } from '../../../lib/audit';

// Temporary type aliases until prisma generate is run
type AuditScope = CreateAuditLogInput['scope'];
type AuditAction = CreateAuditLogInput['action'];

// Constants for validation
const MAX_QUESTIONS = 10;
const MAX_LABEL_LENGTH = 200;
const MAX_HELP_TEXT_LENGTH = 200;
const MAX_OPTIONS = 10;

/**
 * Check if user can edit feedback questions for an event
 * Rules:
 * - Must be owner or moderator
 * - Event must have PLUS or PRO plan
 */
async function canEditFeedbackQuestions(
  eventId: string,
  userId: string,
  userRole: string
): Promise<{ canEdit: boolean; reason?: string }> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      ownerId: true,
      sponsorshipPlan: true,
      members: {
        where: {
          userId,
          role: { in: ['OWNER', 'MODERATOR'] },
          status: 'JOINED',
        },
        select: { userId: true, role: true, status: true },
      },
    },
  });

  if (!event) {
    return { canEdit: false, reason: 'Event not found' };
  }

  // Check plan - feedback is only available for PLUS or PRO
  if (event.sponsorshipPlan === 'FREE') {
    return {
      canEdit: false,
      reason: 'Feedback questions are only available for PLUS or PRO plans',
    };
  }

  const isOwner = event.ownerId === userId;
  const isModerator = event.members.some(
    (m) =>
      m.userId === userId &&
      (m.role === 'OWNER' || m.role === 'MODERATOR') &&
      m.status === 'JOINED'
  );
  const isAdmin = userRole === 'ADMIN';

  if (!isOwner && !isModerator && !isAdmin) {
    return {
      canEdit: false,
      reason: 'Only event owner or moderators can edit feedback questions',
    };
  }

  return { canEdit: true };
}

/**
 * Create a new feedback question
 */
export const createFeedbackQuestionMutation: MutationResolvers['createFeedbackQuestion'] =
  async (_parent, { input }, { user }) => {
    if (!user) {
      throw new GraphQLError('Authentication required', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    // Check permissions
    const { canEdit, reason } = await canEditFeedbackQuestions(
      input.eventId,
      user.id,
      user.role
    );
    if (!canEdit) {
      throw new GraphQLError(reason || 'Cannot edit feedback questions', {
        extensions: { code: 'FORBIDDEN' },
      });
    }

    // Validate label length
    if (input.label.length > MAX_LABEL_LENGTH) {
      throw new GraphQLError(
        `Question label must be at most ${MAX_LABEL_LENGTH} characters`,
        {
          extensions: { code: 'BAD_USER_INPUT' },
        }
      );
    }

    // Validate help text length
    if (input.helpText && input.helpText.length > MAX_HELP_TEXT_LENGTH) {
      throw new GraphQLError(
        `Help text must be at most ${MAX_HELP_TEXT_LENGTH} characters`,
        {
          extensions: { code: 'BAD_USER_INPUT' },
        }
      );
    }

    // Validate options for CHOICE types
    if (input.type === 'SINGLE_CHOICE' || input.type === 'MULTI_CHOICE') {
      if (!input.options || !Array.isArray(input.options)) {
        throw new GraphQLError('Options are required for choice questions', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      if (input.options.length === 0) {
        throw new GraphQLError(
          'At least one option is required for choice questions',
          {
            extensions: { code: 'BAD_USER_INPUT' },
          }
        );
      }

      if (input.options.length > MAX_OPTIONS) {
        throw new GraphQLError(`Maximum ${MAX_OPTIONS} options allowed`, {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }
    }

    // Check max questions limit
    const existingCount = await prisma.eventFeedbackQuestion.count({
      where: { eventId: input.eventId },
    });

    if (existingCount >= MAX_QUESTIONS) {
      throw new GraphQLError(
        `Maximum ${MAX_QUESTIONS} questions allowed per event`,
        {
          extensions: { code: 'BAD_USER_INPUT' },
        }
      );
    }

    const question = await prisma.eventFeedbackQuestion.create({
      data: {
        eventId: input.eventId,
        order: input.order,
        type: input.type,
        label: input.label,
        helpText: input.helpText || null,
        required: input.required ?? false,
        options: input.options
          ? JSON.parse(JSON.stringify(input.options))
          : null,
        maxLength: input.maxLength || null,
      },
    });

    return {
      ...question,
      options: question.options || null,
      maxLength: question.maxLength || null,
      helpText: question.helpText || null,
      event: null, // Field resolver handles this
    } as unknown as EventFeedbackQuestion;
  };

/**
 * Update a feedback question
 */
export const updateFeedbackQuestionMutation: MutationResolvers['updateFeedbackQuestion'] =
  async (_parent, { id, input }, { user }) => {
    if (!user) {
      throw new GraphQLError('Authentication required', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    const question = await prisma.eventFeedbackQuestion.findUnique({
      where: { id },
      select: { eventId: true },
    });

    if (!question) {
      throw new GraphQLError('Question not found', {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    // Check permissions
    const { canEdit, reason } = await canEditFeedbackQuestions(
      question.eventId,
      user.id,
      user.role
    );
    if (!canEdit) {
      throw new GraphQLError(reason || 'Cannot edit feedback questions', {
        extensions: { code: 'FORBIDDEN' },
      });
    }

    // Validate label length
    if (input.label && input.label.length > MAX_LABEL_LENGTH) {
      throw new GraphQLError(
        `Question label must be at most ${MAX_LABEL_LENGTH} characters`,
        {
          extensions: { code: 'BAD_USER_INPUT' },
        }
      );
    }

    // Validate help text length
    if (input.helpText && input.helpText.length > MAX_HELP_TEXT_LENGTH) {
      throw new GraphQLError(
        `Help text must be at most ${MAX_HELP_TEXT_LENGTH} characters`,
        {
          extensions: { code: 'BAD_USER_INPUT' },
        }
      );
    }

    // Validate options if provided
    if (input.options) {
      if (!Array.isArray(input.options)) {
        throw new GraphQLError('Options must be an array', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      if (input.options.length === 0) {
        throw new GraphQLError(
          'At least one option is required for choice questions',
          {
            extensions: { code: 'BAD_USER_INPUT' },
          }
        );
      }

      if (input.options.length > MAX_OPTIONS) {
        throw new GraphQLError(`Maximum ${MAX_OPTIONS} options allowed`, {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }
    }

    const updated = await prisma.eventFeedbackQuestion.update({
      where: { id },
      data: {
        ...(input.order !== undefined && { order: input.order }),
        ...(input.label && { label: input.label }),
        ...(input.helpText !== undefined && {
          helpText: input.helpText || null,
        }),
        ...(input.required !== undefined && { required: input.required }),
        ...(input.options !== undefined && {
          options: input.options
            ? JSON.parse(JSON.stringify(input.options))
            : null,
        }),
        ...(input.maxLength !== undefined && {
          maxLength: input.maxLength || null,
        }),
      } as Record<string, unknown>,
    });

    return {
      ...updated,
      options: updated.options || null,
      maxLength: updated.maxLength || null,
      helpText: updated.helpText || null,
      event: null, // Field resolver handles this
    } as unknown as EventFeedbackQuestion;
  };

/**
 * Delete a feedback question
 */
export const deleteFeedbackQuestionMutation: MutationResolvers['deleteFeedbackQuestion'] =
  async (_parent, { id }, { user }) => {
    if (!user) {
      throw new GraphQLError('Authentication required', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    const question = await prisma.eventFeedbackQuestion.findUnique({
      where: { id },
      select: { eventId: true },
    });

    if (!question) {
      throw new GraphQLError('Question not found', {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    // Check permissions
    const { canEdit, reason } = await canEditFeedbackQuestions(
      question.eventId,
      user.id,
      user.role
    );
    if (!canEdit) {
      throw new GraphQLError(reason || 'Cannot edit feedback questions', {
        extensions: { code: 'FORBIDDEN' },
      });
    }

    await prisma.eventFeedbackQuestion.delete({
      where: { id },
    });

    return true;
  };

/**
 * Reorder feedback questions
 */
export const reorderFeedbackQuestionsMutation: MutationResolvers['reorderFeedbackQuestions'] =
  async (_parent, { eventId, questionIds }, { user }) => {
    if (!user) {
      throw new GraphQLError('Authentication required', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    // Check permissions
    const { canEdit, reason } = await canEditFeedbackQuestions(
      eventId,
      user.id,
      user.role
    );
    if (!canEdit) {
      throw new GraphQLError(reason || 'Cannot edit feedback questions', {
        extensions: { code: 'FORBIDDEN' },
      });
    }

    // Verify all questions belong to this event
    const questions = await prisma.eventFeedbackQuestion.findMany({
      where: {
        id: { in: questionIds },
        eventId,
      },
    });

    if (questions.length !== questionIds.length) {
      throw new GraphQLError('Some questions do not belong to this event', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }

    // Update order for each question
    await Promise.all(
      questionIds.map((id, index) =>
        prisma.eventFeedbackQuestion.update({
          where: { id },
          data: { order: index },
        })
      )
    );

    // Return updated questions
    const updated = await prisma.eventFeedbackQuestion.findMany({
      where: { eventId },
      orderBy: { order: 'asc' },
    });

    return updated.map((q) => ({
      ...q,
      options: q.options || null,
      maxLength: q.maxLength || null,
      helpText: q.helpText || null,
      event: null, // Field resolver handles this
    })) as unknown as EventFeedbackQuestion[];
  };

/**
 * Submit review + feedback (combined mutation)
 */
export const submitReviewAndFeedbackMutation: MutationResolvers['submitReviewAndFeedback'] =
  async (_parent, { input }, { user, pubsub }) => {
    if (!user) {
      throw new GraphQLError('Authentication required', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    // RATE LIMIT: Prevent review spam
    await assertFeedbackRateLimit(user.id);

    const { eventId, rating, content, feedbackAnswers } = input;

    // Verify event exists and is ended
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        endAt: true,
        ownerId: true,
        title: true,
        members: {
          where: {
            userId: user.id,
            status: 'JOINED',
          },
        },
      },
    });

    if (!event) {
      throw new GraphQLError('Event not found', {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    // Check if user is a member
    if (event.members.length === 0) {
      throw new GraphQLError('Only members can submit reviews and feedback', {
        extensions: { code: 'FORBIDDEN' },
      });
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      throw new GraphQLError('Rating must be between 1 and 5', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }

    // Validate content length
    if (content && content.length > 500) {
      throw new GraphQLError('Review content must be at most 500 characters', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }

    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Upsert review
      const review = await tx.review.upsert({
        where: {
          eventId_authorId: {
            eventId,
            authorId: user.id,
          },
        },
        update: {
          rating,
          content: content || null,
          updatedAt: new Date(),
        },
        create: {
          eventId,
          authorId: user.id,
          rating,
          content: content || null,
        },
        include: {
          author: true,
          event: true,
        },
      });

      // Process feedback answers if provided
      const createdAnswers = [];
      if (feedbackAnswers && feedbackAnswers.length > 0) {
        // Fetch questions to validate
        const questions = await tx.eventFeedbackQuestion.findMany({
          where: {
            eventId,
            id: { in: feedbackAnswers.map((a) => a.questionId) },
          },
        });

        const questionMap = new Map(questions.map((q) => [q.id, q]));

        // Validate and upsert answers
        for (const answerInput of feedbackAnswers) {
          const question = questionMap.get(answerInput.questionId);
          if (!question) {
            throw new GraphQLError(
              `Question ${answerInput.questionId} not found`,
              {
                extensions: { code: 'BAD_USER_INPUT' },
              }
            );
          }

          // Validate answer based on question type
          // (Add more validation as needed)

          const answer = await tx.eventFeedbackAnswer.upsert({
            where: {
              eventId_userId_questionId: {
                eventId,
                userId: user.id,
                questionId: answerInput.questionId,
              },
            },
            update: {
              answer: answerInput.answer,
              updatedAt: new Date(),
            },
            create: {
              eventId,
              userId: user.id,
              questionId: answerInput.questionId,
              answer: answerInput.answer,
            },
            include: {
              question: true,
              member: {
                include: {
                  user: true,
                },
              },
            },
          });

          createdAnswers.push(answer);
        }
      }

      // Audit log: REVIEW/CREATE (severity 2)
      await createAuditLog(tx, {
        eventId,
        actorId: user.id,
        actorRole: null,
        scope: 'REVIEW' as AuditScope,
        action: 'CREATE' as AuditAction,
        entityType: 'Review',
        entityId: review.id,
        meta: { rating, hadFeedback: createdAnswers.length > 0 },
        severity: 2,
      });

      return { review, feedbackAnswers: createdAnswers };
    });

    // Notify owner about review/feedback submission
    if (event.ownerId && event.ownerId !== user.id) {
      const hasFeedback = feedbackAnswers && feedbackAnswers.length > 0;
      const kind = hasFeedback
        ? PrismaNotificationKind.EVENT_FEEDBACK_RECEIVED
        : PrismaNotificationKind.EVENT_REVIEW_RECEIVED;

      const notif = await prisma.notification.create({
        data: {
          kind,
          recipientId: event.ownerId,
          actorId: user.id,
          entityType: PrismaNotificationEntity.REVIEW,
          entityId: result.review.id,
          eventId,
          title: null,
          body: null,
          dedupeKey: `review_feedback:${eventId}:${result.review.id}`,
          data: {
            eventId,
            eventTitle: event.title,
            actorName: user.name,
            rating,
            reviewContent: content?.slice(0, 100) || undefined,
            hasFeedback,
          },
        },
        include: NOTIFICATION_INCLUDE,
      });
      await pubsub?.publish({
        topic: `NOTIFICATION_ADDED:${event.ownerId}`,
        payload: { notificationAdded: mapNotification(notif) },
      });
      await pubsub?.publish({
        topic: `NOTIFICATION_BADGE:${event.ownerId}`,
        payload: { notificationBadgeChanged: { recipientId: event.ownerId } },
      });
    }

    return {
      review: result.review,
      feedbackAnswers: result.feedbackAnswers.map((answer) => ({
        ...answer,
        user: answer.member.user,
      })),
    } as unknown as SubmitReviewAndFeedbackResult;
  };

/**
 * Bulk update (replace) all feedback questions for an event
 * Similar to updateEventJoinQuestions - deletes all existing and creates new ones
 */
export const updateEventFeedbackQuestionsMutation: MutationResolvers['updateEventFeedbackQuestions'] =
  async (_parent, { input }, { user }) => {
    if (!user) {
      throw new GraphQLError('Authentication required', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    const { eventId, questions } = input;

    // Check permissions
    const { canEdit, reason } = await canEditFeedbackQuestions(
      eventId,
      user.id,
      user.role
    );
    if (!canEdit) {
      throw new GraphQLError(reason || 'Cannot edit feedback questions', {
        extensions: { code: 'FORBIDDEN' },
      });
    }

    // Validate input
    if (questions.length > MAX_QUESTIONS) {
      throw new GraphQLError(
        `Cannot add more than ${MAX_QUESTIONS} questions`,
        {
          extensions: { code: 'BAD_USER_INPUT' },
        }
      );
    }

    // Validate each question
    for (const q of questions) {
      if (!q.label || q.label.trim().length === 0) {
        throw new GraphQLError('Question label cannot be empty', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }
      if (q.label.length > MAX_LABEL_LENGTH) {
        throw new GraphQLError(
          `Question label cannot exceed ${MAX_LABEL_LENGTH} characters`,
          {
            extensions: { code: 'BAD_USER_INPUT' },
          }
        );
      }
      if (q.helpText && q.helpText.length > MAX_HELP_TEXT_LENGTH) {
        throw new GraphQLError(
          `Help text cannot exceed ${MAX_HELP_TEXT_LENGTH} characters`,
          {
            extensions: { code: 'BAD_USER_INPUT' },
          }
        );
      }
      if (
        (q.type === 'SINGLE_CHOICE' || q.type === 'MULTI_CHOICE') &&
        (!q.options || q.options.length === 0)
      ) {
        throw new GraphQLError(
          'Choice questions must have at least one option',
          {
            extensions: { code: 'BAD_USER_INPUT' },
          }
        );
      }
      if (q.options && q.options.length > MAX_OPTIONS) {
        throw new GraphQLError(
          `Cannot have more than ${MAX_OPTIONS} options per question`,
          {
            extensions: { code: 'BAD_USER_INPUT' },
          }
        );
      }
    }

    // Delete all existing questions and create new ones in a transaction
    const updatedQuestions = await prisma.$transaction(async (tx) => {
      // Delete all existing questions (this also deletes related answers due to cascade)
      await tx.eventFeedbackQuestion.deleteMany({
        where: { eventId },
      });

      // Create new questions with order
      const createdQuestions = await Promise.all(
        questions.map((q, index) =>
          tx.eventFeedbackQuestion.create({
            data: {
              eventId,
              order: q.order ?? index,
              type: q.type,
              label: q.label.trim(),
              helpText: q.helpText?.trim() || null,
              required: q.required,
              options: q.options ? JSON.parse(JSON.stringify(q.options)) : null,
              maxLength: q.maxLength || null,
            },
          })
        )
      );

      // Audit log: EVENT/CONFIG_CHANGE (severity 2)
      await createAuditLog(tx, {
        eventId,
        actorId: user.id,
        actorRole: user.role,
        scope: 'EVENT' as AuditScope,
        action: 'CONFIG_CHANGE' as AuditAction,
        entityType: 'EventFeedbackQuestion',
        entityId: eventId,
        meta: { feedbackQuestionsChanged: true, questionCount: questions.length },
        severity: 2,
      });

      return createdQuestions;
    });

    return updatedQuestions.map((q) => ({
      ...q,
      options: q.options || null,
      maxLength: q.maxLength || null,
      helpText: q.helpText || null,
      event: null, // Field resolver handles this
    })) as unknown as EventFeedbackQuestion[];
  };

/**
 * Manual trigger to send feedback requests to all JOINED members
 * Only owner, moderator, or admin can trigger this
 */
export const sendFeedbackRequestsMutation: MutationResolvers['sendFeedbackRequests'] =
  async (_parent, { eventId }, { user }) => {
    if (!user) {
      throw new GraphQLError('Unauthorized', {
        extensions: { code: 'UNAUTHORIZED' },
      });
    }

    // RATE LIMIT: CRITICAL - Prevent mass email spam!
    await assertFeedbackSendRateLimit(user.id);

    // Fetch event with membership
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        members: {
          where: {
            userId: user.id,
          },
        },
        owner: true,
      },
    });

    if (!event) {
      throw new GraphQLError('Event not found', {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    // Check permissions (owner, moderator, or admin)
    const membership = event.members[0];
    const isAdmin = user.role === 'ADMIN';
    const isOwnerOrModerator =
      membership && ['OWNER', 'MODERATOR'].includes(membership.role);

    if (!isAdmin && !isOwnerOrModerator) {
      throw new GraphQLError(
        'Only owner, moderator, or admin can send feedback requests',
        {
          extensions: { code: 'FORBIDDEN' },
        }
      );
    }
    // Check if event has ended
    if (event.endAt > new Date()) {
      throw new GraphQLError(
        'Cannot send feedback requests before event ends',
        {
          extensions: { code: 'BAD_USER_INPUT' },
        }
      );
    }

    // Check if event is cancelled or deleted
    if (event.canceledAt || event.deletedAt) {
      throw new GraphQLError(
        'Cannot send feedback requests for cancelled/deleted event',
        {
          extensions: { code: 'BAD_USER_INPUT' },
        }
      );
    }

    // Count eligible members (JOINED status)
    const joinedMembers = await prisma.eventMember.count({
      where: {
        eventId,
        status: 'JOINED',
      },
    });

    if (joinedMembers === 0) {
      return {
        success: false,
        sentCount: 0,
        skippedCount: 0,
        message: 'No joined members to send feedback requests to',
      };
    }

    // Enqueue feedback request job
    try {
      await enqueueFeedbackRequestNow(eventId);

      // Audit log: EVENT/CONFIG_CHANGE (severity 3)
      await createAuditLog(prisma, {
        eventId,
        actorId: user.id,
        actorRole: user.role,
        scope: 'EVENT' as AuditScope,
        action: 'CONFIG_CHANGE' as AuditAction,
        entityType: 'Event',
        entityId: eventId,
        meta: { feedbackRequestsSent: true, recipientCount: joinedMembers },
        severity: 3,
      });

      return {
        success: true,
        sentCount: joinedMembers,
        skippedCount: 0,
        message: `Feedback requests will be sent to ${joinedMembers} member(s)`,
      };
    } catch (error: unknown) {
      logger.error({ error }, 'sendFeedbackRequests failed');
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new GraphQLError(
        `Failed to enqueue feedback requests: ${message}`,
        {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        }
      );
    }
  };
