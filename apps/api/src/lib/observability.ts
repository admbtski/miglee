/**
 * Observability helpers for API
 *
 * Business metrics and tracing helpers specific to the API service.
 */

import { businessMetrics, jobMetrics } from '@appname/observability/metrics';
import { trace, SpanStatusCode } from '@opentelemetry/api';

const tracer = trace.getTracer('api');

/**
 * Track business events with metrics
 *
 * Usage:
 * ```ts
 * import { trackEvent } from './lib/observability';
 *
 * trackEvent('event.created', { visibility: 'public', category: 'sport' });
 * trackEvent('event.joined', { join_mode: 'public' });
 * ```
 */
export function trackEvent(eventName: string, attributes: Record<string, string> = {}): void {
  businessMetrics.increment(eventName, attributes);
}

/**
 * Track payment events
 */
export const trackPayment = {
  success(plan: string, amount?: number) {
    businessMetrics.increment('payments.success', { plan });
    if (amount) {
      // Could add histogram for amounts
    }
  },
  
  failed(plan: string, reason: string) {
    businessMetrics.increment('payments.failed', { plan, reason });
  },
  
  refund(plan: string, reason: string) {
    businessMetrics.increment('payments.refund', { plan, reason });
  },
};

/**
 * Track notification events
 */
export const trackNotification = {
  sent(channel: 'email' | 'push' | 'in_app', type: string) {
    businessMetrics.increment('notifications.sent', { channel, type });
  },
  
  failed(channel: 'email' | 'push' | 'in_app', type: string, reason: string) {
    businessMetrics.increment('notifications.failed', { channel, type, reason });
  },
};

/**
 * Track check-in events
 */
export function trackCheckIn(attributes: { event_type?: string } = {}): void {
  businessMetrics.increment('checkins.count', attributes);
}

/**
 * Create a custom span for a domain operation
 *
 * Usage:
 * ```ts
 * await traceOperation('processPayment', async (span) => {
 *   span.setAttribute('user.id', userId);
 *   span.setAttribute('amount', amount);
 *   
 *   const result = await stripe.createPaymentIntent(...);
 *   return result;
 * });
 * ```
 */
export async function traceOperation<T>(
  operationName: string,
  fn: (span: ReturnType<typeof tracer.startSpan>) => Promise<T>,
  attributes: Record<string, string | number | boolean> = {}
): Promise<T> {
  return tracer.startActiveSpan(operationName, { attributes }, async (span) => {
    try {
      const result = await fn(span);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ 
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    } finally {
      span.end();
    }
  });
}

/**
 * Record job metrics
 *
 * Usage in worker:
 * ```ts
 * import { recordJob } from './lib/observability';
 *
 * const startTime = Date.now();
 * try {
 *   await processJob(job);
 *   recordJob(job.name, 'completed', Date.now() - startTime, { queue: job.queueName });
 * } catch (error) {
 *   recordJob(job.name, 'failed', Date.now() - startTime, { queue: job.queueName });
 * }
 * ```
 */
export function recordJob(
  jobName: string,
  result: 'completed' | 'failed',
  durationMs: number,
  attributes: Record<string, string> = {}
): void {
  jobMetrics.recordJob(jobName, result, durationMs / 1000, attributes);
}

/**
 * Export metrics and tracking helpers
 */
export { businessMetrics, jobMetrics } from '@appname/observability/metrics';

