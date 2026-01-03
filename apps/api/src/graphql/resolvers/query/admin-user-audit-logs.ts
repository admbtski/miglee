import type { QueryResolvers } from '../../__generated__/resolvers-types';
import { UserEffectivePlan, Role } from '../../__generated__/resolvers-types';
import type { MercuriusContext } from 'mercurius';
import { prisma } from '../../../lib/prisma';
import { requireAuthUser, requireAdmin } from '../shared/auth-guards';

/**
 * Query: Admin User Audit Logs
 * 
 * Returns audit trail for all administrative actions performed on a specific user.
 * Includes: role changes, verification updates, suspensions, deletions, etc.
 * 
 * ✅ Security: Admin-only
 * ✅ Observability: Tracked via resolverWithMetrics
 * ✅ Pagination: Supports limit/offset
 */
export const adminUserAuditLogsQuery: QueryResolvers['adminUserAuditLogs'] =
  async (_p, { userId, limit, offset }, ctx: MercuriusContext) => {
      const currentUser = requireAuthUser(ctx);
      requireAdmin(currentUser);

      // Validate pagination
      const safeLimit = Math.min(Math.max(1, limit ?? 50), 100);
      const safeOffset = Math.max(0, offset ?? 0);

      // Fetch audit logs
      const [items, total] = await Promise.all([
        prisma.userAuditLog.findMany({
          where: {
            targetUserId: userId,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: safeLimit,
          skip: safeOffset,
          include: {
            actor: true, // Include admin who performed the action
          },
        }),
        prisma.userAuditLog.count({
          where: {
            targetUserId: userId,
          },
        }),
      ]);

      return {
        items: items.map((log) => ({
          id: log.id,
          targetUserId: log.targetUserId,
          action: log.action as any, // Cast to GraphQL enum
          actorId: log.actorId,
          before: log.before as never,
          after: log.after as never,
          diff: log.diff as never,
          reason: log.reason,
          meta: log.meta as never,
          severity: log.severity,
          ipAddress: log.ipAddress,
          userAgent: log.userAgent,
          createdAt: log.createdAt,
          actor: log.actor
            ? {
                id: log.actor.id,
                name: log.actor.name,
                email: log.actor.email,
                avatarKey: log.actor.avatarKey,
                role: log.actor.role as Role,
                verifiedAt: log.actor.verifiedAt,
                suspendedAt: log.actor.suspendedAt,
                suspendedUntil: log.actor.suspendedUntil,
                suspendedById: log.actor.suspendedById,
                suspensionReason: log.actor.suspensionReason,
                deletedAt: log.actor.deletedAt,
                deletedById: log.actor.deletedById,
                deletedReason: log.actor.deletedReason,
                createdAt: log.actor.createdAt,
                updatedAt: log.actor.updatedAt,
                lastSeenAt: log.actor.lastSeenAt,
                locale: log.actor.locale,
                timezone: log.actor.timezone,
                acceptedTermsAt: log.actor.acceptedTermsAt,
                acceptedMarketingAt: log.actor.acceptedMarketingAt,
                // Field resolvers handle these
                avatarBlurhash: null,
                profile: null,
                privacy: null,
                stats: null,
                socialLinks: [],
                categoryLevels: [],
                availability: [],
                badges: [],
                effectivePlan: UserEffectivePlan.Free,
                planEndsAt: null,
                activeSubscription: null,
                activePlanPeriods: [],
              }
            : null,
        })),
        pageInfo: {
          total,
          hasNext: total > safeOffset + safeLimit,
          hasPrev: safeOffset > 0,
          limit: safeLimit,
          offset: safeOffset,
        },
      };
  };

