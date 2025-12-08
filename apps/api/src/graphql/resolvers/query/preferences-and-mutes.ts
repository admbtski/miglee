/**
 * Notification Preferences & Mutes Query Resolvers
 */

import type { Prisma } from '@prisma/client';
import { GraphQLError } from 'graphql';
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
 */
export const myNotificationPreferencesQuery: QueryResolvers['myNotificationPreferences'] =
  resolverWithMetrics(
    'Query',
    'myNotificationPreferences',
    async (_p, _args, { user }) => {
      if (!user?.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      // Find or create preferences
      let preferences = await prisma.notificationPreference.findUnique({
        where: { userId: user.id },
        include: NOTIFICATION_PREFERENCE_INCLUDE,
      });

      if (!preferences) {
        // Create default preferences
        preferences = await prisma.notificationPreference.create({
          data: {
            userId: user.id,
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
 */
export const eventMuteQuery: QueryResolvers['eventMute'] = resolverWithMetrics(
  'Query',
  'eventMute',
  async (_p, { eventId }, { user }) => {
    if (!user?.id) {
      throw new GraphQLError('Authentication required.', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    const mute = await prisma.eventMute.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId: user.id,
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
 */
export const dmMuteQuery: QueryResolvers['dmMute'] = resolverWithMetrics(
  'Query',
  'dmMute',
  async (_p, { threadId }, { user }) => {
    if (!user?.id) {
      throw new GraphQLError('Authentication required.', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    const mute = await prisma.dmMute.findUnique({
      where: {
        threadId_userId: {
          threadId,
          userId: user.id,
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
