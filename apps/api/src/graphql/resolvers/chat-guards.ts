/**
 * Chat Authorization Guards
 *
 * This file provides backwards-compatible wrappers around the shared auth guards.
 * These wrappers accept (userId, eventId) signatures for compatibility with existing code.
 *
 * For new code, prefer importing directly from './shared/auth-guards'.
 */

import { EventMemberStatus } from '@prisma/client';
import { GraphQLError } from 'graphql';
import { prisma } from '../../lib/prisma';
import {
  requireAdmin,
  requireDmParticipant,
  requireDmAllowed,
  requireMessageAuthor,
  getEventMembership,
  isEventModeratorRole,
} from './shared/auth-guards';

// Re-export guards that don't need wrapping
export { requireAdmin, requireDmParticipant, requireMessageAuthor };
export { requireDmAllowed as checkDmAllowed };

/**
 * Check if user is a JOINED member of the event.
 * Required for reading/writing event chat messages.
 * @deprecated Use requireEventParticipantOrAppMod from shared/auth-guards instead
 */
export async function requireJoinedMember(
  userId: string,
  eventId: string
): Promise<void> {
  const member = await prisma.eventMember.findUnique({
    where: {
      eventId_userId: { eventId, userId },
    },
    select: { status: true },
  });

  if (!member || member.status !== EventMemberStatus.JOINED) {
    throw new GraphQLError('You must be a joined member to access this chat.', {
      extensions: { code: 'FORBIDDEN' },
    });
  }
}

/**
 * Check if user can moderate event chat (owner or moderator).
 * @deprecated Use requireEventModOrOwner from shared/auth-guards instead
 */
export async function requireEventChatModerator(
  userId: string,
  eventId: string
): Promise<void> {
  const member = await getEventMembership(userId, eventId);

  if (!member || member.status !== EventMemberStatus.JOINED) {
    throw new GraphQLError('Moderator access required.', {
      extensions: { code: 'FORBIDDEN' },
    });
  }

  if (!isEventModeratorRole(member.role)) {
    throw new GraphQLError('Moderator access required.', {
      extensions: { code: 'FORBIDDEN' },
    });
  }
}
