// apps/api/src/graphql/resolvers/subscription/notifications.ts
import { withFilter } from 'mercurius';
import { SubscriptionResolvers } from '../../__generated__/resolvers-types';

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
