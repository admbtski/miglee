import { withFilter } from 'mercurius';
import { prisma } from '../../lib/prisma';
import {
  Event,
  Notification,
  Resolvers,
} from '../__generated__/resolvers-types';

// codegen daje typy, ograniczamy się do 3 sekcji
type ResolversType = Pick<Resolvers, 'Query' | 'Mutation' | 'Subscription'>;

let idCount = '1';
const notifications: Notification[] = [
  { id: idCount, message: 'Notification message' },
];

export const resolvers: ResolversType = {
  Query: {
    events: async (_parent, args, _ctx): Promise<Event[]> => {
      const limit = Math.max(1, Math.min(args.limit || 10, 100));
      const events = await prisma.event.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
      });

      return events.map(({ createdAt, id, title }) => ({
        id,
        title,
        createdAt,
      }));
    },

    notifications: async () => {
      return notifications;
    },
  },

  Mutation: {
    addNotification: async (_parent, { message }, { pubsub }) => {
      const id = String(Number(idCount) + 1);
      idCount = id;

      const notification = { id, message };
      notifications.push(notification);

      // Publikacja przez Redis-emitter:
      await pubsub.publish({
        topic: 'NOTIFICATION_ADDED',
        payload: { notificationAdded: notification },
      });

      return notification;
    },
  },

  Subscription: {
    notificationAdded: {
      // withFilter opcjonalny; jeśli nie filtrujesz, możesz zwrócić pubsub.subscribe(...) bez filtra
      subscribe: withFilter(
        (source, args, ctx, info) => {
          return ctx.pubsub.subscribe('NOTIFICATION_ADDED');
        },
        // filtr w tym momencie przepuszcza wszystko:
        (payload, args, ctx, info) => {
          return true;
        }
      ),
    },
  },
};
