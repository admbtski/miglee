/**
 * Stripe Webhook Handler Service
 * Processes Stripe webhook events and updates database accordingly
 */

import type Stripe from 'stripe';
import { prisma } from '../prisma';
import { logger } from '../pino';
import { addMonths, addYears } from './stripe.service';
import { createUserPlanPeriod } from './user-plan.service';
import { activateEventSponsorship } from './event-sponsorship.service';
import { STRIPE_WEBHOOK_EVENTS, METADATA_TYPE } from './constants';
import type {
  UserSubscriptionMetadata,
  UserOneOffMetadata,
  EventSponsorshipMetadata,
} from './constants';

// ========================================================================================
// MAIN WEBHOOK HANDLER
// ========================================================================================

export async function handleStripeWebhook(event: Stripe.Event): Promise<void> {
  logger.info({ type: event.type, id: event.id }, 'Processing Stripe webhook');

  // Check if event already processed
  const existingEvent = await prisma.paymentEvent.findUnique({
    where: { eventId: event.id },
  });

  if (existingEvent?.success) {
    logger.info({ eventId: event.id }, 'Event already processed, skipping');
    return;
  }

  try {
    // Save/update payment event
    await prisma.paymentEvent.upsert({
      where: { eventId: event.id },
      create: {
        eventId: event.id,
        type: event.type,
        payload: event as any,
        receivedAt: new Date(),
        attempt: 1,
      },
      update: {
        attempt: { increment: 1 },
      },
    });

    // Route to appropriate handler
    switch (event.type) {
      case STRIPE_WEBHOOK_EVENTS.CHECKOUT_SESSION_COMPLETED:
        await handleCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session
        );
        break;

      case STRIPE_WEBHOOK_EVENTS.CUSTOMER_SUBSCRIPTION_CREATED:
      case STRIPE_WEBHOOK_EVENTS.CUSTOMER_SUBSCRIPTION_UPDATED:
        await handleSubscriptionUpdate(
          event.data.object as Stripe.Subscription
        );
        break;

      case STRIPE_WEBHOOK_EVENTS.CUSTOMER_SUBSCRIPTION_DELETED:
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription
        );
        break;

      case STRIPE_WEBHOOK_EVENTS.INVOICE_PAID:
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case STRIPE_WEBHOOK_EVENTS.INVOICE_PAYMENT_FAILED:
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case STRIPE_WEBHOOK_EVENTS.PAYMENT_INTENT_SUCCEEDED:
        await handlePaymentIntentSucceeded(
          event.data.object as Stripe.PaymentIntent
        );
        break;

      default:
        logger.info({ type: event.type }, 'Unhandled webhook event type');
    }

    // Mark as successfully processed
    await prisma.paymentEvent.update({
      where: { eventId: event.id },
      data: {
        success: true,
        processedAt: new Date(),
      },
    });

    logger.info(
      { type: event.type, id: event.id },
      'Webhook processed successfully'
    );
  } catch (error: any) {
    logger.error({ error, eventId: event.id }, 'Webhook processing failed');

    // Update payment event with error
    await prisma.paymentEvent.update({
      where: { eventId: event.id },
      data: {
        success: false,
        lastError: error.message,
      },
    });

    throw error;
  }
}

// ========================================================================================
// CHECKOUT SESSION COMPLETED
// ========================================================================================

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
): Promise<void> {
  const metadata = session.metadata as any;

  if (!metadata?.type) {
    logger.warn(
      { sessionId: session.id },
      'Checkout session missing metadata type'
    );
    return;
  }

  switch (metadata.type) {
    case METADATA_TYPE.USER_SUBSCRIPTION:
      await handleUserSubscriptionCheckout(
        session,
        metadata as UserSubscriptionMetadata
      );
      break;

    case METADATA_TYPE.USER_ONE_OFF:
      await handleUserOneOffCheckout(session, metadata as UserOneOffMetadata);
      break;

    case METADATA_TYPE.EVENT_SPONSORSHIP:
      await handleEventSponsorshipCheckout(
        session,
        metadata as EventSponsorshipMetadata
      );
      break;

    default:
      logger.warn(
        { type: metadata.type, sessionId: session.id },
        'Unknown metadata type'
      );
  }
}

// ========================================================================================
// USER SUBSCRIPTION CHECKOUT
// ========================================================================================

async function handleUserSubscriptionCheckout(
  session: Stripe.Checkout.Session,
  metadata: UserSubscriptionMetadata
): Promise<void> {
  const { userId, plan, billingPeriod } = metadata;

  if (!session.subscription || typeof session.subscription !== 'string') {
    logger.warn(
      { sessionId: session.id },
      'Subscription checkout missing subscription ID'
    );
    return;
  }

  // Create or update UserSubscription record
  await prisma.userSubscription.upsert({
    where: {
      stripeSubscriptionId: session.subscription,
    },
    create: {
      userId,
      plan,
      billingPeriod,
      status: 'INCOMPLETE', // Will be updated by subscription.created/updated
      stripeCustomerId: session.customer as string,
      stripeSubscriptionId: session.subscription,
      stripePriceId: session.line_items?.data[0]?.price?.id,
    },
    update: {
      plan,
      billingPeriod,
      stripePriceId: session.line_items?.data[0]?.price?.id,
    },
  });

  logger.info(
    { userId, plan, subscriptionId: session.subscription },
    'User subscription checkout processed'
  );
}

// ========================================================================================
// USER ONE-OFF CHECKOUT
// ========================================================================================

async function handleUserOneOffCheckout(
  session: Stripe.Checkout.Session,
  metadata: UserOneOffMetadata
): Promise<void> {
  const { userId, plan, billingPeriod } = metadata;

  if (!session.payment_intent) {
    logger.warn(
      { sessionId: session.id },
      'One-off checkout missing payment intent'
    );
    return;
  }

  const paymentIntentId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent.id;

  const now = new Date();
  const startsAt = now;
  const endsAt =
    billingPeriod === 'MONTHLY' ? addMonths(now, 1) : addYears(now, 1);

  // Get amount and currency from session
  const amount = session.amount_total ? session.amount_total / 100 : 0; // Convert from cents
  const currency = session.currency || 'pln';

  // Create UserPlanPeriod
  await createUserPlanPeriod({
    userId,
    plan,
    source: 'ONE_OFF',
    billingPeriod,
    amount,
    currency,
    stripeCustomerId: session.customer as string,
    stripePaymentEventId: paymentIntentId,
    stripeCheckoutSessionId: session.id,
    startsAt,
    endsAt,
  });

  logger.info(
    { userId, plan, billingPeriod, startsAt, endsAt },
    'User one-off checkout processed'
  );
}

// ========================================================================================
// EVENT SPONSORSHIP CHECKOUT
// ========================================================================================

async function handleEventSponsorshipCheckout(
  session: Stripe.Checkout.Session,
  metadata: EventSponsorshipMetadata
): Promise<void> {
  const { eventSponsorshipId, eventId, actionType, actionPackageSize } =
    metadata;

  if (!session.payment_intent) {
    logger.warn(
      { sessionId: session.id },
      'Event sponsorship checkout missing payment intent'
    );
    return;
  }

  const paymentIntentId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent.id;

  // Activate sponsorship
  await activateEventSponsorship({
    sponsorshipId: eventSponsorshipId,
    stripePaymentEventId: paymentIntentId,
    stripeCheckoutSessionId: session.id,
    actionType: actionType as 'new' | 'upgrade' | 'reload' | undefined,
    actionPackageSize: actionPackageSize
      ? (Number(actionPackageSize) as 1 | 3 | 5)
      : undefined,
  });

  logger.info(
    {
      eventId,
      sponsorshipId: eventSponsorshipId,
      actionType,
      actionPackageSize,
    },
    'Event sponsorship checkout processed'
  );
}

// ========================================================================================
// SUBSCRIPTION UPDATED
// ========================================================================================

async function handleSubscriptionUpdate(
  subscription: Stripe.Subscription
): Promise<void> {
  const metadata = subscription.metadata as unknown as UserSubscriptionMetadata;

  if (!metadata?.userId) {
    logger.warn(
      { subscriptionId: subscription.id },
      'Subscription missing userId in metadata'
    );
    return;
  }

  const { userId, plan, billingPeriod } = metadata;

  // Log field availability for debugging
  logger.info(
    {
      subscriptionId: subscription.id,
      has_current_period_start: 'current_period_start' in subscription,
      has_current_period_end: 'current_period_end' in subscription,
      current_period_start_value: (subscription as any).current_period_start,
      current_period_end_value: (subscription as any).current_period_end,
      billing_cycle_anchor: subscription.billing_cycle_anchor,
      created: subscription.created,
      item_current_period_start:
        subscription.items.data[0]?.current_period_start,
      item_current_period_end: subscription.items.data[0]?.current_period_end,
    },
    'Subscription period fields check'
  );

  // Use subscription item periods or fallback to billing cycle
  const currentPeriodStart =
    (subscription as any).current_period_start ||
    subscription.items.data[0]?.current_period_start ||
    subscription.billing_cycle_anchor ||
    subscription.created;

  const currentPeriodEnd =
    (subscription as any).current_period_end ||
    subscription.items.data[0]?.current_period_end ||
    subscription.billing_cycle_anchor;

  if (!currentPeriodStart || !currentPeriodEnd) {
    logger.error(
      { subscription },
      'Cannot determine subscription period - skipping'
    );
    return;
  }

  // Update UserSubscription
  await prisma.userSubscription.upsert({
    where: { stripeSubscriptionId: subscription.id },
    create: {
      userId,
      plan,
      billingPeriod: billingPeriod || 'MONTHLY',
      status: subscription.status.toUpperCase() as any,
      stripeCustomerId: subscription.customer as string,
      stripeSubscriptionId: subscription.id,
      stripePriceId: subscription.items.data[0]?.price.id,
      currentPeriodStart: new Date(currentPeriodStart * 1000),
      currentPeriodEnd: new Date(currentPeriodEnd * 1000),
      trialEndsAt: null, // NO TRIAL
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
    update: {
      status: subscription.status.toUpperCase() as any,
      currentPeriodStart: new Date(currentPeriodStart * 1000),
      currentPeriodEnd: new Date(currentPeriodEnd * 1000),
      trialEndsAt: null, // NO TRIAL
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });

  // Create/update UserPlanPeriod for active subscription (NO TRIAL)
  if (['active', 'trialing'].includes(subscription.status)) {
    const startsAt = new Date(currentPeriodStart * 1000);
    const endsAt = new Date(currentPeriodEnd * 1000);

    // Get amount and currency from subscription price
    const priceData = subscription.items.data[0]?.price;
    const amount = priceData?.unit_amount ? priceData.unit_amount / 100 : 0;
    const currency = priceData?.currency || 'pln';

    await createUserPlanPeriod({
      userId,
      plan,
      source: 'SUBSCRIPTION',
      billingPeriod: billingPeriod || 'MONTHLY',
      amount,
      currency,
      stripeCustomerId: subscription.customer as string,
      stripeSubscriptionId: subscription.id,
      startsAt,
      endsAt,
    });
  }

  logger.info(
    { userId, subscriptionId: subscription.id, status: subscription.status },
    'Subscription updated'
  );
}

// ========================================================================================
// SUBSCRIPTION DELETED
// ========================================================================================

async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
): Promise<void> {
  await prisma.userSubscription.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: 'CANCELED',
      canceledAt: new Date(),
    },
  });

  logger.info({ subscriptionId: subscription.id }, 'Subscription deleted');
}

// ========================================================================================
// INVOICE PAID
// ========================================================================================

async function handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
  // Type assertion for subscription field (may not exist on all invoice types)
  const invoiceSubscription = (invoice as { subscription?: string | null })
    .subscription;
  if (!invoiceSubscription || typeof invoiceSubscription !== 'string') {
    return; // Not a subscription invoice
  }

  const subscription = await prisma.userSubscription.findUnique({
    where: { stripeSubscriptionId: invoiceSubscription },
  });

  if (!subscription) {
    logger.warn(
      { invoiceId: invoice.id },
      'Invoice paid but subscription not found'
    );
    return;
  }

  // Create new UserPlanPeriod for this billing period
  const startsAt = new Date(invoice.period_start * 1000);
  const endsAt = new Date(invoice.period_end * 1000);

  // Get amount and currency from invoice
  const amount = invoice.amount_paid ? invoice.amount_paid / 100 : 0;
  const currency = invoice.currency || 'pln';

  await createUserPlanPeriod({
    userId: subscription.userId,
    plan: subscription.plan,
    source: 'SUBSCRIPTION',
    billingPeriod: subscription.billingPeriod,
    amount,
    currency,
    stripeCustomerId: subscription.stripeCustomerId,
    stripeSubscriptionId: subscription.stripeSubscriptionId!,
    startsAt,
    endsAt,
  });

  logger.info(
    { userId: subscription.userId, invoiceId: invoice.id, startsAt, endsAt },
    'Invoice paid, plan period created'
  );
}

// ========================================================================================
// INVOICE PAYMENT FAILED
// ========================================================================================

async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice
): Promise<void> {
  // Type assertion for subscription field (may not exist on all invoice types)
  const invoiceSubscription = (invoice as { subscription?: string | null })
    .subscription;
  if (!invoiceSubscription || typeof invoiceSubscription !== 'string') {
    return;
  }

  await prisma.userSubscription.updateMany({
    where: { stripeSubscriptionId: invoiceSubscription },
    data: { status: 'PAST_DUE' },
  });

  logger.warn(
    { invoiceId: invoice.id, subscriptionId: invoiceSubscription },
    'Invoice payment failed'
  );
}

// ========================================================================================
// PAYMENT EVENT SUCCEEDED
// ========================================================================================

async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent
): Promise<void> {
  const metadata = paymentIntent.metadata as Record<string, string>;

  if (metadata?.type === METADATA_TYPE.USER_ONE_OFF && metadata.userId) {
    // One-off payment succeeded - UserPlanPeriod should already be created in checkout.session.completed
    logger.info(
      { paymentIntentId: paymentIntent.id, userId: metadata.userId },
      'One-off payment succeeded'
    );
  } else if (metadata?.type === METADATA_TYPE.EVENT_SPONSORSHIP) {
    // Event sponsorship payment succeeded - should already be activated in checkout.session.completed
    logger.info(
      { paymentIntentId: paymentIntent.id, eventId: metadata.eventId },
      'Event sponsorship payment succeeded'
    );
  }
}
