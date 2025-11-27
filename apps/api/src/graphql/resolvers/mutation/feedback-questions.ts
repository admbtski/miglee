import type { MutationResolvers } from '../../__generated__/resolvers-types';
import { prisma } from '../../../lib/prisma';
import { GraphQLError } from 'graphql';
import { enqueueFeedbackRequestNow } from '../../../workers/feedback/queue';

// Constants for validation
const MAX_QUESTIONS = 10;
const MAX_LABEL_LENGTH = 200;
const MAX_HELP_TEXT_LENGTH = 200;
const MAX_OPTIONS = 10;

/**
 * Check if user can edit feedback questions for an intent
 * Rules:
 * - Must be owner or moderator
 * - Event must have PLUS or PRO plan
 */
async function canEditFeedbackQuestions(
  intentId: string,
  userId: string,
  userRole: string
): Promise<{ canEdit: boolean; reason?: string }> {
  const intent = await prisma.intent.findUnique({
    where: { id: intentId },
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

  if (!intent) {
    return { canEdit: false, reason: 'Intent not found' };
  }

  // Check plan - feedback is only available for PLUS or PRO
  if (intent.sponsorshipPlan === 'FREE') {
    return {
      canEdit: false,
      reason: 'Feedback questions are only available for PLUS or PRO plans',
    };
  }

  const isOwner = intent.ownerId === userId;
  const isModerator = intent.members.some(
    (m) =>
      m.userId === userId &&
      (m.role === 'OWNER' || m.role === 'MODERATOR') &&
      m.status === 'JOINED'
  );
  const isAdmin = userRole === 'ADMIN';

  if (!isOwner && !isModerator && !isAdmin) {
    return {
      canEdit: false,
      reason: 'Only intent owner or moderators can edit feedback questions',
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
      input.intentId,
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
    const existingCount = await prisma.intentFeedbackQuestion.count({
      where: { intentId: input.intentId },
    });

    if (existingCount >= MAX_QUESTIONS) {
      throw new GraphQLError(
        `Maximum ${MAX_QUESTIONS} questions allowed per intent`,
        {
          extensions: { code: 'BAD_USER_INPUT' },
        }
      );
    }

    const question = await prisma.intentFeedbackQuestion.create({
      data: {
        intentId: input.intentId,
        order: input.order,
        type: input.type,
        label: input.label,
        helpText: input.helpText || null,
        required: input.required ?? false,
        options: input.options || null,
        maxLength: input.maxLength || null,
      },
    });

    return {
      ...question,
      options: question.options || null,
      maxLength: question.maxLength || null,
      helpText: question.helpText || null,
    };
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

    const question = await prisma.intentFeedbackQuestion.findUnique({
      where: { id },
      select: { intentId: true },
    });

    if (!question) {
      throw new GraphQLError('Question not found', {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    // Check permissions
    const { canEdit, reason } = await canEditFeedbackQuestions(
      question.intentId,
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

    const updated = await prisma.intentFeedbackQuestion.update({
      where: { id },
      data: {
        ...(input.order !== undefined && { order: input.order }),
        ...(input.label && { label: input.label }),
        ...(input.helpText !== undefined && {
          helpText: input.helpText || null,
        }),
        ...(input.required !== undefined && { required: input.required }),
        ...(input.options !== undefined && { options: input.options || null }),
        ...(input.maxLength !== undefined && {
          maxLength: input.maxLength || null,
        }),
      },
    });

    return {
      ...updated,
      options: updated.options || null,
      maxLength: updated.maxLength || null,
      helpText: updated.helpText || null,
    };
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

    const question = await prisma.intentFeedbackQuestion.findUnique({
      where: { id },
      select: { intentId: true },
    });

    if (!question) {
      throw new GraphQLError('Question not found', {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    // Check permissions
    const { canEdit, reason } = await canEditFeedbackQuestions(
      question.intentId,
      user.id,
      user.role
    );
    if (!canEdit) {
      throw new GraphQLError(reason || 'Cannot edit feedback questions', {
        extensions: { code: 'FORBIDDEN' },
      });
    }

    await prisma.intentFeedbackQuestion.delete({
      where: { id },
    });

    return true;
  };

/**
 * Reorder feedback questions
 */
export const reorderFeedbackQuestionsMutation: MutationResolvers['reorderFeedbackQuestions'] =
  async (_parent, { intentId, questionIds }, { user }) => {
    if (!user) {
      throw new GraphQLError('Authentication required', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    // Check permissions
    const { canEdit, reason } = await canEditFeedbackQuestions(
      intentId,
      user.id,
      user.role
    );
    if (!canEdit) {
      throw new GraphQLError(reason || 'Cannot edit feedback questions', {
        extensions: { code: 'FORBIDDEN' },
      });
    }

    // Verify all questions belong to this intent
    const questions = await prisma.intentFeedbackQuestion.findMany({
      where: {
        id: { in: questionIds },
        intentId,
      },
    });

    if (questions.length !== questionIds.length) {
      throw new GraphQLError('Some questions do not belong to this intent', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }

    // Update order for each question
    await Promise.all(
      questionIds.map((id, index) =>
        prisma.intentFeedbackQuestion.update({
          where: { id },
          data: { order: index },
        })
      )
    );

    // Return updated questions
    const updated = await prisma.intentFeedbackQuestion.findMany({
      where: { intentId },
      orderBy: { order: 'asc' },
    });

    return updated.map((q) => ({
      ...q,
      options: q.options || null,
      maxLength: q.maxLength || null,
      helpText: q.helpText || null,
    }));
  };

/**
 * Submit review + feedback (combined mutation)
 */
export const submitReviewAndFeedbackMutation: MutationResolvers['submitReviewAndFeedback'] =
  async (_parent, { input }, { user }) => {
    if (!user) {
      throw new GraphQLError('Authentication required', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    const { intentId, rating, content, feedbackAnswers } = input;

    // Verify intent exists and is ended
    const intent = await prisma.intent.findUnique({
      where: { id: intentId },
      select: {
        id: true,
        endAt: true,
        members: {
          where: {
            userId: user.id,
            status: 'JOINED',
          },
        },
      },
    });

    if (!intent) {
      throw new GraphQLError('Intent not found', {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    // Check if user is a member
    if (intent.members.length === 0) {
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
          intentId_authorId: {
            intentId,
            authorId: user.id,
          },
        },
        update: {
          rating,
          content: content || null,
          updatedAt: new Date(),
        },
        create: {
          intentId,
          authorId: user.id,
          rating,
          content: content || null,
        },
        include: {
          author: true,
          intent: true,
        },
      });

      // Process feedback answers if provided
      const createdAnswers = [];
      if (feedbackAnswers && feedbackAnswers.length > 0) {
        // Fetch questions to validate
        const questions = await tx.intentFeedbackQuestion.findMany({
          where: {
            intentId,
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

          const answer = await tx.intentFeedbackAnswer.upsert({
            where: {
              intentId_userId_questionId: {
                intentId,
                userId: user.id,
                questionId: answerInput.questionId,
              },
            },
            update: {
              answer: answerInput.answer,
              updatedAt: new Date(),
            },
            create: {
              intentId,
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

      return { review, feedbackAnswers: createdAnswers };
    });

    return {
      review: result.review,
      feedbackAnswers: result.feedbackAnswers.map((answer) => ({
        ...answer,
        user: answer.member.user,
      })),
    };
  };

/**
 * Manual trigger to send feedback requests to all JOINED members
 * Only owner, moderator, or admin can trigger this
 */
export const sendFeedbackRequestsMutation: MutationResolvers['sendFeedbackRequests'] =
  async (_parent, { intentId }, { user }) => {
    if (!user) {
      throw new GraphQLError('Unauthorized', {
        extensions: { code: 'UNAUTHORIZED' },
      });
    }

    // Fetch intent with membership
    const intent = await prisma.intent.findUnique({
      where: { id: intentId },
      include: {
        members: {
          where: {
            userId: user.id,
          },
        },
        owner: true,
      },
    });

    if (!intent) {
      throw new GraphQLError('Intent not found', {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    // Check permissions (owner, moderator, or admin)
    const membership = intent.members[0];
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
    if (intent.endAt > new Date()) {
      throw new GraphQLError(
        'Cannot send feedback requests before event ends',
        {
          extensions: { code: 'BAD_USER_INPUT' },
        }
      );
    }

    // Check if event is cancelled or deleted
    if (intent.canceledAt || intent.deletedAt) {
      throw new GraphQLError(
        'Cannot send feedback requests for cancelled/deleted event',
        {
          extensions: { code: 'BAD_USER_INPUT' },
        }
      );
    }

    // Count eligible members (JOINED status)
    const joinedMembers = await prisma.intentMember.count({
      where: {
        intentId,
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
      await enqueueFeedbackRequestNow(intentId);

      return {
        success: true,
        sentCount: joinedMembers,
        skippedCount: 0,
        message: `Feedback requests will be sent to ${joinedMembers} member(s)`,
      };
    } catch (error: any) {
      console.error('[sendFeedbackRequests] Error:', error);
      throw new GraphQLError(
        `Failed to enqueue feedback requests: ${error.message || 'Unknown error'}`,
        {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        }
      );
    }
  };
