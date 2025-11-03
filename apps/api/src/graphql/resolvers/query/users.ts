// api/graphql/resolvers/query/users.ts
import type { Prisma } from '@prisma/client';
import { prisma } from '../../../lib/prisma';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import type {
  Role as GQLRole,
  User as GQLUser,
  QueryResolvers,
  UsersResult,
} from '../../__generated__/resolvers-types';

function mapRole(r: Prisma.$UserPayload['scalars']['role']): GQLRole {
  return r as unknown as GQLRole;
}

function mapUser(u: Prisma.UserGetPayload<{}>): GQLUser {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    imageUrl: u.imageUrl,
    role: mapRole(u.role),
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
    verifiedAt: u.verifiedAt,
    lastSeenAt: u.lastSeenAt,
    acceptedMarketingAt: u.acceptedMarketingAt,
    acceptedTermsAt: u.acceptedTermsAt,
    locale: u.locale,
    tz: u.tz,
  };
}

export const usersQuery: QueryResolvers['users'] = resolverWithMetrics(
  'Query',
  'users',
  async (
    _p,
    {
      limit = 50,
      offset = 0,
      q,
      role,
      verifiedOnly,
      sortBy = 'CREATED_AT',
      sortDir = 'DESC',
    }
  ): Promise<UsersResult> => {
    // sanitize pagination
    const take = Math.max(1, Math.min(limit, 200));
    const skip = Math.max(0, offset);

    // where: name/email ilike, role, verifiedAt presence
    const where: Prisma.UserWhereInput = {
      AND: [
        q
          ? {
              OR: [
                { name: { contains: q, mode: 'insensitive' as const } },
                { email: { contains: q, mode: 'insensitive' as const } },
              ],
            }
          : {},
        role ? { role: role } : {},
        verifiedOnly ? { NOT: { verifiedAt: {} } } : {},
      ],
    };

    // orderBy mapping
    const dir = sortDir.toLowerCase() as 'asc' | 'desc';
    const orderBy: Prisma.UserOrderByWithRelationInput =
      sortBy === 'NAME'
        ? { name: dir }
        : sortBy === 'ROLE'
          ? { role: dir }
          : sortBy === 'VERIFIED_AT'
            ? { verifiedAt: dir }
            : { createdAt: dir }; // default CREATED_AT

    // total count for proper pagination
    const total = await prisma.user.count({ where });

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
      items: list.map(mapUser),
      pageInfo,
    };
  }
);

export const userQuery: QueryResolvers['user'] = resolverWithMetrics(
  'Query',
  'user',
  async (_p, { id }): Promise<GQLUser | null> => {
    const u = await prisma.user.findUnique({ where: { id } });
    return u ? mapUser(u) : null;
  }
);
