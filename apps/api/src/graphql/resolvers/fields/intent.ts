import { prisma } from '../../../lib/prisma';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import type { IntentResolvers } from '../../__generated__/resolvers-types';

/**
 * Field resolver for Intent.sponsorshipPlan
 * Returns the effective sponsorship plan for this intent (FREE, PLUS, PRO)
 */
export const intentSponsorshipPlanResolver: IntentResolvers['sponsorshipPlan'] =
  resolverWithMetrics('Intent', 'sponsorshipPlan', async (parent, _args) => {
    // If already present in parent, return it
    if ('sponsorshipPlan' in parent && parent.sponsorshipPlan !== undefined) {
      return parent.sponsorshipPlan as any;
    }

    // Check for active sponsorship
    const sponsorship = await prisma.eventSponsorship.findUnique({
      where: { intentId: parent.id },
    });

    if (!sponsorship || sponsorship.status !== 'ACTIVE') {
      return 'FREE';
    }

    return sponsorship.plan as any;
  });

/**
 * Field resolver for Intent.sponsorship
 * Returns EventSponsorship if exists for this intent
 */
export const intentSponsorshipResolver: IntentResolvers['sponsorship'] =
  resolverWithMetrics(
    'Intent',
    'sponsorship',
    async (parent, _args, { user }) => {
      const sponsorship = await prisma.eventSponsorship.findUnique({
        where: { intentId: parent.id },
        include: { sponsor: true, intent: true },
      });

      if (!sponsorship) return null;

      return {
        id: sponsorship.id,
        intentId: sponsorship.intentId,
        sponsorId: sponsorship.sponsorId,
        plan: sponsorship.plan as any,
        status: sponsorship.status as any,
        startsAt: sponsorship.startsAt ?? null,
        endsAt: sponsorship.endsAt ?? null,
        boostsTotal: sponsorship.boostsTotal,
        boostsUsed: sponsorship.boostsUsed,
        localPushesTotal: sponsorship.localPushesTotal,
        localPushesUsed: sponsorship.localPushesUsed,
        stripePaymentIntentId: sponsorship.stripePaymentIntentId ?? null,
        stripeCheckoutSessionId: sponsorship.stripeCheckoutSessionId ?? null,
        createdAt: sponsorship.createdAt,
        updatedAt: sponsorship.updatedAt,
        intent: parent as any, // Avoid circular fetch
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
 * Field resolver for Intent.inviteLinks
 * Returns all invite links for this intent (access-controlled)
 */
export const intentInviteLinksResolver: IntentResolvers['inviteLinks'] =
  resolverWithMetrics(
    'Intent',
    'inviteLinks',
    async (parent, _args, { user }) => {
      // Only owner/moderator can see invite links
      const membership = await prisma.intentMember.findUnique({
        where: {
          intentId_userId: {
            intentId: parent.id,
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

      const links = await prisma.intentInviteLink.findMany({
        where: { intentId: parent.id },
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
          intentId: link.intentId,
          code: link.code,
          maxUses: link.maxUses ?? null,
          usedCount: link.usedCount,
          expiresAt: link.expiresAt ?? null,
          createdAt: link.createdAt,
          intent: parent as any,
          isExpired,
          isMaxedOut,
          isValid,
        };
      });
    }
  );

/**
 * Field resolver for Intent.isFavourite
 * Returns true if the current user has favourited this intent
 */
export const intentIsFavouriteResolver: IntentResolvers['isFavourite'] =
  resolverWithMetrics(
    'Intent',
    'isFavourite',
    async (parent, _args, { user }) => {
      if (!user?.id) {
        return false; // Not authenticated = not favourited
      }

      const favourite = await prisma.intentFavourite.findUnique({
        where: {
          userId_intentId: {
            userId: user.id,
            intentId: parent.id,
          },
        },
      });

      return !!favourite;
    }
  );

/**
 * Field resolver for Intent.coverBlurhash
 * Returns blurhash from MediaAsset if coverKey exists
 */
export const intentCoverBlurhashResolver: IntentResolvers['coverBlurhash'] =
  resolverWithMetrics('Intent', 'coverBlurhash', async (parent) => {
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
