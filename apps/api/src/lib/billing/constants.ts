/**
 * Billing & Subscription Constants
 * Centralized configuration for billing system
 */

import type {
  SubscriptionPlan,
  EventPlan,
  BillingPeriod,
} from '@prisma/client';
import { config } from '../../env';

// ========================================================================================
// EVENT PLAN LIMITS
// ========================================================================================

export const EVENT_PLAN_LIMITS = {
  FREE: {
    boostsTotal: 0,
    localPushesTotal: 0,
    maxCapacity: 50, // Default max capacity for free events
    featuredInListing: false,
    analytics: 'basic' as const,
  },
  PLUS: {
    boostsTotal: 1,
    localPushesTotal: 1,
    maxCapacity: 150,
    featuredInListing: true,
    analytics: 'standard' as const,
  },
  PRO: {
    boostsTotal: 3,
    localPushesTotal: 3,
    maxCapacity: 500, // Or unlimited (null)
    featuredInListing: true,
    analytics: 'advanced' as const,
  },
} as const satisfies Record<EventPlan, unknown>;

// ========================================================================================
// ACTION PACKAGES (for reload/top-up)
// ========================================================================================

export const ACTION_PACKAGES = {
  SMALL: {
    actions: 1,
    price: 9.99,
    stripePriceId: config.stripePrices.actionPackages.small || '',
  },
  MEDIUM: {
    actions: 3,
    price: 24.99,
    stripePriceId: config.stripePrices.actionPackages.medium || '',
  },
  LARGE: {
    actions: 5,
    price: 39.99,
    stripePriceId: config.stripePrices.actionPackages.large || '',
  },
} as const;

export type ActionPackageSize = 1 | 3 | 5;

export function getActionPackage(size: ActionPackageSize) {
  if (size === 1) return ACTION_PACKAGES.SMALL;
  if (size === 3) return ACTION_PACKAGES.MEDIUM;
  if (size === 5) return ACTION_PACKAGES.LARGE;
  throw new Error(`Invalid action package size: ${size}`);
}

// ========================================================================================
// PLAN HIERARCHY (for determining effective plan when multiple periods exist)
// ========================================================================================

export const PLAN_LEVEL: Record<SubscriptionPlan, number> = {
  PLUS: 1,
  PRO: 2,
} as const;

// ========================================================================================
// STRIPE CHECKOUT CONFIGURATION
// ========================================================================================

export const CHECKOUT_SESSION_CONFIG = {
  // How long until checkout session expires (in seconds)
  expiresAfter: 30 * 60, // 30 minutes

  // Allow promotion codes in checkout
  allowPromotionCodes: true,

  // Billing address collection
  billingAddressCollection: 'auto' as const,

  // Payment method types
  paymentMethodTypes: ['card', 'blik'] as const,

  // Currency
  currency: 'pln' as const,

  // Tax behavior
  automaticTax: {
    enabled: false, // Set to true when you configure Stripe Tax
  },
} as const;

// ========================================================================================
// WEBHOOK EVENTS TO HANDLE
// ========================================================================================

export const STRIPE_WEBHOOK_EVENTS = {
  // Checkout
  CHECKOUT_SESSION_COMPLETED: 'checkout.session.completed',

  // Subscriptions
  CUSTOMER_SUBSCRIPTION_CREATED: 'customer.subscription.created',
  CUSTOMER_SUBSCRIPTION_UPDATED: 'customer.subscription.updated',
  CUSTOMER_SUBSCRIPTION_DELETED: 'customer.subscription.deleted',

  // Invoices
  INVOICE_PAID: 'invoice.paid',
  INVOICE_PAYMENT_FAILED: 'invoice.payment_failed',
  INVOICE_UPCOMING: 'invoice.upcoming',

  // Payment Intents
  PAYMENT_INTENT_SUCCEEDED: 'payment_intent.succeeded',
  PAYMENT_INTENT_PAYMENT_FAILED: 'payment_intent.payment_failed',

  // Customer
  CUSTOMER_CREATED: 'customer.created',
  CUSTOMER_UPDATED: 'customer.updated',
  CUSTOMER_DELETED: 'customer.deleted',
} as const;

// ========================================================================================
// METADATA TYPES (for Stripe sessions/subscriptions)
// ========================================================================================

export const METADATA_TYPE = {
  USER_SUBSCRIPTION: 'user_subscription',
  USER_ONE_OFF: 'user_one_off',
  EVENT_SPONSORSHIP: 'event_sponsorship',
} as const;

export type MetadataType = (typeof METADATA_TYPE)[keyof typeof METADATA_TYPE];

// ========================================================================================
// HELPER TYPES
// ========================================================================================

export interface UserSubscriptionMetadata {
  type: typeof METADATA_TYPE.USER_SUBSCRIPTION;
  userId: string;
  plan: SubscriptionPlan;
  billingPeriod: BillingPeriod;
}

export interface UserOneOffMetadata {
  type: typeof METADATA_TYPE.USER_ONE_OFF;
  userId: string;
  plan: SubscriptionPlan;
  billingPeriod: BillingPeriod;
}

export interface EventSponsorshipMetadata {
  type: typeof METADATA_TYPE.EVENT_SPONSORSHIP;
  eventSponsorshipId: string;
  eventId: string;
  userId: string;
  plan: EventPlan;
  actionType?: 'new' | 'upgrade' | 'reload';
  actionPackageSize?: number;
}

export function getCheckoutSuccessUrl(
  baseUrl: string,
  type: MetadataType
): string {
  switch (type) {
    case METADATA_TYPE.USER_SUBSCRIPTION:
    case METADATA_TYPE.USER_ONE_OFF:
      return `${baseUrl}/account/plans-and-bills?success=true&session_id={CHECKOUT_SESSION_ID}`;
    case METADATA_TYPE.EVENT_SPONSORSHIP:
      return `${baseUrl}/event/{eventId}/manage/plans?success=true&session_id={CHECKOUT_SESSION_ID}`;
    default:
      return `${baseUrl}?success=true`;
  }
}

export function getCheckoutCancelUrl(
  baseUrl: string,
  type: MetadataType
): string {
  switch (type) {
    case METADATA_TYPE.USER_SUBSCRIPTION:
    case METADATA_TYPE.USER_ONE_OFF:
      return `${baseUrl}/account/plans-and-bills?canceled=true`;
    case METADATA_TYPE.EVENT_SPONSORSHIP:
      return `${baseUrl}/event/{eventId}/manage/plans?canceled=true`;
    default:
      return baseUrl;
  }
}
