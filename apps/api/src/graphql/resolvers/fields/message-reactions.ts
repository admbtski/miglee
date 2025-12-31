/**
 * Message Reactions Field Resolvers
 *
 * Aggregate reactions for DM and Event Chat messages.
 */

import { User as PrismaUser } from '../../../prisma-client/client';
import { prisma } from '../../../lib/prisma';
import type {
  DmMessageResolvers,
  EventChatMessageResolvers,
  MessageReaction,
} from '../../__generated__/resolvers-types';
import { mapUser } from '../helpers';

interface ReactionWithUser {
  emoji: string;
  userId: string;
  user: PrismaUser;
}

/**
 * Helper to aggregate reactions by emoji
 */
function aggregateReactions(
  reactions: ReactionWithUser[],
  currentUserId?: string
): MessageReaction[] {
  const grouped: Record<string, ReactionWithUser[]> = {};
  for (const r of reactions) {
    const existing = grouped[r.emoji];
    if (existing) {
      existing.push(r);
    } else {
      grouped[r.emoji] = [r];
    }
  }

  return Object.entries(grouped).map(([emoji, items]) => ({
    emoji,
    count: items.length,
    users: items.slice(0, 20).map((r) => mapUser(r.user)), // Cap at 20 users
    reacted: currentUserId
      ? items.some((r) => r.userId === currentUserId)
      : false,
  }));
}

/**
 * Aggregate reactions for a DM message
 */
export const dmMessageReactionsResolver: DmMessageResolvers['reactions'] =
  async (parent, _args, { user }): Promise<MessageReaction[]> => {
    const reactions = await prisma.dmMessageReaction.findMany({
      where: { messageId: parent.id },
      include: { user: true },
    });

    return aggregateReactions(reactions, user?.id);
  };

/**
 * Aggregate reactions for an Event chat message
 */
export const eventChatMessageReactionsResolver: EventChatMessageResolvers['reactions'] =
  async (parent, _args, { user }): Promise<MessageReaction[]> => {
    const reactions = await prisma.eventChatMessageReaction.findMany({
      where: { messageId: parent.id },
      include: { user: true },
    });

    return aggregateReactions(reactions, user?.id);
  };
