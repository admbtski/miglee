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
  type EventSponsorshipMetadata,
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

  if (existing && existing.status === 'ACTIVE') {
    throw new Error('Event already has an active sponsorship');
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
  const sponsorship = await prisma.eventSponsorship.upsert({
    where: { intentId },
    create: {
      intentId,
      sponsorId: userId,
      plan,
      status: 'PENDING',
      boostsTotal: EVENT_PLAN_LIMITS[plan].boostsTotal,
      localPushesTotal: EVENT_PLAN_LIMITS[plan].localPushesTotal,
    },
    update: {
      plan,
      status: 'PENDING',
      boostsTotal: EVENT_PLAN_LIMITS[plan].boostsTotal,
      localPushesTotal: EVENT_PLAN_LIMITS[plan].localPushesTotal,
    },
  });

  // Prepare metadata
  const metadata: EventSponsorshipMetadata = {
    type: METADATA_TYPE.EVENT_SPONSORSHIP,
    eventSponsorshipId: sponsorship.id,
    intentId,
    userId,
    plan,
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
    metadata,
    payment_intent_data: {
      metadata,
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
}

export async function activateEventSponsorship(
  params: ActivateEventSponsorshipParams
): Promise<void> {
  const { sponsorshipId, stripePaymentIntentId, stripeCheckoutSessionId } =
    params;

  const sponsorship = await prisma.eventSponsorship.findUnique({
    where: { id: sponsorshipId },
    include: { intent: true },
  });

  if (!sponsorship) {
    throw new Error('Sponsorship not found');
  }

  const now = new Date();
  const endsAt = new Date(now);
  endsAt.setMonth(endsAt.getMonth() + 1); // 1 month from now

  // Update sponsorship
  await prisma.eventSponsorship.update({
    where: { id: sponsorshipId },
    data: {
      status: 'ACTIVE',
      startsAt: now,
      endsAt,
      stripePaymentIntentId,
      stripeCheckoutSessionId,
    },
  });

  // Update intent sponsorshipPlan
  await prisma.intent.update({
    where: { id: sponsorship.intentId },
    data: {
      sponsorshipPlan: sponsorship.plan,
    },
  });

  logger.info(
    {
      sponsorshipId,
      intentId: sponsorship.intentId,
      plan: sponsorship.plan,
      endsAt,
    },
    'Event sponsorship activated'
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
