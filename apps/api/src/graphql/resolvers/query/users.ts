import type { Prisma } from '@prisma/client';
import { prisma } from '../../../lib/prisma';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import type {
  Role as GQLRole,
  User as GQLUser,
  QueryResolvers,
} from '../../__generated__/resolvers-types';

function mapRole(r: Prisma.$UserPayload['scalars']['role']): GQLRole {
  return r as unknown as GQLRole;
}

export const usersQuery: QueryResolvers['users'] = resolverWithMetrics(
  'Query',
  'users',
  async (_p, { limit, offset }): Promise<GQLUser[]> => {
    const take = Math.max(1, Math.min(limit, 200));
    const skip = Math.max(0, offset);

    const list = await prisma.user.findMany({
      take,
      skip,
      orderBy: { createdAt: 'desc' },
    });

    return list.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      imageUrl: u.imageUrl,
      role: mapRole(u.role),
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
      verifiedAt: u.verifiedAt,
    }));
  }
);

export const userQuery: QueryResolvers['user'] = resolverWithMetrics(
  'Query',
  'user',
  async (_p, { id }): Promise<GQLUser | null> => {
    const u = await prisma.user.findUnique({ where: { id } });
    return u
      ? {
          id: u.id,
          email: u.email,
          name: u.name,
          imageUrl: u.imageUrl,
          role: mapRole(u.role),
          createdAt: u.createdAt,
          updatedAt: u.updatedAt,
          verifiedAt: u.verifiedAt,
        }
      : null;
  }
);
