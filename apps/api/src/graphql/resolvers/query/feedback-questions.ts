import type { QueryResolvers } from '../../__generated__/resolvers-types';
import { prisma } from '../../../lib/prisma';
import { GraphQLError } from 'graphql';

/**
 * Get feedback questions for an intent
 * Public for viewing (members need to see the form)
 */
export const intentFeedbackQuestionsQuery: QueryResolvers['intentFeedbackQuestions'] =
  async (_parent, { intentId }, { user }) => {
    const questions = await prisma.intentFeedbackQuestion.findMany({
      where: { intentId },
      orderBy: { order: 'asc' },
    });

    return questions.map((q) => ({
      ...q,
      options: q.options || null,
      maxLength: q.maxLength || null,
      helpText: q.helpText || null,
    }));
  };

/**
 * Get aggregated feedback results for an intent
 * Only accessible by owner/mods
 */
export const intentFeedbackResultsQuery: QueryResolvers['intentFeedbackResults'] =
  async (_parent, { intentId }, { user }) => {
    if (!user) {
      throw new GraphQLError('Authentication required', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    // Check if user is owner or moderator
    const intent = await prisma.intent.findUnique({
      where: { id: intentId },
      select: {
        ownerId: true,
        members: {
          where: {
            userId: user.id,
            role: { in: ['OWNER', 'MODERATOR'] },
            status: 'JOINED',
          },
          select: { role: true },
        },
      },
    });

    if (!intent) {
      throw new GraphQLError('Intent not found', {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    const isOwner = intent.ownerId === user.id;
    const isModerator = intent.members.length > 0;
    const isAdmin = user.role === 'ADMIN';

    if (!isOwner && !isModerator && !isAdmin) {
      throw new GraphQLError(
        'Only intent owner or moderators can view feedback results',
        {
          extensions: { code: 'FORBIDDEN' },
        }
      );
    }

    // Get all questions
    const questions = await prisma.intentFeedbackQuestion.findMany({
      where: { intentId },
      orderBy: { order: 'asc' },
      include: {
        answers: {
          include: {
            member: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Count total respondents (unique users who answered at least one question)
    const totalRespondents = await prisma.intentFeedbackAnswer.groupBy({
      by: ['userId'],
      where: { intentId },
      _count: true,
    });

    // Build stats for each question
    const questionStats = questions.map((question) => {
      const answers = question.answers;
      const totalAnswers = answers.length;

      let choiceDistribution = null;
      let textAnswers = null;

      if (
        question.type === 'SINGLE_CHOICE' ||
        question.type === 'MULTI_CHOICE'
      ) {
        // Calculate distribution for choice questions
        const counts = new Map<string, number>();

        answers.forEach((answer) => {
          const value = answer.answer;
          if (question.type === 'MULTI_CHOICE' && Array.isArray(value)) {
            value.forEach((v: string) => {
              counts.set(v, (counts.get(v) || 0) + 1);
            });
          } else if (typeof value === 'string') {
            counts.set(value, (counts.get(value) || 0) + 1);
          }
        });

        choiceDistribution = Array.from(counts.entries()).map(
          ([option, count]) => ({
            option,
            count,
            percentage: totalAnswers > 0 ? (count / totalAnswers) * 100 : 0,
          })
        );
      } else if (question.type === 'TEXT') {
        // Collect text answers with user info
        textAnswers = answers.map((answer) => {
          const user = answer.member.user;
          const userName = user.name || 'Anonymous';

          return {
            answer: String(answer.answer),
            userId: answer.userId,
            userName,
            createdAt: answer.createdAt,
          };
        });
      }

      return {
        question: {
          ...question,
          options: question.options || null,
          maxLength: question.maxLength || null,
          helpText: question.helpText || null,
        },
        totalAnswers,
        choiceDistribution,
        textAnswers,
      };
    });

    return {
      intentId,
      questionStats,
      totalRespondents: totalRespondents.length,
    };
  };

/**
 * Get current user's feedback answers for an intent
 */
export const myFeedbackAnswersQuery: QueryResolvers['myFeedbackAnswers'] =
  async (_parent, { intentId }, { user }) => {
    if (!user) {
      throw new GraphQLError('Authentication required', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    const answers = await prisma.intentFeedbackAnswer.findMany({
      where: {
        intentId,
        userId: user.id,
      },
      include: {
        question: true,
        member: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        question: {
          order: 'asc',
        },
      },
    });

    return answers.map((answer) => ({
      ...answer,
      user: answer.member.user,
      question: {
        ...answer.question,
        options: answer.question.options || null,
        maxLength: answer.question.maxLength || null,
        helpText: answer.question.helpText || null,
      },
    }));
  };

/**
 * Check if current user can submit feedback for an intent
 *
 * Returns false if:
 * - User is not authenticated
 * - User is not a JOINED member
 * - Event has not ended yet
 * - User has already submitted feedback answers (if there are questions)
 *
 * Note: Even if user already submitted a review, they can still submit feedback
 * if they haven't answered the feedback questions yet.
 */
export const canSubmitFeedbackQuery: QueryResolvers['canSubmitFeedback'] =
  async (_parent, { intentId }, { user }) => {
    if (!user) {
      return false;
    }

    // Check if user is a JOINED member
    const member = await prisma.intentMember.findUnique({
      where: {
        intentId_userId: {
          intentId,
          userId: user.id,
        },
      },
      select: {
        status: true,
      },
    });

    if (!member || member.status !== 'JOINED') {
      return false;
    }

    // Check if event has ended
    const intent = await prisma.intent.findUnique({
      where: { id: intentId },
      select: { endAt: true },
    });

    if (!intent || intent.endAt > new Date()) {
      return false;
    }

    // Check if there are any feedback questions for this intent
    const questionsCount = await prisma.intentFeedbackQuestion.count({
      where: { intentId },
    });

    // Check if user has already submitted a review
    const existingReview = await prisma.review.findUnique({
      where: {
        intentId_authorId: {
          intentId,
          authorId: user.id,
        },
      },
      select: { id: true, deletedAt: true },
    });

    const hasReview = existingReview && !existingReview.deletedAt;

    // If there are no feedback questions, check only for review
    if (questionsCount === 0) {
      // No questions - can submit only if no review yet
      return !hasReview;
    }

    // If there are feedback questions, check if user has answered them
    const answersCount = await prisma.intentFeedbackAnswer.count({
      where: {
        intentId,
        userId: user.id,
      },
    });

    // User can submit if they haven't answered any questions yet
    // (even if they already have a review - they can update it and add feedback)
    if (answersCount === 0) {
      return true;
    }

    // User has already submitted feedback answers
    return false;
  };
