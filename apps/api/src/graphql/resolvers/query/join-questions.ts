import type { QueryResolvers } from '../../__generated__/resolvers-types';
import { prisma } from '../../../lib/prisma';
import { GraphQLError } from 'graphql';

/**
 * Get join questions for an intent
 * Public for viewing, but answers are only visible to owner/mods
 */
export const intentJoinQuestionsQuery: QueryResolvers['intentJoinQuestions'] =
  async (_parent, { intentId }, { user }) => {
    // Anyone can view questions (needed for users to see the form)
    const questions = await prisma.intentJoinQuestion.findMany({
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
 * Get join requests (PENDING members with their answers) for an intent
 * Only accessible by owner/mods
 */
export const intentJoinRequestsQuery: QueryResolvers['intentJoinRequests'] =
  async (_parent, { intentId, limit = 20, offset = 0 }, { user }) => {
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
        'Only intent owner or moderators can view join requests',
        {
          extensions: { code: 'FORBIDDEN' },
        }
      );
    }

    // Get PENDING members with their answers
    const [members, total] = await Promise.all([
      prisma.intentMember.findMany({
        where: {
          intentId,
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
      prisma.intentMember.count({
        where: {
          intentId,
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
    };
  };

/**
 * Get current user's join requests (their PENDING/REJECTED/CANCELLED memberships)
 */
export const myJoinRequestsQuery: QueryResolvers['myJoinRequests'] = async (
  _parent,
  { status, limit = 20, offset = 0 },
  { user }
) => {
  if (!user) {
    throw new GraphQLError('Authentication required', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }

  const members = await prisma.intentMember.findMany({
    where: {
      userId: user.id,
      status: status || { in: ['PENDING', 'REJECTED', 'CANCELLED'] },
    },
    include: {
      intent: {
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
    joinedAt: member.joinedAt?.toISOString() || null,
    leftAt: member.leftAt?.toISOString() || null,
    note: member.note || null,
    rejectReason: member.rejectReason || null,
  }));
};
