/**
 * Event Sponsorship Service
 * Handles event sponsorship/boost purchases and management
 */

import type { IntentPlan } from '@prisma/client';
import { prisma } from '../prisma';
import { logger } from '../pino';
import { getStripe, getOrCreateStripeCustomer } from './stripe.service';
import {
  EVENT_PLAN_LIMITS,
  METADATA_TYPE,
  getCheckoutSuccessUrl,
  getCheckoutCancelUrl,
  CHECKOUT_SESSION_CONFIG,
} from './constants';
import { config } from '../../env';

// ========================================================================================
// CREATE EVENT SPONSORSHIP CHECKOUT
// ========================================================================================

export interface CreateEventSponsorshipCheckoutParams {
  intentId: string;
  userId: string;
  userEmail: string;
  userName: string;
  plan: IntentPlan;
}

export async function createEventSponsorshipCheckout(
  params: CreateEventSponsorshipCheckoutParams
): Promise<{ checkoutUrl: string; sessionId: string; sponsorshipId: string }> {
  const { intentId, userId, userEmail, userName, plan } = params;

  if (plan === 'FREE') {
    throw new Error('Cannot purchase FREE plan');
  }

  const stripe = getStripe();

  // Verify intent exists and user is owner/moderator
  const intent = await prisma.intent.findUnique({
    where: { id: intentId },
    include: {
      members: {
        where: {
          userId,
          role: { in: ['OWNER', 'MODERATOR'] },
          status: 'JOINED',
        },
      },
    },
  });

  if (!intent) {
    throw new Error('Intent not found');
  }

  if (intent.members.length === 0) {
    throw new Error('User is not authorized to sponsor this event');
  }

  // Check if sponsorship already exists
  const existing = await prisma.eventSponsorship.findUnique({
    where: { intentId },
  });

  // Determine action type: new, upgrade, or reload
  let actionType: 'new' | 'upgrade' | 'reload' = 'new';

  if (existing && existing.status === 'ACTIVE') {
    // Check if it's an upgrade (PLUS -> PRO)
    if (existing.plan === 'PLUS' && plan === 'PRO') {
      actionType = 'upgrade';
      logger.info(
        { intentId, from: existing.plan, to: plan },
        'Upgrading event sponsorship plan'
      );
    }
    // Check if it's a reload (buying same plan again to stack actions)
    else if (existing.plan === plan) {
      actionType = 'reload';
      logger.info(
        { intentId, plan },
        'Reloading event sponsorship actions (stacking)'
      );
    }
    // Downgrade is not allowed
    else if (existing.plan === 'PRO' && plan === 'PLUS') {
      throw new Error('Downgrade from PRO to PLUS is not allowed');
    }
    // Any other case with active sponsorship
    else {
      throw new Error('Event already has an active sponsorship');
    }
  }

  // Get or create Stripe customer
  const customerId = await getOrCreateStripeCustomer(
    userId,
    userEmail,
    userName
  );

  // Get price ID from config
  const priceId =
    plan === 'PLUS'
      ? config.stripePrices.event.plus
      : config.stripePrices.event.pro;

  if (!priceId) {
    throw new Error(`Stripe price ID not configured for event plan=${plan}`);
  }

  // Create or update sponsorship record
  await prisma.eventSponsorship.upsert({
    where: { intentId },
    create: {
      intentId,
      sponsorId: userId,
      plan,
      status: 'PENDING',
      boostsTotal: EVENT_PLAN_LIMITS[plan].boostsTotal,
      localPushesTotal: EVENT_PLAN_LIMITS[plan].localPushesTotal,
    },
    update:
      actionType === 'reload'
        ? {
            // For reload: add new actions to existing totals (stacking)
            status: 'PENDING', // Will be set back to ACTIVE after payment
            boostsTotal: {
              increment: EVENT_PLAN_LIMITS[plan].boostsTotal,
            },
            localPushesTotal: {
              increment: EVENT_PLAN_LIMITS[plan].localPushesTotal,
            },
          }
        : actionType === 'upgrade'
          ? {
              // For upgrade: change plan AND add new actions to existing totals (stacking)
              plan,
              status: 'PENDING',
              boostsTotal: {
                increment: EVENT_PLAN_LIMITS[plan].boostsTotal,
              },
              localPushesTotal: {
                increment: EVENT_PLAN_LIMITS[plan].localPushesTotal,
              },
            }
          : {
              // For new or reactivation: reset everything
              plan,
              status: 'PENDING',
              boostsTotal: EVENT_PLAN_LIMITS[plan].boostsTotal,
              localPushesTotal: EVENT_PLAN_LIMITS[plan].localPushesTotal,
            },
  });

  // Fetch the updated sponsorship to get the correct values after increment
  const sponsorship = await prisma.eventSponsorship.findUnique({
    where: { intentId },
  });

  if (!sponsorship) {
    throw new Error('Failed to create/update sponsorship');
  }

  logger.info(
    {
      intentId,
      actionType,
      plan,
      boostsTotal: sponsorship.boostsTotal,
      localPushesTotal: sponsorship.localPushesTotal,
      status: sponsorship.status,
    },
    'Event sponsorship upserted after checkout'
  );

  // Prepare metadata
  const metadata = {
    type: METADATA_TYPE.EVENT_SPONSORSHIP,
    eventSponsorshipId: sponsorship.id,
    intentId,
    userId,
    plan,
    actionType, // Add action type to metadata for webhook processing
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
    metadata: metadata as Record<string, string>,
    payment_intent_data: {
      metadata: metadata as Record<string, string>,
    },
    success_url: getCheckoutSuccessUrl(
      config.appUrl,
      METADATA_TYPE.EVENT_SPONSORSHIP
    ).replace('{intentId}', intentId),
    cancel_url: getCheckoutCancelUrl(
      config.appUrl,
      METADATA_TYPE.EVENT_SPONSORSHIP
    ).replace('{intentId}', intentId),
    allow_promotion_codes: CHECKOUT_SESSION_CONFIG.allowPromotionCodes,
    billing_address_collection:
      CHECKOUT_SESSION_CONFIG.billingAddressCollection,
    expires_at:
      Math.floor(Date.now() / 1000) + CHECKOUT_SESSION_CONFIG.expiresAfter,
  });

  logger.info(
    {
      intentId,
      userId,
      plan,
      sessionId: session.id,
      sponsorshipId: sponsorship.id,
    },
    'Created event sponsorship checkout session'
  );

  if (!session.url) {
    throw new Error('Checkout session created but no URL returned');
  }

  return {
    checkoutUrl: session.url,
    sessionId: session.id,
    sponsorshipId: sponsorship.id,
  };
}

// ========================================================================================
// ACTIVATE EVENT SPONSORSHIP (after payment)
// ========================================================================================

export interface ActivateEventSponsorshipParams {
  sponsorshipId: string;
  stripePaymentIntentId: string;
  stripeCheckoutSessionId: string;
  actionType?: 'new' | 'upgrade' | 'reload';
}

export async function activateEventSponsorship(
  params: ActivateEventSponsorshipParams
): Promise<void> {
  const {
    sponsorshipId,
    stripePaymentIntentId,
    stripeCheckoutSessionId,
    actionType,
  } = params;

  const sponsorship = await prisma.eventSponsorship.findUnique({
    where: { id: sponsorshipId },
    include: { intent: true },
  });

  if (!sponsorship) {
    throw new Error('Sponsorship not found');
  }

  const now = new Date();

  let updateData: any = {
    status: 'ACTIVE',
    stripePaymentIntentId,
    stripeCheckoutSessionId,
  };

  // Only update dates for new sponsorships, not for reloads or upgrades
  if (actionType === 'new' || !sponsorship.startsAt) {
    const endsAt = new Date(now);
    endsAt.setMonth(endsAt.getMonth() + 1); // 1 month from now

    updateData.startsAt = now;
    updateData.endsAt = endsAt;

    logger.info(
      { sponsorshipId, startsAt: now, endsAt },
      'Setting sponsorship dates for new purchase'
    );
  } else {
    logger.info(
      { sponsorshipId, actionType },
      'Keeping existing sponsorship dates (reload or upgrade)'
    );
  }

  // Update sponsorship
  // Note: boostsTotal and localPushesTotal were already incremented in createEventSponsorshipCheckout
  const updated = await prisma.eventSponsorship.update({
    where: { id: sponsorshipId },
    data: updateData,
  });

  // Update intent sponsorshipPlan
  await prisma.intent.update({
    where: { id: sponsorship.intentId },
    data: {
      sponsorshipPlan: updated.plan,
    },
  });

  // Create EventSponsorshipPeriod record for this transaction
  const planLimits = EVENT_PLAN_LIMITS[updated.plan];
  const amount = updated.plan === 'PRO' ? 29.99 : 14.99; // Price in PLN

  await prisma.eventSponsorshipPeriod.create({
    data: {
      intentId: sponsorship.intentId,
      sponsorId: sponsorship.sponsorId,
      plan: updated.plan,
      actionType: actionType || 'new',
      boostsAdded: planLimits.boostsTotal,
      localPushesAdded: planLimits.localPushesTotal,
      amount,
      currency: 'pln',
      stripePaymentIntentId,
      stripeCheckoutSessionId,
    },
  });

  logger.info(
    {
      sponsorshipId,
      intentId: sponsorship.intentId,
      plan: updated.plan,
      actionType: actionType || 'unknown',
      boostsTotal: updated.boostsTotal,
      localPushesTotal: updated.localPushesTotal,
      startsAt: updated.startsAt,
      endsAt: updated.endsAt,
    },
    'Event sponsorship activated and period created'
  );
}

// ========================================================================================
// USE BOOST
// ========================================================================================

export async function useBoost(intentId: string): Promise<void> {
  const sponsorship = await prisma.eventSponsorship.findUnique({
    where: { intentId },
  });

  if (!sponsorship || sponsorship.status !== 'ACTIVE') {
    throw new Error('No active sponsorship for this event');
  }

  if (sponsorship.boostsUsed >= sponsorship.boostsTotal) {
    throw new Error('All boosts have been used');
  }

  await prisma.eventSponsorship.update({
    where: { id: sponsorship.id },
    data: {
      boostsUsed: { increment: 1 },
    },
  });

  logger.info(
    {
      intentId,
      boostsUsed: sponsorship.boostsUsed + 1,
      boostsTotal: sponsorship.boostsTotal,
    },
    'Boost used'
  );
}

// ========================================================================================
// USE LOCAL PUSH
// ========================================================================================

export async function useLocalPush(intentId: string): Promise<void> {
  const sponsorship = await prisma.eventSponsorship.findUnique({
    where: { intentId },
  });

  if (!sponsorship || sponsorship.status !== 'ACTIVE') {
    throw new Error('No active sponsorship for this event');
  }

  if (sponsorship.localPushesUsed >= sponsorship.localPushesTotal) {
    throw new Error('All local pushes have been used');
  }

  await prisma.eventSponsorship.update({
    where: { id: sponsorship.id },
    data: {
      localPushesUsed: { increment: 1 },
    },
  });

  logger.info(
    {
      intentId,
      localPushesUsed: sponsorship.localPushesUsed + 1,
      localPushesTotal: sponsorship.localPushesTotal,
    },
    'Local push used'
  );
}

// ========================================================================================
// EXPIRE SPONSORSHIPS (to be called by cron)
// ========================================================================================

export async function expireEventSponsorships(): Promise<number> {
  const now = new Date();

  const expiredSponsorships = await prisma.eventSponsorship.findMany({
    where: {
      status: 'ACTIVE',
      endsAt: { lte: now },
    },
    include: { intent: true },
  });

  for (const sponsorship of expiredSponsorships) {
    await prisma.$transaction([
      prisma.eventSponsorship.update({
        where: { id: sponsorship.id },
        data: { status: 'EXPIRED' },
      }),
      prisma.intent.update({
        where: { id: sponsorship.intentId },
        data: { sponsorshipPlan: 'FREE' },
      }),
    ]);
  }

  if (expiredSponsorships.length > 0) {
    logger.info(
      { count: expiredSponsorships.length },
      'Expired event sponsorships'
    );
  }

  return expiredSponsorships.length;
}
