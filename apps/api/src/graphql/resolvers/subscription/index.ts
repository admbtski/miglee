import type { Resolvers } from '../../__generated__/resolvers-types';
import {
  notificationAddedSubscription,
  notificationBadgeChangedSubscription,
} from './notifications';

export const Subscription: Resolvers['Subscription'] = {
  notificationAdded: notificationAddedSubscription,
  notificationBadgeChanged: notificationBadgeChangedSubscription,
};
