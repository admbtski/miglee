/**
 * SessionUser Field Resolvers
 *
 * SessionUser is the authenticated user's representation.
 * No privacy checks needed since this is the user viewing their own data.
 */

import type {
  SessionUserResolvers,
  UserProfile,
  UserEffectivePlan,
  Maybe,
  Mode,
} from '../../__generated__/resolvers-types';
import { prisma } from '../../../lib/prisma';
import { getUserEffectivePlan } from '../../../lib/billing';

export const SessionUserFieldResolvers: Partial<SessionUserResolvers> = {
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

  profile: async (parent): Promise<Maybe<UserProfile>> => {
    if ('profile' in parent && parent.profile !== undefined) {
      return parent.profile;
    }

    const profile = await prisma.userProfile.findUnique({
      where: { userId: parent.id },
    });

    if (!profile) return null;

    return {
      id: profile.id,
      userId: profile.userId,
      displayName: profile.displayName,
      bioShort: profile.bioShort,
      bioLong: profile.bioLong,
      coverKey: profile.coverKey,
      coverBlurhash: null,
      city: profile.city,
      country: profile.country,
      homeLat: profile.homeLat,
      homeLng: profile.homeLng,
      interests: [],
      speaks: [],
      preferredMaxDistanceKm: profile.preferredMaxDistanceKm,
      preferredMode: (profile.preferredMode as Mode) ?? null,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  },

  effectivePlan: async (parent): Promise<UserEffectivePlan> => {
    if ('effectivePlan' in parent && parent.effectivePlan !== undefined) {
      return parent.effectivePlan;
    }

    const planInfo = await getUserEffectivePlan(parent.id);
    return planInfo.plan as UserEffectivePlan;
  },
};
