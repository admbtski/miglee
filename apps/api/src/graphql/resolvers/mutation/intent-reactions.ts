/**
 * Intent Chat Message Reactions Resolvers
 */

import { GraphQLError } from 'graphql';
import { prisma } from '../../../lib/prisma';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import type { MutationResolvers } from '../../__generated__/resolvers-types';
import { requireJoinedMember } from '../chat-guards';

const ALLOWED_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

/**
 * Add reaction to Intent chat message
 */
export const addIntentReactionMutation: MutationResolvers['addIntentReaction'] =
  resolverWithMetrics(
    'Mutation',
    'addIntentReaction',
    async (_p, { messageId, emoji }, { user, pubsub }) => {
      if (!user?.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      // Validate emoji
      if (!ALLOWED_EMOJIS.includes(emoji)) {
        throw new GraphQLError('Invalid emoji. Allowed: 👍 ❤️ 😂 😮 😢 🙏', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      // Check if message exists
      const message = await prisma.intentChatMessage.findUnique({
        where: { id: messageId },
      });

      if (!message) {
        throw new GraphQLError('Message not found.', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Check if user is a joined member
      await requireJoinedMember(user.id, message.intentId);

      // Upsert reaction (idempotent)
      await prisma.intentChatMessageReaction.upsert({
        where: {
          messageId_userId_emoji: {
            messageId,
            userId: user.id,
            emoji,
          },
        },
        create: {
          messageId,
          userId: user.id,
          emoji,
        },
        update: {}, // No-op if already exists
      });

      // Publish to WebSocket
      await pubsub?.publish({
        topic: `intentReactionAdded:${message.intentId}`,
        payload: {
          intentReactionAdded: {
            messageId,
            userId: user.id,
            emoji,
            action: 'ADD',
          },
        },
      });

      return true;
    }
  );

/**
 * Remove reaction from Intent chat message
 */
export const removeIntentReactionMutation: MutationResolvers['removeIntentReaction'] =
  resolverWithMetrics(
    'Mutation',
    'removeIntentReaction',
    async (_p, { messageId, emoji }, { user, pubsub }) => {
      if (!user?.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      // Check if message exists
      const message = await prisma.intentChatMessage.findUnique({
        where: { id: messageId },
      });

      if (!message) {
        throw new GraphQLError('Message not found.', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Check if user is a joined member
      await requireJoinedMember(user.id, message.intentId);

      // Delete reaction (idempotent - no error if doesn't exist)
      await prisma.intentChatMessageReaction.deleteMany({
        where: {
          messageId,
          userId: user.id,
          emoji,
        },
      });

      // Publish to WebSocket
      await pubsub?.publish({
        topic: `intentReactionAdded:${message.intentId}`,
        payload: {
          intentReactionAdded: {
            messageId,
            userId: user.id,
            emoji,
            action: 'REMOVE',
          },
        },
      });

      return true;
    }
  );
