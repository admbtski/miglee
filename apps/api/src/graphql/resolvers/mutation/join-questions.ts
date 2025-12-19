/**
 * Join Questions Resolvers
 * Handles join form questions for events
 */

import { GraphQLError } from 'graphql';
import type {
  MutationResolvers,
  EventJoinQuestion,
} from '../../__generated__/resolvers-types';
import { prisma } from '../../../lib/prisma';
import { createAuditLog, type CreateAuditLogInput } from '../../../lib/audit';

// Temporary type aliases until prisma generate is run
type AuditScope = CreateAuditLogInput['scope'];
type AuditAction = CreateAuditLogInput['action'];

export const joinQuestionsMutations: Partial<MutationResolvers> = {
  /**
   * Update (replace) all join questions for an event
   * Only owner/moderators can update questions
   * This is a bulk replace operation - all existing questions are deleted and replaced
   */
  updateEventJoinQuestions: async (_parent, { input }, { user }) => {
    if (!user) {
      throw new GraphQLError('You must be logged in to update join questions', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    const { eventId, questions } = input;

    // Validate input
    if (questions.length > 50) {
      throw new GraphQLError('Cannot add more than 50 questions', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }

    // Validate each question
    for (const q of questions) {
      if (!q.label || q.label.trim().length === 0) {
        throw new GraphQLError('Question label cannot be empty', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }
      if (q.label.length > 200) {
        throw new GraphQLError('Question label cannot exceed 200 characters', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }
      if (q.helpText && q.helpText.length > 200) {
        throw new GraphQLError('Help text cannot exceed 200 characters', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
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
      if (q.options && q.options.length > 10) {
        throw new GraphQLError(
          'Cannot have more than 10 options per question',
          {
            extensions: { code: 'BAD_USER_INPUT' },
          }
        );
      }
    }

    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        ownerId: true,
        members: {
          where: {
            userId: user.id,
            status: 'JOINED',
            role: {
              in: ['OWNER', 'MODERATOR'],
            },
          },
          select: { role: true },
        },
      },
    });

    if (!event) {
      throw new GraphQLError('Event not found', {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    // Check permissions (owner or moderator)
    const isOwner = event.ownerId === user.id;
    const isModerator = event.members.some((m) => m.role === 'MODERATOR');

    if (!isOwner && !isModerator) {
      throw new GraphQLError(
        'Only event owner or moderators can manage join questions',
        {
          extensions: { code: 'FORBIDDEN' },
        }
      );
    }

    // Delete all existing questions and create new ones in a transaction
    const updatedQuestions = await prisma.$transaction(async (tx) => {
      // Delete all existing questions
      await tx.eventJoinQuestion.deleteMany({
        where: { eventId },
      });

      // Create new questions with order
      const createdQuestions = await Promise.all(
        questions.map((q, index) =>
          tx.eventJoinQuestion.create({
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
        actorRole: isOwner ? 'OWNER' : 'MODERATOR',
        scope: 'EVENT' as AuditScope,
        action: 'CONFIG_CHANGE' as AuditAction,
        entityType: 'EventJoinQuestion',
        entityId: eventId,
        meta: { joinFormChanged: true, questionCount: questions.length },
        severity: 2,
      });

      return createdQuestions;
    });

    return updatedQuestions as unknown as EventJoinQuestion[];
  },
};
