/**
 * Notification Preferences & Mutes Mutation Resolvers
 *
 * Authorization: AUTH (SELF)
 */

import type { Prisma } from '../../../prisma-client/client';
import { prisma } from '../../../lib/prisma';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import type { MutationResolvers } from '../../__generated__/resolvers-types';
import { mapNotificationPreference, mapEventMute, mapDmMute } from '../helpers';
import { requireAuth } from '../shared/auth-guards';

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
 * Authorization: AUTH (SELF)
 */
export const updateNotificationPreferencesMutation: MutationResolvers['updateNotificationPreferences'] =
  resolverWithMetrics(
    'Mutation',
    'updateNotificationPreferences',
    async (_p, { input }, ctx) => {
      const userId = requireAuth(ctx);

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
        user: { connect: { id: userId } },
        emailOnInvite: input.emailOnInvite ?? undefined,
        emailOnJoinRequest: input.emailOnJoinRequest ?? undefined,
        emailOnMessage: input.emailOnMessage ?? undefined,
        pushOnReminder: input.pushOnReminder ?? undefined,
        inAppOnEverything: input.inAppOnEverything ?? undefined,
      };

      const preferences = await prisma.notificationPreference.upsert({
        where: { userId },
        create: createData,
        update: updateData,
        include: NOTIFICATION_PREFERENCE_INCLUDE,
      });

      return mapNotificationPreference(preferences);
    }
  );

/**
 * Mutation: Mute/unmute event
 * Authorization: AUTH (SELF)
 */
export const muteEventMutation: MutationResolvers['muteEvent'] =
  resolverWithMetrics(
    'Mutation',
    'muteEvent',
    async (_p, { eventId, muted }, ctx) => {
      const userId = requireAuth(ctx);

      const eventMute = await prisma.eventMute.upsert({
        where: {
          eventId_userId: { eventId, userId },
        },
        create: { eventId, userId, muted },
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
 * Authorization: AUTH (SELF)
 */
export const muteDmThreadMutation: MutationResolvers['muteDmThread'] =
  resolverWithMetrics(
    'Mutation',
    'muteDmThread',
    async (_p, { threadId, muted }, ctx) => {
      const userId = requireAuth(ctx);

      const dmMute = await prisma.dmMute.upsert({
        where: {
          threadId_userId: { threadId, userId },
        },
        create: { threadId, userId, muted },
        update: { muted },
        include: DM_MUTE_INCLUDE,
      });

      return mapDmMute(dmMute);
    }
  );
