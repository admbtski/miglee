// api/graphql/resolvers/query/users.ts
import type { Prisma } from '../../../prisma-client/client';
import { GraphQLError } from 'graphql';
import { logger } from '../../../lib/pino';
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
    suspensionReason: (u.suspensionReason as string | null) ?? null,
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
 * Query: Get list of users
 * Required level: AUTH (listing restricted by privacy)
 */
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
    },
    { user }
  ): Promise<UsersResult> => {
    // AUTH required
    if (!user?.id) {
      throw new GraphQLError('Authentication required.', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    // sanitize pagination
    const take = Math.max(1, Math.min(limit, 200));
    const skip = Math.max(0, offset);

    // where: name/email/displayName ilike, role, verifiedAt presence
    const where: Prisma.UserWhereInput = {
      AND: [
        q
          ? {
              OR: [
                { name: { contains: q, mode: 'insensitive' as const } },
                { email: { contains: q, mode: 'insensitive' as const } },
                {
                  profile: {
                    displayName: { contains: q, mode: 'insensitive' as const },
                  },
                },
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
      items: list.map(mapUserToGQL),
      pageInfo,
    };
  }
);

export const userQuery: QueryResolvers['user'] = resolverWithMetrics(
  'Query',
  'user',
  async (_p, args): Promise<GQLUser | null> => {
    const id = args.id;
    // name might be in args if the schema supports it
    const name = 'name' in args ? (args.name as string | undefined) : undefined;

    // Must provide at least one of id or name
    if (!id && !name) {
      return null;
    }

    // Build where clause based on provided parameters
    const where: Prisma.UserWhereUniqueInput = id ? { id } : { name: name! };

    const u = await prisma.user.findUnique({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        avatarKey: true,
        role: true,
        verifiedAt: true,
        createdAt: true,
        updatedAt: true,
        lastSeenAt: true,
        suspendedAt: true,
        suspensionReason: true,
        locale: true,
        timezone: true,
        acceptedTermsAt: true,
        acceptedMarketingAt: true,
      },
    });

    logger.debug(
      { id: u?.id, avatarKey: u?.avatarKey },
      'userQuery found user'
    );

    const mapped = u ? mapUserToGQL(u) : null;
    logger.debug(
      { id: mapped?.id, avatarKey: mapped?.avatarKey },
      'userQuery mapped user'
    );

    return mapped;
  }
);
