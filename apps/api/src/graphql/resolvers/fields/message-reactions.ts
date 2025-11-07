/**
 * Field resolvers for message reactions
 */

import { prisma } from '../../../lib/prisma';
import type {
  DmMessageResolvers,
  IntentChatMessageResolvers,
  MessageReaction,
} from '../../__generated__/resolvers-types';

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
    user: { id: string; name: string; imageUrl: string | null };
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
    users: items.map((r) => ({
      id: r.user.id,
      name: r.user.name,
      imageUrl: r.user.imageUrl,
      // Add other required User fields with defaults
      email: '',
      role: 'USER' as const,
      verifiedAt: null,
    })),
    reacted: currentUserId
      ? items.some((r) => r.userId === currentUserId)
      : false,
  }));
}
