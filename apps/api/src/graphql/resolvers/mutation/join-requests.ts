import type { MutationResolvers } from '../../__generated__/resolvers-types';
import { prisma } from '../../../lib/prisma';
import { GraphQLError } from 'graphql';
import { mapEvent } from '../helpers';

/**
 * Request to join an event with answers to join questions (REQUEST mode)
 */
export const requestJoinEventWithAnswersMutation: MutationResolvers['requestJoinEventWithAnswers'] =
  async (_parent, { input }, { user, pubsub }) => {
    if (!user) {
      throw new GraphQLError('Authentication required', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    const { eventId, answers } = input;

    // Fetch event with all necessary data
    const event = await prisma.event.findUnique({
      where: { id: eventId },
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

    if (!event) {
      throw new GraphQLError('Event not found', {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    // Check if event is deleted or canceled
    if (event.deletedAt) {
      throw new GraphQLError('Cannot join a deleted event', {
        extensions: { code: 'FORBIDDEN' },
      });
    }

    if (event.canceledAt) {
      throw new GraphQLError('Cannot join a canceled event', {
        extensions: { code: 'FORBIDDEN' },
      });
    }

    // This mutation can be used for both OPEN and REQUEST modes
    // In OPEN mode, user is immediately JOINED (if not full)
    // In REQUEST mode, user is PENDING and needs approval

    // Check existing membership
    const existingMember = event.members.find((m) => m.userId === user.id);

    if (existingMember) {
      if (existingMember.status === 'JOINED') {
        throw new GraphQLError('You are already a member of this event', {
          extensions: { code: 'ALREADY_MEMBER' },
        });
      }

      if (existingMember.status === 'PENDING') {
        throw new GraphQLError(
          'You already have a pending request for this event',
          {
            extensions: { code: 'ALREADY_PENDING' },
          }
        );
      }

      if (existingMember.status === 'BANNED') {
        throw new GraphQLError('You are banned from this event', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      if (existingMember.status === 'REJECTED') {
        throw new GraphQLError(
          'Your previous request was rejected. You cannot re-apply to this event.',
          {
            extensions: { code: 'FORBIDDEN' },
          }
        );
      }
    }

    // Fetch join questions
    const questions = await prisma.eventJoinQuestion.findMany({
      where: { eventId },
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
    const joinedCount = await prisma.eventMember.count({
      where: {
        eventId,
        status: 'JOINED',
      },
    });
    const isFull = event.max !== null && joinedCount >= event.max;

    // In OPEN mode: user is JOINED immediately (if not full)
    // In REQUEST mode: user is PENDING and needs approval
    const memberStatus =
      event.joinMode === 'OPEN' && !isFull ? 'JOINED' : 'PENDING';
    const eventKind = event.joinMode === 'OPEN' && !isFull ? 'JOIN' : 'REQUEST';

    // Create or update EventMember and save answers in a transaction
    await prisma.$transaction(async (tx) => {
      // Create or update member
      await tx.eventMember.upsert({
        where: {
          eventId_userId: {
            eventId,
            userId: user.id,
          },
        },
        create: {
          eventId,
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
      await tx.eventJoinAnswer.deleteMany({
        where: {
          eventId,
          userId: user.id,
        },
      });

      // Create new answers
      await tx.eventJoinAnswer.createMany({
        data: answers.map((a) => ({
          eventId,
          userId: user.id,
          questionId: a.questionId,
          answer: a.answer,
        })),
      });

      // Update joinedCount if user was immediately joined
      if (memberStatus === 'JOINED') {
        await tx.event.update({
          where: { id: eventId },
          data: { joinedCount: { increment: 1 } },
        });
      }

      // Create member event
      await tx.eventMemberEvent.create({
        data: {
          eventId,
          userId: user.id,
          actorId: user.id,
          kind: eventKind,
        },
      });
    });

    // Send notifications to owner and moderators only if user is PENDING (REQUEST mode)
    if (memberStatus === 'PENDING') {
      const recipientIds = [
        event.ownerId,
        ...event.members
          .filter((m) => m.role === 'MODERATOR' && m.status === 'JOINED')
          .map((m) => m.userId),
      ].filter((id): id is string => id !== null && id !== user.id);

      await Promise.all(
        recipientIds.map((recipientId) =>
          prisma.notification.create({
            data: {
              recipientId,
              kind: 'JOIN_REQUEST',
              entityType: 'EVENT',
              entityId: eventId,
              actorId: user.id,
              title: null,
              body: null,
              data: {
                eventId,
                eventTitle: event.title,
                actorName: user.name,
              },
            },
          })
        )
      );
    }

    // Reload event with full data for response
    const updatedEvent = await prisma.event.findUnique({
      where: { id: eventId },
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

    if (!updatedEvent) {
      throw new GraphQLError('Event not found after update', {
        extensions: { code: 'INTERNAL_SERVER_ERROR' },
      });
    }

    // Publish to pubsub if needed
    if (pubsub) {
      await pubsub.publish({
        topic: `EVENT_UPDATED:${eventId}`,
        payload: { eventUpdated: mapEvent(updatedEvent) },
      });
    }

    // Return updated event
    return mapEvent(updatedEvent);
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

    const { eventId, userId: targetUserId } = input;

    // Fetch event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
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

    if (!event) {
      throw new GraphQLError('Event not found', {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    // Check permissions
    const isOwner = event.ownerId === user.id;
    const isModerator = event.members.some(
      (m) =>
        m.userId === user.id &&
        (m.role === 'OWNER' || m.role === 'MODERATOR') &&
        m.status === 'JOINED'
    );
    const isAdmin = user.role === 'ADMIN';

    if (!isOwner && !isModerator && !isAdmin) {
      throw new GraphQLError(
        'Only event owner or moderators can approve requests',
        {
          extensions: { code: 'FORBIDDEN' },
        }
      );
    }

    // Find target member
    const targetMember = event.members.find((m) => m.userId === targetUserId);

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
    if (event.joinedCount >= event.max) {
      throw new GraphQLError('Event is full', {
        extensions: { code: 'EVENT_FULL' },
      });
    }

    // Approve request in transaction
    await prisma.$transaction(async (tx) => {
      // Update member status
      await tx.eventMember.update({
        where: {
          eventId_userId: {
            eventId,
            userId: targetUserId,
          },
        },
        data: {
          status: 'JOINED',
          joinedAt: new Date(),
        },
      });

      // Increment joinedCount
      await tx.event.update({
        where: { id: eventId },
        data: {
          joinedCount: {
            increment: 1,
          },
        },
      });

      // Create member events
      await tx.eventMemberEvent.createMany({
        data: [
          {
            eventId,
            userId: targetUserId,
            actorId: user.id,
            kind: 'APPROVE',
          },
          {
            eventId,
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
        kind: 'EVENT_MEMBERSHIP_APPROVED',
        entityType: 'EVENT',
        entityId: eventId,
        actorId: user.id,
        title: null,
        body: null,
        data: {
          eventId,
          eventTitle: event.title,
          actorName: user.name,
        },
      },
    });

    // Return updated event
    const updated = await prisma.event.findUnique({
      where: { id: eventId },
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
      throw new GraphQLError('Event not found after update', {
        extensions: { code: 'INTERNAL_SERVER_ERROR' },
      });
    }

    // Publish to pubsub
    if (pubsub) {
      await pubsub.publish({
        topic: `EVENT_UPDATED:${eventId}`,
        payload: { eventUpdated: mapEvent(updated) },
      });
    }

    return mapEvent(updated);
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

    const { eventId, userId: targetUserId, reason } = input;

    // Fetch event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
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

    if (!event) {
      throw new GraphQLError('Event not found', {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    // Check permissions
    const isOwner = event.ownerId === user.id;
    const isModerator = event.members.some(
      (m) =>
        m.userId === user.id &&
        (m.role === 'OWNER' || m.role === 'MODERATOR') &&
        m.status === 'JOINED'
    );
    const isAdmin = user.role === 'ADMIN';

    if (!isOwner && !isModerator && !isAdmin) {
      throw new GraphQLError(
        'Only event owner or moderators can reject requests',
        {
          extensions: { code: 'FORBIDDEN' },
        }
      );
    }

    // Find target member
    const targetMember = event.members.find((m) => m.userId === targetUserId);

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
      await tx.eventMember.update({
        where: {
          eventId_userId: {
            eventId,
            userId: targetUserId,
          },
        },
        data: {
          status: 'REJECTED',
          rejectReason: reason || null,
        },
      });

      // Create member event
      await tx.eventMemberEvent.create({
        data: {
          eventId,
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
        kind: 'EVENT_MEMBERSHIP_REJECTED',
        entityType: 'EVENT',
        entityId: eventId,
        actorId: user.id,
        title: null,
        body: null,
        data: {
          eventId,
          eventTitle: event.title,
          actorName: user.name,
          reason: reason || undefined,
        },
      },
    });

    // Return updated event
    const updated = await prisma.event.findUnique({
      where: { id: eventId },
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
      throw new GraphQLError('Event not found after update', {
        extensions: { code: 'INTERNAL_SERVER_ERROR' },
      });
    }

    // Publish to pubsub
    if (pubsub) {
      await pubsub.publish({
        topic: `EVENT_UPDATED:${eventId}`,
        payload: { eventUpdated: mapEvent(updated) },
      });
    }

    return mapEvent(updated);
  };

/**
 * Cancel own join request (user cancels their PENDING request)
 * This is an update to the existing cancelJoinRequest mutation
 */
export const cancelJoinRequestMutation: MutationResolvers['cancelJoinRequest'] =
  async (_parent, { eventId }, { user, pubsub }) => {
    if (!user) {
      throw new GraphQLError('Authentication required', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    // Find member
    const member = await prisma.eventMember.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId: user.id,
        },
      },
    });

    if (!member) {
      throw new GraphQLError('You are not a member of this event', {
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
      await tx.eventMember.update({
        where: {
          eventId_userId: {
            eventId,
            userId: user.id,
          },
        },
        data: {
          status: 'CANCELLED',
        },
      });

      // Create member event
      await tx.eventMemberEvent.create({
        data: {
          eventId,
          userId: user.id,
          actorId: user.id,
          kind: 'CANCEL_REQUEST',
        },
      });
    });

    // Publish to pubsub
    if (pubsub) {
      const event = await prisma.event.findUnique({
        where: { id: eventId },
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

      if (event) {
        await pubsub.publish({
          topic: `EVENT_UPDATED:${eventId}`,
          payload: { eventUpdated: mapEvent(event) },
        });
      }
    }

    return true;
  };
