/**
 * @appname/observability
 *
 * Shared observability package for distributed tracing, metrics, and logging.
 *
 * Works seamlessly in:
 * - Local development (Docker Compose)
 * - Kubernetes (AWS EKS)
 * - Managed observability (Grafana Cloud)
 *
 * @example Basic setup (API)
 * ```ts
 * import { initObservability } from '@appname/observability';
 *
 * // Call BEFORE any other imports
 * await initObservability();
 *
 * // Rest of your app...
 * import fastify from 'fastify';
 * ```
 *
 * @example Enhanced Pino logger
 * ```ts
 * import pino from 'pino';
 * import { pinoTraceMixin } from '@appname/observability/pino';
 *
 * const logger = pino({
 *   mixin: pinoTraceMixin,
 * });
 *
 * // Logs will include trace_id and span_id
 * logger.info('Request handled');
 * ```
 *
 * @example Business metrics
 * ```ts
 * import { businessMetrics } from '@appname/observability/metrics';
 *
 * businessMetrics.increment('events.created', { visibility: 'public' });
 * businessMetrics.increment('payments.success', { plan: 'pro' });
 * ```
 */

export * from './config';
export * from './tracing';
export * from './metrics';
export * from './pino';
export * from './graphql';
export * from './bullmq';
export * from './browser';

import { initTracing, shutdownTracing } from './tracing';
import { initMetrics, shutdownMetrics } from './metrics';
import { getObservabilityConfig } from './config';

/**
 * Initialize all observability (tracing + metrics)
 *
 * Call this ONCE at application startup, BEFORE any other imports.
 *
 * @returns Promise that resolves when initialization is complete
 *
 * @example
 * ```ts
 * import { initObservability } from '@appname/observability';
 *
 * await initObservability();
 *
 * // Now import and start your app
 * import { createServer } from './server';
 * const server = await createServer();
 * await server.listen({ port: 4000 });
 * ```
 */
export async function initObservability(): Promise<void> {
  const config = getObservabilityConfig();

  if (config.debug) {
    console.log('[Observability] Initializing...', {
      service: config.serviceName,
      version: config.serviceVersion,
      environment: config.environment,
      endpoint: config.otlpEndpoint,
    });
  }

  try {
    // Initialize tracing first (required for context propagation)
    await initTracing();

    // Initialize metrics
    await initMetrics();

    if (config.debug) {
      console.log('[Observability] ✅ Initialization complete');
    }
  } catch (error) {
    console.error('[Observability] ❌ Initialization failed:', error);
    // Don't throw - observability failure shouldn't break the app
  }
}

/**
 * Shutdown all observability
 *
 * Call this during graceful shutdown to flush pending telemetry.
 */
export async function shutdownObservability(): Promise<void> {
  const config = getObservabilityConfig();

  if (config.debug) {
    console.log('[Observability] Shutting down...');
  }

  try {
    await Promise.all([shutdownTracing(), shutdownMetrics()]);

    if (config.debug) {
      console.log('[Observability] ✅ Shutdown complete');
    }
  } catch (error) {
    console.error('[Observability] Error during shutdown:', error);
  }
}
