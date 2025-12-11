/**
 * Join Questions Query Resolvers
 *
 * Authorization levels:
 * - eventJoinQuestions: AUTH
 * - eventJoinRequests: EVENT_MOD_OR_OWNER
 * - myJoinRequests: AUTH (SELF)
 */

import type {
  QueryResolvers,
  EventJoinQuestion,
  EventJoinRequestsResult,
  EventMember,
} from '../../__generated__/resolvers-types';
import { prisma } from '../../../lib/prisma';
import { requireAuth, requireEventModOrOwner } from '../shared/auth-guards';

/**
 * Query: Get join questions for an event
 * Authorization: AUTH
 */
export const eventJoinQuestionsQuery: QueryResolvers['eventJoinQuestions'] =
  async (_parent, { eventId }, ctx) => {
    requireAuth(ctx);

    const questions = await prisma.eventJoinQuestion.findMany({
      where: { eventId },
      orderBy: { order: 'asc' },
    });

    return questions.map((q) => ({
      ...q,
      options: q.options || null,
      maxLength: q.maxLength || null,
      helpText: q.helpText || null,
      event: null, // Field resolver handles this
    })) as unknown as EventJoinQuestion[];
  };

/**
 * Query: Get join requests (PENDING members with answers)
 * Authorization: EVENT_MOD_OR_OWNER
 */
export const eventJoinRequestsQuery: QueryResolvers['eventJoinRequests'] =
  async (_parent, { eventId, limit = 20, offset = 0 }, ctx) => {
    // Check EVENT_MOD_OR_OWNER (includes app mod/admin bypass)
    await requireEventModOrOwner(ctx.user, eventId);

    // Get PENDING members with their answers
    const [members, total] = await Promise.all([
      prisma.eventMember.findMany({
        where: {
          eventId,
          status: 'PENDING',
        },
        include: {
          user: {
            include: {
              profile: true,
            },
          },
          joinAnswers: {
            include: {
              question: true,
            },
            orderBy: {
              question: {
                order: 'asc',
              },
            },
          },
        },
        orderBy: { createdAt: 'asc' },
        take: limit,
        skip: offset,
      }),
      prisma.eventMember.count({
        where: {
          eventId,
          status: 'PENDING',
        },
      }),
    ]);

    return {
      items: members.map((member) => ({
        member: {
          ...member,
          addedBy: null,
          joinedAt: member.joinedAt?.toISOString() || null,
          leftAt: member.leftAt?.toISOString() || null,
          note: member.note || null,
          rejectReason: member.rejectReason || null,
        },
        answers: member.joinAnswers.map((answer) => ({
          ...answer,
          question: {
            ...answer.question,
            options: answer.question.options || null,
            maxLength: answer.question.maxLength || null,
            helpText: answer.question.helpText || null,
          },
        })),
      })),
      pageInfo: {
        total,
        limit,
        offset,
        hasNext: offset + limit < total,
        hasPrev: offset > 0,
      },
    } as unknown as EventJoinRequestsResult;
  };

/**
 * Query: Get current user's join requests
 * Authorization: AUTH (SELF)
 */
export const myJoinRequestsQuery: QueryResolvers['myJoinRequests'] = async (
  _parent,
  { status, limit = 20, offset = 0 },
  ctx
) => {
  const userId = requireAuth(ctx);

  const members = await prisma.eventMember.findMany({
    where: {
      userId,
      status: status || { in: ['PENDING', 'REJECTED', 'CANCELLED'] },
    },
    include: {
      event: {
        include: {
          categories: true,
          tags: true,
          owner: {
            include: {
              profile: true,
            },
          },
        },
      },
      user: {
        include: {
          profile: true,
        },
      },
      joinAnswers: {
        include: {
          question: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
  });

  return members.map((member) => ({
    ...member,
    addedBy: null,
    joinedAt: member.joinedAt || null,
    leftAt: member.leftAt || null,
    note: member.note || null,
    rejectReason: member.rejectReason || null,
  })) as unknown as EventMember[];
};
