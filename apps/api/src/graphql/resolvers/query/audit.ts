/**
 * Event Audit Log Query Resolvers
 *
 * Queries for event audit logs (governance tracking).
 * Access restricted to event owner, moderators, and app admins/moderators.
 */

import type { Prisma } from '@prisma/client';
import { GraphQLError } from 'graphql';
import type { QueryResolvers } from '../../__generated__/resolvers-types';
import { validateModeratorAccess } from '../helpers/checkin';

// Maximum export limit to prevent memory issues
const MAX_EXPORT_LIMIT = 10000;

/**
 * Get audit logs for an event
 *
 * Access: Owner, Moderator, App Admin/Moderator
 * Provides governance tracking for event changes, membership, moderation, etc.
 */
export const eventAuditLogs: QueryResolvers['eventAuditLogs'] = async (
  _,
  { eventId, scope, action, actorId, from, to, limit = 50, cursor },
  { prisma, user }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> => {
  const userId = user?.id;
  if (!userId) {
    throw new GraphQLError('Not authenticated', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }

  try {
    // Validate moderator/owner access
    await validateModeratorAccess(prisma, eventId, userId);

    // Enforce max limit
    const safeLimit = Math.min(Math.max(1, limit ?? 50), 100);

    // Build where clause
    const where: Prisma.EventAuditLogWhereInput = {
      eventId,
    };

    // Filter by scope(s)
    if (scope && scope.length > 0) {
      where.scope = { in: scope };
    }

    // Filter by action(s)
    if (action && action.length > 0) {
      where.action = { in: action };
    }

    // Filter by actor
    if (actorId) {
      where.actorId = actorId;
    }

    // Filter by date range
    if (from || to) {
      where.createdAt = {};
      if (from) {
        where.createdAt.gte = new Date(from);
      }
      if (to) {
        where.createdAt.lte = new Date(to);
      }
    }

    // Cursor-based pagination
    if (cursor) {
      where.id = { lt: cursor };
    }

    // Fetch logs with pagination
    const [items, total] = await Promise.all([
      prisma.eventAuditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: safeLimit,
        include: {
          actor: {
            include: {
              profile: true,
            },
          },
        },
      }),
      prisma.eventAuditLog.count({ where: { eventId } }),
    ]);

    return {
      items,
      pageInfo: {
        total,
        limit: safeLimit,
        offset: 0, // Not used in cursor pagination but required by PageInfo
        hasNext: items.length === safeLimit,
        hasPrev: !!cursor,
      },
    };
  } catch (error) {
    if (error instanceof GraphQLError) {
      throw error;
    }
    throw new GraphQLError('Failed to fetch audit logs', {
      extensions: { code: 'INTERNAL_SERVER_ERROR' },
    });
  }
};

/**
 * Export audit logs for an event as JSON
 *
 * Access: Owner, Moderator, App Admin/Moderator
 * Requires PRO plan
 * Returns all logs (up to limit) in a format suitable for download
 */
export const exportEventAuditLogs: QueryResolvers['exportEventAuditLogs'] =
  async (
    _,
    { eventId, scope, action, from, to, limit = MAX_EXPORT_LIMIT },
    { prisma, user }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<any> => {
    const userId = user?.id;
    if (!userId) {
      throw new GraphQLError('Not authenticated', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    try {
      // Validate moderator/owner access
      await validateModeratorAccess(prisma, eventId, userId);

      // Check if event exists and get details
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: {
          id: true,
          title: true,
          sponsorshipPlan: true,
        },
      });

      if (!event) {
        throw new GraphQLError('Event not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Check PRO plan requirement
      if (event.sponsorshipPlan !== 'PRO') {
        throw new GraphQLError('Audit log export requires PRO plan', {
          extensions: { code: 'FORBIDDEN', requiredPlan: 'PRO' },
        });
      }

      // Enforce max limit
      const safeLimit = Math.min(
        Math.max(1, limit ?? MAX_EXPORT_LIMIT),
        MAX_EXPORT_LIMIT
      );

      // Build where clause
      const where: Prisma.EventAuditLogWhereInput = {
        eventId,
      };

      // Filter by scope(s)
      if (scope && scope.length > 0) {
        where.scope = { in: scope };
      }

      // Filter by action(s)
      if (action && action.length > 0) {
        where.action = { in: action };
      }

      // Filter by date range
      if (from || to) {
        where.createdAt = {};
        if (from) {
          where.createdAt.gte = new Date(from);
        }
        if (to) {
          where.createdAt.lte = new Date(to);
        }
      }

      // Fetch all logs for export
      const items = await prisma.eventAuditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: safeLimit,
        include: {
          actor: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // Format data for export
      const exportData = items.map((item) => ({
        id: item.id,
        createdAt: item.createdAt.toISOString(),
        scope: item.scope,
        action: item.action,
        entityType: item.entityType,
        entityId: item.entityId,
        actorId: item.actorId,
        actorName: item.actor?.name || null,
        actorRole: item.actorRole,
        severity: item.severity,
        diff: item.diff,
        meta: item.meta,
      }));

      return {
        count: items.length,
        eventId: event.id,
        eventTitle: event.title,
        exportedAt: new Date().toISOString(),
        data: JSON.stringify(exportData, null, 2),
      };
    } catch (error) {
      if (error instanceof GraphQLError) {
        throw error;
      }
      throw new GraphQLError('Failed to export audit logs', {
        extensions: { code: 'INTERNAL_SERVER_ERROR' },
      });
    }
  };
