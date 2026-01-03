/**
 * Admin Users Query
 * 
 * Admin-only query for searching and filtering users with advanced options.
 * Supports filtering by role, verification status, deleted status, and suspension status.
 */

import type { Prisma } from '../../../prisma-client/client';
import { prisma } from '../../../lib/prisma';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import { requireAuthUser, requireAdmin } from '../shared/auth-guards';
import type {
  Role as GQLRole,
  User as GQLUser,
  QueryResolvers,
  UsersResult,
} from '../../__generated__/resolvers-types';

function mapRole(r: Prisma.$UserPayload['scalars']['role']): GQLRole {
  return r as unknown as GQLRole;
}

function mapUserToGQL(u: Record<string, unknown>): GQLUser {
  return {
    id: u.id as string,
    email: u.email as string,
    name: u.name as string,
    avatarKey: (u.avatarKey as string | null) ?? null,
    role: mapRole(u.role as Prisma.$UserPayload['scalars']['role']),
    createdAt: u.createdAt as Date,
    updatedAt: u.updatedAt as Date,
    suspendedAt: (u.suspendedAt as Date | null) ?? null,
    suspendedUntil: (u.suspendedUntil as Date | null) ?? null,
    suspendedById: (u.suspendedById as string | null) ?? null,
    suspensionReason: (u.suspensionReason as string | null) ?? null,
    deletedAt: (u.deletedAt as Date | null) ?? null,
    deletedById: (u.deletedById as string | null) ?? null,
    deletedReason: (u.deletedReason as string | null) ?? null,
    verifiedAt: (u.verifiedAt as Date | null) ?? null,
    lastSeenAt: (u.lastSeenAt as Date | null) ?? null,
    acceptedMarketingAt: (u.acceptedMarketingAt as Date | null) ?? null,
    acceptedTermsAt: (u.acceptedTermsAt as Date | null) ?? null,
    locale: u.locale as string,
    timezone: u.timezone as string,
    // Field resolvers handle these
    avatarBlurhash: null,
    profile: null,
    privacy: null,
    stats: null,
    socialLinks: [],
    categoryLevels: [],
    availability: [],
    badges: [],
    effectivePlan: 'FREE' as GQLUser['effectivePlan'],
    planEndsAt: null,
    activeSubscription: null,
    activePlanPeriods: [],
  };
}

/**
 * Query: Admin Users - Get list of users with admin-level filtering
 * Required level: ADMIN
 */
export const adminUsersQuery: QueryResolvers['adminUsers'] = resolverWithMetrics(
  'Query',
  'adminUsers',
  async (
    _p,
    {
      limit = 50,
      offset = 0,
      q,
      role,
      verifiedOnly,
      deletedOnly,
      suspendedOnly,
      sortBy = 'CREATED_AT',
      sortDir = 'DESC',
    },
    ctx
  ): Promise<UsersResult> => {
    // Require admin access
    const currentUser = requireAuthUser(ctx);
    requireAdmin(currentUser);

    // Sanitize pagination
    const take = Math.max(1, Math.min(limit, 200));
    const skip = Math.max(0, offset);

    // Build where clause with admin-level filters
    const whereConditions: Prisma.UserWhereInput[] = [];

    // Text search: name/email/displayName
    if (q) {
      whereConditions.push({
        OR: [
          { name: { contains: q, mode: 'insensitive' as const } },
          { email: { contains: q, mode: 'insensitive' as const } },
          {
            profile: {
              displayName: { contains: q, mode: 'insensitive' as const },
            },
          },
        ],
      });
    }

    // Filter by role
    if (role) {
      whereConditions.push({ role });
    }

    // Filter by verification status
    if (verifiedOnly) {
      whereConditions.push({ NOT: { verifiedAt: null } });
    }

    // Filter by deleted status
    if (deletedOnly) {
      whereConditions.push({ NOT: { deletedAt: null } });
    }

    // Filter by suspension status
    if (suspendedOnly) {
      whereConditions.push({ NOT: { suspendedAt: null } });
    }

    const where: Prisma.UserWhereInput = {
      AND: whereConditions.length > 0 ? whereConditions : [{}],
    };

    // Order by mapping
    const dir = sortDir.toLowerCase() as 'asc' | 'desc';
    const orderBy: Prisma.UserOrderByWithRelationInput =
      sortBy === 'NAME'
        ? { name: dir }
        : sortBy === 'ROLE'
          ? { role: dir }
          : sortBy === 'VERIFIED_AT'
            ? { verifiedAt: dir }
            : { createdAt: dir }; // default CREATED_AT

    // Total count for pagination
    const total = await prisma.user.count({ where });

    // Fetch users
    const list = await prisma.user.findMany({
      where,
      orderBy,
      take,
      skip,
    });

    const pageInfo = {
      total,
      limit: take,
      offset: skip,
      hasPrev: skip > 0,
      hasNext: skip + take < total,
    };

    return {
      items: list.map(mapUserToGQL),
      pageInfo,
    };
  }
);

