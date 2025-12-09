import { prisma } from '../../../lib/prisma';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import type { EventResolvers } from '../../__generated__/resolvers-types';

/**
 * Field resolver for Event.sponsorshipPlan
 * Returns the effective sponsorship plan for this event (FREE, PLUS, PRO)
 */
export const eventSponsorshipPlanResolver: EventResolvers['sponsorshipPlan'] =
  resolverWithMetrics('Event', 'sponsorshipPlan', async (parent, _args) => {
    // If already present in parent, return it
    if ('sponsorshipPlan' in parent && parent.sponsorshipPlan !== undefined) {
      return parent.sponsorshipPlan as any;
    }

    // Check for active sponsorship
    const sponsorship = await prisma.eventSponsorship.findUnique({
      where: { eventId: parent.id },
    });

    if (!sponsorship || sponsorship.status !== 'ACTIVE') {
      return 'FREE';
    }

    return sponsorship.plan as any;
  });

/**
 * Field resolver for Event.sponsorship
 * Returns EventSponsorship if exists for this event
 */
export const eventSponsorshipResolver: EventResolvers['sponsorship'] =
  resolverWithMetrics(
    'Event',
    'sponsorship',
    async (parent, _args, _context) => {
      const sponsorship = await prisma.eventSponsorship.findUnique({
        where: { eventId: parent.id },
        include: { sponsor: true, event: true },
      });

      if (!sponsorship) return null;

      return {
        id: sponsorship.id,
        eventId: sponsorship.eventId,
        sponsorId: sponsorship.sponsorId,
        plan: sponsorship.plan as any,
        status: sponsorship.status as any,
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
        event: parent as any, // Avoid circular fetch
        sponsor: {
          id: sponsorship.sponsor.id,
          email: sponsorship.sponsor.email,
          name: sponsorship.sponsor.name,
          avatarKey: sponsorship.sponsor.avatarKey ?? null,
          role: sponsorship.sponsor.role as any,
          verifiedAt: sponsorship.sponsor.verifiedAt ?? null,
          createdAt: sponsorship.sponsor.createdAt,
          updatedAt: sponsorship.sponsor.updatedAt,
          lastSeenAt: sponsorship.sponsor.lastSeenAt ?? null,
          locale: (sponsorship.sponsor as any).locale ?? null,
          timezone: (sponsorship.sponsor as any).timezone ?? null,
          acceptedTermsAt: (sponsorship.sponsor as any).acceptedTermsAt ?? null,
          acceptedMarketingAt:
            (sponsorship.sponsor as any).acceptedMarketingAt ?? null,
        },
      };
    }
  );

/**
 * Field resolver for Event.inviteLinks
 * Returns all invite links for this event (access-controlled)
 */
export const eventInviteLinksResolver: EventResolvers['inviteLinks'] =
  resolverWithMetrics(
    'Event',
    'inviteLinks',
    async (parent, _args, { user }) => {
      // Only owner/moderator can see invite links
      const membership = await prisma.eventMember.findUnique({
        where: {
          eventId_userId: {
            eventId: parent.id,
            userId: user?.id ?? '',
          },
        },
      });

      const isOwnerOrMod =
        membership &&
        (membership.role === 'OWNER' || membership.role === 'MODERATOR') &&
        membership.status === 'JOINED';

      if (!isOwnerOrMod) {
        return [];
      }

      const links = await prisma.eventInviteLink.findMany({
        where: { eventId: parent.id },
        orderBy: { createdAt: 'desc' },
      });

      const now = new Date();

      return links.map((link) => {
        const isExpired = link.expiresAt ? link.expiresAt < now : false;
        const isMaxedOut = link.maxUses
          ? link.usedCount >= link.maxUses
          : false;
        const isValid = !isExpired && !isMaxedOut;

        return {
          id: link.id,
          eventId: link.eventId,
          code: link.code,
          maxUses: link.maxUses ?? null,
          usedCount: link.usedCount,
          expiresAt: link.expiresAt ?? null,
          createdAt: link.createdAt,
          event: parent as any,
          isExpired,
          isMaxedOut,
          isValid,
        };
      });
    }
  );

/**
 * Field resolver for Event.isFavourite
 * Returns true if the current user has favourited this event
 */
export const eventIsFavouriteResolver: EventResolvers['isFavourite'] =
  resolverWithMetrics(
    'Event',
    'isFavourite',
    async (parent, _args, { user }) => {
      if (!user?.id) {
        return false; // Not authenticated = not favourited
      }

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
 * Returns blurhash from MediaAsset if coverKey exists
 */
export const eventCoverBlurhashResolver: EventResolvers['coverBlurhash'] =
  resolverWithMetrics('Event', 'coverBlurhash', async (parent) => {
    // If already present in parent, return it
    if ('coverBlurhash' in parent && parent.coverBlurhash !== undefined) {
      return parent.coverBlurhash;
    }

    // If no coverKey, no blurhash
    if (!parent.coverKey) {
      return null;
    }

    // Fetch blurhash from MediaAsset
    const mediaAsset = await prisma.mediaAsset.findUnique({
      where: { key: parent.coverKey },
      select: { blurhash: true },
    });

    return mediaAsset?.blurhash || null;
  });

/**
 * Field resolver for Event.faqs
 * Returns all FAQs for this event, ordered by their order field
 */
export const eventFaqsResolver: EventResolvers['faqs'] = resolverWithMetrics(
  'Event',
  'faqs',
  async (parent) => {
    const faqs = await prisma.eventFaq.findMany({
      where: { eventId: parent.id },
      orderBy: { order: 'asc' },
    });

    return faqs.map((faq) => ({
      id: faq.id,
      eventId: faq.eventId,
      order: faq.order,
      question: faq.question,
      answer: faq.answer,
      createdAt: faq.createdAt,
      updatedAt: faq.updatedAt,
      event: parent as any, // Avoid circular fetch
    }));
  }
);

/**
 * Field resolver for Event.joinQuestions
 * Returns all join questions for this event, ordered by their order field
 */
export const eventJoinQuestionsResolver: EventResolvers['joinQuestions'] =
  resolverWithMetrics('Event', 'joinQuestions', async (parent) => {
    const questions = await prisma.eventJoinQuestion.findMany({
      where: { eventId: parent.id },
      orderBy: { order: 'asc' },
    });

    return questions as any;
  });

/**
 * Field resolver for Event.appearance
 * Returns appearance configuration for this event
 */
export const eventAppearanceResolver: EventResolvers['appearance'] =
  resolverWithMetrics('Event', 'appearance', async (parent) => {
    // Check if appearance is already loaded (e.g., from include in query)
    const existingAppearance = (parent as any).appearance;
    if (existingAppearance !== undefined) {
      if (!existingAppearance) {
        return null;
      }
      return {
        id: existingAppearance.id,
        eventId: existingAppearance.eventId,
        config: existingAppearance.config,
        createdAt: existingAppearance.createdAt,
        updatedAt: existingAppearance.updatedAt,
      };
    }

    // Fallback: fetch from database
    // NOTE: After running `prisma generate`, remove the (prisma as any) cast
    const appearance = await (prisma as any).eventAppearance.findUnique({
      where: { eventId: parent.id },
    });

    if (!appearance) {
      return null;
    }

    return {
      id: appearance.id,
      eventId: appearance.eventId,
      config: appearance.config,
      createdAt: appearance.createdAt,
      updatedAt: appearance.updatedAt,
    };
  });

/**
 * Field resolver for Event.agendaItems
 * Returns all agenda items for this event, sorted by startAt (nulls last), then order
 */
export const eventAgendaItemsResolver: EventResolvers['agendaItems'] =
  resolverWithMetrics('Event', 'agendaItems', async (parent) => {
    // Check if agendaItems is already loaded (e.g., from include in query)
    const existingItems = (parent as any).agendaItems;
    if (existingItems !== undefined) {
      return existingItems;
    }

    // Fallback: fetch from database
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
      orderBy: [{ startAt: { sort: 'asc', nulls: 'last' } }, { order: 'asc' }],
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
      hosts: item.hosts.map((host) => ({
        id: host.id,
        agendaItemId: host.agendaItemId,
        order: host.order,
        kind: host.kind,
        userId: host.userId,
        user: host.user,
        name: host.name,
        avatarUrl: host.avatarUrl,
        createdAt: host.createdAt,
        updatedAt: host.updatedAt,
      })),
    }));
  });
