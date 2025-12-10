/**
 * Notifications Query Resolvers
 *
 * Authorization: SELF (recipientId must match current user)
 */

import type { Prisma } from '@prisma/client';
import { GraphQLError } from 'graphql';
import { prisma } from '../../../lib/prisma';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import { QueryResolvers } from '../../__generated__/resolvers-types';
import { mapNotification } from '../helpers';
import { requireAuth, isAdmin } from '../shared/auth-guards';

export const NOTIFICATION_INCLUDE = {
  recipient: true,
  actor: true,
  event: {
    include: {
      categories: true,
      tags: true,
      members: { include: { user: true, addedBy: true } },
      owner: true,
      canceledBy: true,
      deletedBy: true,
    },
  },
} satisfies Prisma.NotificationInclude;

/**
 * Query: notifications
 * Authorization: SELF (recipientId must match current user, ADMIN can access any)
 */
export const notificationsQuery: QueryResolvers['notifications'] =
  resolverWithMetrics('Query', 'notifications', async (_p, args, ctx) => {
    const userId = requireAuth(ctx);

    // SELF check with ADMIN bypass
    if (args.recipientId !== userId && !isAdmin(ctx.user)) {
      throw new GraphQLError('Access denied for requested recipient.', {
        extensions: { code: 'FORBIDDEN' },
      });
    }

    // --- pagination ---
    const take = Math.max(1, Math.min(args.limit ?? 50, 200));
    const skip = Math.max(0, args.offset ?? 0);

    // --- filters ---
    const where: Prisma.NotificationWhereInput = {
      recipientId: args.recipientId,
      ...(args.unreadOnly ? { readAt: null } : {}),
      ...(args.entityType ? { entityType: args.entityType as any } : {}),
    };

    // --- total count ---
    const total = await prisma.notification.count({ where });

    // --- page rows ---
    const rows = await prisma.notification.findMany({
      where,
      take,
      skip,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      include: NOTIFICATION_INCLUDE,
    });

    // --- result ---
    return {
      items: rows.map(mapNotification),
      pageInfo: {
        total,
        limit: take,
        offset: skip,
        hasPrev: skip > 0,
        hasNext: skip + take < total,
      },
    };
  });
