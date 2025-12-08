import type { Resolvers } from '../../__generated__/resolvers-types';
import { prisma } from '../../../lib/prisma';
import { getUserEffectivePlan } from '../../../lib/billing';

/**
 * Helper to check if viewer can see a field based on privacy settings
 */
function canViewField(
  privacySetting: string | undefined | null,
  viewerId: string | undefined,
  profileUserId: string
): boolean {
  // Owner can always see their own data
  if (viewerId === profileUserId) {
    return true;
  }

  // Default to ALL if no setting
  if (!privacySetting || privacySetting === 'ALL') {
    return true;
  }

  // HIDDEN - only owner can see
  if (privacySetting === 'HIDDEN') {
    return false;
  }

  // MEMBERS - check if viewer is a member of any event with this user
  // For now, we'll implement a simple check - in production you'd query eventMembers
  if (privacySetting === 'MEMBERS') {
    // TODO: Implement actual membership check
    // For now, return true if logged in
    return !!viewerId;
  }

  // SELF - only owner
  if (privacySetting === 'SELF') {
    return false;
  }

  return true;
}

export const UserFieldResolvers: Resolvers['User'] = {
  avatarBlurhash: async (parent) => {
    // If already present in parent, return it
    if ('avatarBlurhash' in parent && parent.avatarBlurhash !== undefined) {
      return parent.avatarBlurhash;
    }

    // If no avatarKey, no blurhash
    if (!parent.avatarKey) {
      return null;
    }

    // Fetch blurhash from MediaAsset
    const mediaAsset = await prisma.mediaAsset.findUnique({
      where: { key: parent.avatarKey },
      select: { blurhash: true },
    });

    return mediaAsset?.blurhash || null;
  },

  profile: async (parent, _args, context) => {
    if ('profile' in parent && parent.profile !== undefined) {
      return parent.profile;
    }

    // Check privacy for location
    const privacy = await prisma.userPrivacy.findUnique({
      where: { userId: parent.id },
    });

    const profile = await prisma.userProfile.findUnique({
      where: { userId: parent.id },
    });

    if (!profile) {
      return null;
    }

    const viewerId = context.user?.id;

    // Apply location privacy
    if (!canViewField(privacy?.showLocation, viewerId, parent.id)) {
      // Hide precise location
      return {
        ...profile,
        homeLat: null,
        homeLng: null,
        // Keep city/country based on privacy level
        city: privacy?.showLocation === 'CITY' ? profile.city : null,
        country: privacy?.showLocation === 'CITY' ? profile.country : null,
      };
    }

    return profile;
  },

  privacy: async (parent) => {
    if ('privacy' in parent && parent.privacy !== undefined) {
      return parent.privacy;
    }

    const privacy = await prisma.userPrivacy.findUnique({
      where: { userId: parent.id },
    });

    return privacy || null;
  },

  stats: async (parent, _args, context) => {
    if ('stats' in parent && parent.stats !== undefined) {
      return parent.stats;
    }

    // Check privacy settings
    const privacy = await prisma.userPrivacy.findUnique({
      where: { userId: parent.id },
    });

    const viewerId = context.user?.id;
    if (!canViewField(privacy?.showStats, viewerId, parent.id)) {
      return null;
    }

    const stats = await prisma.userStats.findUnique({
      where: { userId: parent.id },
    });

    return stats || null;
  },

  socialLinks: async (parent) => {
    if ('socialLinks' in parent && parent.socialLinks !== undefined) {
      return parent.socialLinks;
    }

    const links = await prisma.userSocialLink.findMany({
      where: { userId: parent.id },
      orderBy: { createdAt: 'asc' },
    });

    return links;
  },

  categoryLevels: async (parent) => {
    if ('categoryLevels' in parent && parent.categoryLevels !== undefined) {
      return parent.categoryLevels;
    }

    const categoryLevels = await prisma.userCategoryLevel.findMany({
      where: { userId: parent.id },
      include: { category: true },
      orderBy: { createdAt: 'asc' },
    });

    return categoryLevels;
  },

  availability: async (parent) => {
    if ('availability' in parent && parent.availability !== undefined) {
      return parent.availability;
    }

    const availability = await prisma.userAvailability.findMany({
      where: { userId: parent.id },
      orderBy: [{ weekday: 'asc' }, { startMin: 'asc' }],
    });

    return availability;
  },

  badges: async (parent) => {
    if ('badges' in parent && parent.badges !== undefined) {
      return parent.badges;
    }

    const badges = await prisma.userBadge.findMany({
      where: { userId: parent.id },
      orderBy: { earnedAt: 'desc' },
    });

    return badges;
  },

  // Billing fields
  effectivePlan: async (parent) => {
    const planInfo = await getUserEffectivePlan(parent.id);
    return planInfo.plan;
  },

  planEndsAt: async (parent) => {
    const planInfo = await getUserEffectivePlan(parent.id);
    return planInfo.planEndsAt;
  },

  activeSubscription: async (parent) => {
    const subscription = await prisma.userSubscription.findFirst({
      where: {
        userId: parent.id,
        status: { in: ['ACTIVE', 'TRIALING'] },
      },
      orderBy: { createdAt: 'desc' },
    });

    return subscription;
  },

  activePlanPeriods: async (parent) => {
    const now = new Date();
    const periods = await prisma.userPlanPeriod.findMany({
      where: {
        userId: parent.id,
        startsAt: { lte: now },
        endsAt: { gt: now },
      },
      orderBy: { endsAt: 'desc' },
    });

    return periods;
  },
};

export const UserProfileFieldResolvers: Resolvers['UserProfile'] = {
  coverBlurhash: async (parent) => {
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
  },
};
