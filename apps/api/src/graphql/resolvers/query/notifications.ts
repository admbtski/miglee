import { prisma } from '../../../lib/prisma';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import { QueryResolvers } from '../../__generated__/resolvers-types';
import { mapNotification } from '../helpers';

export const notificationsQuery: QueryResolvers['notifications'] =
  resolverWithMetrics('Query', 'notifications', async (_p, _a, { user }) => {
    const recipientId = _a?.recipientId ?? user?.id ?? null;
    const where = recipientId ? { recipientId } : {};
    const list = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        recipient: true,
        intent: { include: { author: true, categories: true, tags: true } },
      },
    });
    return list.map(mapNotification);
  });
