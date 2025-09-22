import { withFilter } from 'mercurius';
import { prisma } from '../../lib/prisma';
import { resolverWithMetrics } from '../../lib/resolver-metrics';
import type {
  Event,
  Notification,
  Resolvers,
} from '../__generated__/resolvers-types';

type ResolversType = Pick<Resolvers, 'Query' | 'Mutation' | 'Subscription'>;

let idCount = '1';
const notifications: Notification[] = [
  { id: idCount, message: 'Notification message' },
];

export const resolvers: ResolversType = {
  Query: {
    events: resolverWithMetrics(
      'Query',
      'events',
      async (_parent, args, _ctx): Promise<Event[]> => {
        const limit = Math.max(1, Math.min(args.limit ?? 10, 100));
        const events = await prisma.event.findMany({
          take: limit,
          orderBy: { createdAt: 'desc' },
        });

        return events.map(({ id, title, createdAt }) => ({
          id,
          title,
          createdAt,
        }));
      }
    ),

    notifications: resolverWithMetrics('Query', 'notifications', async () => {
      return notifications;
    }),
  },

  Mutation: {
    addNotification: resolverWithMetrics(
      'Mutation',
      'addNotification',
      async (_parent, { message }, { pubsub }) => {
        const id = String(Number(idCount) + 1);
        idCount = id;

        const notification: Notification = { id, message };
        notifications.push(notification);

        await pubsub.publish({
          topic: 'NOTIFICATION_ADDED',
          payload: { notificationAdded: notification },
        });

        return notification;
      }
    ),
  },

  Subscription: {
    notificationAdded: {
      subscribe: withFilter(
        (_source, _args, ctx, _info) => {
          return ctx.pubsub.subscribe('NOTIFICATION_ADDED');
        },
        (_payload, _args, _ctx, _info) => true
      ),
    },
  },
};
