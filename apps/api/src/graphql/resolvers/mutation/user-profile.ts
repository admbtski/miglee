import { GraphQLError } from 'graphql';
import type { MutationResolvers } from '../__generated__/resolvers-types';
import { prisma } from '../../../lib/prisma';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';

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
      if (input.displayName !== undefined) {
        const trimmed = input.displayName.trim();
        if (trimmed.length < 3 || trimmed.length > 40) {
          throw new GraphQLError(
            'Display name must be between 3 and 40 characters',
            { extensions: { code: 'BAD_USER_INPUT' } }
          );
        }
      }

      if (input.bioShort !== undefined && input.bioShort.length > 200) {
        throw new GraphQLError('Bio short must be max 200 characters', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      if (input.bioLong !== undefined && input.bioLong.length > 1000) {
        throw new GraphQLError('Bio long must be max 1000 characters', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      if (input.interests !== undefined && input.interests.length > 20) {
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
          coverUrl: input.coverUrl?.trim() || null,
          speaks: input.speaks ?? [],
          interests: input.interests ?? [],
          preferredMode: input.preferredMode ?? null,
          preferredMaxDistanceKm: input.preferredMaxDistanceKm ?? null,
        },
        update: {
          ...(input.displayName !== undefined && {
            displayName: input.displayName.trim() || null,
          }),
          ...(input.bioShort !== undefined && {
            bioShort: input.bioShort.trim() || null,
          }),
          ...(input.bioLong !== undefined && {
            bioLong: input.bioLong.trim() || null,
          }),
          ...(input.city !== undefined && { city: input.city.trim() || null }),
          ...(input.country !== undefined && {
            country: input.country.trim() || null,
          }),
          ...(input.homeLat !== undefined && { homeLat: input.homeLat }),
          ...(input.homeLng !== undefined && { homeLng: input.homeLng }),
          ...(input.coverUrl !== undefined && {
            coverUrl: input.coverUrl.trim() || null,
          }),
          ...(input.speaks !== undefined && { speaks: input.speaks }),
          ...(input.interests !== undefined && { interests: input.interests }),
          ...(input.preferredMode !== undefined && {
            preferredMode: input.preferredMode,
          }),
          ...(input.preferredMaxDistanceKm !== undefined && {
            preferredMaxDistanceKm: input.preferredMaxDistanceKm,
          }),
          updatedAt: new Date(),
        },
      });

      return profile;
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
        },
      });

      return privacy;
    }
  );

// =============================================================================
// User Disciplines
// =============================================================================

export const upsertUserDisciplineMutation: MutationResolvers['upsertUserDiscipline'] =
  resolverWithMetrics(
    'Mutation',
    'upsertUserDiscipline',
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

      // Upsert discipline
      const discipline = input.id
        ? await prisma.userDiscipline.update({
            where: { id: input.id },
            data: {
              level: input.level,
              notes: input.notes?.trim() || null,
              updatedAt: new Date(),
            },
            include: { category: true },
          })
        : await prisma.userDiscipline.upsert({
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

      return discipline;
    }
  );

export const removeUserDisciplineMutation: MutationResolvers['removeUserDiscipline'] =
  resolverWithMetrics(
    'Mutation',
    'removeUserDiscipline',
    async (_parent, { id }, { user }) => {
      if (!user) {
        throw new GraphQLError('Unauthorized', {
          extensions: { code: 'UNAUTHORIZED' },
        });
      }

      // Check ownership
      const discipline = await prisma.userDiscipline.findUnique({
        where: { id },
      });

      if (!discipline) {
        throw new GraphQLError('Discipline not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      if (discipline.userId !== user.id) {
        throw new GraphQLError('Forbidden', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      await prisma.userDiscipline.delete({ where: { id } });

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
