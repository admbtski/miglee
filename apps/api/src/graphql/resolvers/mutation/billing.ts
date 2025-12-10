/**
 * Billing Mutation Resolvers
 * Handles mutations for subscriptions, one-off payments, and event sponsorships
 */

import { GraphQLError } from 'graphql';
import type { MutationResolvers } from '../../__generated__/resolvers-types';
import { prisma } from '../../../lib/prisma';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import {
  createSubscriptionCheckout,
  createOneOffCheckout,
  cancelSubscription,
  reactivateSubscription,
  createEventSponsorshipCheckout,
  useBoost,
  useLocalPush,
} from '../../../lib/billing';
import {
  getReceiptUrlFromPaymentEvent,
  getInvoiceUrlFromSubscription,
} from '../../../lib/billing/stripe.service';
import { logger } from '../../../lib/pino';
import { isAdminOrModerator } from '../shared/auth-guards';

/**
 * Create checkout session for user subscription (auto-renewable)
 */
export const createSubscriptionCheckoutMutation: MutationResolvers['createSubscriptionCheckout'] =
  resolverWithMetrics(
    'Mutation',
    'createSubscriptionCheckout',
    async (_parent, args, { user }) => {
      if (!user?.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const { input } = args;

      logger.info(
        {
          userId: user.id,
          plan: input.plan,
          billingPeriod: input.billingPeriod,
        },
        'Creating subscription checkout'
      );

      const result = await createSubscriptionCheckout({
        userId: user.id,
        userEmail: user.email,
        userName: user.name,
        plan: input.plan,
        billingPeriod: input.billingPeriod,
        withTrial: input.withTrial ?? true,
      });

      return {
        checkoutUrl: result.checkoutUrl,
        sessionId: result.sessionId,
      };
    }
  );

/**
 * Create checkout session for one-off payment (month or year)
 */
export const createOneOffCheckoutMutation: MutationResolvers['createOneOffCheckout'] =
  resolverWithMetrics(
    'Mutation',
    'createOneOffCheckout',
    async (_parent, args, { user }) => {
      if (!user?.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const { input } = args;

      logger.info(
        {
          userId: user.id,
          plan: input.plan,
          billingPeriod: input.billingPeriod,
        },
        'Creating one-off checkout'
      );

      const result = await createOneOffCheckout({
        userId: user.id,
        userEmail: user.email,
        userName: user.name,
        plan: input.plan,
        billingPeriod: input.billingPeriod,
      });

      return {
        checkoutUrl: result.checkoutUrl,
        sessionId: result.sessionId,
      };
    }
  );

/**
 * Create checkout session for event sponsorship
 */
export const createEventSponsorshipCheckoutMutation: MutationResolvers['createEventSponsorshipCheckout'] =
  resolverWithMetrics(
    'Mutation',
    'createEventSponsorshipCheckout',
    async (_parent, args, { user }) => {
      if (!user?.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const { input } = args;

      if (input.plan === 'FREE') {
        throw new GraphQLError(
          'Cannot purchase FREE plan for event sponsorship.',
          {
            extensions: { code: 'BAD_USER_INPUT', field: 'plan' },
          }
        );
      }

      logger.info(
        {
          userId: user.id,
          eventId: input.eventId,
          plan: input.plan,
          actionType: input.actionType,
          actionPackageSize: input.actionPackageSize,
        },
        'Creating event sponsorship checkout'
      );

      const result = await createEventSponsorshipCheckout({
        eventId: input.eventId,
        userId: user.id,
        userEmail: user.email,
        userName: user.name,
        plan: input.plan,
        actionType: input.actionType as
          | 'new'
          | 'upgrade'
          | 'reload'
          | undefined,
        actionPackageSize: input.actionPackageSize as 1 | 3 | 5 | undefined,
      });

      return {
        checkoutUrl: result.checkoutUrl,
        sessionId: result.sessionId,
        sponsorshipId: result.sponsorshipId,
      };
    }
  );

/**
 * Cancel user subscription (at period end or immediately)
 */
export const cancelSubscriptionMutation: MutationResolvers['cancelSubscription'] =
  resolverWithMetrics(
    'Mutation',
    'cancelSubscription',
    async (_parent, args, { user }) => {
      if (!user?.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const { immediately = false } = args;

      logger.info({ userId: user.id, immediately }, 'Canceling subscription');

      await cancelSubscription(user.id, immediately);

      return true;
    }
  );

/**
 * Reactivate a subscription that was set to cancel at period end
 */
export const reactivateSubscriptionMutation: MutationResolvers['reactivateSubscription'] =
  resolverWithMetrics(
    'Mutation',
    'reactivateSubscription',
    async (_parent, _args, { user }) => {
      if (!user?.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      logger.info({ userId: user.id }, 'Reactivating subscription');

      await reactivateSubscription(user.id);

      return true;
    }
  );

/**
 * Use a boost for event sponsorship
 */
export const useBoostMutation: MutationResolvers['useBoost'] =
  resolverWithMetrics(
    'Mutation',
    'useBoost',
    async (_parent, args, { user }) => {
      if (!user?.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const { eventId } = args;

      // EVENT_MOD_OR_OWNER or APP_MOD_OR_ADMIN
      if (!isAdminOrModerator(user)) {
        const member = await prisma.eventMember.findFirst({
          where: {
            eventId,
            userId: user.id,
            role: { in: ['OWNER', 'MODERATOR'] },
            status: 'JOINED',
          },
        });

        if (!member) {
          throw new GraphQLError('Only event owner/moderator can use boosts.', {
            extensions: { code: 'FORBIDDEN' },
          });
        }
      }

      logger.info({ userId: user.id, eventId }, 'Using boost');

      await useBoost(eventId);

      return true;
    }
  );

/**
 * Use a local push notification for event sponsorship
 */
export const useLocalPushMutation: MutationResolvers['useLocalPush'] =
  resolverWithMetrics(
    'Mutation',
    'useLocalPush',
    async (_parent, args, { user }) => {
      if (!user?.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const { eventId } = args;

      // EVENT_MOD_OR_OWNER or APP_MOD_OR_ADMIN
      if (!isAdminOrModerator(user)) {
        const member = await prisma.eventMember.findFirst({
          where: {
            eventId,
            userId: user.id,
            role: { in: ['OWNER', 'MODERATOR'] },
            status: 'JOINED',
          },
        });

        if (!member) {
          throw new GraphQLError(
            'Only event owner/moderator can use local pushes.',
            {
              extensions: { code: 'FORBIDDEN' },
            }
          );
        }
      }

      logger.info({ userId: user.id, eventId }, 'Using local push');

      await useLocalPush(eventId);

      return true;
    }
  );

/**
 * Get receipt URL for a user plan period
 */
export const getUserPlanReceiptUrlMutation: MutationResolvers['getUserPlanReceiptUrl'] =
  resolverWithMetrics(
    'Mutation',
    'getUserPlanReceiptUrl',
    async (_parent, args, { user }) => {
      if (!user?.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const { periodId } = args;

      // Find the period and verify it belongs to the user
      const period = await prisma.userPlanPeriod.findUnique({
        where: { id: periodId },
      });

      if (!period || period.userId !== user.id) {
        throw new GraphQLError('Period not found or unauthorized.', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Try to get receipt from payment event (for one-off payments)
      if (period.stripePaymentEventId) {
        const url = await getReceiptUrlFromPaymentEvent(
          period.stripePaymentEventId
        );
        if (url) {
          logger.info(
            { userId: user.id, periodId, url },
            'Retrieved receipt URL'
          );
          return url;
        }
      }

      // Try to get invoice from subscription
      if (period.stripeSubscriptionId) {
        const url = await getInvoiceUrlFromSubscription(
          period.stripeSubscriptionId
        );
        if (url) {
          logger.info(
            { userId: user.id, periodId, url },
            'Retrieved invoice URL'
          );
          return url;
        }
      }

      logger.warn(
        { userId: user.id, periodId },
        'No receipt/invoice URL found'
      );
      return null;
    }
  );

/**
 * Get receipt URL for an event sponsorship period
 */
export const getEventSponsorshipReceiptUrlMutation: MutationResolvers['getEventSponsorshipReceiptUrl'] =
  resolverWithMetrics(
    'Mutation',
    'getEventSponsorshipReceiptUrl',
    async (_parent, args, { user }) => {
      if (!user?.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const { periodId } = args;

      // Find the period and verify it belongs to the user
      const period = await prisma.eventSponsorshipPeriod.findUnique({
        where: { id: periodId },
      });

      if (!period || period.sponsorId !== user.id) {
        throw new GraphQLError('Period not found or unauthorized.', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Try to get receipt from payment event
      if (period.stripePaymentEventId) {
        const url = await getReceiptUrlFromPaymentEvent(
          period.stripePaymentEventId
        );
        if (url) {
          logger.info(
            { userId: user.id, periodId, url },
            'Retrieved receipt URL'
          );
          return url;
        }
      }

      logger.warn({ userId: user.id, periodId }, 'No receipt URL found');
      return null;
    }
  );
