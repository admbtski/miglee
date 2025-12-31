import { GraphQLError } from 'graphql';
import mercurius from 'mercurius';
import type { SubscriptionResolvers } from '../../__generated__/resolvers-types';

const { withFilter } = mercurius;

// Note: Subscription resolvers use 'any' because withFilter from Mercurius
// has complex generic signatures that are difficult to satisfy with strict types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FilterFn = (...args: any[]) => any;

/**
 * Validate that user is authenticated and can only subscribe to their own notifications
 */
function validateNotificationAccess(
  args: { recipientId?: string },
  ctx: { user?: { id: string } }
): string {
  if (!ctx?.user?.id) {
    throw new GraphQLError('Authentication required.', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }

  const recipientId = args?.recipientId ?? ctx.user.id;

  // Users can only subscribe to their own notifications
  if (recipientId !== ctx.user.id) {
    throw new GraphQLError(
      'You can only subscribe to your own notifications.',
      {
        extensions: { code: 'FORBIDDEN' },
      }
    );
  }

  return recipientId;
}

/**
 * notificationAdded(recipientId)
 *  - topic: NOTIFICATION_ADDED:<recipientId>
 *  - payload: { notificationAdded: Notification! }
 */
export const notificationAddedSubscription: SubscriptionResolvers['notificationAdded'] =
  {
    subscribe: withFilter(
      ((_source, args, ctx) => {
        const recipientId = validateNotificationAccess(args, ctx);
        const topic = `NOTIFICATION_ADDED:${recipientId}`;
        return ctx.pubsub.subscribe(topic);
      }) as FilterFn,
      ((payload, args, ctx) => {
        const recipientId = args?.recipientId ?? ctx?.user?.id;
        return payload?.notificationAdded?.recipientId === recipientId;
      }) as FilterFn
    ),
  };

/**
 * notificationBadgeChanged(recipientId)
 *  - topic: NOTIFICATION_BADGE:<recipientId>
 *  - payload: { notificationBadgeChanged: { recipientId: ID! } }
 */
export const notificationBadgeChangedSubscription: SubscriptionResolvers['notificationBadgeChanged'] =
  {
    subscribe: withFilter(
      ((_source, args, ctx) => {
        const recipientId = validateNotificationAccess(args, ctx);
        const topic = `NOTIFICATION_BADGE:${recipientId}`;
        return ctx.pubsub.subscribe(topic);
      }) as FilterFn,
      ((payload, args, ctx) => {
        const recipientId = args?.recipientId ?? ctx?.user?.id;
        return payload?.notificationBadgeChanged?.recipientId === recipientId;
      }) as FilterFn
    ),
  };
