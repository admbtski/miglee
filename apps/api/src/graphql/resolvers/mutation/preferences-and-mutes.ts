/**
 * Notification Preferences & Mutes Mutation Resolvers
 */

import type { Prisma } from '@prisma/client';
import { GraphQLError } from 'graphql';
import { prisma } from '../../../lib/prisma';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import type { MutationResolvers } from '../../__generated__/resolvers-types';
import {
  mapNotificationPreference,
  mapEventMute,
  mapDmMute,
  type NotificationPreferenceWithGraph,
  type EventMuteWithGraph,
  type DmMuteWithGraph,
} from '../helpers';

const NOTIFICATION_PREFERENCE_INCLUDE = {
  user: true,
} satisfies Prisma.NotificationPreferenceInclude;

const EVENT_MUTE_INCLUDE = {
  event: true,
  user: true,
} satisfies Prisma.EventMuteInclude;

const DM_MUTE_INCLUDE = {
  thread: {
    include: {
      aUser: true,
      bUser: true,
    },
  },
  user: true,
} satisfies Prisma.DmMuteInclude;

/**
 * Mutation: Update notification preferences
 */
export const updateNotificationPreferencesMutation: MutationResolvers['updateNotificationPreferences'] =
  resolverWithMetrics(
    'Mutation',
    'updateNotificationPreferences',
    async (_p, { input }, { user }) => {
      if (!user?.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      // Build update/create data
      const updateData: Prisma.NotificationPreferenceUpdateInput = {};
      if (input.emailOnInvite !== undefined && input.emailOnInvite !== null)
        updateData.emailOnInvite = input.emailOnInvite;
      if (
        input.emailOnJoinRequest !== undefined &&
        input.emailOnJoinRequest !== null
      )
        updateData.emailOnJoinRequest = input.emailOnJoinRequest;
      if (input.emailOnMessage !== undefined && input.emailOnMessage !== null)
        updateData.emailOnMessage = input.emailOnMessage;
      if (input.pushOnReminder !== undefined && input.pushOnReminder !== null)
        updateData.pushOnReminder = input.pushOnReminder;
      if (
        input.inAppOnEverything !== undefined &&
        input.inAppOnEverything !== null
      )
        updateData.inAppOnEverything = input.inAppOnEverything;

      // For create, we need plain values (not field update operations)
      const createData: Prisma.NotificationPreferenceCreateInput = {
        user: { connect: { id: user.id } },
        emailOnInvite: input.emailOnInvite ?? undefined,
        emailOnJoinRequest: input.emailOnJoinRequest ?? undefined,
        emailOnMessage: input.emailOnMessage ?? undefined,
        pushOnReminder: input.pushOnReminder ?? undefined,
        inAppOnEverything: input.inAppOnEverything ?? undefined,
      };

      const preferences = await prisma.notificationPreference.upsert({
        where: { userId: user.id },
        create: createData,
        update: updateData,
        include: NOTIFICATION_PREFERENCE_INCLUDE,
      });

      return mapNotificationPreference(preferences);
    }
  );

/**
 * Mutation: Mute/unmute event
 */
export const muteEventMutation: MutationResolvers['muteEvent'] =
  resolverWithMetrics(
    'Mutation',
    'muteEvent',
    async (_p, { eventId, muted }, { user }) => {
      if (!user?.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const eventMute = await prisma.eventMute.upsert({
        where: {
          eventId_userId: {
            eventId,
            userId: user.id,
          },
        },
        create: {
          eventId,
          userId: user.id,
          muted,
        },
        update: {
          muted,
        },
        include: EVENT_MUTE_INCLUDE,
      });

      return mapEventMute(eventMute);
    }
  );

/**
 * Mutation: Mute/unmute DM thread
 */
export const muteDmThreadMutation: MutationResolvers['muteDmThread'] =
  resolverWithMetrics(
    'Mutation',
    'muteDmThread',
    async (_p, { threadId, muted }, { user }) => {
      if (!user?.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const dmMute = await prisma.dmMute.upsert({
        where: {
          threadId_userId: {
            threadId,
            userId: user.id,
          },
        },
        create: {
          threadId,
          userId: user.id,
          muted,
        },
        update: {
          muted,
        },
        include: DM_MUTE_INCLUDE,
      });

      return mapDmMute(dmMute);
    }
  );
