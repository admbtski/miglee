import { prisma } from '../../../lib/prisma';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import type { IntentResolvers } from '../../__generated__/resolvers-types';

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
        include: { sponsor: true },
      });

      if (!sponsorship) return null;

      return {
        id: sponsorship.id,
        intentId: sponsorship.intentId,
        sponsorId: sponsorship.sponsorId,
        plan: sponsorship.plan as any,
        status: sponsorship.status as any,
        highlightOn: sponsorship.highlightOn,
        startedAt: sponsorship.startedAt ?? null,
        endsAt: sponsorship.endsAt ?? null,
        boostsUsed: sponsorship.boostsUsed,
        localPushes: sponsorship.localPushes,
        createdAt: sponsorship.createdAt,
        updatedAt: sponsorship.updatedAt,
        intent: parent as any, // Avoid circular fetch
        sponsor: {
          id: sponsorship.sponsor.id,
          email: sponsorship.sponsor.email,
          name: sponsorship.sponsor.name,
          imageUrl: sponsorship.sponsor.imageUrl ?? null,
          role: sponsorship.sponsor.role as any,
          verifiedAt: sponsorship.sponsor.verifiedAt ?? null,
          createdAt: sponsorship.sponsor.createdAt,
          updatedAt: sponsorship.sponsor.updatedAt,
          lastSeenAt: sponsorship.sponsor.lastSeenAt ?? null,
          locale: (sponsorship.sponsor as any).locale ?? null,
          tz: (sponsorship.sponsor as any).tz ?? null,
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
