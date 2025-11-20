/**
 * Field resolvers for message reactions
 */

import { prisma } from '../../../lib/prisma';
import type {
  DmMessageResolvers,
  IntentChatMessageResolvers,
  MessageReaction,
} from '../../__generated__/resolvers-types';
import { mapUser } from '../helpers';

/**
 * Aggregate reactions for a DM message
 */
export const dmMessageReactionsResolver: DmMessageResolvers['reactions'] =
  async (parent, _args, { user }) => {
    const reactions = await prisma.dmMessageReaction.findMany({
      where: { messageId: parent.id },
      include: { user: true },
    });

    return aggregateReactions(reactions, user?.id);
  };

/**
 * Aggregate reactions for an Intent chat message
 */
export const intentChatMessageReactionsResolver: IntentChatMessageResolvers['reactions'] =
  async (parent, _args, { user }) => {
    const reactions = await prisma.intentChatMessageReaction.findMany({
      where: { messageId: parent.id },
      include: { user: true },
    });

    return aggregateReactions(reactions, user?.id);
  };

/**
 * Helper to aggregate reactions by emoji
 */
function aggregateReactions(
  reactions: Array<{
    emoji: string;
    userId: string;
    user: { id: string; name: string; avatarKey: string | null };
  }>,
  currentUserId?: string
): MessageReaction[] {
  const grouped = reactions.reduce(
    (acc, r) => {
      if (!acc[r.emoji]) {
        acc[r.emoji] = [];
      }
      acc[r.emoji].push(r);
      return acc;
    },
    {} as Record<string, typeof reactions>
  );

  return Object.entries(grouped).map(([emoji, items]) => ({
    emoji,
    count: items.length,
    users: items.slice(0, 20).map((r) => mapUser(r.user as any)), // Cap at 20 users
    reacted: currentUserId
      ? items.some((r) => r.userId === currentUserId)
      : false,
  }));
}
