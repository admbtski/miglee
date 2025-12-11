/**
 * Feedback Questions Query Resolvers
 *
 * Authorization levels:
 * - eventFeedbackQuestions: AUTH
 * - eventFeedbackResults: EVENT_MOD_OR_OWNER
 * - myFeedbackAnswers: AUTH (SELF)
 * - canSubmitFeedback: AUTH
 */

import type {
  QueryResolvers,
  EventFeedbackQuestion,
  EventFeedbackResults,
  EventFeedbackAnswer,
} from '../../__generated__/resolvers-types';
import { prisma } from '../../../lib/prisma';
import { requireAuth, requireEventModOrOwner } from '../shared/auth-guards';

/**
 * Query: Get feedback questions for an event
 * Authorization: AUTH
 */
export const eventFeedbackQuestionsQuery: QueryResolvers['eventFeedbackQuestions'] =
  async (_parent, { eventId }, ctx) => {
    requireAuth(ctx);

    const questions = await prisma.eventFeedbackQuestion.findMany({
      where: { eventId },
      orderBy: { order: 'asc' },
    });

    return questions.map((q) => ({
      ...q,
      options: q.options || null,
      maxLength: q.maxLength || null,
      helpText: q.helpText || null,
      event: null, // Field resolver handles this
    })) as unknown as EventFeedbackQuestion[];
  };

/**
 * Query: Get aggregated feedback results
 * Authorization: EVENT_MOD_OR_OWNER
 */
export const eventFeedbackResultsQuery: QueryResolvers['eventFeedbackResults'] =
  async (_parent, { eventId }, ctx) => {
    // Check EVENT_MOD_OR_OWNER (includes app mod/admin bypass)
    await requireEventModOrOwner(ctx.user, eventId);

    // Get all questions
    const questions = await prisma.eventFeedbackQuestion.findMany({
      where: { eventId },
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
    const totalRespondents = await prisma.eventFeedbackAnswer.groupBy({
      by: ['userId'],
      where: { eventId },
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
            (value as string[]).forEach((v) => {
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
      eventId,
      questionStats,
      totalRespondents: totalRespondents.length,
    } as unknown as EventFeedbackResults;
  };

/**
 * Query: Get current user's feedback answers
 * Authorization: AUTH (SELF)
 */
export const myFeedbackAnswersQuery: QueryResolvers['myFeedbackAnswers'] =
  async (_parent, { eventId }, ctx) => {
    const userId = requireAuth(ctx);

    const answers = await prisma.eventFeedbackAnswer.findMany({
      where: {
        eventId,
        userId,
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
        event: null, // Field resolver handles this
      },
    })) as unknown as EventFeedbackAnswer[];
  };

/**
 * Check if current user can submit feedback for an event
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
  async (_parent, { eventId }, { user }) => {
    if (!user) {
      return false;
    }

    // Check if user is a JOINED member
    const member = await prisma.eventMember.findUnique({
      where: {
        eventId_userId: {
          eventId,
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
    const eventData = await prisma.event.findUnique({
      where: { id: eventId },
      select: { endAt: true },
    });

    if (!eventData || eventData.endAt > new Date()) {
      return false;
    }

    // Check if there are any feedback questions for this event
    const questionsCount = await prisma.eventFeedbackQuestion.count({
      where: { eventId },
    });

    // Check if user has already submitted a review
    const existingReview = await prisma.review.findUnique({
      where: {
        eventId_authorId: {
          eventId,
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
    const answersCount = await prisma.eventFeedbackAnswer.count({
      where: {
        eventId,
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
