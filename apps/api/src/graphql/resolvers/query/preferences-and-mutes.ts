/**
 * Notification Preferences & Mutes Query Resolvers
 *
 * Authorization: AUTH (SELF)
 */

import type { Prisma } from '../../../prisma-client/client';
import { prisma } from '../../../lib/prisma';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import type { QueryResolvers } from '../../__generated__/resolvers-types';
import {
  mapNotificationPreference,
  mapEventMute,
  mapDmMute,
  type NotificationPreferenceWithGraph,
  type EventMuteWithGraph,
  type DmMuteWithGraph,
} from '../helpers';
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
 * Query: Get my notification preferences
 * Authorization: AUTH (SELF)
 */
export const myNotificationPreferencesQuery: QueryResolvers['myNotificationPreferences'] =
  resolverWithMetrics(
    'Query',
    'myNotificationPreferences',
    async (_p, _args, ctx) => {
      const userId = requireAuth(ctx);

      // Find or create preferences
      let preferences = await prisma.notificationPreference.findUnique({
        where: { userId },
        include: NOTIFICATION_PREFERENCE_INCLUDE,
      });

      if (!preferences) {
        // Create default preferences
        preferences = await prisma.notificationPreference.create({
          data: {
            userId,
            emailOnInvite: true,
            emailOnJoinRequest: true,
            emailOnMessage: false,
            pushOnReminder: true,
            inAppOnEverything: true,
          },
          include: NOTIFICATION_PREFERENCE_INCLUDE,
        });
      }

      return mapNotificationPreference(
        preferences as NotificationPreferenceWithGraph
      );
    }
  );

/**
 * Query: Get event mute status
 * Authorization: AUTH (SELF)
 */
export const eventMuteQuery: QueryResolvers['eventMute'] = resolverWithMetrics(
  'Query',
  'eventMute',
  async (_p, { eventId }, ctx) => {
    const userId = requireAuth(ctx);

    const mute = await prisma.eventMute.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
      },
      include: EVENT_MUTE_INCLUDE,
    });

    if (!mute) {
      return null;
    }

    return mapEventMute(mute as EventMuteWithGraph);
  }
);

/**
 * Query: Get DM thread mute status
 * Authorization: AUTH (SELF)
 */
export const dmMuteQuery: QueryResolvers['dmMute'] = resolverWithMetrics(
  'Query',
  'dmMute',
  async (_p, { threadId }, ctx) => {
    const userId = requireAuth(ctx);

    const mute = await prisma.dmMute.findUnique({
      where: {
        threadId_userId: {
          threadId,
          userId,
        },
      },
      include: DM_MUTE_INCLUDE,
    });

    if (!mute) {
      return null;
    }

    return mapDmMute(mute as DmMuteWithGraph);
  }
);
