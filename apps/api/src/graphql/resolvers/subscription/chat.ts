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
  subscribe: async (_p, { threadId }, { pubsub }) => {
    // Subscribe to channel
    return pubsub.subscribe(`dmTyping:${threadId}`);
  },
  resolve: (payload: any) => {
    return payload.dmTyping;
  },
};

/**
 * Subscription: Reaction added/removed in intent chat
 */
export const intentReactionAddedSubscription: SubscriptionResolvers['intentReactionAdded'] =
  {
    subscribe: async (
      _p: any,
      { intentId }: { intentId: string },
      { user, pubsub }: any
    ) => {
      if (!user?.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      // Guard: user must be JOINED
      await requireJoinedMember(user.id, intentId);

      // Subscribe to channel
      return pubsub.subscribe(`intentReactionAdded:${intentId}`);
    },
    resolve: (payload: any) => {
      return payload.intentReactionAdded;
    },
  };

/**
 * Subscription: Reaction added/removed in DM thread
 */
export const dmReactionAddedSubscription: SubscriptionResolvers['dmReactionAdded'] =
  {
    subscribe: async (
      _p: any,
      { threadId }: { threadId: string },
      { user, pubsub }: any
    ) => {
      if (!user?.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      // Guard: user must be a participant
      await requireDmParticipant(user.id, threadId);

      // Subscribe to channel
      return pubsub.subscribe(`dmReactionAdded:${threadId}`);
    },
    resolve: (payload: any) => {
      return payload.dmReactionAdded;
    },
  };

/**
 * Subscription: DM message updated
 */
export const dmMessageUpdatedSubscription: SubscriptionResolvers['dmMessageUpdated'] =
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
      return pubsub.subscribe(`dmMessageUpdated:${threadId}`);
    },
    resolve: (payload: any) => {
      return payload.dmMessageUpdated;
    },
  };

/**
 * Subscription: DM message deleted
 */
export const dmMessageDeletedSubscription: SubscriptionResolvers['dmMessageDeleted'] =
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
      return pubsub.subscribe(`dmMessageDeleted:${threadId}`);
    },
    resolve: (payload: any) => {
      console.dir({ adam: '######################' });
      return payload.dmMessageDeleted;
    },
  };

/**
 * Subscription: Intent message updated
 */
export const intentMessageUpdatedSubscription: SubscriptionResolvers['intentMessageUpdated'] =
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
      return pubsub.subscribe(`intentMessageUpdated:${intentId}`);
    },
    resolve: (payload: any) => {
      return payload.intentMessageUpdated;
    },
  };

/**
 * Subscription: Intent message deleted
 */
export const intentMessageDeletedSubscription: SubscriptionResolvers['intentMessageDeleted'] =
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
      return pubsub.subscribe(`intentMessageDeleted:${intentId}`);
    },
    resolve: (payload: any) => {
      return payload.intentMessageDeleted;
    },
  };
