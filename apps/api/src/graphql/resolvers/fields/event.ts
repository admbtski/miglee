/**
 * Event Field Resolvers
 *
 * These resolvers handle lazy-loaded fields on the Event type that are not
 * included in the base query to avoid N+1 problems or circular references.
 */

import { prisma } from '../../../lib/prisma';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import type {
  EventResolvers,
  EventPlan,
  SponsorshipStatus,
  EventSponsorship,
  EventInviteLink,
  EventFaq,
  EventJoinQuestion,
  EventAppearance,
  EventAgendaItem,
  EventAgendaItemHost,
  AgendaHostKind,
  Role,
  UserEffectivePlan,
  JoinQuestionType,
} from '../../__generated__/resolvers-types';
import { mapUser } from '../helpers';

/**
 * Field resolver for Event.sponsorshipPlan
 */
export const eventSponsorshipPlanResolver: EventResolvers['sponsorshipPlan'] =
  resolverWithMetrics('Event', 'sponsorshipPlan', async (parent) => {
    if ('sponsorshipPlan' in parent && parent.sponsorshipPlan !== undefined) {
      return parent.sponsorshipPlan;
    }

    const sponsorship = await prisma.eventSponsorship.findUnique({
      where: { eventId: parent.id },
    });

    if (!sponsorship || sponsorship.status !== 'ACTIVE') {
      return 'FREE' as EventPlan;
    }

    return sponsorship.plan as EventPlan;
  });

/**
 * Field resolver for Event.sponsorship
 */
export const eventSponsorshipResolver: EventResolvers['sponsorship'] =
  resolverWithMetrics(
    'Event',
    'sponsorship',
    async (parent): Promise<EventSponsorship | null> => {
      const sponsorship = await prisma.eventSponsorship.findUnique({
        where: { eventId: parent.id },
        include: { sponsor: true },
      });

      if (!sponsorship) return null;

      return {
        id: sponsorship.id,
        eventId: sponsorship.eventId,
        sponsorId: sponsorship.sponsorId,
        plan: sponsorship.plan as EventPlan,
        status: sponsorship.status as SponsorshipStatus,
        startsAt: sponsorship.startsAt ?? null,
        endsAt: sponsorship.endsAt ?? null,
        boostsTotal: sponsorship.boostsTotal,
        boostsUsed: sponsorship.boostsUsed,
        localPushesTotal: sponsorship.localPushesTotal,
        localPushesUsed: sponsorship.localPushesUsed,
        stripePaymentEventId: sponsorship.stripePaymentEventId ?? null,
        stripeCheckoutSessionId: sponsorship.stripeCheckoutSessionId ?? null,
        createdAt: sponsorship.createdAt,
        updatedAt: sponsorship.updatedAt,
        event: parent,
        sponsor: mapUser(sponsorship.sponsor),
      };
    }
  );

/**
 * Field resolver for Event.inviteLinks
 */
export const eventInviteLinksResolver: EventResolvers['inviteLinks'] =
  resolverWithMetrics(
    'Event',
    'inviteLinks',
    async (parent, _args, { user }): Promise<EventInviteLink[]> => {
      const membership = user?.id
        ? await prisma.eventMember.findUnique({
            where: {
              eventId_userId: {
                eventId: parent.id,
                userId: user.id,
              },
            },
          })
        : null;

      const isOwnerOrMod =
        membership &&
        (membership.role === 'OWNER' || membership.role === 'MODERATOR') &&
        membership.status === 'JOINED';

      if (!isOwnerOrMod) return [];

      const links = await prisma.eventInviteLink.findMany({
        where: { eventId: parent.id },
        include: { createdBy: true, revokedBy: true },
        orderBy: { createdAt: 'desc' },
      });

      const now = new Date();

      return links.map((link): EventInviteLink => {
        const isExpired = link.expiresAt ? link.expiresAt < now : false;
        const isMaxedOut = link.maxUses
          ? link.usedCount >= link.maxUses
          : false;
        const isRevoked = !!link.revokedAt;
        const isValid = !isExpired && !isMaxedOut && !isRevoked;

        return {
          id: link.id,
          eventId: link.eventId,
          code: link.code,
          maxUses: link.maxUses ?? null,
          usedCount: link.usedCount,
          expiresAt: link.expiresAt ?? null,
          createdAt: link.createdAt,
          updatedAt: link.updatedAt ?? null,
          createdById: link.createdById ?? null,
          createdBy: link.createdBy ? mapUser(link.createdBy) : null,
          label: link.label ?? null,
          revokedAt: link.revokedAt ?? null,
          revokedById: link.revokedById ?? null,
          revokedBy: link.revokedBy ? mapUser(link.revokedBy) : null,
          event: parent,
          isExpired,
          isMaxedOut,
          isRevoked,
          isValid,
          uses: [],
        };
      });
    }
  );

/**
 * Field resolver for Event.isFavourite
 */
export const eventIsFavouriteResolver: EventResolvers['isFavourite'] =
  resolverWithMetrics(
    'Event',
    'isFavourite',
    async (parent, _args, { user }) => {
      if (!user?.id) return false;

      const favourite = await prisma.eventFavourite.findUnique({
        where: {
          userId_eventId: {
            userId: user.id,
            eventId: parent.id,
          },
        },
      });

      return !!favourite;
    }
  );

/**
 * Field resolver for Event.coverBlurhash
 */
export const eventCoverBlurhashResolver: EventResolvers['coverBlurhash'] =
  resolverWithMetrics('Event', 'coverBlurhash', async (parent) => {
    if ('coverBlurhash' in parent && parent.coverBlurhash !== undefined) {
      return parent.coverBlurhash;
    }

    if (!parent.coverKey) return null;

    const mediaAsset = await prisma.mediaAsset.findUnique({
      where: { key: parent.coverKey },
      select: { blurhash: true },
    });

    return mediaAsset?.blurhash ?? null;
  });

/**
 * Field resolver for Event.faqs
 */
export const eventFaqsResolver: EventResolvers['faqs'] = resolverWithMetrics(
  'Event',
  'faqs',
  async (parent): Promise<EventFaq[]> => {
    const faqs = await prisma.eventFaq.findMany({
      where: { eventId: parent.id },
      orderBy: { order: 'asc' },
    });

    return faqs.map(
      (faq): EventFaq => ({
        id: faq.id,
        eventId: faq.eventId,
        order: faq.order,
        question: faq.question,
        answer: faq.answer,
        createdAt: faq.createdAt,
        updatedAt: faq.updatedAt,
        event: parent,
      })
    );
  }
);

/**
 * Field resolver for Event.joinQuestions
 */
export const eventJoinQuestionsResolver: EventResolvers['joinQuestions'] =
  resolverWithMetrics(
    'Event',
    'joinQuestions',
    async (parent): Promise<EventJoinQuestion[]> => {
      const questions = await prisma.eventJoinQuestion.findMany({
        where: { eventId: parent.id },
        orderBy: { order: 'asc' },
      });

      return questions.map(
        (q): EventJoinQuestion => ({
          id: q.id,
          eventId: q.eventId,
          order: q.order,
          label: q.label,
          type: q.type as JoinQuestionType,
          helpText: q.helpText,
          required: q.required,
          options: q.options as Record<string, unknown> | null,
          maxLength: q.maxLength,
          createdAt: q.createdAt,
          updatedAt: q.updatedAt,
        })
      );
    }
  );

/**
 * Field resolver for Event.appearance
 */
export const eventAppearanceResolver: EventResolvers['appearance'] =
  resolverWithMetrics(
    'Event',
    'appearance',
    async (parent): Promise<EventAppearance | null> => {
      const existing = (parent as { appearance?: EventAppearance }).appearance;
      if (existing !== undefined) return existing;

      const appearance = await prisma.eventAppearance.findUnique({
        where: { eventId: parent.id },
      });

      if (!appearance) return null;

      return {
        id: appearance.id,
        eventId: appearance.eventId,
        config: JSON.parse(appearance.config as unknown as string),
        createdAt: appearance.createdAt,
        updatedAt: appearance.updatedAt,
      };
    }
  );

/**
 * Helper to map User for agenda hosts (minimal fields)
 */
function mapAgendaHostUser(
  user: { id: string; name: string; avatarKey: string | null } | null
) {
  if (!user) return null;

  return {
    id: user.id,
    email: '',
    name: user.name,
    avatarKey: user.avatarKey,
    role: 'USER' as Role,
    verifiedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSeenAt: null,
    suspendedAt: null,
    suspensionReason: null,
    locale: 'en',
    timezone: 'UTC',
    acceptedTermsAt: null,
    acceptedMarketingAt: null,
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
 * Field resolver for Event.agendaItems
 */
export const eventAgendaItemsResolver: EventResolvers['agendaItems'] =
  resolverWithMetrics(
    'Event',
    'agendaItems',
    async (parent): Promise<EventAgendaItem[]> => {
      const existing = (parent as { agendaItems?: EventAgendaItem[] })
        .agendaItems;
      if (existing !== undefined) return existing;

      const items = await prisma.eventAgendaItem.findMany({
        where: { eventId: parent.id },
        include: {
          hosts: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  avatarKey: true,
                },
              },
            },
            orderBy: { order: 'asc' },
          },
        },
        orderBy: [
          { startAt: { sort: 'asc', nulls: 'last' } },
          { order: 'asc' },
        ],
      });

      return items.map(
        (item): EventAgendaItem => ({
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
        })
      );
    }
  );
