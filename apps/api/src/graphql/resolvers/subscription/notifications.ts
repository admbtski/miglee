import { withFilter } from 'mercurius';
import { SubscriptionResolvers } from '../../__generated__/resolvers-types';

/**
 * notificationAdded(recipientId)
 *  - temat: NOTIFICATION_ADDED:<recipientId>
 *  - payload: { notificationAdded: Notification! }
 */
export const notificationAddedSubscription: SubscriptionResolvers['notificationAdded'] =
  {
    subscribe: withFilter(
      (_source: any, args: any, ctx: any) => {
        const recipientId = args?.recipientId ?? ctx?.auth?.userId;
        const topic = `NOTIFICATION_ADDED:${recipientId}`;
        return ctx.pubsub.subscribe(topic);
      },
      (payload: any, args: any, ctx: any) => {
        const recipientId = args?.recipientId ?? ctx?.auth?.userId;
        return payload?.notificationAdded?.recipientId === recipientId;
      }
    ),
  };

/**
 * notificationBadgeChanged(recipientId)
 *  - temat: NOTIFICATION_BADGE:<recipientId>
 *  - payload: { notificationBadgeChanged: { recipientId: ID! } }
 */
export const notificationBadgeChangedSubscription: SubscriptionResolvers['notificationBadgeChanged'] =
  {
    subscribe: withFilter(
      (_source: any, args: any, ctx: any) => {
        const recipientId = args?.recipientId ?? ctx?.auth?.userId;
        const topic = `NOTIFICATION_BADGE:${recipientId}`;
        return ctx.pubsub.subscribe(topic);
      },
      (payload: any, args: any, ctx: any) => {
        const recipientId = args?.recipientId ?? ctx?.auth?.userId;
        return payload?.notificationBadgeChanged?.recipientId === recipientId;
      }
    ),
  };
