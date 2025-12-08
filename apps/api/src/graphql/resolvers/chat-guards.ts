/**
 * Chat authorization guards
 */

import { GraphQLError } from 'graphql';
import { prisma } from '../../lib/prisma';
import type { SessionUser } from '../__generated__/resolvers-types';

// =============================================================================
// Event Chat Guards
// =============================================================================

/**
 * Check if user is a JOINED member of the event
 * Required for reading/writing event chat messages
 */
export async function requireJoinedMember(
  userId: string,
  eventId: string
): Promise<void> {
  const member = await prisma.eventMember.findUnique({
    where: {
      eventId_userId: {
        eventId,
        userId,
      },
    },
    select: {
      status: true,
    },
  });

  if (!member || member.status !== 'JOINED') {
    throw new GraphQLError('You must be a joined member to access this chat.', {
      extensions: { code: 'FORBIDDEN' },
    });
  }
}

/**
 * Check if user can moderate event chat (owner or moderator)
 */
export async function requireEventChatModerator(
  userId: string,
  eventId: string
): Promise<void> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      ownerId: true,
      members: {
        where: {
          userId,
          status: 'JOINED',
        },
        select: {
          role: true,
        },
      },
    },
  });

  if (!event) {
    throw new GraphQLError('Event not found.', {
      extensions: { code: 'NOT_FOUND' },
    });
  }

  const isOwner = event.ownerId === userId;
  const isModerator = event.members.some(
    (m) => m.role === 'MODERATOR' || m.role === 'OWNER'
  );

  if (!isOwner && !isModerator) {
    throw new GraphQLError('Moderator access required.', {
      extensions: { code: 'FORBIDDEN' },
    });
  }
}

// =============================================================================
// DM Guards
// =============================================================================

/**
 * Check if user is a participant in the DM thread
 */
export async function requireDmParticipant(
  userId: string,
  threadId: string
): Promise<void> {
  const thread = await prisma.dmThread.findUnique({
    where: { id: threadId },
    select: {
      aUserId: true,
      bUserId: true,
    },
  });

  if (!thread) {
    throw new GraphQLError('DM thread not found.', {
      extensions: { code: 'NOT_FOUND' },
    });
  }

  if (thread.aUserId !== userId && thread.bUserId !== userId) {
    throw new GraphQLError('You are not a participant in this thread.', {
      extensions: { code: 'FORBIDDEN' },
    });
  }
}

/**
 * Check if users can create DM thread (no blocks, not self)
 */
export async function checkDmAllowed(
  userId1: string,
  userId2: string
): Promise<void> {
  if (userId1 === userId2) {
    throw new GraphQLError('Cannot create DM thread with yourself.', {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  }

  // Check for UserBlock in either direction
  const block = await prisma.userBlock.findFirst({
    where: {
      OR: [
        { blockerId: userId1, blockedId: userId2 },
        { blockerId: userId2, blockedId: userId1 },
      ],
    },
  });

  if (block) {
    throw new GraphQLError(
      'Cannot send messages to this user due to blocking.',
      {
        extensions: { code: 'FORBIDDEN' },
      }
    );
  }
}

// =============================================================================
// Message Ownership Guards
// =============================================================================

/**
 * Check if user is the author of a message
 */
export async function requireMessageAuthor(
  userId: string,
  messageId: string,
  messageType: 'event' | 'dm'
): Promise<void> {
  let message: { authorId?: string; senderId?: string } | null = null;

  if (messageType === 'event') {
    message = await prisma.eventChatMessage.findUnique({
      where: { id: messageId },
      select: { authorId: true },
    });
  } else {
    message = await prisma.dmMessage.findUnique({
      where: { id: messageId },
      select: { senderId: true },
    });
  }

  if (!message) {
    throw new GraphQLError('Message not found.', {
      extensions: { code: 'NOT_FOUND' },
    });
  }

  const authorId =
    messageType === 'event'
      ? (message as any).authorId
      : (message as any).senderId;

  if (authorId !== userId) {
    throw new GraphQLError('You can only edit/delete your own messages.', {
      extensions: { code: 'FORBIDDEN' },
    });
  }
}

// =============================================================================
// Admin Guard
// =============================================================================

/**
 * Check if user is an admin
 */
export function requireAdmin(user: SessionUser | null): void {
  if (!user || user.role !== 'ADMIN') {
    throw new GraphQLError('Admin access required.', {
      extensions: { code: 'FORBIDDEN' },
    });
  }
}
