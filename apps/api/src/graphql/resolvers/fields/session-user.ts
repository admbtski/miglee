import type { Resolvers } from '../../__generated__/resolvers-types';
import { prisma } from '../../../lib/prisma';
import { getUserEffectivePlan } from '../../../lib/billing';

export const SessionUserFieldResolvers: Resolvers['SessionUser'] = {
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

  profile: async (parent, _args, _context) => {
    // If profile is already included in parent, return it
    if ('profile' in parent && parent.profile !== undefined) {
      return parent.profile;
    }

    // For SessionUser, we always show the user's own profile data
    // No privacy checks needed since this is the authenticated user viewing their own data
    const profile = await prisma.userProfile.findUnique({
      where: { userId: parent.id },
    });

    return profile || null;
  },

  effectivePlan: async (parent) => {
    // If already present in parent, return it
    if ('effectivePlan' in parent && parent.effectivePlan !== undefined) {
      return parent.effectivePlan;
    }

    // Get user's effective plan
    const planInfo = await getUserEffectivePlan(parent.id);
    return planInfo.plan;
  },
};
