/**
 * Stripe Service
 * Centralized Stripe client and utility functions
 */

import Stripe from 'stripe';
import { config } from '../../env';
import { logger } from '../pino';

// ========================================================================================
// STRIPE CLIENT
// ========================================================================================

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!config.stripeSecretKey) {
    throw new Error(
      'STRIPE_SECRET_KEY is not configured. Billing features are disabled.'
    );
  }

  if (!stripeInstance) {
    stripeInstance = new Stripe(config.stripeSecretKey, {
      apiVersion: '2025-11-17.clover', // Use latest API version
      typescript: true,
      appInfo: {
        name: 'Miglee',
        version: '1.0.0',
      },
    });

    logger.info('Stripe client initialized');
  }

  return stripeInstance;
}

// ========================================================================================
// HELPER: Get or Create Stripe Customer
// ========================================================================================

export async function getOrCreateStripeCustomer(
  userId: string,
  email: string,
  name: string
): Promise<string> {
  const stripe = getStripe();

  // Search for existing customer by email
  const existingCustomers = await stripe.customers.list({
    email,
    limit: 1,
  });

  if (existingCustomers.data.length > 0) {
    const customer = existingCustomers.data[0];
    if (customer?.id) {
      logger.info(
        { customerId: customer.id, userId },
        'Found existing Stripe customer'
      );
      return customer.id;
    }
  }

  // Create new customer
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: {
      userId,
    },
  });

  logger.info(
    { customerId: customer.id, userId },
    'Created new Stripe customer'
  );
  return customer.id;
}

// ========================================================================================
// HELPER: Verify Webhook Signature
// ========================================================================================

export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  const stripe = getStripe();

  if (!config.stripeWebhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
  }

  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      config.stripeWebhookSecret
    );
    return event;
  } catch (err: unknown) {
    logger.error({ err }, 'Webhook signature verification failed');
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Webhook signature verification failed: ${message}`);
  }
}

// ========================================================================================
// HELPER: Format Amount for Stripe
// ========================================================================================

/**
 * Converts amount in PLN grosze (cents) to Stripe format
 * @param amountInCents Amount in grosze (e.g., 29_00 for 29 PLN)
 * @returns Stripe amount
 */
export function formatStripeAmount(amountInCents: number): number {
  return amountInCents;
}

/**
 * Converts Stripe amount back to PLN grosze
 * @param stripeAmount Amount from Stripe
 * @returns Amount in grosze
 */
export function parseStripeAmount(stripeAmount: number): number {
  return stripeAmount;
}

// ========================================================================================
// HELPER: Format Currency
// ========================================================================================

export function formatCurrency(
  amountInCents: number,
  currency = 'PLN'
): string {
  const amount = amountInCents / 100;
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency,
  }).format(amount);
}

// ========================================================================================
// HELPER: Date/Time Utilities
// ========================================================================================

/**
 * Add months to a date
 */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

/**
 * Add years to a date
 */
export function addYears(date: Date, years: number): Date {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() + years);
  return result;
}

/**
 * Add days to a date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// ========================================================================================
// HELPER: Get Invoice/Receipt URL
// ========================================================================================

/**
 * Get receipt URL from Stripe PaymentEvent
 */
export async function getReceiptUrlFromPaymentEvent(
  paymentEventId: string
): Promise<string | null> {
  const stripe = getStripe();

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentEventId, {
      expand: ['latest_charge'],
    });

    if (paymentIntent.latest_charge) {
      const charge =
        typeof paymentIntent.latest_charge === 'string'
          ? await stripe.charges.retrieve(paymentIntent.latest_charge)
          : paymentIntent.latest_charge;

      return charge.receipt_url || null;
    }

    return null;
  } catch (error: unknown) {
    logger.error(
      { paymentEventId, error: error instanceof Error ? error.message : error },
      'Failed to retrieve receipt URL from PaymentEvent'
    );
    return null;
  }
}

/**
 * Get invoice URL from Stripe Subscription
 */
export async function getInvoiceUrlFromSubscription(
  subscriptionId: string
): Promise<string | null> {
  const stripe = getStripe();

  try {
    // Get the most recent invoice for this subscription
    const invoices = await stripe.invoices.list({
      subscription: subscriptionId,
      limit: 1,
    });

    if (invoices.data.length > 0) {
      const invoice = invoices.data[0];
      if (invoice) {
        return invoice.hosted_invoice_url || invoice.invoice_pdf || null;
      }
    }

    return null;
  } catch (error: unknown) {
    logger.error(
      { subscriptionId, error: error instanceof Error ? error.message : error },
      'Failed to retrieve invoice URL from Subscription'
    );
    return null;
  }
}

// ========================================================================================
// EXPORTS
// ========================================================================================

export { Stripe };
