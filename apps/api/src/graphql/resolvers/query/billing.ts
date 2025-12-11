/**
 * Billing Query Resolvers
 * Handles queries for user subscriptions, plans, and event sponsorships
 */

import type {
  QueryResolvers,
  UserPlanInfo,
  UserSubscription,
  UserPlanPeriod,
  EventSponsorshipPeriod,
  EventSponsorship,
} from '../../__generated__/resolvers-types';
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
  } as unknown as UserPlanInfo;
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

  return subscription as unknown as UserSubscription | null;
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

  return periods as unknown as UserPlanPeriod[];
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
        event: true,
        sponsor: true,
        eventSponsorship: true,
      },
    });

    // Map periods to look like EventSponsorship for compatibility
    return periods.map((period) => ({
      ...period,
      id: period.id,
      actionType: period.actionType,
      eventId: period.eventId,
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
      stripePaymentEventId: period.stripePaymentEventId,
      stripeCheckoutSessionId: period.stripeCheckoutSessionId,
      createdAt: period.createdAt,
      updatedAt: period.createdAt,
      event: period.event,
      sponsor: period.sponsor,
    })) as unknown as EventSponsorshipPeriod[];
  };

/**
 * Get event sponsorship for a specific event
 * Required level: EVENT_MOD_OR_OWNER
 */
export const eventSponsorshipQuery: QueryResolvers['eventSponsorship'] = async (
  _parent,
  args,
  { user }
) => {
  const { eventId } = args;
  const userId = user?.id;

  if (!userId) {
    throw new Error('Authentication required');
  }

  // Check EVENT_MOD_OR_OWNER
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      ownerId: true,
      members: {
        where: { userId, status: 'JOINED' },
        select: { role: true },
      },
    },
  });

  if (!event) {
    return null;
  }

  // Global ADMIN or MODERATOR always has access
  const isGlobalMod = user.role === 'ADMIN' || user.role === 'MODERATOR';
  const isOwner = event.ownerId === userId;
  const isEventModerator = event.members.some(
    (m) => m.role === 'MODERATOR' || m.role === 'OWNER'
  );

  if (!isGlobalMod && !isOwner && !isEventModerator) {
    throw new Error('Only event owner or moderators can view sponsorship');
  }

  const sponsorship = await prisma.eventSponsorship.findUnique({
    where: { eventId },
    include: {
      event: true,
      sponsor: true,
    },
  });

  return sponsorship as unknown as EventSponsorship | null;
};
