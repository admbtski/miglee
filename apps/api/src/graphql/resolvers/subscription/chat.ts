/**
 * Chat Subscriptions (Event Chat + DM)
 */

import { GraphQLError } from 'graphql';
import type { SubscriptionResolvers } from '../../__generated__/resolvers-types';
import { requireJoinedMember, requireDmParticipant } from '../chat-guards';

// Note: Subscription payloads use 'any' because Mercurius/GraphQL subscription
// resolvers expect specific return types that are difficult to type statically
// when the payload comes from pubsub.publish() calls across the codebase.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SubscriptionPayload = Record<string, any>;

/**
 * Subscription: New message added to event chat
 */
export const eventMessageAddedSubscription: SubscriptionResolvers['eventMessageAdded'] =
  {
    subscribe: async (_p, { eventId }, { user, pubsub }) => {
      if (!user?.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      // Guard: user must be JOINED
      await requireJoinedMember(user.id, eventId);

      // Subscribe to channel
      return pubsub.subscribe(`eventMessageAdded:${eventId}`);
    },
    resolve: (payload: SubscriptionPayload) => {
      return payload.eventMessageAdded;
    },
  };

/**
 * Subscription: Typing indicator for eventchat
 */
export const eventTypingSubscription: SubscriptionResolvers['eventTyping'] = {
  subscribe: async (_p, { eventId }, { user, pubsub }) => {
    if (!user?.id) {
      throw new GraphQLError('Authentication required.', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    // Guard: user must be JOINED
    await requireJoinedMember(user.id, eventId);

    // Subscribe to channel
    return pubsub.subscribe(`eventTyping:${eventId}`);
  },
  resolve: (payload: SubscriptionPayload) => {
    return payload.eventTyping;
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
    resolve: (payload: SubscriptionPayload) => {
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
  resolve: (payload: SubscriptionPayload) => {
    return payload.dmTyping;
  },
};

/**
 * Subscription: Reaction added/removed in eventchat
 */
export const eventReactionAddedSubscription: SubscriptionResolvers['eventReactionAdded'] =
  {
    subscribe: async (_p, { eventId }, { user, pubsub }) => {
      if (!user?.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      // Guard: user must be JOINED
      await requireJoinedMember(user.id, eventId);

      // Subscribe to channel
      return pubsub.subscribe(`eventReactionAdded:${eventId}`);
    },
    resolve: (payload: SubscriptionPayload) => {
      return payload.eventReactionAdded;
    },
  };

/**
 * Subscription: Reaction added/removed in DM thread
 */
export const dmReactionAddedSubscription: SubscriptionResolvers['dmReactionAdded'] =
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
      return pubsub.subscribe(`dmReactionAdded:${threadId}`);
    },
    resolve: (payload: SubscriptionPayload) => {
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
    resolve: (payload: SubscriptionPayload) => {
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
    resolve: (payload: SubscriptionPayload) => {
      return payload.dmMessageDeleted;
    },
  };

/**
 * Subscription: Event message updated
 */
export const eventMessageUpdatedSubscription: SubscriptionResolvers['eventMessageUpdated'] =
  {
    subscribe: async (_p, { eventId }, { user, pubsub }) => {
      if (!user?.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      // Guard: user must be JOINED
      await requireJoinedMember(user.id, eventId);

      // Subscribe to channel
      return pubsub.subscribe(`eventMessageUpdated:${eventId}`);
    },
    resolve: (payload: SubscriptionPayload) => {
      return payload.eventMessageUpdated;
    },
  };

/**
 * Subscription: Event message deleted
 */
export const eventMessageDeletedSubscription: SubscriptionResolvers['eventMessageDeleted'] =
  {
    subscribe: async (_p, { eventId }, { user, pubsub }) => {
      if (!user?.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      // Guard: user must be JOINED
      await requireJoinedMember(user.id, eventId);

      // Subscribe to channel
      return pubsub.subscribe(`eventMessageDeleted:${eventId}`);
    },
    resolve: (payload: SubscriptionPayload) => {
      return payload.eventMessageDeleted;
    },
  };
