import type { Resolvers } from '../../__generated__/resolvers-types';
import { notificationAddedSubscription } from './notifications';

export const Subscription: Resolvers['Subscription'] = {
  notificationAdded: notificationAddedSubscription as any,
};
