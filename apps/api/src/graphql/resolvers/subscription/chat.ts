/**
 * Chat Subscriptions (Event Chat + DM)
 */

import { GraphQLError } from 'graphql';
import type { SubscriptionResolvers } from '../../__generated__/resolvers-types';
import { requireJoinedMember, requireDmParticipant } from '../chat-guards';

/**
 * Subscription: New message added to intent chat
 */
export const intentMessageAddedSubscription: SubscriptionResolvers['intentMessageAdded'] =
  {
    subscribe: async (_p, { intentId }, { user, pubsub }) => {
      if (!user?.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      // Guard: user must be JOINED
      await requireJoinedMember(user.id, intentId);

      // Subscribe to channel
      return pubsub.subscribe(`intentMessageAdded:${intentId}`);
    },
    resolve: (payload: any) => {
      return payload.intentMessageAdded;
    },
  };

/**
 * Subscription: Typing indicator for intent chat
 */
export const intentTypingSubscription: SubscriptionResolvers['intentTyping'] = {
  subscribe: async (_p, { intentId }, { user, pubsub }) => {
    if (!user?.id) {
      throw new GraphQLError('Authentication required.', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    // Guard: user must be JOINED
    await requireJoinedMember(user.id, intentId);

    // Subscribe to channel
    return pubsub.subscribe(`intentTyping:${intentId}`);
  },
  resolve: (payload: any) => {
    return payload.intentTyping;
  },
};

/**
 * Subscription: New message added to DM thread
 */
export const dmMessageAddedSubscription: SubscriptionResolvers['dmMessageAdded'] =
  {
    subscribe: async (_p, { threadId }, { user, pubsub }) => {
      if (!user?.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      // Guard: user must be a participant
      await requireDmParticipant(user.id, threadId);

      // Subscribe to channel
      return pubsub.subscribe(`dmMessageAdded:${threadId}`);
    },
    resolve: (payload: any) => {
      return payload.dmMessageAdded;
    },
  };

/**
 * Subscription: Typing indicator for DM thread
 */
export const dmTypingSubscription: SubscriptionResolvers['dmTyping'] = {
  subscribe: async (_p, { threadId }, { user, pubsub }) => {
    if (!user?.id) {
      throw new GraphQLError('Authentication required.', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    // Guard: user must be a participant
    await requireDmParticipant(user.id, threadId);

    // Subscribe to channel
    return pubsub.subscribe(`dmTyping:${threadId}`);
  },
  resolve: (payload: any) => {
    return payload.dmTyping;
  },
};
