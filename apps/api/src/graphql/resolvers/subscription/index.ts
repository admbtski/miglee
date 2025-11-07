import type { Resolvers } from '../../__generated__/resolvers-types';
import {
  notificationAddedSubscription,
  notificationBadgeChangedSubscription,
} from './notifications';
import {
  intentMessageAddedSubscription,
  intentTypingSubscription,
  dmMessageAddedSubscription,
  dmTypingSubscription,
  intentReactionAddedSubscription,
  dmReactionAddedSubscription,
} from './chat';

export const Subscription: Resolvers['Subscription'] = {
  notificationAdded: notificationAddedSubscription,
  notificationBadgeChanged: notificationBadgeChangedSubscription,
  intentMessageAdded: intentMessageAddedSubscription,
  intentTyping: intentTypingSubscription,
  dmMessageAdded: dmMessageAddedSubscription,
  dmTyping: dmTypingSubscription,
  intentReactionAdded: intentReactionAddedSubscription,
  dmReactionAdded: dmReactionAddedSubscription,
};
