import { withFilter } from 'mercurius';
import { prisma } from '../../lib/prisma';
import {
  Event,
  Notification,
  Resolvers,
} from '../__generated__/resolvers-types';

// codegen generates type for each entity, so we need to extract query, mutation and subscription
type ResolversType = Pick<Resolvers, 'Query' | 'Mutation' | 'Subscription'>;

let idCount = '1';
const notifications: Notification[] = [
  {
    id: idCount,
    message: 'Notification message',
  },
];

export const resolvers: ResolversType = {
  Query: {
    events: async (_parent, args, ctx): Promise<Event[]> => {
      const limit = Math.max(1, Math.min(args.limit || 10, 100));

      const events = await prisma.event.findMany({
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      });

      return events.map(({ createdAt, id, title }) => ({
        id,
        title,
        createdAt,
      }));
    },
    notifications: async (_parent, args, ctx): Promise<Notification[]> => {
      return await notifications;
    },
  },
  Mutation: {
    addNotification: async (_, { message }, { pubsub }) => {
      let id = Number(idCount);
      id++;
      const notification = {
        id: id.toString(),
        message,
      };
      notifications.push(notification);
      await pubsub.publish({
        topic: 'NOTIFICATION_ADDED',
        payload: {
          notificationAdded: notification,
        },
      });

      return notification;
    },
  },
  Subscription: {
    notificationAdded: {
      subscribe: withFilter(
        (root, args, { pubsub }) => pubsub.subscribe('NOTIFICATION_ADDED'),
        (payload, args) => true
      ),
    },
  },
};
