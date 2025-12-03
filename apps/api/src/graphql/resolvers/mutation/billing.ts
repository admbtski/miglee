/**
 * Billing Mutation Resolvers
 * Handles mutations for subscriptions, one-off payments, and event sponsorships
 */

import type { MutationResolvers } from '../../__generated__/resolvers-types';
import { prisma } from '../../../lib/prisma';
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
  getReceiptUrlFromPaymentIntent,
  getInvoiceUrlFromSubscription,
} from '../../../lib/billing/stripe.service';
import { logger } from '../../../lib/pino';

/**
 * Create checkout session for user subscription (auto-renewable)
 */
export const createSubscriptionCheckoutMutation: MutationResolvers['createSubscriptionCheckout'] =
  async (_parent, args, { user }) => {
    const userId = user?.id;
    const { input } = args;

    if (!userId) {
      throw new Error('Authentication required');
    }

    logger.info(
      { userId, plan: input.plan, billingPeriod: input.billingPeriod },
      'Creating subscription checkout'
    );

    const result = await createSubscriptionCheckout({
      userId,
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
  };

/**
 * Create checkout session for one-off payment (month or year)
 */
export const createOneOffCheckoutMutation: MutationResolvers['createOneOffCheckout'] =
  async (_parent, args, { user }) => {
    const userId = user?.id;
    const { input } = args;

    if (!userId) {
      throw new Error('Authentication required');
    }

    logger.info(
      { userId, plan: input.plan, billingPeriod: input.billingPeriod },
      'Creating one-off checkout'
    );

    const result = await createOneOffCheckout({
      userId,
      userEmail: user.email,
      userName: user.name,
      plan: input.plan,
      billingPeriod: input.billingPeriod,
    });

    return {
      checkoutUrl: result.checkoutUrl,
      sessionId: result.sessionId,
    };
  };

/**
 * Create checkout session for event sponsorship
 */
export const createEventSponsorshipCheckoutMutation: MutationResolvers['createEventSponsorshipCheckout'] =
  async (_parent, args, { user }) => {
    const userId = user?.id;
    const { input } = args;

    if (!userId || !user) {
      throw new Error('Authentication required');
    }

    if (input.plan === 'FREE') {
      throw new Error('Cannot purchase FREE plan for event sponsorship');
    }

    logger.info(
      {
        userId,
        intentId: input.intentId,
        plan: input.plan,
        actionType: input.actionType,
        actionPackageSize: input.actionPackageSize,
      },
      'Creating event sponsorship checkout'
    );

    const result = await createEventSponsorshipCheckout({
      intentId: input.intentId,
      userId,
      userEmail: user.email,
      userName: user.name,
      plan: input.plan,
      actionType: input.actionType as 'new' | 'upgrade' | 'reload' | undefined,
      actionPackageSize: input.actionPackageSize as 1 | 3 | 5 | undefined,
    });

    return {
      checkoutUrl: result.checkoutUrl,
      sessionId: result.sessionId,
      sponsorshipId: result.sponsorshipId,
    };
  };

/**
 * Cancel user subscription (at period end or immediately)
 */
export const cancelSubscriptionMutation: MutationResolvers['cancelSubscription'] =
  async (_parent, args, { user }) => {
    const userId = user?.id;
    const { immediately = false } = args;

    if (!userId) {
      throw new Error('Authentication required');
    }

    logger.info({ userId, immediately }, 'Canceling subscription');

    await cancelSubscription(userId, immediately);

    return true;
  };

/**
 * Reactivate a subscription that was set to cancel at period end
 */
export const reactivateSubscriptionMutation: MutationResolvers['reactivateSubscription'] =
  async (_parent, _args, { user }) => {
    const userId = user?.id;

    if (!userId) {
      throw new Error('Authentication required');
    }

    logger.info({ userId }, 'Reactivating subscription');

    await reactivateSubscription(userId);

    return true;
  };

/**
 * Use a boost for event sponsorship
 */
export const useBoostMutation: MutationResolvers['useBoost'] = async (
  _parent,
  args,
  { user }
) => {
  const userId = user?.id;
  const { intentId } = args;

  if (!userId) {
    throw new Error('Authentication required');
  }

  // Verify user is owner/moderator of the intent
  const member = await prisma.intentMember.findFirst({
    where: {
      intentId,
      userId,
      role: { in: ['OWNER', 'MODERATOR'] },
      status: 'JOINED',
    },
  });

  if (!member) {
    throw new Error('Only intent owner/moderator can use boosts');
  }

  logger.info({ userId, intentId }, 'Using boost');

  await useBoost(intentId);

  return true;
};

/**
 * Use a local push notification for event sponsorship
 */
export const useLocalPushMutation: MutationResolvers['useLocalPush'] = async (
  _parent,
  args,
  { user }
) => {
  const userId = user?.id;
  const { intentId } = args;

  if (!userId) {
    throw new Error('Authentication required');
  }

  // Verify user is owner/moderator of the intent
  const member = await prisma.intentMember.findFirst({
    where: {
      intentId,
      userId,
      role: { in: ['OWNER', 'MODERATOR'] },
      status: 'JOINED',
    },
  });

  if (!member) {
    throw new Error('Only intent owner/moderator can use local pushes');
  }

  logger.info({ userId, intentId }, 'Using local push');

  await useLocalPush(intentId);

  return true;
};

/**
 * Get receipt URL for a user plan period
 */
export const getUserPlanReceiptUrlMutation: MutationResolvers['getUserPlanReceiptUrl'] =
  async (_parent, args, { user }) => {
    const userId = user?.id;
    const { periodId } = args;

    if (!userId) {
      throw new Error('Authentication required');
    }

    // Find the period and verify it belongs to the user
    const period = await prisma.userPlanPeriod.findUnique({
      where: { id: periodId },
    });

    if (!period || period.userId !== userId) {
      throw new Error('Period not found or unauthorized');
    }

    // Try to get receipt from payment intent (for one-off payments)
    if (period.stripePaymentIntentId) {
      const url = await getReceiptUrlFromPaymentIntent(
        period.stripePaymentIntentId
      );
      if (url) {
        logger.info({ userId, periodId, url }, 'Retrieved receipt URL');
        return url;
      }
    }

    // Try to get invoice from subscription
    if (period.stripeSubscriptionId) {
      const url = await getInvoiceUrlFromSubscription(
        period.stripeSubscriptionId
      );
      if (url) {
        logger.info({ userId, periodId, url }, 'Retrieved invoice URL');
        return url;
      }
    }

    logger.warn({ userId, periodId }, 'No receipt/invoice URL found');
    return null;
  };

/**
 * Get receipt URL for an event sponsorship period
 */
export const getEventSponsorshipReceiptUrlMutation: MutationResolvers['getEventSponsorshipReceiptUrl'] =
  async (_parent, args, { user }) => {
    const userId = user?.id;
    const { periodId } = args;

    if (!userId) {
      throw new Error('Authentication required');
    }

    // Find the period and verify it belongs to the user
    const period = await prisma.eventSponsorshipPeriod.findUnique({
      where: { id: periodId },
    });

    if (!period || period.sponsorId !== userId) {
      throw new Error('Period not found or unauthorized');
    }

    // Try to get receipt from payment intent
    if (period.stripePaymentIntentId) {
      const url = await getReceiptUrlFromPaymentIntent(
        period.stripePaymentIntentId
      );
      if (url) {
        logger.info({ userId, periodId, url }, 'Retrieved receipt URL');
        return url;
      }
    }

    logger.warn({ userId, periodId }, 'No receipt URL found');
    return null;
  };
