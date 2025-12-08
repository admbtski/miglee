import type { Resolvers } from '../../__generated__/resolvers-types';
import {
  notificationAddedSubscription,
  notificationBadgeChangedSubscription,
} from './notifications';
import {
  eventMessageAddedSubscription,
  eventMessageUpdatedSubscription,
  eventMessageDeletedSubscription,
  eventTypingSubscription,
  dmMessageAddedSubscription,
  dmMessageUpdatedSubscription,
  dmMessageDeletedSubscription,
  dmTypingSubscription,
  eventReactionAddedSubscription,
  dmReactionAddedSubscription,
} from './chat';

export const Subscription: Resolvers['Subscription'] = {
  notificationAdded: notificationAddedSubscription,
  notificationBadgeChanged: notificationBadgeChangedSubscription,
  eventMessageAdded: eventMessageAddedSubscription,
  eventMessageUpdated: eventMessageUpdatedSubscription,
  eventMessageDeleted: eventMessageDeletedSubscription,
  eventTyping: eventTypingSubscription,
  dmMessageAdded: dmMessageAddedSubscription,
  dmMessageUpdated: dmMessageUpdatedSubscription,
  dmMessageDeleted: dmMessageDeletedSubscription,
  dmTyping: dmTypingSubscription,
  eventReactionAdded: eventReactionAddedSubscription,
  dmReactionAdded: dmReactionAddedSubscription,
};
