import type { Resolvers } from '../../__generated__/resolvers-types';
import {
  notificationAddedSubscription,
  notificationBadgeChangedSubscription,
} from './notifications';
import {
  intentMessageAddedSubscription,
  intentMessageUpdatedSubscription,
  intentMessageDeletedSubscription,
  intentTypingSubscription,
  dmMessageAddedSubscription,
  dmMessageUpdatedSubscription,
  dmMessageDeletedSubscription,
  dmTypingSubscription,
  intentReactionAddedSubscription,
  dmReactionAddedSubscription,
} from './chat';

export const Subscription: Resolvers['Subscription'] = {
  notificationAdded: notificationAddedSubscription,
  notificationBadgeChanged: notificationBadgeChangedSubscription,
  intentMessageAdded: intentMessageAddedSubscription,
  intentMessageUpdated: intentMessageUpdatedSubscription,
  intentMessageDeleted: intentMessageDeletedSubscription,
  intentTyping: intentTypingSubscription,
  dmMessageAdded: dmMessageAddedSubscription,
  dmMessageUpdated: dmMessageUpdatedSubscription,
  dmMessageDeleted: dmMessageDeletedSubscription,
  dmTyping: dmTypingSubscription,
  intentReactionAdded: intentReactionAddedSubscription,
  dmReactionAdded: dmReactionAddedSubscription,
};
