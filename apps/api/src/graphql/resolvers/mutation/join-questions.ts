import type { MutationResolvers } from '../../__generated__/resolvers-types';
import { prisma } from '../../../lib/prisma';
import { GraphQLError } from 'graphql';

// Constants for validation
const MAX_QUESTIONS = 5;
const MAX_LABEL_LENGTH = 200;
const MAX_HELP_TEXT_LENGTH = 200;
const MAX_OPTIONS = 10;

/**
 * Check if user can edit join questions for an intent
 * Rules:
 * - Must be owner or moderator
 * - Cannot edit if there are any PENDING or JOINED members (excluding owner and current user)
 * - This allows owner to create questions immediately after creating the event
 */
async function canEditJoinQuestions(
  intentId: string,
  userId: string,
  userRole: string
): Promise<{ canEdit: boolean; reason?: string }> {
  const intent = await prisma.intent.findUnique({
    where: { id: intentId },
    select: {
      ownerId: true,
      members: {
        where: {
          OR: [
            { userId, role: { in: ['OWNER', 'MODERATOR'] }, status: 'JOINED' },
            { status: { in: ['PENDING', 'JOINED'] } },
          ],
        },
        select: { userId: true, role: true, status: true },
      },
    },
  });

  if (!intent) {
    return { canEdit: false, reason: 'Intent not found' };
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
      reason: 'Only intent owner or moderators can edit questions',
    };
  }

  // Check if there are any PENDING or JOINED members (excluding owner)
  const hasApplications = intent.members.some(
    (m) =>
      (m.status === 'PENDING' || m.status === 'JOINED') &&
      m.role !== 'OWNER' &&
      m.userId !== userId
  );

  if (hasApplications) {
    return {
      canEdit: false,
      reason:
        'Cannot edit questions after users have applied or joined. Questions are locked to preserve answer integrity.',
    };
  }

  return { canEdit: true };
}

/**
 * Create a new join question
 */
export const createJoinQuestionMutation: MutationResolvers['createJoinQuestion'] =
  async (_parent, { input }, { user }) => {
    if (!user) {
      throw new GraphQLError('Authentication required', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    // Check permissions
    const { canEdit, reason } = await canEditJoinQuestions(
      input.intentId,
      user.id,
      user.role
    );
    if (!canEdit) {
      throw new GraphQLError(reason || 'Cannot edit questions', {
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
    const existingCount = await prisma.intentJoinQuestion.count({
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

    const question = await prisma.intentJoinQuestion.create({
      data: {
        intentId: input.intentId,
        order: input.order,
        type: input.type,
        label: input.label,
        helpText: input.helpText || null,
        required: input.required ?? true,
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
 * Update a join question
 */
export const updateJoinQuestionMutation: MutationResolvers['updateJoinQuestion'] =
  async (_parent, { id, input }, { user }) => {
    if (!user) {
      throw new GraphQLError('Authentication required', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    const question = await prisma.intentJoinQuestion.findUnique({
      where: { id },
      select: { intentId: true },
    });

    if (!question) {
      throw new GraphQLError('Question not found', {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    // Check permissions
    const { canEdit, reason } = await canEditJoinQuestions(
      question.intentId,
      user.id,
      user.role
    );
    if (!canEdit) {
      throw new GraphQLError(reason || 'Cannot edit questions', {
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

    const updated = await prisma.intentJoinQuestion.update({
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
 * Delete a join question
 */
export const deleteJoinQuestionMutation: MutationResolvers['deleteJoinQuestion'] =
  async (_parent, { id }, { user }) => {
    if (!user) {
      throw new GraphQLError('Authentication required', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    const question = await prisma.intentJoinQuestion.findUnique({
      where: { id },
      select: { intentId: true },
    });

    if (!question) {
      throw new GraphQLError('Question not found', {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    // Check permissions
    const { canEdit, reason } = await canEditJoinQuestions(
      question.intentId,
      user.id,
      user.role
    );
    if (!canEdit) {
      throw new GraphQLError(reason || 'Cannot edit questions', {
        extensions: { code: 'FORBIDDEN' },
      });
    }

    await prisma.intentJoinQuestion.delete({
      where: { id },
    });

    return true;
  };

/**
 * Reorder join questions
 */
export const reorderJoinQuestionsMutation: MutationResolvers['reorderJoinQuestions'] =
  async (_parent, { intentId, questionIds }, { user }) => {
    if (!user) {
      throw new GraphQLError('Authentication required', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    // Check permissions
    const { canEdit, reason } = await canEditJoinQuestions(
      intentId,
      user.id,
      user.role
    );
    if (!canEdit) {
      throw new GraphQLError(reason || 'Cannot edit questions', {
        extensions: { code: 'FORBIDDEN' },
      });
    }

    // Verify all questions belong to this intent
    const questions = await prisma.intentJoinQuestion.findMany({
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
        prisma.intentJoinQuestion.update({
          where: { id },
          data: { order: index },
        })
      )
    );

    // Return updated questions
    const updated = await prisma.intentJoinQuestion.findMany({
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
