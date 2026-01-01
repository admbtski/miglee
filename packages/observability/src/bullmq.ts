/**
 * BullMQ OpenTelemetry Integration
 * 
 * Provides trace propagation for BullMQ jobs:
 * 1. Producer side: injectTraceContext() - captures current trace context and adds to job data
 * 2. Worker side: wrapJobProcessor() - extracts trace context and creates child span
 * 
 * This ensures end-to-end correlation between API request and async job execution.
 */

import {
  trace,
  context,
  propagation,
  SpanStatusCode,
  Span,
  SpanKind,
} from '@opentelemetry/api';
import type { Job } from 'bullmq';

const tracer = trace.getTracer('bullmq');

// =============================================================================
// Producer: Inject Trace Context
// =============================================================================

/**
 * Injects current trace context into job data.
 * Call this when adding a job to the queue.
 * 
 * @example
 * ```ts
 * const jobData = injectTraceContext({ eventId: '123' });
 * await queue.add('send-email', jobData);
 * ```
 */
export function injectTraceContext<T extends Record<string, unknown>>(
  data: T
): T & { __traceContext?: Record<string, string> } {
  const carrier: Record<string, string> = {};
  propagation.inject(context.active(), carrier);

  return {
    ...data,
    __traceContext: Object.keys(carrier).length > 0 ? carrier : undefined,
  };
}

// =============================================================================
// Worker: Extract Trace Context and Create Span
// =============================================================================

/**
 * Wraps a BullMQ job processor to:
 * 1. Extract trace context from job data
 * 2. Create a child span for the job execution
 * 3. Add job metadata to span
 * 4. Handle errors and span status
 * 
 * @example
 * ```ts
 * createWorker('email-queue', wrapJobProcessor(async (job) => {
 *   // Your job logic here
 *   await sendEmail(job.data.email);
 * }));
 * ```
 */
export function wrapJobProcessor<T = unknown>(
  processor: (job: Job<T>) => Promise<unknown>,
  options: {
    /**
     * Custom span name. Defaults to "job.{queueName}.{jobName}"
     */
    spanName?: (job: Job<T>) => string;
    /**
     * Add custom attributes to the span
     */
    addAttributes?: (job: Job<T>) => Record<string, string | number | boolean>;
  } = {}
): (job: Job<T>) => Promise<unknown> {
  return async (job: Job<T>) => {
    // Extract trace context from job data
    const jobData = job.data as Record<string, unknown>;
    const carrier = (jobData?.__traceContext as Record<string, string>) || {};

    // Create parent context from carrier
    const parentContext = propagation.extract(context.active(), carrier);

    // Determine span name
    const spanName =
      options.spanName?.(job) ||
      `job.${job.queueName}.${job.name || 'unnamed'}`;

    // Create span with parent context
    const span = tracer.startSpan(
      spanName,
      {
        kind: SpanKind.CONSUMER,
        attributes: {
          'job.id': job.id || 'unknown',
          'job.name': job.name || 'unnamed',
          'job.queue': job.queueName,
          'job.attempt': job.attemptsMade + 1,
          'job.timestamp': job.timestamp,
          ...options.addAttributes?.(job),
        },
      },
      parentContext
    );

    // Execute processor within span context
    return context.with(trace.setSpan(parentContext, span), async () => {
      try {
        const result = await processor(job);
        span.setStatus({ code: SpanStatusCode.OK });
        return result;
      } catch (error) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error instanceof Error ? error.message : 'Unknown error',
        });
        span.recordException(error instanceof Error ? error : new Error(String(error)));
        throw error;
      } finally {
        span.end();
      }
    });
  };
}

// =============================================================================
// Utility: Create Manual Span (for complex jobs)
// =============================================================================

/**
 * Creates a manual span for a specific job step.
 * Useful for tracing individual operations within a job.
 * 
 * @example
 * ```ts
 * await withJobSpan('fetch-user', async (span) => {
 *   span.setAttribute('user.id', userId);
 *   return await db.user.findUnique({ where: { id: userId } });
 * });
 * ```
 */
export async function withJobSpan<T>(
  name: string,
  fn: (span: Span) => Promise<T>
): Promise<T> {
  const span = tracer.startSpan(name, {
    kind: SpanKind.INTERNAL,
  });

  return context.with(trace.setSpan(context.active(), span), async () => {
    try {
      const result = await fn(span);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      span.recordException(error instanceof Error ? error : new Error(String(error)));
      throw error;
    } finally {
      span.end();
    }
  });
}

