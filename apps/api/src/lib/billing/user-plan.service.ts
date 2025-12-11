/**
 * User Plan Service
 * Handles user subscription logic and plan periods
 */

import type {
  SubscriptionPlan,
  UserPlanSource,
  BillingPeriod,
} from '@prisma/client';
import { prisma } from '../prisma';
import { logger } from '../pino';
import {
  getStripe,
  getOrCreateStripeCustomer,
  addMonths,
  addYears,
} from './stripe.service';
import {
  PLAN_LEVEL,
  METADATA_TYPE,
  getCheckoutSuccessUrl,
  getCheckoutCancelUrl,
  CHECKOUT_SESSION_CONFIG,
  type UserSubscriptionMetadata,
  type UserOneOffMetadata,
} from './constants';
import { config } from '../../env';

// ========================================================================================
// GET EFFECTIVE USER PLAN
// ========================================================================================

export type UserEffectivePlan = 'FREE' | 'PLUS' | 'PRO';

export interface UserPlanInfo {
  plan: UserEffectivePlan;
  planEndsAt: Date | null;
  source: UserPlanSource | null;
  billingPeriod: BillingPeriod | null;
}

/**
 * Get user's current effective plan based on active plan periods
 * Algorithm:
 * 1. Get all periods where now() is between startsAt and endsAt
 * 2. If no active periods -> FREE
 * 3. If multiple periods -> select highest plan level (PRO > PLUS)
 * 4. If same level -> select the one with latest endsAt
 */
export async function getUserEffectivePlan(
  userId: string,
  now = new Date()
): Promise<UserPlanInfo> {
  const activePeriods = await prisma.userPlanPeriod.findMany({
    where: {
      userId,
      startsAt: { lte: now },
      endsAt: { gt: now },
    },
    orderBy: [{ endsAt: 'desc' }],
  });

  if (activePeriods.length === 0) {
    return {
      plan: 'FREE',
      planEndsAt: null,
      source: null,
      billingPeriod: null,
    };
  }

  // Find highest level plan
  const selectedPeriod = activePeriods.reduce((best, current) => {
    const bestLevel = PLAN_LEVEL[best.plan];
    const currentLevel = PLAN_LEVEL[current.plan];

    if (currentLevel > bestLevel) {
      return current;
    }
    if (currentLevel === bestLevel && current.endsAt > best.endsAt) {
      return current;
    }
    return best;
  });

  return {
    plan: selectedPeriod.plan,
    planEndsAt: selectedPeriod.endsAt,
    source: selectedPeriod.source,
    billingPeriod: selectedPeriod.billingPeriod,
  };
}

// ========================================================================================
// CREATE SUBSCRIPTION CHECKOUT
// ========================================================================================

export interface CreateSubscriptionCheckoutParams {
  userId: string;
  userEmail: string;
  userName: string;
  plan: SubscriptionPlan;
  billingPeriod: BillingPeriod;
  withTrial?: boolean;
}

export async function createSubscriptionCheckout(
  params: CreateSubscriptionCheckoutParams
): Promise<{ checkoutUrl: string; sessionId: string }> {
  const { userId, userEmail, userName, plan, billingPeriod } = params;

  const stripe = getStripe();

  // Get or create Stripe customer
  const customerId = await getOrCreateStripeCustomer(
    userId,
    userEmail,
    userName
  );

  // Get price ID from config
  const priceId =
    billingPeriod === 'MONTHLY'
      ? config.stripePrices.user[plan.toLowerCase() as 'plus' | 'pro']
          .monthlySub
      : null; // We only support monthly subscriptions for now

  if (!priceId) {
    throw new Error(
      `Stripe price ID not configured for plan=${plan} billingPeriod=${billingPeriod}`
    );
  }

  // Prepare metadata
  const metadata: UserSubscriptionMetadata = {
    type: METADATA_TYPE.USER_SUBSCRIPTION,
    userId,
    plan,
    billingPeriod,
  };

  // Create checkout session - NO TRIAL
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    subscription_data: {
      metadata: metadata as unknown as Record<string, string>,
    },
    metadata: metadata as unknown as Record<string, string>,
    success_url: getCheckoutSuccessUrl(
      config.appUrl,
      METADATA_TYPE.USER_SUBSCRIPTION
    ),
    cancel_url: getCheckoutCancelUrl(
      config.appUrl,
      METADATA_TYPE.USER_SUBSCRIPTION
    ),
    allow_promotion_codes: CHECKOUT_SESSION_CONFIG.allowPromotionCodes,
    billing_address_collection:
      CHECKOUT_SESSION_CONFIG.billingAddressCollection,
    expires_at:
      Math.floor(Date.now() / 1000) + CHECKOUT_SESSION_CONFIG.expiresAfter,
  });

  logger.info(
    { userId, plan, billingPeriod, sessionId: session.id },
    'Created subscription checkout session'
  );

  if (!session.url) {
    throw new Error('Checkout session created but no URL returned');
  }

  return {
    checkoutUrl: session.url,
    sessionId: session.id,
  };
}

// ========================================================================================
// CREATE ONE-OFF PAYMENT CHECKOUT
// ========================================================================================

export interface CreateOneOffCheckoutParams {
  userId: string;
  userEmail: string;
  userName: string;
  plan: SubscriptionPlan;
  billingPeriod: BillingPeriod;
}

export async function createOneOffCheckout(
  params: CreateOneOffCheckoutParams
): Promise<{ checkoutUrl: string; sessionId: string }> {
  const { userId, userEmail, userName, plan, billingPeriod } = params;

  const stripe = getStripe();

  // Get or create Stripe customer
  const customerId = await getOrCreateStripeCustomer(
    userId,
    userEmail,
    userName
  );

  // Get price ID from config
  const planKey = plan.toLowerCase() as 'plus' | 'pro';
  const priceId =
    billingPeriod === 'MONTHLY'
      ? config.stripePrices.user[planKey].monthlyOneOff
      : config.stripePrices.user[planKey].yearlyOneOff;

  if (!priceId) {
    throw new Error(
      `Stripe price ID not configured for plan=${plan} billingPeriod=${billingPeriod} (one-off)`
    );
  }

  // Prepare metadata
  const metadata: UserOneOffMetadata = {
    type: METADATA_TYPE.USER_ONE_OFF,
    userId,
    plan,
    billingPeriod,
  };

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'payment',
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    metadata: metadata as unknown as Record<string, string>,
    payment_intent_data: {
      metadata: metadata as unknown as Record<string, string>,
    },
    success_url: getCheckoutSuccessUrl(
      config.appUrl,
      METADATA_TYPE.USER_ONE_OFF
    ),
    cancel_url: getCheckoutCancelUrl(config.appUrl, METADATA_TYPE.USER_ONE_OFF),
    allow_promotion_codes: CHECKOUT_SESSION_CONFIG.allowPromotionCodes,
    billing_address_collection:
      CHECKOUT_SESSION_CONFIG.billingAddressCollection,
    expires_at:
      Math.floor(Date.now() / 1000) + CHECKOUT_SESSION_CONFIG.expiresAfter,
  });

  logger.info(
    { userId, plan, billingPeriod, sessionId: session.id },
    'Created one-off checkout session'
  );

  if (!session.url) {
    throw new Error('Checkout session created but no URL returned');
  }

  return {
    checkoutUrl: session.url,
    sessionId: session.id,
  };
}

// ========================================================================================
// CANCEL SUBSCRIPTION
// ========================================================================================

export async function cancelSubscription(
  userId: string,
  cancelImmediately = false
): Promise<void> {
  // Find active subscription
  const subscription = await prisma.userSubscription.findFirst({
    where: {
      userId,
      status: { in: ['ACTIVE', 'TRIALING'] },
    },
  });

  if (!subscription || !subscription.stripeSubscriptionId) {
    throw new Error('No active subscription found');
  }

  const stripe = getStripe();

  if (cancelImmediately) {
    // Cancel immediately
    await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);

    await prisma.userSubscription.update({
      where: { id: subscription.id },
      data: {
        status: 'CANCELED',
        cancelAtPeriodEnd: false,
        canceledAt: new Date(),
      },
    });

    logger.info(
      { userId, subscriptionId: subscription.id },
      'Subscription canceled immediately'
    );
  } else {
    // Cancel at period end
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    await prisma.userSubscription.update({
      where: { id: subscription.id },
      data: {
        cancelAtPeriodEnd: true,
        canceledAt: new Date(),
      },
    });

    logger.info(
      { userId, subscriptionId: subscription.id },
      'Subscription set to cancel at period end'
    );
  }
}

// ========================================================================================
// REACTIVATE SUBSCRIPTION
// ========================================================================================

export async function reactivateSubscription(userId: string): Promise<void> {
  // Find subscription with cancel_at_period_end = true
  const subscription = await prisma.userSubscription.findFirst({
    where: {
      userId,
      status: { in: ['ACTIVE', 'TRIALING'] },
      cancelAtPeriodEnd: true,
    },
  });

  if (!subscription || !subscription.stripeSubscriptionId) {
    throw new Error('No cancelable subscription found');
  }

  const stripe = getStripe();

  // Remove cancel_at_period_end
  await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
    cancel_at_period_end: false,
  });

  await prisma.userSubscription.update({
    where: { id: subscription.id },
    data: {
      cancelAtPeriodEnd: false,
      canceledAt: null,
    },
  });

  logger.info(
    { userId, subscriptionId: subscription.id },
    'Subscription reactivated'
  );
}

// ========================================================================================
// CREATE USER PLAN PERIOD (for one-off payments or manual grants)
// ========================================================================================

export interface CreateUserPlanPeriodParams {
  userId: string;
  plan: SubscriptionPlan;
  source: UserPlanSource;
  billingPeriod: BillingPeriod;
  amount: number;
  currency?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripePaymentEventId?: string;
  stripeCheckoutSessionId?: string;
  startsAt?: Date;
  endsAt?: Date;
}

export async function createUserPlanPeriod(
  params: CreateUserPlanPeriodParams
): Promise<void> {
  const {
    userId,
    plan,
    source,
    billingPeriod,
    amount,
    currency = 'pln',
    stripeCustomerId,
    stripeSubscriptionId,
    stripePaymentEventId,
    stripeCheckoutSessionId,
    startsAt = new Date(),
    endsAt,
  } = params;

  // Calculate endsAt if not provided
  const calculatedEndsAt =
    endsAt ||
    (billingPeriod === 'MONTHLY'
      ? addMonths(startsAt, 1)
      : addYears(startsAt, 1));

  await prisma.userPlanPeriod.create({
    data: {
      userId,
      plan,
      source,
      billingPeriod,
      amount,
      currency,
      stripeCustomerId,
      stripeSubscriptionId,
      stripePaymentEventId,
      stripeCheckoutSessionId,
      startsAt,
      endsAt: calculatedEndsAt,
    },
  });

  logger.info(
    {
      userId,
      plan,
      source,
      billingPeriod,
      amount,
      currency,
      startsAt,
      endsAt: calculatedEndsAt,
    },
    'Created user plan period'
  );
}
