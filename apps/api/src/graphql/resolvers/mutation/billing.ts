/**
 * Billing Mutation Resolvers
 * Handles mutations for subscriptions, one-off payments, and event sponsorships
 *
 * OBSERVABILITY: All mutations are instrumented with:
 * - Metrics: billing.checkout.created/failed, billing.subscription.*, billing.boost.used
 * - Tracing: spans for all Stripe operations
 * - Audit logs: structured logs for compliance
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
import { assertBillingRateLimit } from '../../../lib/rate-limit/domainRateLimiter';
import {
  trackCheckout,
  trackSubscriptionCanceled,
  trackSubscriptionReactivated,
  trackBoostUsed,
  trackLocalPushUsed,
  traceBillingOperation,
} from '../../../lib/observability';

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

      // RATE LIMIT: Protect Stripe from spam
      await assertBillingRateLimit(user.id);

      const { input } = args;

      return traceBillingOperation(
        'createSubscriptionCheckout',
        { userId: user.id },
        async (span) => {
          span.setAttribute('billing.plan', input.plan);
          span.setAttribute('billing.period', input.billingPeriod);

          try {
            const result = await createSubscriptionCheckout({
              userId: user.id,
              userEmail: user.email,
              userName: user.name,
              plan: input.plan,
              billingPeriod: input.billingPeriod,
              withTrial: input.withTrial ?? true,
            });

            // Track successful checkout
            trackCheckout('created', {
              userId: user.id,
              type: 'subscription',
              plan: input.plan,
            });

            return {
              checkoutUrl: result.checkoutUrl,
              sessionId: result.sessionId,
            };
          } catch (error) {
            // Track failed checkout
            trackCheckout(
              'failed',
              {
                userId: user.id,
                type: 'subscription',
                plan: input.plan,
              },
              error instanceof Error ? error.message : 'unknown'
            );

            throw error;
          }
        }
      );
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

      // RATE LIMIT: Protect Stripe from spam
      await assertBillingRateLimit(user.id);

      const { input } = args;

      return traceBillingOperation(
        'createOneOffCheckout',
        { userId: user.id },
        async (span) => {
          span.setAttribute('billing.plan', input.plan);
          span.setAttribute('billing.period', input.billingPeriod);

          try {
            const result = await createOneOffCheckout({
              userId: user.id,
              userEmail: user.email,
              userName: user.name,
              plan: input.plan,
              billingPeriod: input.billingPeriod,
            });

            trackCheckout('created', {
              userId: user.id,
              type: 'one_off',
              plan: input.plan,
            });

            return {
              checkoutUrl: result.checkoutUrl,
              sessionId: result.sessionId,
            };
          } catch (error) {
            trackCheckout(
              'failed',
              {
                userId: user.id,
                type: 'one_off',
                plan: input.plan,
              },
              error instanceof Error ? error.message : 'unknown'
            );

            throw error;
          }
        }
      );
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

      // RATE LIMIT: Protect Stripe from spam
      await assertBillingRateLimit(user.id);

      const { input } = args;

      if (input.plan === 'FREE') {
        trackCheckout(
          'failed',
          {
            userId: user.id,
            type: 'event_sponsorship',
            plan: input.plan,
            eventId: input.eventId,
          },
          'free_plan_not_allowed'
        );

        throw new GraphQLError(
          'Cannot purchase FREE plan for event sponsorship.',
          {
            extensions: { code: 'BAD_USER_INPUT', field: 'plan' },
          }
        );
      }

      return traceBillingOperation(
        'createEventSponsorshipCheckout',
        { userId: user.id },
        async (span) => {
          span.setAttribute('billing.plan', input.plan);
          span.setAttribute('billing.event_id', input.eventId);
          if (input.actionType)
            span.setAttribute('billing.action_type', input.actionType);

          try {
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
              actionPackageSize: input.actionPackageSize as
                | 1
                | 3
                | 5
                | undefined,
            });

            trackCheckout('created', {
              userId: user.id,
              type: 'event_sponsorship',
              plan: input.plan,
              eventId: input.eventId,
            });

            return {
              checkoutUrl: result.checkoutUrl,
              sessionId: result.sessionId,
              sponsorshipId: result.sponsorshipId,
            };
          } catch (error) {
            trackCheckout(
              'failed',
              {
                userId: user.id,
                type: 'event_sponsorship',
                plan: input.plan,
                eventId: input.eventId,
              },
              error instanceof Error ? error.message : 'unknown'
            );

            throw error;
          }
        }
      );
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

      // RATE LIMIT: Protect Stripe from spam
      await assertBillingRateLimit(user.id);

      const { immediately = false } = args;

      return traceBillingOperation(
        'cancelSubscription',
        { userId: user.id },
        async (span) => {
          span.setAttribute('billing.immediately', immediately);

          // Get current subscription for tracking
          const subscription = await prisma.userSubscription.findFirst({
            where: { userId: user.id },
          });

          await cancelSubscription(user.id, immediately);

          trackSubscriptionCanceled({
            userId: user.id,
            subscriptionId: subscription?.stripeSubscriptionId || 'unknown',
            plan: subscription?.plan || 'unknown',
            reason: immediately ? 'immediate' : 'at_period_end',
          });

          return true;
        }
      );
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

      // RATE LIMIT: Protect Stripe from spam
      await assertBillingRateLimit(user.id);

      return traceBillingOperation(
        'reactivateSubscription',
        { userId: user.id },
        async () => {
          // Get current subscription for tracking
          const subscription = await prisma.userSubscription.findFirst({
            where: { userId: user.id },
          });

          await reactivateSubscription(user.id);

          trackSubscriptionReactivated({
            userId: user.id,
            subscriptionId: subscription?.stripeSubscriptionId || 'unknown',
            plan: subscription?.plan || 'unknown',
          });

          return true;
        }
      );
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

      return traceBillingOperation(
        'useBoost',
        { userId: user.id },
        async (span) => {
          span.setAttribute('billing.event_id', eventId);

          // Get remaining boosts before use
          const sponsorship = await prisma.eventSponsorship.findUnique({
            where: { eventId },
            select: { boostsTotal: true, boostsUsed: true },
          });

          await useBoost(eventId);

          const remaining = sponsorship
            ? sponsorship.boostsTotal - sponsorship.boostsUsed - 1
            : 0;

          trackBoostUsed({
            userId: user.id,
            eventId,
            remaining: Math.max(0, remaining),
          });

          return true;
        }
      );
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

      return traceBillingOperation(
        'useLocalPush',
        { userId: user.id },
        async (span) => {
          span.setAttribute('billing.event_id', eventId);

          // Get remaining local pushes before use
          const sponsorship = await prisma.eventSponsorship.findUnique({
            where: { eventId },
            select: { localPushesTotal: true, localPushesUsed: true },
          });

          await useLocalPush(eventId);

          const remaining = sponsorship
            ? sponsorship.localPushesTotal - sponsorship.localPushesUsed - 1
            : 0;

          trackLocalPushUsed({
            userId: user.id,
            eventId,
            remaining: Math.max(0, remaining),
          });

          return true;
        }
      );
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
