import type { MutationResolvers } from '../../__generated__/resolvers-types';
import { prisma } from '../../../lib/prisma';
import { GraphQLError } from 'graphql';
import { mapIntent } from '../helpers';

/**
 * Request to join an intent with answers to join questions (REQUEST mode)
 */
export const requestJoinIntentWithAnswersMutation: MutationResolvers['requestJoinIntentWithAnswers'] =
  async (_parent, { input }, { user, pubsub }) => {
    if (!user) {
      throw new GraphQLError('Authentication required', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    const { intentId, answers } = input;

    // Fetch intent with all necessary data
    const intent = await prisma.intent.findUnique({
      where: { id: intentId },
      include: {
        categories: true,
        tags: true,
        owner: { include: { profile: true } },
        members: {
          where: {
            OR: [
              { userId: user.id },
              { role: { in: ['OWNER', 'MODERATOR'] }, status: 'JOINED' },
            ],
          },
          include: {
            user: { include: { profile: true } },
          },
        },
      },
    });

    if (!intent) {
      throw new GraphQLError('Intent not found', {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    // Check if intent is deleted or canceled
    if (intent.deletedAt) {
      throw new GraphQLError('Cannot join a deleted intent', {
        extensions: { code: 'FORBIDDEN' },
      });
    }

    if (intent.canceledAt) {
      throw new GraphQLError('Cannot join a canceled intent', {
        extensions: { code: 'FORBIDDEN' },
      });
    }

    // This mutation can be used for both OPEN and REQUEST modes
    // In OPEN mode, user is immediately JOINED (if not full)
    // In REQUEST mode, user is PENDING and needs approval

    // Check existing membership
    const existingMember = intent.members.find((m) => m.userId === user.id);

    if (existingMember) {
      if (existingMember.status === 'JOINED') {
        throw new GraphQLError('You are already a member of this intent', {
          extensions: { code: 'ALREADY_MEMBER' },
        });
      }

      if (existingMember.status === 'PENDING') {
        throw new GraphQLError(
          'You already have a pending request for this intent',
          {
            extensions: { code: 'ALREADY_PENDING' },
          }
        );
      }

      if (existingMember.status === 'BANNED') {
        throw new GraphQLError('You are banned from this intent', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      if (existingMember.status === 'REJECTED') {
        throw new GraphQLError(
          'Your previous request was rejected. You cannot re-apply to this intent.',
          {
            extensions: { code: 'FORBIDDEN' },
          }
        );
      }
    }

    // Fetch join questions
    const questions = await prisma.intentJoinQuestion.findMany({
      where: { intentId },
      orderBy: { order: 'asc' },
    });

    // Validate answers
    const requiredQuestions = questions.filter((q) => q.required);
    const answeredQuestionIds = answers.map((a) => a.questionId);

    // Check all required questions are answered
    for (const q of requiredQuestions) {
      if (!answeredQuestionIds.includes(q.id)) {
        throw new GraphQLError(`Question "${q.label}" is required`, {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }
    }

    // Validate each answer
    for (const answer of answers) {
      const question = questions.find((q) => q.id === answer.questionId);

      if (!question) {
        throw new GraphQLError(`Question not found: ${answer.questionId}`, {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      // Validate answer format based on question type
      if (question.type === 'TEXT') {
        if (typeof answer.answer !== 'string') {
          throw new GraphQLError(
            `Answer for "${question.label}" must be a string`,
            {
              extensions: { code: 'BAD_USER_INPUT' },
            }
          );
        }

        const textAnswer = answer.answer as string;
        if (question.maxLength && textAnswer.length > question.maxLength) {
          throw new GraphQLError(
            `Answer for "${question.label}" exceeds maximum length of ${question.maxLength}`,
            {
              extensions: { code: 'BAD_USER_INPUT' },
            }
          );
        }
      } else if (question.type === 'SINGLE_CHOICE') {
        if (typeof answer.answer !== 'string') {
          throw new GraphQLError(
            `Answer for "${question.label}" must be a single choice`,
            {
              extensions: { code: 'BAD_USER_INPUT' },
            }
          );
        }
      } else if (question.type === 'MULTI_CHOICE') {
        if (!Array.isArray(answer.answer)) {
          throw new GraphQLError(
            `Answer for "${question.label}" must be an array of choices`,
            {
              extensions: { code: 'BAD_USER_INPUT' },
            }
          );
        }
      }
    }

    // Determine member status based on join mode and capacity
    // Count current joined members
    const joinedCount = await prisma.intentMember.count({
      where: {
        intentId,
        status: 'JOINED',
      },
    });
    const isFull = intent.max !== null && joinedCount >= intent.max;

    // In OPEN mode: user is JOINED immediately (if not full)
    // In REQUEST mode: user is PENDING and needs approval
    const memberStatus =
      intent.joinMode === 'OPEN' && !isFull ? 'JOINED' : 'PENDING';
    const eventKind =
      intent.joinMode === 'OPEN' && !isFull ? 'JOIN' : 'REQUEST';

    // Create or update IntentMember and save answers in a transaction
    await prisma.$transaction(async (tx) => {
      // Create or update member
      await tx.intentMember.upsert({
        where: {
          intentId_userId: {
            intentId,
            userId: user.id,
          },
        },
        create: {
          intentId,
          userId: user.id,
          status: memberStatus,
          role: 'PARTICIPANT',
          joinedAt: memberStatus === 'JOINED' ? new Date() : null,
        },
        update: {
          status: memberStatus,
          joinedAt: memberStatus === 'JOINED' ? new Date() : undefined,
        },
      });

      // Delete existing answers (if re-applying)
      await tx.intentJoinAnswer.deleteMany({
        where: {
          intentId,
          userId: user.id,
        },
      });

      // Create new answers
      await tx.intentJoinAnswer.createMany({
        data: answers.map((a) => ({
          intentId,
          userId: user.id,
          questionId: a.questionId,
          answer: a.answer,
        })),
      });

      // Update joinedCount if user was immediately joined
      if (memberStatus === 'JOINED') {
        await tx.intent.update({
          where: { id: intentId },
          data: { joinedCount: { increment: 1 } },
        });
      }

      // Create member event
      await tx.intentMemberEvent.create({
        data: {
          intentId,
          userId: user.id,
          actorId: user.id,
          kind: eventKind,
        },
      });
    });

    // Send notifications to owner and moderators only if user is PENDING (REQUEST mode)
    if (memberStatus === 'PENDING') {
      const recipientIds = [
        intent.ownerId,
        ...intent.members
          .filter((m) => m.role === 'MODERATOR' && m.status === 'JOINED')
          .map((m) => m.userId),
      ].filter((id): id is string => id !== null && id !== user.id);

      await Promise.all(
        recipientIds.map((recipientId) =>
          prisma.notification.create({
            data: {
              recipientId,
              kind: 'JOIN_REQUEST',
              entityType: 'INTENT',
              entityId: intentId,
              actorId: user.id,
              title: 'New join request',
              body: `${user.name} requested to join "${intent.title}"`,
            },
          })
        )
      );
    }

    // Reload intent with full data for response
    const updatedIntent = await prisma.intent.findUnique({
      where: { id: intentId },
      include: {
        categories: true,
        tags: true,
        owner: { include: { profile: true } },
        canceledBy: { include: { profile: true } },
        deletedBy: { include: { profile: true } },
        members: {
          include: {
            user: { include: { profile: true } },
            addedBy: { include: { profile: true } },
          },
        },
      },
    });

    if (!updatedIntent) {
      throw new GraphQLError('Intent not found after update', {
        extensions: { code: 'INTERNAL_SERVER_ERROR' },
      });
    }

    // Publish to pubsub if needed
    if (pubsub) {
      await pubsub.publish({
        topic: `INTENT_UPDATED:${intentId}`,
        payload: { intentUpdated: mapIntent(updatedIntent) },
      });
    }

    // Return updated intent
    return mapIntent(updatedIntent);
  };

/**
 * Approve a join request (owner/mod only)
 */
export const approveJoinRequestMutation: MutationResolvers['approveJoinRequest'] =
  async (_parent, { input }, { user, pubsub }) => {
    if (!user) {
      throw new GraphQLError('Authentication required', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    const { intentId, userId: targetUserId } = input;

    // Fetch intent
    const intent = await prisma.intent.findUnique({
      where: { id: intentId },
      include: {
        categories: true,
        tags: true,
        owner: { include: { profile: true } },
        members: {
          include: {
            user: { include: { profile: true } },
            addedBy: { include: { profile: true } },
          },
        },
      },
    });

    if (!intent) {
      throw new GraphQLError('Intent not found', {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    // Check permissions
    const isOwner = intent.ownerId === user.id;
    const isModerator = intent.members.some(
      (m) =>
        m.userId === user.id &&
        (m.role === 'OWNER' || m.role === 'MODERATOR') &&
        m.status === 'JOINED'
    );
    const isAdmin = user.role === 'ADMIN';

    if (!isOwner && !isModerator && !isAdmin) {
      throw new GraphQLError(
        'Only intent owner or moderators can approve requests',
        {
          extensions: { code: 'FORBIDDEN' },
        }
      );
    }

    // Find target member
    const targetMember = intent.members.find((m) => m.userId === targetUserId);

    if (!targetMember) {
      throw new GraphQLError('Member not found', {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    if (targetMember.status !== 'PENDING') {
      throw new GraphQLError('Only PENDING requests can be approved', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }

    // Check capacity
    if (intent.joinedCount >= intent.max) {
      throw new GraphQLError('Intent is full', {
        extensions: { code: 'INTENT_FULL' },
      });
    }

    // Approve request in transaction
    await prisma.$transaction(async (tx) => {
      // Update member status
      await tx.intentMember.update({
        where: {
          intentId_userId: {
            intentId,
            userId: targetUserId,
          },
        },
        data: {
          status: 'JOINED',
          joinedAt: new Date(),
        },
      });

      // Increment joinedCount
      await tx.intent.update({
        where: { id: intentId },
        data: {
          joinedCount: {
            increment: 1,
          },
        },
      });

      // Create member events
      await tx.intentMemberEvent.createMany({
        data: [
          {
            intentId,
            userId: targetUserId,
            actorId: user.id,
            kind: 'APPROVE',
          },
          {
            intentId,
            userId: targetUserId,
            actorId: user.id,
            kind: 'JOIN',
          },
        ],
      });
    });

    // Send notification to target user
    await prisma.notification.create({
      data: {
        recipientId: targetUserId,
        kind: 'INTENT_MEMBERSHIP_APPROVED',
        entityType: 'INTENT',
        entityId: intentId,
        actorId: user.id,
        title: 'Join request approved',
        body: `Your request to join "${intent.title}" has been approved`,
      },
    });

    // Return updated intent
    const updated = await prisma.intent.findUnique({
      where: { id: intentId },
      include: {
        categories: true,
        tags: true,
        owner: { include: { profile: true } },
        canceledBy: { include: { profile: true } },
        deletedBy: { include: { profile: true } },
        members: {
          include: {
            user: { include: { profile: true } },
            addedBy: { include: { profile: true } },
          },
        },
      },
    });

    if (!updated) {
      throw new GraphQLError('Intent not found after update', {
        extensions: { code: 'INTERNAL_SERVER_ERROR' },
      });
    }

    // Publish to pubsub
    if (pubsub) {
      await pubsub.publish({
        topic: `INTENT_UPDATED:${intentId}`,
        payload: { intentUpdated: mapIntent(updated) },
      });
    }

    return mapIntent(updated);
  };

/**
 * Reject a join request (owner/mod only)
 */
export const rejectJoinRequestMutation: MutationResolvers['rejectJoinRequest'] =
  async (_parent, { input }, { user, pubsub }) => {
    if (!user) {
      throw new GraphQLError('Authentication required', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    const { intentId, userId: targetUserId, reason } = input;

    // Fetch intent
    const intent = await prisma.intent.findUnique({
      where: { id: intentId },
      include: {
        categories: true,
        tags: true,
        owner: { include: { profile: true } },
        members: {
          include: {
            user: { include: { profile: true } },
            addedBy: { include: { profile: true } },
          },
        },
      },
    });

    if (!intent) {
      throw new GraphQLError('Intent not found', {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    // Check permissions
    const isOwner = intent.ownerId === user.id;
    const isModerator = intent.members.some(
      (m) =>
        m.userId === user.id &&
        (m.role === 'OWNER' || m.role === 'MODERATOR') &&
        m.status === 'JOINED'
    );
    const isAdmin = user.role === 'ADMIN';

    if (!isOwner && !isModerator && !isAdmin) {
      throw new GraphQLError(
        'Only intent owner or moderators can reject requests',
        {
          extensions: { code: 'FORBIDDEN' },
        }
      );
    }

    // Find target member
    const targetMember = intent.members.find((m) => m.userId === targetUserId);

    if (!targetMember) {
      throw new GraphQLError('Member not found', {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    if (targetMember.status !== 'PENDING') {
      throw new GraphQLError('Only PENDING requests can be rejected', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }

    // Validate reason length
    if (reason && reason.length > 500) {
      throw new GraphQLError(
        'Rejection reason must be at most 500 characters',
        {
          extensions: { code: 'BAD_USER_INPUT' },
        }
      );
    }

    // Reject request in transaction
    await prisma.$transaction(async (tx) => {
      // Update member status
      await tx.intentMember.update({
        where: {
          intentId_userId: {
            intentId,
            userId: targetUserId,
          },
        },
        data: {
          status: 'REJECTED',
          rejectReason: reason || null,
        },
      });

      // Create member event
      await tx.intentMemberEvent.create({
        data: {
          intentId,
          userId: targetUserId,
          actorId: user.id,
          kind: 'REJECT',
          note: reason || null,
        },
      });
    });

    // Send notification to target user (optionally include reason)
    await prisma.notification.create({
      data: {
        recipientId: targetUserId,
        kind: 'INTENT_MEMBERSHIP_REJECTED',
        entityType: 'INTENT',
        entityId: intentId,
        actorId: user.id,
        title: 'Join request rejected',
        body: reason
          ? `Your request to join "${intent.title}" was rejected: ${reason}`
          : `Your request to join "${intent.title}" was rejected`,
      },
    });

    // Return updated intent
    const updated = await prisma.intent.findUnique({
      where: { id: intentId },
      include: {
        categories: true,
        tags: true,
        owner: { include: { profile: true } },
        canceledBy: { include: { profile: true } },
        deletedBy: { include: { profile: true } },
        members: {
          include: {
            user: { include: { profile: true } },
            addedBy: { include: { profile: true } },
          },
        },
      },
    });

    if (!updated) {
      throw new GraphQLError('Intent not found after update', {
        extensions: { code: 'INTERNAL_SERVER_ERROR' },
      });
    }

    // Publish to pubsub
    if (pubsub) {
      await pubsub.publish({
        topic: `INTENT_UPDATED:${intentId}`,
        payload: { intentUpdated: mapIntent(updated) },
      });
    }

    return mapIntent(updated);
  };

/**
 * Cancel own join request (user cancels their PENDING request)
 * This is an update to the existing cancelJoinRequest mutation
 */
export const cancelJoinRequestMutation: MutationResolvers['cancelJoinRequest'] =
  async (_parent, { intentId }, { user, pubsub }) => {
    if (!user) {
      throw new GraphQLError('Authentication required', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    // Find member
    const member = await prisma.intentMember.findUnique({
      where: {
        intentId_userId: {
          intentId,
          userId: user.id,
        },
      },
    });

    if (!member) {
      throw new GraphQLError('You are not a member of this intent', {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    if (member.status !== 'PENDING') {
      throw new GraphQLError('Only PENDING requests can be cancelled', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }

    // Cancel request in transaction
    await prisma.$transaction(async (tx) => {
      // Update status to CANCELLED
      await tx.intentMember.update({
        where: {
          intentId_userId: {
            intentId,
            userId: user.id,
          },
        },
        data: {
          status: 'CANCELLED',
        },
      });

      // Create member event
      await tx.intentMemberEvent.create({
        data: {
          intentId,
          userId: user.id,
          actorId: user.id,
          kind: 'CANCEL_REQUEST',
        },
      });
    });

    // Publish to pubsub
    if (pubsub) {
      const intent = await prisma.intent.findUnique({
        where: { id: intentId },
        include: {
          categories: true,
          tags: true,
          owner: { include: { profile: true } },
          canceledBy: { include: { profile: true } },
          deletedBy: { include: { profile: true } },
          members: {
            include: {
              user: { include: { profile: true } },
              addedBy: { include: { profile: true } },
            },
          },
        },
      });

      if (intent) {
        await pubsub.publish({
          topic: `INTENT_UPDATED:${intentId}`,
          payload: { intentUpdated: mapIntent(intent) },
        });
      }
    }

    return true;
  };
