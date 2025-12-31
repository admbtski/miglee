/**
 * Agenda Query Resolvers
 *
 * Authorization: ANY (agenda is visible to anyone who can see the event)
 */

import type {
  QueryResolvers,
  EventAgendaItem,
  EventAgendaItemHost,
  AgendaHostKind,
  User as GQLUser,
  Role,
  UserEffectivePlan,
} from '../../__generated__/resolvers-types';
import { prisma } from '../../../lib/prisma';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import type { User as PrismaUser } from '../../../prisma-client/client';

/**
 * Map Prisma User to GraphQL User type for agenda host
 */
function mapAgendaHostUser(user: PrismaUser | null): GQLUser | null {
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarKey: user.avatarKey,
    role: user.role as Role,
    verifiedAt: user.verifiedAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    lastSeenAt: user.lastSeenAt,
    suspendedAt: user.suspendedAt,
    suspensionReason: user.suspensionReason,
    locale: user.locale,
    timezone: user.timezone,
    acceptedTermsAt: user.acceptedTermsAt,
    acceptedMarketingAt: user.acceptedMarketingAt,
    // Field resolvers will handle these
    avatarBlurhash: null,
    profile: null,
    privacy: null,
    stats: null,
    socialLinks: [],
    categoryLevels: [],
    availability: [],
    badges: [],
    effectivePlan: 'FREE' as UserEffectivePlan,
    planEndsAt: null,
    activeSubscription: null,
    activePlanPeriods: [],
  };
}

/**
 * Get agenda items for an event
 * Authorization: ANY (public)
 */
export const eventAgendaItemsQuery: QueryResolvers['eventAgendaItems'] =
  resolverWithMetrics(
    'Query',
    'eventAgendaItems',
    async (_parent, { eventId }): Promise<EventAgendaItem[]> => {
      const items = await prisma.eventAgendaItem.findMany({
        where: { eventId },
        include: {
          hosts: {
            include: { user: true },
            orderBy: { order: 'asc' },
          },
        },
        orderBy: [
          { startAt: { sort: 'asc', nulls: 'last' } },
          { order: 'asc' },
        ],
      });

      return items.map((item) => ({
        id: item.id,
        eventId: item.eventId,
        order: item.order,
        title: item.title,
        description: item.description,
        startAt: item.startAt,
        endAt: item.endAt,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        hosts: item.hosts.map(
          (host): EventAgendaItemHost => ({
            id: host.id,
            agendaItemId: host.agendaItemId,
            order: host.order,
            kind: host.kind as AgendaHostKind,
            userId: host.userId,
            user: mapAgendaHostUser(host.user),
            name: host.name,
            avatarUrl: host.avatarUrl,
            createdAt: host.createdAt,
            updatedAt: host.updatedAt,
          })
        ),
      }));
    }
  );
