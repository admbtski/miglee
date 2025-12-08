import type { Prisma } from '@prisma/client';
import { EventMemberRole, EventMemberStatus } from '@prisma/client';
import { GraphQLError } from 'graphql';
import type { MercuriusContext } from 'mercurius';
import { prisma } from '../../../lib/prisma';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import type {
  EventMember as GQLEventMember,
  EventMemberRole as GqlEventMemberRole,
  EventMemberStatus as GqlEventMemberStatus,
  QueryResolvers,
} from '../../__generated__/resolvers-types';
import type { EventMemberWithUsers } from '../helpers';
import { mapUser } from '../helpers';

/* ────────────────────────────────────────────────────────────────────────────
 * Mapping
 * ────────────────────────────────────────────────────────────────────────── */

function mapEventMember(m: EventMemberWithUsers): GQLEventMember {
  return {
    id: m.id,
    eventId: m.eventId,
    userId: m.userId,
    role: m.role as unknown as GqlEventMemberRole,
    status: m.status as unknown as GqlEventMemberStatus,
    joinedAt: m.joinedAt ?? null,
    leftAt: m.leftAt ?? null,
    note: m.note ?? null,
    rejectReason: m.rejectReason ?? null,
    user: mapUser(m.user),
    addedBy: m.addedBy ? mapUser(m.addedBy) : null,
    // event and joinAnswers will be resolved by field resolvers
    event: null as any,
    joinAnswers: [],
  };
}

const MEMBER_INCLUDE = {
  user: { include: { profile: true } },
  addedBy: { include: { profile: true } },
} satisfies Prisma.EventMemberInclude;

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

function isMod(role: EventMemberRole | null): boolean {
  return role === EventMemberRole.OWNER || role === EventMemberRole.MODERATOR;
}

/**
 * Zwraca rolę widza (jeśli JOINED) dla danego eventu albo null.
 */
async function resolveViewerRole(
  eventId: string,
  viewerId?: string
): Promise<EventMemberRole | null> {
  if (!viewerId) return null;

  const me = await prisma.eventMember.findUnique({
    where: { eventId_userId: { eventId, userId: viewerId } },
    select: { role: true, status: true },
  });

  if (!me) return null;
  if (me.status !== EventMemberStatus.JOINED) return null;
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
  eventId: string,
  viewerRole: EventMemberRole | null,
  opts: {
    desiredStatus?: EventMemberStatus | null;
    desiredRole?: EventMemberRole | null;
  }
): Prisma.EventMemberWhereInput {
  const base: Prisma.EventMemberWhereInput = { eventId };

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
    status: EventMemberStatus.JOINED,
  };
}

/**
 * Spójny porządek: rola ↑, status ↑, joinedAt ↑, createdAt ↑
 * (wspiera paginację offsetową i przewidywalny UI)
 */
function buildMemberOrder(): Prisma.EventMemberOrderByWithRelationInput[] {
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

export const eventMembersQuery: QueryResolvers['eventMembers'] =
  resolverWithMetrics(
    'Query',
    'eventMembers',
    async (_p, { eventId, status, role, limit, offset }, { user }) => {
      const take = Math.max(1, Math.min(limit ?? 50, 200));
      const skip = Math.max(0, offset ?? 0);

      const viewerRole = await resolveViewerRole(eventId, user?.id);

      const where = buildMemberWhere(eventId, viewerRole, {
        desiredStatus: (status as unknown as EventMemberStatus | null) ?? null,
        desiredRole: (role as unknown as EventMemberRole | null) ?? null,
      });

      const list = await prisma.eventMember.findMany({
        where,
        take,
        skip,
        orderBy: buildMemberOrder(),
        include: MEMBER_INCLUDE,
      });

      return list.map((m) => mapEventMember(m as EventMemberWithUsers));
    }
  );

export const eventMemberQuery: QueryResolvers['eventMember'] =
  resolverWithMetrics(
    'Query',
    'eventMember',
    async (_p, { eventId, userId }, ctx) => {
      const viewerRole = await resolveViewerRole(eventId, ctx.user?.id);

      const row = await prisma.eventMember.findUnique({
        where: { eventId_userId: { eventId, userId } },
        include: MEMBER_INCLUDE,
      });

      if (!row) return null;

      // Nie-modowie widzą tylko JOINED
      if (!isMod(viewerRole) && row.status !== EventMemberStatus.JOINED) {
        return null;
      }

      return mapEventMember(row as EventMemberWithUsers);
    }
  );

/**
 * Get current user's membership for a specific event.
 * Unlike eventMember, this doesn't require userId parameter - uses authenticated user.
 * Returns null if user is not authenticated or has no membership.
 */
export const myMembershipForEventQuery: QueryResolvers['myMembershipForEvent'] =
  resolverWithMetrics(
    'Query',
    'myMembershipForEvent',
    async (_p, { eventId }, ctx) => {
      // Return null if not authenticated
      if (!ctx.user?.id) {
        return null;
      }

      const row = await prisma.eventMember.findUnique({
        where: { eventId_userId: { eventId, userId: ctx.user.id } },
        include: MEMBER_INCLUDE,
      });

      if (!row) return null;

      return mapEventMember(row as EventMemberWithUsers);
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

      const where: Prisma.EventMemberWhereInput = {
        userId: me,
        ...(status ? { status: status as unknown as EventMemberStatus } : {}),
        ...(role ? { role: role as unknown as EventMemberRole } : {}),
      };

      const list = await prisma.eventMember.findMany({
        where,
        take,
        skip,
        orderBy: [{ createdAt: 'desc' }],
        include: MEMBER_INCLUDE,
      });

      return list.map((m) => mapEventMember(m as EventMemberWithUsers));
    }
  );

export const myEventsQuery: QueryResolvers['myEvents'] = resolverWithMetrics(
  'Query',
  'myEvents',
  async (_p, { role, membershipStatus, eventStatuses, limit, offset }, ctx) => {
    const me = await authUser(ctx);

    const take = Math.max(1, Math.min(limit ?? 50, 200));
    const skip = Math.max(0, offset ?? 0);

    // Build membership filters
    const memberWhere: Prisma.EventMemberWhereInput = {
      userId: me,
      ...(membershipStatus
        ? { status: membershipStatus as unknown as EventMemberStatus }
        : {}),
      ...(role ? { role: role as unknown as EventMemberRole } : {}),
    };

    // Build event lifecycle status filters
    const eventWhere: Prisma.EventWhereInput = {};

    if (eventStatuses && eventStatuses.length > 0) {
      const now = new Date();
      const conditions: Prisma.EventWhereInput[] = [];

      for (const status of eventStatuses) {
        switch (status) {
          case 'DELETED':
            conditions.push({ deletedAt: { not: null } });
            break;
          case 'CANCELED':
            conditions.push({
              deletedAt: { equals: null },
              canceledAt: { not: null },
            });
            break;
          case 'FINISHED':
            conditions.push({
              deletedAt: { equals: null },
              canceledAt: { equals: null },
              endAt: { lte: now },
            });
            break;
          case 'ONGOING':
            // Ongoing: started but not ended (endAt is null OR endAt > now)
            conditions.push({
              deletedAt: { equals: null },
              canceledAt: { equals: null },
              startAt: { lte: now },
              NOT: {
                endAt: { lte: now },
              },
            });
            break;
          case 'UPCOMING':
            conditions.push({
              deletedAt: { equals: null },
              canceledAt: { equals: null },
              startAt: { gt: now },
            });
            break;
        }
      }

      if (conditions.length > 0) {
        eventWhere.OR = conditions;
      }
    }

    // Combine filters
    const where: Prisma.EventMemberWhereInput = {
      ...memberWhere,
      ...(Object.keys(eventWhere).length > 0 ? { event: eventWhere } : {}),
    };

    const list = await prisma.eventMember.findMany({
      where,
      take,
      skip,
      orderBy: [{ createdAt: 'desc' }],
      include: {
        ...MEMBER_INCLUDE,
        event: true, // Include full event data
      },
    });

    return list.map((m) => mapEventMember(m as EventMemberWithUsers));
  }
);

export const eventMemberStatsQuery: QueryResolvers['eventMemberStats'] =
  resolverWithMetrics(
    'Query',
    'eventMemberStats',
    async (_p, { eventId }, { user }) => {
      const viewerRole = await resolveViewerRole(eventId, user?.id);

      if (isMod(viewerRole)) {
        const byStatus = await prisma.eventMember.groupBy({
          by: ['status'],
          where: { eventId },
          _count: true,
        });

        const get = (s: EventMemberStatus) =>
          byStatus.find((r) => r.status === s)?._count ?? 0;

        return {
          joined: get(EventMemberStatus.JOINED),
          pending: get(EventMemberStatus.PENDING),
          invited: get(EventMemberStatus.INVITED),
          rejected: get(EventMemberStatus.REJECTED),
          banned: get(EventMemberStatus.BANNED),
          left: get(EventMemberStatus.LEFT),
          kicked: get(EventMemberStatus.KICKED),
        };
      }

      // Nie-modowie: tylko JOINED
      const joined = await prisma.eventMember.count({
        where: { eventId, status: EventMemberStatus.JOINED },
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
