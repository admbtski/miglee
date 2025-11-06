import type { Prisma } from '@prisma/client';
import { IntentMemberRole, IntentMemberStatus } from '@prisma/client';
import { GraphQLError } from 'graphql';
import type { MercuriusContext } from 'mercurius';
import { prisma } from '../../../lib/prisma';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import type {
  IntentMember as GQLIntentMember,
  IntentMemberRole as GqlIntentMemberRole,
  IntentMemberStatus as GqlIntentMemberStatus,
  QueryResolvers,
} from '../../__generated__/resolvers-types';
import type { IntentMemberWithUsers } from '../helpers';
import { mapUser } from '../helpers';

/* ────────────────────────────────────────────────────────────────────────────
 * Mapping
 * ────────────────────────────────────────────────────────────────────────── */

function mapIntentMember(m: IntentMemberWithUsers): GQLIntentMember {
  return {
    id: m.id,
    intentId: m.intentId,
    userId: m.userId,
    role: m.role as unknown as GqlIntentMemberRole,
    status: m.status as unknown as GqlIntentMemberStatus,
    joinedAt: m.joinedAt ?? null,
    leftAt: m.leftAt ?? null,
    note: m.note ?? null,
    user: mapUser(m.user),
    addedBy: m.addedBy ? mapUser(m.addedBy) : null,
  };
}

const MEMBER_INCLUDE = {
  user: true,
  addedBy: true,
} satisfies Prisma.IntentMemberInclude;

/* ────────────────────────────────────────────────────────────────────────────
 * Auth & role helpers
 * ────────────────────────────────────────────────────────────────────────── */

async function authUser(ctx: MercuriusContext) {
  if (!ctx.user?.id) {
    throw new GraphQLError('Authentication required.', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
  return ctx.user.id;
}

function isMod(role: IntentMemberRole | null): boolean {
  return role === IntentMemberRole.OWNER || role === IntentMemberRole.MODERATOR;
}

/**
 * Zwraca rolę widza (jeśli JOINED) dla danego intentu albo null.
 */
async function resolveViewerRole(
  intentId: string,
  viewerId?: string
): Promise<IntentMemberRole | null> {
  if (!viewerId) return null;

  const me = await prisma.intentMember.findUnique({
    where: { intentId_userId: { intentId, userId: viewerId } },
    select: { role: true, status: true },
  });

  if (!me) return null;
  if (me.status !== IntentMemberStatus.JOINED) return null;
  return me.role;
}

/* ────────────────────────────────────────────────────────────────────────────
 * Filters & ordering
 * ────────────────────────────────────────────────────────────────────────── */

/**
 * Jeśli nie-moderator: widzi wyłącznie JOINED (i ukrywa BANNED).
 * Jeśli moderator/owner: może filtrować dowolnym statusem/rolą.
 */
function buildMemberWhere(
  intentId: string,
  viewerRole: IntentMemberRole | null,
  opts: {
    desiredStatus?: IntentMemberStatus | null;
    desiredRole?: IntentMemberRole | null;
  }
): Prisma.IntentMemberWhereInput {
  const base: Prisma.IntentMemberWhereInput = { intentId };

  // Filtr roli (jeśli podany)
  if (opts.desiredRole) {
    base.role = opts.desiredRole;
  }

  if (isMod(viewerRole)) {
    // Mod/Owner: pełny zakres, ewentualnie status na żądanie
    if (opts.desiredStatus) {
      base.status = opts.desiredStatus;
    }
    return base;
  }

  // Nie-mod: pokazuj tylko JOINED (i z definicji nie pokazuj BANNED)
  return {
    ...base,
    status: IntentMemberStatus.JOINED,
  };
}

/**
 * Spójny porządek: rola ↑, status ↑, joinedAt ↑, createdAt ↑
 * (wspiera paginację offsetową i przewidywalny UI)
 */
function buildMemberOrder(): Prisma.IntentMemberOrderByWithRelationInput[] {
  return [
    { role: 'asc' },
    { status: 'asc' },
    { joinedAt: 'asc' },
    { createdAt: 'asc' },
  ];
}

/* ────────────────────────────────────────────────────────────────────────────
 * Queries
 * ────────────────────────────────────────────────────────────────────────── */

export const intentMembersQuery: QueryResolvers['intentMembers'] =
  resolverWithMetrics(
    'Query',
    'intentMembers',
    async (_p, { intentId, status, role, limit, offset }, { user }) => {
      const take = Math.max(1, Math.min(limit ?? 50, 200));
      const skip = Math.max(0, offset ?? 0);

      const viewerRole = await resolveViewerRole(intentId, user?.id);

      const where = buildMemberWhere(intentId, viewerRole, {
        desiredStatus: (status as unknown as IntentMemberStatus | null) ?? null,
        desiredRole: (role as unknown as IntentMemberRole | null) ?? null,
      });

      const list = await prisma.intentMember.findMany({
        where,
        take,
        skip,
        orderBy: buildMemberOrder(),
        include: MEMBER_INCLUDE,
      });

      return list.map((m) => mapIntentMember(m as IntentMemberWithUsers));
    }
  );

export const intentMemberQuery: QueryResolvers['intentMember'] =
  resolverWithMetrics(
    'Query',
    'intentMember',
    async (_p, { intentId, userId }, ctx) => {
      const viewerRole = await resolveViewerRole(intentId, ctx.user?.id);

      const row = await prisma.intentMember.findUnique({
        where: { intentId_userId: { intentId, userId } },
        include: MEMBER_INCLUDE,
      });

      if (!row) return null;

      // Nie-modowie widzą tylko JOINED
      if (!isMod(viewerRole) && row.status !== IntentMemberStatus.JOINED) {
        return null;
      }

      return mapIntentMember(row as IntentMemberWithUsers);
    }
  );

export const myMembershipsQuery: QueryResolvers['myMemberships'] =
  resolverWithMetrics(
    'Query',
    'myMemberships',
    async (_p, { status, role, limit, offset }, ctx) => {
      const me = await authUser(ctx);

      const take = Math.max(1, Math.min(limit ?? 50, 200));
      const skip = Math.max(0, offset ?? 0);

      const where: Prisma.IntentMemberWhereInput = {
        userId: me,
        ...(status ? { status: status as unknown as IntentMemberStatus } : {}),
        ...(role ? { role: role as unknown as IntentMemberRole } : {}),
      };

      const list = await prisma.intentMember.findMany({
        where,
        take,
        skip,
        orderBy: [{ createdAt: 'desc' }],
        include: MEMBER_INCLUDE,
      });

      return list.map((m) => mapIntentMember(m as IntentMemberWithUsers));
    }
  );

export const intentMemberStatsQuery: QueryResolvers['intentMemberStats'] =
  resolverWithMetrics(
    'Query',
    'intentMemberStats',
    async (_p, { intentId }, { user }) => {
      const viewerRole = await resolveViewerRole(intentId, user?.id);

      if (isMod(viewerRole)) {
        const byStatus = await prisma.intentMember.groupBy({
          by: ['status'],
          where: { intentId },
          _count: true,
        });

        const get = (s: IntentMemberStatus) =>
          byStatus.find((r) => r.status === s)?._count ?? 0;

        return {
          joined: get(IntentMemberStatus.JOINED),
          pending: get(IntentMemberStatus.PENDING),
          invited: get(IntentMemberStatus.INVITED),
          rejected: get(IntentMemberStatus.REJECTED),
          banned: get(IntentMemberStatus.BANNED),
          left: get(IntentMemberStatus.LEFT),
          kicked: get(IntentMemberStatus.KICKED),
        };
      }

      // Nie-modowie: tylko JOINED
      const joined = await prisma.intentMember.count({
        where: { intentId, status: IntentMemberStatus.JOINED },
      });

      return {
        joined,
        pending: 0,
        invited: 0,
        rejected: 0,
        banned: 0,
        left: 0,
        kicked: 0,
      };
    }
  );
