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
  mapIntentMute,
  mapDmMute,
  type NotificationPreferenceWithGraph,
  type IntentMuteWithGraph,
  type DmMuteWithGraph,
} from '../helpers';

const NOTIFICATION_PREFERENCE_INCLUDE = {
  user: true,
} satisfies Prisma.NotificationPreferenceInclude;

const INTENT_MUTE_INCLUDE = {
  intent: true,
  user: true,
} satisfies Prisma.IntentMuteInclude;

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

      const data: Prisma.NotificationPreferenceUpdateInput = {};
      if (input.emailOnInvite !== undefined)
        data.emailOnInvite = input.emailOnInvite;
      if (input.emailOnJoinRequest !== undefined)
        data.emailOnJoinRequest = input.emailOnJoinRequest;
      if (input.emailOnMessage !== undefined)
        data.emailOnMessage = input.emailOnMessage;
      if (input.pushOnReminder !== undefined)
        data.pushOnReminder = input.pushOnReminder;
      if (input.inAppOnEverything !== undefined)
        data.inAppOnEverything = input.inAppOnEverything;

      const preferences = await prisma.notificationPreference.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          ...data,
        },
        update: data,
        include: NOTIFICATION_PREFERENCE_INCLUDE,
      });

      return mapNotificationPreference(
        preferences as NotificationPreferenceWithGraph
      );
    }
  );

/**
 * Mutation: Mute/unmute intent
 */
export const muteIntentMutation: MutationResolvers['muteIntent'] =
  resolverWithMetrics(
    'Mutation',
    'muteIntent',
    async (_p, { intentId, muted }, { user }) => {
      if (!user?.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const intentMute = await prisma.intentMute.upsert({
        where: {
          intentId_userId: {
            intentId,
            userId: user.id,
          },
        },
        create: {
          intentId,
          userId: user.id,
          muted,
        },
        update: {
          muted,
        },
        include: INTENT_MUTE_INCLUDE,
      });

      return mapIntentMute(intentMute as IntentMuteWithGraph);
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

      return mapDmMute(dmMute as DmMuteWithGraph);
    }
  );
