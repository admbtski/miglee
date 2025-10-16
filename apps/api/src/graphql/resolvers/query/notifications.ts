import type { Prisma } from '@prisma/client';
import { GraphQLError } from 'graphql';
import { prisma } from '../../../lib/prisma';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import { QueryResolvers } from '../../__generated__/resolvers-types';
import { mapNotification } from '../helpers';

const INTENT_INCLUDE = {
  categories: true,
  tags: true,
  members: { include: { user: true, addedBy: true } }, // OWNER/participants
} satisfies Prisma.IntentInclude;

export const notificationsQuery: QueryResolvers['notifications'] =
  resolverWithMetrics('Query', 'notifications', async (_p, args, { user }) => {
    const take = Math.max(1, Math.min(args.limit ?? 50, 200));
    const skip = Math.max(0, args.offset ?? 0);

    // Wymagamy zalogowanego usera oraz zgodności recipientId
    if (!user?.id) {
      throw new GraphQLError('Authentication required.', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }
    if (args.recipientId !== user.id) {
      // jeśli chcesz dopuścić adminów -> tu sprawdź role
      throw new GraphQLError('Access denied for requested recipient.', {
        extensions: { code: 'FORBIDDEN' },
      });
    }

    const where: Prisma.NotificationWhereInput = {
      recipientId: args.recipientId,
      ...(args.unreadOnly ? { readAt: null } : {}),
      ...(args.entityType ? { entityType: args.entityType as any } : {}),
    };

    const list = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take,
      skip,
      include: {
        recipient: true,
        actor: true,
        intent: { include: INTENT_INCLUDE },
      },
    });

    return list.map(mapNotification);
  });
