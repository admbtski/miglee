import { GraphQLError } from 'graphql';
import type {
  MutationResolvers,
  UserProfile,
  UserPrivacy,
  UserCategoryLevel,
  User,
} from '../../__generated__/resolvers-types';
import { prisma } from '../../../lib/prisma';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import {
  trackProfileUpdated,
  trackAvailabilityChange,
  trackTimezoneUsage,
} from '../../../lib/observability';

// =============================================================================
// Update User Profile
// =============================================================================

export const updateUserProfileMutation: MutationResolvers['updateUserProfile'] =
  resolverWithMetrics(
    'Mutation',
    'updateUserProfile',
    async (_parent, { input }, { user }) => {
      if (!user) {
        throw new GraphQLError('Unauthorized', {
          extensions: { code: 'UNAUTHORIZED' },
        });
      }

      // Validation
      if (input.displayName != null) {
        const trimmed = input.displayName.trim();
        if (trimmed.length < 3 || trimmed.length > 40) {
          throw new GraphQLError(
            'Display name must be between 3 and 40 characters',
            { extensions: { code: 'BAD_USER_INPUT' } }
          );
        }
      }

      if (input.bioShort != null && input.bioShort.length > 200) {
        throw new GraphQLError('Bio short must be max 200 characters', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      if (input.bioLong != null && input.bioLong.length > 1000) {
        throw new GraphQLError('Bio long must be max 1000 characters', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      if (input.interests != null && input.interests.length > 20) {
        throw new GraphQLError('Maximum 20 interests allowed', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      // Fetch user data for fallback
      const userData = await prisma.user.findUnique({
        where: { id: user.id },
        select: { name: true },
      });

      // Upsert profile
      const profile = await prisma.userProfile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          // Initialize displayName = user.name if not provided
          displayName: input.displayName?.trim() || userData?.name || null,
          bioShort: input.bioShort?.trim() || null,
          bioLong: input.bioLong?.trim() || null,
          city: input.city?.trim() || null,
          country: input.country?.trim() || null,
          homeLat: input.homeLat ?? null,
          homeLng: input.homeLng ?? null,
          coverKey: input.coverKey?.trim() || null,
          speaks: input.speaks ?? [],
          interests: input.interests ?? [],
          preferredMode: input.preferredMode ?? null,
          preferredMaxDistanceKm: input.preferredMaxDistanceKm ?? null,
        },
        update: {
          ...(input.displayName !== undefined && {
            displayName: input.displayName?.trim() || null,
          }),
          ...(input.bioShort !== undefined && {
            bioShort: input.bioShort?.trim() || null,
          }),
          ...(input.bioLong !== undefined && {
            bioLong: input.bioLong?.trim() || null,
          }),
          ...(input.city !== undefined && { city: input.city?.trim() || null }),
          ...(input.country !== undefined && {
            country: input.country?.trim() || null,
          }),
          ...(input.homeLat !== undefined && { homeLat: input.homeLat }),
          ...(input.homeLng !== undefined && { homeLng: input.homeLng }),
          ...(input.coverKey !== undefined && {
            coverKey: input.coverKey?.trim() || null,
          }),
          ...(input.speaks !== undefined && {
            speaks: input.speaks as string[],
          }),
          ...(input.interests !== undefined && {
            interests: input.interests as string[],
          }),
          ...(input.preferredMode !== undefined && {
            preferredMode: input.preferredMode as string,
          }),
          ...(input.preferredMaxDistanceKm !== undefined && {
            preferredMaxDistanceKm: input.preferredMaxDistanceKm as number,
          }),
          updatedAt: new Date(),
        } as Record<string, unknown>,
      });

      // Track profile updated
      trackProfileUpdated({
        userId: user.id,
        field: 'other', // Multiple fields updated
      });

      return profile as unknown as UserProfile;
    }
  );

// =============================================================================
// Update User Privacy
// =============================================================================

export const updateUserPrivacyMutation: MutationResolvers['updateUserPrivacy'] =
  resolverWithMetrics(
    'Mutation',
    'updateUserPrivacy',
    async (_parent, { input }, { user }) => {
      if (!user) {
        throw new GraphQLError('Unauthorized', {
          extensions: { code: 'UNAUTHORIZED' },
        });
      }

      // Validation
      const validDmPolicies = ['ALL', 'MEMBERS', 'INVITE_ONLY', 'NONE'];
      const validVisibilities = ['ALL', 'MEMBERS', 'HIDDEN', 'SELF'];

      if (input.dmPolicy && !validDmPolicies.includes(input.dmPolicy)) {
        throw new GraphQLError('Invalid dmPolicy', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      if (
        input.showLastSeen &&
        !validVisibilities.includes(input.showLastSeen)
      ) {
        throw new GraphQLError('Invalid showLastSeen', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      // Upsert privacy
      const privacy = await prisma.userPrivacy.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          dmPolicy: input.dmPolicy ?? 'ALL',
          showLastSeen: input.showLastSeen ?? 'ALL',
          showLocation: input.showLocation ?? 'CITY',
          showEvents: input.showEvents ?? 'ALL',
          showReviews: input.showReviews ?? 'ALL',
          showStats: input.showStats ?? 'ALL',
          defaultAddressVisibility: input.defaultAddressVisibility ?? 'PUBLIC',
          defaultMembersVisibility: input.defaultMembersVisibility ?? 'PUBLIC',
        },
        update: {
          ...(input.dmPolicy !== undefined && { dmPolicy: input.dmPolicy }),
          ...(input.showLastSeen !== undefined && {
            showLastSeen: input.showLastSeen,
          }),
          ...(input.showLocation !== undefined && {
            showLocation: input.showLocation,
          }),
          ...(input.showEvents !== undefined && {
            showEvents: input.showEvents,
          }),
          ...(input.showReviews !== undefined && {
            showReviews: input.showReviews,
          }),
          ...(input.showStats !== undefined && {
            showStats: input.showStats,
          }),
          ...(input.defaultAddressVisibility !== undefined && {
            defaultAddressVisibility: input.defaultAddressVisibility,
          }),
          ...(input.defaultMembersVisibility !== undefined && {
            defaultMembersVisibility: input.defaultMembersVisibility,
          }),
          updatedAt: new Date(),
        } as Record<string, unknown>,
      });

      return privacy as unknown as UserPrivacy;
    }
  );

// =============================================================================
// User Category Levels
// =============================================================================

export const upsertUserCategoryLevelMutation: MutationResolvers['upsertUserCategoryLevel'] =
  resolverWithMetrics(
    'Mutation',
    'upsertUserCategoryLevel',
    async (_parent, { input }, { user }) => {
      if (!user) {
        throw new GraphQLError('Unauthorized', {
          extensions: { code: 'UNAUTHORIZED' },
        });
      }

      // Check if category exists
      const category = await prisma.category.findUnique({
        where: { id: input.categoryId },
      });

      if (!category) {
        throw new GraphQLError('Category not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Upsert category level
      const categoryLevel = input.id
        ? await prisma.userCategoryLevel.update({
            where: { id: input.id },
            data: {
              level: input.level,
              notes: input.notes?.trim() || null,
              updatedAt: new Date(),
            },
            include: { category: true },
          })
        : await prisma.userCategoryLevel.upsert({
            where: {
              userId_categoryId: {
                userId: user.id,
                categoryId: input.categoryId,
              },
            },
            create: {
              userId: user.id,
              categoryId: input.categoryId,
              level: input.level,
              notes: input.notes?.trim() || null,
            },
            update: {
              level: input.level,
              notes: input.notes?.trim() || null,
              updatedAt: new Date(),
            },
            include: { category: true },
          });

      return categoryLevel as unknown as UserCategoryLevel;
    }
  );

export const removeUserCategoryLevelMutation: MutationResolvers['removeUserCategoryLevel'] =
  resolverWithMetrics(
    'Mutation',
    'removeUserCategoryLevel',
    async (_parent, { id }, { user }) => {
      if (!user) {
        throw new GraphQLError('Unauthorized', {
          extensions: { code: 'UNAUTHORIZED' },
        });
      }

      // Check ownership
      const categoryLevel = await prisma.userCategoryLevel.findUnique({
        where: { id },
      });

      if (!categoryLevel) {
        throw new GraphQLError('Category level not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      if (categoryLevel.userId !== user.id) {
        throw new GraphQLError('Forbidden', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      await prisma.userCategoryLevel.delete({ where: { id } });

      return true;
    }
  );

// =============================================================================
// User Availability
// =============================================================================

export const upsertUserAvailabilityMutation: MutationResolvers['upsertUserAvailability'] =
  resolverWithMetrics(
    'Mutation',
    'upsertUserAvailability',
    async (_parent, { input }, { user }) => {
      if (!user) {
        throw new GraphQLError('Unauthorized', {
          extensions: { code: 'UNAUTHORIZED' },
        });
      }

      // Validation
      if (input.weekday < 0 || input.weekday > 6) {
        throw new GraphQLError('Weekday must be between 0 and 6', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      if (
        input.startMin < 0 ||
        input.startMin > 1440 ||
        input.endMin < 0 ||
        input.endMin > 1440
      ) {
        throw new GraphQLError('Minutes must be between 0 and 1440', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      if (input.startMin >= input.endMin) {
        throw new GraphQLError('startMin must be less than endMin', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      // Upsert availability
      const availability = input.id
        ? await prisma.userAvailability.update({
            where: { id: input.id },
            data: {
              weekday: input.weekday,
              startMin: input.startMin,
              endMin: input.endMin,
              tzSnap: input.tzSnap?.trim() || null,
              updatedAt: new Date(),
            },
          })
        : await prisma.userAvailability.create({
            data: {
              userId: user.id,
              weekday: input.weekday,
              startMin: input.startMin,
              endMin: input.endMin,
              tzSnap: input.tzSnap?.trim() || null,
            },
          });

      // Track availability change
      trackAvailabilityChange({
        userId: user.id,
        action: input.id ? 'update' : 'set',
        dayOfWeek: input.weekday,
        timezone: input.tzSnap || undefined,
      });

      return availability;
    }
  );

export const removeUserAvailabilityMutation: MutationResolvers['removeUserAvailability'] =
  resolverWithMetrics(
    'Mutation',
    'removeUserAvailability',
    async (_parent, { id }, { user }) => {
      if (!user) {
        throw new GraphQLError('Unauthorized', {
          extensions: { code: 'UNAUTHORIZED' },
        });
      }

      // Check ownership
      const availability = await prisma.userAvailability.findUnique({
        where: { id },
      });

      if (!availability) {
        throw new GraphQLError('Availability not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      if (availability.userId !== user.id) {
        throw new GraphQLError('Forbidden', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      await prisma.userAvailability.delete({ where: { id } });

      // Track availability removal
      trackAvailabilityChange({
        userId: user.id,
        action: 'remove',
        dayOfWeek: availability.weekday,
      });

      return true;
    }
  );

// =============================================================================
// User Social Links
// =============================================================================

export const addUserSocialLinkMutation: MutationResolvers['addUserSocialLink'] =
  resolverWithMetrics(
    'Mutation',
    'addUserSocialLink',
    async (_parent, { input }, { user }) => {
      if (!user) {
        throw new GraphQLError('Unauthorized', {
          extensions: { code: 'UNAUTHORIZED' },
        });
      }

      // Validation
      const validProviders = [
        'instagram',
        'facebook',
        'strava',
        'x',
        'discord',
        'website',
      ];

      if (!validProviders.includes(input.provider.toLowerCase())) {
        throw new GraphQLError('Invalid provider', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      // Check max 10 links
      const count = await prisma.userSocialLink.count({
        where: { userId: user.id },
      });

      if (count >= 10) {
        throw new GraphQLError('Maximum 10 social links allowed', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      // Normalize URL
      let url = input.url.trim();
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = `https://${url}`;
      }

      // Upsert (replace if provider exists)
      const link = await prisma.userSocialLink.upsert({
        where: {
          userId_provider: {
            userId: user.id,
            provider: input.provider.toLowerCase(),
          },
        },
        create: {
          userId: user.id,
          provider: input.provider.toLowerCase(),
          url,
        },
        update: {
          url,
          updatedAt: new Date(),
        },
      });

      return link;
    }
  );

export const removeUserSocialLinkMutation: MutationResolvers['removeUserSocialLink'] =
  resolverWithMetrics(
    'Mutation',
    'removeUserSocialLink',
    async (_parent, { id }, { user }) => {
      if (!user) {
        throw new GraphQLError('Unauthorized', {
          extensions: { code: 'UNAUTHORIZED' },
        });
      }

      // Check ownership
      const link = await prisma.userSocialLink.findUnique({
        where: { id },
      });

      if (!link) {
        throw new GraphQLError('Social link not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      if (link.userId !== user.id) {
        throw new GraphQLError('Forbidden', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      await prisma.userSocialLink.delete({ where: { id } });

      return true;
    }
  );

// =============================================================================
// User Locale & Timezone
// =============================================================================

export const updateUserLocaleMutation: MutationResolvers['updateUserLocale'] =
  resolverWithMetrics(
    'Mutation',
    'updateUserLocale',
    async (_parent, { locale }, { user }) => {
      if (!user) {
        throw new GraphQLError('Unauthorized', {
          extensions: { code: 'UNAUTHORIZED' },
        });
      }

      // Validate locale
      const validLocales = ['en', 'pl', 'de'];
      if (!validLocales.includes(locale)) {
        throw new GraphQLError('Invalid locale. Must be: en, pl, or de', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      // Update user locale
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { locale, updatedAt: new Date() },
      });

      return updatedUser as unknown as User;
    }
  );

export const updateUserTimezoneMutation: MutationResolvers['updateUserTimezone'] =
  resolverWithMetrics(
    'Mutation',
    'updateUserTimezone',
    async (_parent, { timezone }, { user }) => {
      if (!user) {
        throw new GraphQLError('Unauthorized', {
          extensions: { code: 'UNAUTHORIZED' },
        });
      }

      // Basic IANA timezone validation
      try {
        Intl.DateTimeFormat(undefined, { timeZone: timezone });
      } catch {
        throw new GraphQLError('Invalid IANA timezone', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      // Update user timezone
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { timezone, updatedAt: new Date() },
      });

      // Track timezone usage
      trackTimezoneUsage(timezone);

      return updatedUser as unknown as User;
    }
  );
