import type { Prisma } from '@prisma/client';
import { IntentMemberRole, IntentMemberStatus } from '@prisma/client';
import { GraphQLError } from 'graphql';
import type { MercuriusContext } from 'mercurius';
import { prisma } from '../../../lib/prisma';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import type {
  IntentMember as GQLIntentMember,
  QueryResolvers,
} from '../../__generated__/resolvers-types';
import { IntentMemberWithUsers, mapUser } from '../helpers';

export function mapIntentMember(m: IntentMemberWithUsers): GQLIntentMember {
  return {
    id: m.id,
    intentId: m.intentId,
    userId: m.userId,
    role: m.role as any,
    status: m.status as any,
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

/** ──────────────────────────────────────────────────────────────────────────
 *  Auth helpers
 *  ───────────────────────────────────────────────────────────────────────── */
async function authUser(ctx: MercuriusContext) {
  if (!ctx.user?.id) {
    throw new GraphQLError('Authentication required.', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
  return ctx.user.id;
}

async function resolveViewerRole(intentId: string, viewerId?: string) {
  if (!viewerId) return null;
  const me = await prisma.intentMember.findUnique({
    where: { intentId_userId: { intentId, userId: viewerId } },
    select: { role: true, status: true },
  });
  if (!me) return null;
  if (me.status !== IntentMemberStatus.JOINED) return null;
  return me.role as IntentMemberRole;
}

/**
 * Dla użytkowników nie-będących OWNER/MODERATOR — ogranicz widoczność tylko do JOINED.
 * Opcjonalnie uwzględnia żądany status (dla modów).
 */
function restrictForNonMods(
  viewerRole: IntentMemberRole | null,
  desiredStatus?: IntentMemberStatus | null
): Prisma.IntentMemberWhereInput {
  if (
    viewerRole === IntentMemberRole.OWNER ||
    viewerRole === IntentMemberRole.MODERATOR
  ) {
    return desiredStatus ? { status: desiredStatus } : {};
  }
  return { status: IntentMemberStatus.JOINED };
}

/** Przyda się gdybyś kiedyś chciał filtrować bany z list (na razie nie używamy). */
function excludeBannedUnlessMod(
  viewerRole: IntentMemberRole | null
): Prisma.IntentMemberWhereInput {
  if (
    viewerRole === IntentMemberRole.OWNER ||
    viewerRole === IntentMemberRole.MODERATOR
  ) {
    return {};
  }
  return { NOT: { status: IntentMemberStatus.BANNED } };
}

/** ──────────────────────────────────────────────────────────────────────────
 *  Queries
 *  ───────────────────────────────────────────────────────────────────────── */
export const intentMembersQuery: QueryResolvers['intentMembers'] =
  resolverWithMetrics(
    'Query',
    'intentMembers',
    async (_p, { intentId, status, role, limit, offset }, { user }) => {
      const take = Math.max(1, Math.min(limit ?? 50, 200));
      const skip = Math.max(0, offset ?? 0);

      const viewerRole = await resolveViewerRole(intentId, user?.id);
      const statusFilter = restrictForNonMods(viewerRole, status ?? null);
      const bannedFilter = excludeBannedUnlessMod(viewerRole);

      const where: Prisma.IntentMemberWhereInput = {
        intentId,
        ...(role ? { role } : {}),
        ...statusFilter,
        ...bannedFilter,
      };

      const list = await prisma.intentMember.findMany({
        where,
        take,
        skip,
        orderBy: [
          { role: 'asc' },
          { status: 'asc' },
          { joinedAt: 'asc' },
          { createdAt: 'asc' },
        ],
        include: MEMBER_INCLUDE,
      });

      return list.map(mapIntentMember);
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

      // non-mods can only see JOINED members
      if (
        !(
          viewerRole === IntentMemberRole.OWNER ||
          viewerRole === IntentMemberRole.MODERATOR
        )
      ) {
        if (row.status !== IntentMemberStatus.JOINED) return null;
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
        ...(status ? { status } : {}),
        ...(role ? { role } : {}),
      };

      const list = await prisma.intentMember.findMany({
        where,
        take,
        skip,
        orderBy: [{ createdAt: 'desc' }],
        include: MEMBER_INCLUDE,
      });

      return list.map(mapIntentMember);
    }
  );

export const intentMemberStatsQuery: QueryResolvers['intentMemberStats'] =
  resolverWithMetrics(
    'Query',
    'intentMemberStats',
    async (_p, { intentId }, { user }) => {
      const viewerRole = await resolveViewerRole(intentId, user?.id);

      // OWNER/MODERATOR: pełne zliczenia
      if (
        viewerRole === IntentMemberRole.OWNER ||
        viewerRole === IntentMemberRole.MODERATOR
      ) {
        const byStatus = await prisma.intentMember.groupBy({
          by: ['status'],
          where: { intentId },
          _count: true,
        });

        const reduce = (s: IntentMemberStatus) =>
          byStatus.find((r) => r.status === s)?._count ?? 0;

        return {
          joined: reduce(IntentMemberStatus.JOINED),
          pending: reduce(IntentMemberStatus.PENDING),
          invited: reduce(IntentMemberStatus.INVITED),
          rejected: reduce(IntentMemberStatus.REJECTED),
          banned: reduce(IntentMemberStatus.BANNED),
          left: reduce(IntentMemberStatus.LEFT),
          kicked: reduce(IntentMemberStatus.KICKED),
        };
      }

      // inni: eksponuj tylko JOINED
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
