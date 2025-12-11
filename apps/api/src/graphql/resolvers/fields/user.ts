/**
 * User Field Resolvers
 *
 * These resolvers handle lazy-loaded fields on User and UserProfile types.
 */

import type {
  UserResolvers,
  UserProfileResolvers,
  UserProfile,
  UserPrivacy,
  UserStats,
  UserSocialLink,
  UserCategoryLevel,
  UserAvailability,
  UserBadge,
  UserEffectivePlan,
  UserSubscription,
  UserPlanPeriod,
  Maybe,
  Level,
  AddressVisibility,
  MembersVisibility,
  SubscriptionStatus,
  SubscriptionPlan,
  BillingPeriod,
  UserPlanSource,
  Mode,
} from '../../__generated__/resolvers-types';
import { prisma } from '../../../lib/prisma';
import { getUserEffectivePlan } from '../../../lib/billing';
import { toJSONObject, mapUser } from '../helpers';

/**
 * Helper to check if viewer can see a field based on privacy settings
 */
function canViewField(
  privacySetting: string | undefined | null,
  viewerId: string | undefined,
  profileUserId: string
): boolean {
  if (viewerId === profileUserId) return true;
  if (!privacySetting || privacySetting === 'ALL') return true;
  if (privacySetting === 'HIDDEN') return false;
  if (privacySetting === 'MEMBERS') return !!viewerId;
  if (privacySetting === 'SELF') return false;
  return true;
}

export const UserFieldResolvers: Partial<UserResolvers> = {
  avatarBlurhash: async (parent): Promise<Maybe<string>> => {
    if ('avatarBlurhash' in parent && parent.avatarBlurhash !== undefined) {
      return parent.avatarBlurhash;
    }

    if (!parent.avatarKey) return null;

    const mediaAsset = await prisma.mediaAsset.findUnique({
      where: { key: parent.avatarKey },
      select: { blurhash: true },
    });

    return mediaAsset?.blurhash ?? null;
  },

  profile: async (parent, _args, context): Promise<Maybe<UserProfile>> => {
    if ('profile' in parent && parent.profile !== undefined) {
      return parent.profile;
    }

    const privacy = await prisma.userPrivacy.findUnique({
      where: { userId: parent.id },
    });

    const profile = await prisma.userProfile.findUnique({
      where: { userId: parent.id },
    });

    if (!profile) return null;

    const viewerId = context.user?.id;
    const hideLocation = !canViewField(
      privacy?.showLocation,
      viewerId,
      parent.id
    );

    return {
      id: profile.id,
      userId: profile.userId,
      displayName: profile.displayName,
      bioShort: profile.bioShort,
      bioLong: profile.bioLong,
      coverKey: profile.coverKey,
      coverBlurhash: null,
      city: hideLocation ? null : profile.city,
      country: hideLocation ? null : profile.country,
      homeLat: hideLocation ? null : profile.homeLat,
      homeLng: hideLocation ? null : profile.homeLng,
      interests: [],
      speaks: [],
      preferredMaxDistanceKm: profile.preferredMaxDistanceKm,
      preferredMode: (profile.preferredMode as Mode) ?? null,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  },

  privacy: async (parent): Promise<Maybe<UserPrivacy>> => {
    if ('privacy' in parent && parent.privacy !== undefined) {
      return parent.privacy;
    }

    const privacy = await prisma.userPrivacy.findUnique({
      where: { userId: parent.id },
    });

    if (!privacy) return null;

    return {
      id: privacy.id,
      userId: privacy.userId,
      dmPolicy: privacy.dmPolicy,
      showLastSeen: privacy.showLastSeen,
      showLocation: privacy.showLocation,
      showEvents: privacy.showEvents,
      showReviews: privacy.showReviews,
      showStats: privacy.showStats,
      defaultAddressVisibility:
        privacy.defaultAddressVisibility as AddressVisibility,
      defaultMembersVisibility:
        privacy.defaultMembersVisibility as MembersVisibility,
      createdAt: privacy.createdAt,
      updatedAt: privacy.updatedAt,
    };
  },

  stats: async (parent, _args, context): Promise<Maybe<UserStats>> => {
    if ('stats' in parent && parent.stats !== undefined) {
      return parent.stats;
    }

    const privacy = await prisma.userPrivacy.findUnique({
      where: { userId: parent.id },
    });

    const viewerId = context.user?.id;
    if (!canViewField(privacy?.showStats, viewerId, parent.id)) return null;

    const stats = await prisma.userStats.findUnique({
      where: { userId: parent.id },
    });

    if (!stats) return null;

    return {
      id: stats.id,
      userId: stats.userId,
      eventsCreated: stats.eventsCreated,
      eventsJoined: stats.eventsJoined,
      reviewsCount: stats.reviewsCount,
      hostRatingAvg: stats.hostRatingAvg,
      attendeeRatingAvg: stats.attendeeRatingAvg,
      lastActiveAt: stats.lastActiveAt,
      createdAt: stats.createdAt,
      updatedAt: stats.updatedAt,
    };
  },

  socialLinks: async (parent): Promise<UserSocialLink[]> => {
    if ('socialLinks' in parent && parent.socialLinks !== undefined) {
      return parent.socialLinks;
    }

    const links = await prisma.userSocialLink.findMany({
      where: { userId: parent.id },
      orderBy: { createdAt: 'asc' },
    });

    return links.map((link) => ({
      id: link.id,
      userId: link.userId,
      provider: link.provider,
      url: link.url,
      verified: link.verified,
      createdAt: link.createdAt,
      updatedAt: link.updatedAt,
    }));
  },

  categoryLevels: async (parent): Promise<UserCategoryLevel[]> => {
    if ('categoryLevels' in parent && parent.categoryLevels !== undefined) {
      return parent.categoryLevels;
    }

    const categoryLevels = await prisma.userCategoryLevel.findMany({
      where: { userId: parent.id },
      include: { category: true },
      orderBy: { createdAt: 'asc' },
    });

    return categoryLevels.map((cl) => ({
      id: cl.id,
      userId: cl.userId,
      categoryId: cl.categoryId,
      level: cl.level as Level,
      notes: cl.notes,
      createdAt: cl.createdAt,
      updatedAt: cl.updatedAt,
      category: {
        id: cl.category.id,
        slug: cl.category.slug,
        names: toJSONObject(cl.category.names),
        createdAt: cl.category.createdAt,
        updatedAt: cl.category.updatedAt,
      },
    }));
  },

  availability: async (parent): Promise<UserAvailability[]> => {
    if ('availability' in parent && parent.availability !== undefined) {
      return parent.availability;
    }

    const availability = await prisma.userAvailability.findMany({
      where: { userId: parent.id },
      orderBy: [{ weekday: 'asc' }, { startMin: 'asc' }],
    });

    return availability.map((a) => ({
      id: a.id,
      userId: a.userId,
      weekday: a.weekday,
      startMin: a.startMin,
      endMin: a.endMin,
      tzSnap: a.tzSnap,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    }));
  },

  badges: async (parent): Promise<UserBadge[]> => {
    if ('badges' in parent && parent.badges !== undefined) {
      return parent.badges;
    }

    const badges = await prisma.userBadge.findMany({
      where: { userId: parent.id },
      orderBy: { earnedAt: 'desc' },
    });

    return badges.map((b) => ({
      id: b.id,
      userId: b.userId,
      slug: b.slug,
      earnedAt: b.earnedAt,
      data: toJSONObject(b.data),
      createdAt: b.createdAt,
    }));
  },

  effectivePlan: async (parent): Promise<UserEffectivePlan> => {
    const planInfo = await getUserEffectivePlan(parent.id);
    return planInfo.plan as UserEffectivePlan;
  },

  planEndsAt: async (parent): Promise<Maybe<Date>> => {
    const planInfo = await getUserEffectivePlan(parent.id);
    return planInfo.planEndsAt ?? null;
  },

  activeSubscription: async (parent): Promise<Maybe<UserSubscription>> => {
    const subscription = await prisma.userSubscription.findFirst({
      where: {
        userId: parent.id,
        status: { in: ['ACTIVE', 'TRIALING'] },
      },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!subscription) return null;

    return {
      id: subscription.id,
      userId: subscription.userId,
      status: subscription.status as SubscriptionStatus,
      plan: subscription.plan as SubscriptionPlan,
      billingPeriod: subscription.billingPeriod as BillingPeriod,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      canceledAt: subscription.canceledAt,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      stripeSubscriptionId: subscription.stripeSubscriptionId,
      stripeCustomerId: subscription.stripeCustomerId,
      stripePriceId: subscription.stripePriceId,
      trialEndsAt: subscription.trialEndsAt,
      createdAt: subscription.createdAt,
      updatedAt: subscription.updatedAt,
      user: mapUser(subscription.user),
    };
  },

  activePlanPeriods: async (parent): Promise<UserPlanPeriod[]> => {
    const now = new Date();
    const periods = await prisma.userPlanPeriod.findMany({
      where: {
        userId: parent.id,
        startsAt: { lte: now },
        endsAt: { gt: now },
      },
      include: { user: true },
      orderBy: { endsAt: 'desc' },
    });

    return periods.map((p) => ({
      id: p.id,
      userId: p.userId,
      plan: p.plan as SubscriptionPlan,
      billingPeriod: p.billingPeriod as BillingPeriod,
      startsAt: p.startsAt,
      endsAt: p.endsAt,
      source: p.source as UserPlanSource,
      stripePaymentEventId: p.stripePaymentEventId,
      stripeSubscriptionId: p.stripeSubscriptionId,
      stripeCheckoutSessionId: p.stripeCheckoutSessionId,
      stripeCustomerId: p.stripeCustomerId,
      amount: p.amount,
      currency: p.currency,
      createdAt: p.createdAt,
      user: mapUser(p.user),
    }));
  },
};

export const UserProfileFieldResolvers: Partial<UserProfileResolvers> = {
  coverBlurhash: async (parent): Promise<Maybe<string>> => {
    if ('coverBlurhash' in parent && parent.coverBlurhash !== undefined) {
      return parent.coverBlurhash;
    }

    if (!parent.coverKey) return null;

    const mediaAsset = await prisma.mediaAsset.findUnique({
      where: { key: parent.coverKey },
      select: { blurhash: true },
    });

    return mediaAsset?.blurhash ?? null;
  },
};
