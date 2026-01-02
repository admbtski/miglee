/**
 * OpenTelemetry Metrics Setup
 *
 * Provides:
 * - Prometheus-compatible metrics export
 * - Business metrics helpers
 * - RED metrics (Rate, Errors, Duration)
 */

import { MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SEMRESATTRS_SERVICE_NAME, SEMRESATTRS_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { metrics, Histogram, Counter, ObservableGauge, ValueType } from '@opentelemetry/api';

import { getObservabilityConfig, getResourceAttributes } from './config';

let meterProvider: MeterProvider | null = null;

/**
 * Initialize OpenTelemetry metrics
 *
 * Call this after initTracing()
 */
export async function initMetrics(): Promise<MeterProvider | null> {
  const config = getObservabilityConfig();
  
  // Skip if metrics disabled
  if (!config.enableMetrics) {
    if (config.debug) {
      console.log('[Observability] Metrics disabled');
    }
    return null;
  }
  
  // Skip if no OTLP endpoint
  if (!config.otlpEndpoint) {
    console.warn('[Observability] OTLP endpoint not configured, skipping metrics');
    return null;
  }
  
  if (config.debug) {
    console.log('[Observability] Initializing metrics...', {
      otlpEndpoint: config.otlpEndpoint,
    });
  }
  
  // Resource
  const resource = new Resource({
    [SEMRESATTRS_SERVICE_NAME]: config.serviceName,
    [SEMRESATTRS_SERVICE_VERSION]: config.serviceVersion,
    ...getResourceAttributes(config),
  });
  
  // OTLP metrics exporter
  const metricExporter = new OTLPMetricExporter({
    url: `${config.otlpEndpoint}/v1/metrics`,
    headers: {},
    timeoutMillis: 10000,
  });
  
  // Metric reader with periodic export
  // In development, export more frequently for faster feedback
  const exportInterval = config.environment === 'development' ? 15000 : 60000;
  const exportTimeout = config.environment === 'development' ? 10000 : 30000;
  const metricReader = new PeriodicExportingMetricReader({
    exporter: metricExporter,
    exportIntervalMillis: exportInterval,
    exportTimeoutMillis: exportTimeout,
  });
  
  if (config.debug) {
    console.log(`[Observability] Metrics export interval: ${exportInterval}ms`);
  }
  
  // Meter provider
  meterProvider = new MeterProvider({
    resource,
    readers: [metricReader],
  });
  
  // Set as global
  metrics.setGlobalMeterProvider(meterProvider);
  
  // Create "up" gauge to verify metrics export is working
  const meter = metrics.getMeter('app');
  const upGauge = meter.createObservableGauge('app.up', {
    description: 'Service is up (1) or down (0)',
    unit: '1',
  });
  upGauge.addCallback((result) => {
    result.observe(1, { service: config.serviceName });
  });
  
  if (config.debug) {
    console.log('[Observability] ✅ Metrics initialized successfully');
  }
  
  // Graceful shutdown
  process.on('SIGTERM', async () => {
    try {
      await meterProvider?.shutdown();
      console.log('[Observability] Metrics shut down gracefully');
    } catch (error) {
      console.error('[Observability] Error shutting down metrics', error);
    }
  });
  
  return meterProvider;
}

/**
 * Shutdown metrics
 */
export async function shutdownMetrics(): Promise<void> {
  if (meterProvider) {
    await meterProvider.shutdown();
    meterProvider = null;
  }
}

/**
 * Get meter for creating metrics
 *
 * Usage:
 * ```ts
 * import { getMeter } from '@appname/observability/metrics';
 *
 * const meter = getMeter();
 * const counter = meter.createCounter('api.requests', {
 *   description: 'Total API requests',
 *   unit: '1',
 * });
 * ```
 */
export function getMeter(name = 'default') {
  return metrics.getMeter(name);
}

// =============================================================================
// Pre-built metrics for common use cases
// =============================================================================

/**
 * Business metrics helper
 *
 * Creates counters for business events (e.g., events.created, payments.success)
 */
export class BusinessMetrics {
  private counters = new Map<string, Counter>();
  
  constructor(private meterName = 'business') {}
  
  /**
   * Increment a business counter
   *
   * @example
   * metrics.increment('events.created', { visibility: 'public' });
   * metrics.increment('payments.success', { plan: 'pro' });
   */
  increment(name: string, attributes: Record<string, string> = {}, value = 1): void {
    let counter = this.counters.get(name);
    
    if (!counter) {
      const meter = getMeter(this.meterName);
      counter = meter.createCounter(`app.${name}`, {
        description: `Business metric: ${name}`,
        unit: '1',
      });
      this.counters.set(name, counter);
    }
    
    counter.add(value, attributes);
  }
}

/**
 * Job/Worker metrics helper
 *
 * Tracks job duration, success/failure rates
 */
export class JobMetrics {
  private durationHistogram: Histogram;
  private countCounter: Counter;
  
  constructor(meterName = 'jobs') {
    const meter = getMeter(meterName);
    
    this.durationHistogram = meter.createHistogram('app.job.duration', {
      description: 'Job processing duration',
      unit: 'seconds',
    });
    
    this.countCounter = meter.createCounter('app.job.count', {
      description: 'Job execution count',
      unit: '1',
    });
  }
  
  /**
   * Record job execution
   *
   * @example
   * jobMetrics.recordJob('send-reminder', 'completed', 1.234, { queue: 'reminders' });
   */
  recordJob(
    jobName: string,
    result: 'completed' | 'failed',
    durationSeconds: number,
    attributes: Record<string, string> = {}
  ): void {
    const baseAttrs = {
      job_name: jobName,
      job_result: result,
      ...attributes,
    };
    
    this.durationHistogram.record(durationSeconds, baseAttrs);
    this.countCounter.add(1, baseAttrs);
  }
}

/**
 * Create observable gauge for queue depth
 *
 * Usage:
 * ```ts
 * createQueueDepthGauge('reminders', async () => {
 *   const queue = getQueue('reminders');
 *   return await queue.count();
 * });
 * ```
 */
export function createQueueDepthGauge(
  queueName: string,
  callback: () => Promise<number> | number
): ObservableGauge {
  const meter = getMeter('queues');
  
  const gauge = meter.createObservableGauge('app.queue.depth', {
    description: 'Number of jobs waiting in queue',
    unit: '1',
    valueType: ValueType.INT,
  });
  
  gauge.addCallback(async (observableResult) => {
    try {
      const depth = await callback();
      observableResult.observe(depth, { queue_name: queueName });
    } catch (error) {
      console.error(`Failed to observe queue depth for ${queueName}:`, error);
    }
  });
  
  return gauge;
}

// Export singleton instances
export const businessMetrics = new BusinessMetrics();
export const jobMetrics = new JobMetrics();

