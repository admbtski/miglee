/**
 * Billing & Subscription Constants
 * Centralized configuration for billing system
 */

import type {
  SubscriptionPlan,
  IntentPlan,
  BillingPeriod,
} from '@prisma/client';

// ========================================================================================
// PRICING (in PLN, stored as integers - grosze/cents)
// ========================================================================================

export const PRICING = {
  // User Plans
  USER_PLUS_MONTHLY_SUB: 29_00, // 29 PLN/month (subscription)
  USER_PLUS_MONTHLY_ONEOFF: 39_00, // 39 PLN (one-time, 1 month)
  USER_PLUS_YEARLY_ONEOFF: 299_00, // 299 PLN (one-time, 12 months) ~25 PLN/month

  USER_PRO_MONTHLY_SUB: 59_00, // 59 PLN/month (subscription)
  USER_PRO_MONTHLY_ONEOFF: 69_00, // 69 PLN (one-time, 1 month)
  USER_PRO_YEARLY_ONEOFF: 599_00, // 599 PLN (one-time, 12 months) ~50 PLN/month

  // Event Plans (one-time, 1 month)
  EVENT_PLUS: 49_00, // 49 PLN per event per month
  EVENT_PRO: 99_00, // 99 PLN per event per month
} as const;

// ========================================================================================
// TRIAL CONFIGURATION
// ========================================================================================

export const TRIAL_DAYS = {
  PLUS: 7, // 7-day trial for Plus
  PRO: 7, // 7-day trial for Pro
} as const;

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
} as const satisfies Record<IntentPlan, unknown>;

// ========================================================================================
// ACTION PACKAGES (for reload/top-up)
// ========================================================================================

export const ACTION_PACKAGES = {
  SMALL: {
    actions: 1,
    price: 9.99,
    stripePriceId: process.env.STRIPE_PRICE_ACTION_PACKAGE_SMALL || '',
  },
  MEDIUM: {
    actions: 3,
    price: 24.99,
    stripePriceId: process.env.STRIPE_PRICE_ACTION_PACKAGE_MEDIUM || '',
  },
  LARGE: {
    actions: 5,
    price: 39.99,
    stripePriceId: process.env.STRIPE_PRICE_ACTION_PACKAGE_LARGE || '',
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
  intentId: string;
  userId: string;
  plan: IntentPlan;
  actionType?: 'new' | 'upgrade' | 'reload';
  actionPackageSize?: number;
}

export type CheckoutMetadata =
  | UserSubscriptionMetadata
  | UserOneOffMetadata
  | EventSponsorshipMetadata;

// ========================================================================================
// URL BUILDERS
// ========================================================================================

export function getCheckoutSuccessUrl(
  baseUrl: string,
  type: MetadataType
): string {
  switch (type) {
    case METADATA_TYPE.USER_SUBSCRIPTION:
    case METADATA_TYPE.USER_ONE_OFF:
      return `${baseUrl}/account/plans-and-bills?success=true&session_id={CHECKOUT_SESSION_ID}`;
    case METADATA_TYPE.EVENT_SPONSORSHIP:
      return `${baseUrl}/intent/{intentId}/manage/subscription?success=true&session_id={CHECKOUT_SESSION_ID}`;
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
      return `${baseUrl}/intent/{intentId}/manage/subscription?canceled=true`;
    default:
      return baseUrl;
  }
}

// ========================================================================================
// PLAN DISPLAY NAMES & DESCRIPTIONS
// ========================================================================================

export const PLAN_DISPLAY = {
  USER: {
    PLUS: {
      name: 'Plus',
      description: 'Enhanced features for active event organizers',
      features: [
        'Create unlimited events',
        'Priority support',
        'Advanced analytics',
        'Custom branding',
      ],
    },
    PRO: {
      name: 'Pro',
      description: 'Complete solution for professional organizers',
      features: [
        'Everything in Plus',
        'Unlimited capacity events',
        'API access',
        'Dedicated account manager',
        'Custom integrations',
      ],
    },
  },
  EVENT: {
    PLUS: {
      name: 'Event Plus',
      description: 'Boost your event visibility',
      features: [
        'Featured in listings',
        '1 boost opportunity',
        '1 local push notification',
        'Up to 150 participants',
        'Standard analytics',
      ],
    },
    PRO: {
      name: 'Event Pro',
      description: 'Maximum reach for your event',
      features: [
        'Premium featured placement',
        '3 boost opportunities',
        '3 local push notifications',
        'Up to 500 participants',
        'Advanced analytics & insights',
      ],
    },
  },
} as const;
