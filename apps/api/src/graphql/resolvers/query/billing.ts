/**
 * Billing Query Resolvers
 * Handles queries for user subscriptions, plans, and event sponsorships
 */

import type { QueryResolvers } from '../../__generated__/resolvers-types';
import { prisma } from '../../../lib/prisma';
import { getUserEffectivePlan } from '../../../lib/billing';

/**
 * Get current user's effective plan
 */
export const myPlanQuery: QueryResolvers['myPlan'] = async (
  _parent,
  _args,
  { user }
) => {
  const userId = user?.id;

  if (!userId) {
    throw new Error('Authentication required');
  }

  const planInfo = await getUserEffectivePlan(userId);

  return {
    plan: planInfo.plan,
    planEndsAt: planInfo.planEndsAt,
    source: planInfo.source,
    billingPeriod: planInfo.billingPeriod,
  };
};

/**
 * Get current user's active subscription (if any)
 */
export const mySubscriptionQuery: QueryResolvers['mySubscription'] = async (
  _parent,
  _args,
  { user }
) => {
  const userId = user?.id;

  if (!userId) {
    throw new Error('Authentication required');
  }

  const subscription = await prisma.userSubscription.findFirst({
    where: {
      userId,
      status: { in: ['ACTIVE', 'TRIALING'] },
    },
    orderBy: { createdAt: 'desc' },
  });

  return subscription;
};

/**
 * Get current user's active plan periods
 */
export const myPlanPeriodsQuery: QueryResolvers['myPlanPeriods'] = async (
  _parent,
  args,
  { user }
) => {
  const userId = user?.id;

  const { limit = 10 } = args;

  if (!userId) {
    throw new Error('Authentication required');
  }

  const periods = await prisma.userPlanPeriod.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return periods;
};

/**
 * Get all event sponsorship periods (transaction history) for the current user
 */
export const myEventSponsorshipsQuery: QueryResolvers['myEventSponsorships'] =
  async (_parent, args, { user }) => {
    const userId = user?.id;

    const { limit = 50 } = args;

    if (!userId) {
      throw new Error('Authentication required');
    }

    const periods = await prisma.eventSponsorshipPeriod.findMany({
      where: { sponsorId: userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        intent: true,
        sponsor: true,
        eventSponsorship: true,
      },
    });

    // Map periods to look like EventSponsorship for compatibility
    return periods.map((period) => ({
      ...period,
      id: period.id,
      actionType: period.actionType,
      intentId: period.intentId,
      sponsorId: period.sponsorId,
      plan: period.plan,
      status: period.eventSponsorship?.status || 'COMPLETED',
      startsAt: period.eventSponsorship?.startsAt,
      endsAt: period.eventSponsorship?.endsAt,
      boostsTotal: period.boostsAdded,
      amount: period.amount,
      currency: period.currency,
      localPushesAdded: period.localPushesAdded,
      boostsUsed: 0,
      boostsAdded: period.boostsAdded,
      localPushesTotal: period.localPushesAdded,
      localPushesUsed: 0,
      stripePaymentIntentId: period.stripePaymentIntentId,
      stripeCheckoutSessionId: period.stripeCheckoutSessionId,
      createdAt: period.createdAt,
      updatedAt: period.createdAt,
      intent: period.intent,
      sponsor: period.sponsor,
    })) as any;
  };

/**
 * Get event sponsorship for a specific intent
 */
export const eventSponsorshipQuery: QueryResolvers['eventSponsorship'] = async (
  _parent,
  args,
  { user }
) => {
  const { intentId } = args;
  const userId = user?.id;

  if (!userId) {
    throw new Error('Authentication required');
  }

  const sponsorship = await prisma.eventSponsorship.findUnique({
    where: { intentId },
    include: {
      intent: true,
      sponsor: true,
    },
  });

  return sponsorship;
};
