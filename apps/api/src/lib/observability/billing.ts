/**
 * Billing & Subscriptions Observability
 *
 * HIGHEST PRIORITY - Money, support, complaints
 *
 * Tracked operations:
 * - Checkout creation (subscription, one-off, sponsorship)
 * - Subscription lifecycle (cancel, reactivate)
 * - Boost/LocalPush usage (abuse detection)
 * - Receipt generation
 */

import { getMeter } from '@appname/observability/metrics';
import { trace, SpanStatusCode } from '@opentelemetry/api';
import type { Span, Counter, Histogram } from '@opentelemetry/api';
import { logger } from '../pino';

// Lazy initialization - meters created on first use
let _meter: ReturnType<typeof getMeter> | null = null;
let _tracer: ReturnType<typeof trace.getTracer> | null = null;

function meter() {
  if (!_meter) _meter = getMeter('billing');
  return _meter;
}

function tracer() {
  if (!_tracer) _tracer = trace.getTracer('billing');
  return _tracer;
}

// =============================================================================
// Metrics (lazy)
// =============================================================================

let _checkoutCreated: Counter | null = null;
let _checkoutFailed: Counter | null = null;
let _subscriptionCanceled: Counter | null = null;
let _subscriptionReactivated: Counter | null = null;
let _boostUsed: Counter | null = null;
let _localPushUsed: Counter | null = null;
let _checkoutLatency: Histogram | null = null;

function checkoutCreated() {
  if (!_checkoutCreated) {
    _checkoutCreated = meter().createCounter('billing.checkout.created', {
      description: 'Checkout sessions created',
      unit: '1',
    });
  }
  return _checkoutCreated;
}

function checkoutFailed() {
  if (!_checkoutFailed) {
    _checkoutFailed = meter().createCounter('billing.checkout.failed', {
      description: 'Checkout creation failures',
      unit: '1',
    });
  }
  return _checkoutFailed;
}

function subscriptionCanceled() {
  if (!_subscriptionCanceled) {
    _subscriptionCanceled = meter().createCounter(
      'billing.subscription.canceled',
      {
        description: 'Subscriptions canceled',
        unit: '1',
      }
    );
  }
  return _subscriptionCanceled;
}

function subscriptionReactivated() {
  if (!_subscriptionReactivated) {
    _subscriptionReactivated = meter().createCounter(
      'billing.subscription.reactivated',
      {
        description: 'Subscriptions reactivated',
        unit: '1',
      }
    );
  }
  return _subscriptionReactivated;
}

function boostUsed() {
  if (!_boostUsed) {
    _boostUsed = meter().createCounter('billing.boost.used', {
      description: 'Boosts consumed',
      unit: '1',
    });
  }
  return _boostUsed;
}

function localPushUsed() {
  if (!_localPushUsed) {
    _localPushUsed = meter().createCounter('billing.localpush.used', {
      description: 'LocalPush notifications consumed',
      unit: '1',
    });
  }
  return _localPushUsed;
}

function checkoutLatency() {
  if (!_checkoutLatency) {
    _checkoutLatency = meter().createHistogram('billing.checkout.latency', {
      description: 'Checkout creation latency',
      unit: 'ms',
    });
  }
  return _checkoutLatency;
}

// =============================================================================
// Checkout Tracking
// =============================================================================

export type CheckoutType = 'subscription' | 'one_off' | 'event_sponsorship';
export type CheckoutOutcome = 'created' | 'failed';

interface CheckoutContext {
  userId: string;
  type: CheckoutType;
  plan?: string;
  eventId?: string;
  priceId?: string;
  idempotencyKey?: string;
}

export function trackCheckout(
  outcome: CheckoutOutcome,
  ctx: CheckoutContext,
  error?: string
): void {
  const attributes = {
    type: ctx.type,
    plan: ctx.plan || 'unknown',
  };

  if (outcome === 'created') {
    checkoutCreated().add(1, attributes);
  } else {
    checkoutFailed().add(1, { ...attributes, error: error || 'unknown' });
  }

  // Audit log (structured)
  logger.info(
    {
      audit: 'billing.checkout',
      outcome,
      userId: ctx.userId,
      type: ctx.type,
      plan: ctx.plan,
      eventId: ctx.eventId,
      idempotencyKey: ctx.idempotencyKey,
      error,
    },
    `Checkout ${outcome}: ${ctx.type}`
  );
}

// =============================================================================
// Subscription Lifecycle
// =============================================================================

interface SubscriptionContext {
  userId: string;
  subscriptionId: string;
  plan: string;
  reason?: string;
}

export function trackSubscriptionCanceled(ctx: SubscriptionContext): void {
  subscriptionCanceled().add(1, {
    plan: ctx.plan,
    reason: ctx.reason || 'user_request',
  });

  logger.info(
    {
      audit: 'billing.subscription.canceled',
      userId: ctx.userId,
      subscriptionId: ctx.subscriptionId,
      plan: ctx.plan,
      reason: ctx.reason,
    },
    'Subscription canceled'
  );
}

export function trackSubscriptionReactivated(ctx: SubscriptionContext): void {
  subscriptionReactivated().add(1, { plan: ctx.plan });

  logger.info(
    {
      audit: 'billing.subscription.reactivated',
      userId: ctx.userId,
      subscriptionId: ctx.subscriptionId,
      plan: ctx.plan,
    },
    'Subscription reactivated'
  );
}

// =============================================================================
// Boost & LocalPush Usage (Abuse Detection)
// =============================================================================

interface ActionUsageContext {
  userId: string;
  eventId: string;
  remaining: number;
}

export function trackBoostUsed(ctx: ActionUsageContext): void {
  boostUsed().add(1, { remaining_bucket: getBucket(ctx.remaining) });

  logger.info(
    {
      audit: 'billing.boost.used',
      userId: ctx.userId,
      eventId: ctx.eventId,
      remaining: ctx.remaining,
    },
    'Boost used'
  );
}

export function trackLocalPushUsed(ctx: ActionUsageContext): void {
  localPushUsed().add(1, { remaining_bucket: getBucket(ctx.remaining) });

  logger.info(
    {
      audit: 'billing.localpush.used',
      userId: ctx.userId,
      eventId: ctx.eventId,
      remaining: ctx.remaining,
    },
    'LocalPush used'
  );
}

// =============================================================================
// Tracing Wrapper for Billing Operations
// =============================================================================

export async function traceBillingOperation<T>(
  operationName: string,
  ctx: { userId: string; [key: string]: unknown },
  fn: (span: Span) => Promise<T>
): Promise<T> {
  const startTime = Date.now();

  return tracer().startActiveSpan(`billing.${operationName}`, async (span) => {
    span.setAttribute('user.id', ctx.userId);
    span.setAttribute('billing.operation', operationName);

    try {
      const result = await fn(span);
      span.setStatus({ code: SpanStatusCode.OK });
      checkoutLatency().record(Date.now() - startTime, {
        operation: operationName,
        status: 'ok',
      });
      return result;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      checkoutLatency().record(Date.now() - startTime, {
        operation: operationName,
        status: 'error',
      });
      throw error;
    } finally {
      span.end();
    }
  });
}

// =============================================================================
// Helpers
// =============================================================================

function getBucket(value: number): string {
  if (value === 0) return '0';
  if (value <= 5) return '1-5';
  if (value <= 10) return '6-10';
  return '10+';
}
