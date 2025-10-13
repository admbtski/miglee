import { Prisma } from '@prisma/client';
import { MercuriusContext } from 'mercurius';
import { prisma } from '../../../lib/prisma';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import type { MutationResolvers } from '../../__generated__/resolvers-types';
import { mapNotification } from '../helpers';

export const addNotificationMutation: MutationResolvers['addNotification'] =
  resolverWithMetrics(
    'Mutation',
    'addNotification',
    async (_p, { message }, { pubsub, user }: MercuriusContext) => {
      const recipientId = user?.id;

      const created = await prisma.notification.create({
        data: recipientId
          ? {
              kind: 'INTENT_CREATED',
              message: message ?? null,
              payload: Prisma.JsonNull, // JSON null - brak 'undefined' w unii
              recipient: { connect: { id: recipientId } },
            }
          : {
              kind: 'INTENT_CREATED',
              message: message ?? null,
              payload: Prisma.JsonNull,
              recipient: {
                create: {
                  email: `system-${Date.now()}@example.com`,
                  name: 'System',
                },
              },
            },
        include: {
          recipient: true,
          intent: { include: { author: true, categories: true, tags: true } },
        },
      });

      await pubsub.publish({
        topic: `NOTIFICATION_ADDED:${created.recipientId}`,
        payload: { notificationAdded: mapNotification(created) },
      });

      return mapNotification(created);
    }
  );
