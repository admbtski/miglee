/**
 * Worker OpenTelemetry Instrumentation
 * 
 * This module initializes the OTel SDK for worker processes.
 * 
 * IMPORTANT: This must be imported as the FIRST line in each worker entrypoint
 * to ensure all subsequent imports are properly instrumented.
 */

import { initObservability } from '@appname/observability';
import { config } from '../env';

// Initialize OpenTelemetry SDK for worker
initObservability({
  serviceName: `${config.serviceName}-worker`,
  serviceVersion: process.env.BUILD_SHA || 'unknown',
  environment: config.nodeEnv,
  // OTLP endpoint is configured via OTEL_EXPORTER_OTLP_ENDPOINT env var
  // For local dev, it defaults to http://localhost:4318 (OTel Collector)
});

console.log('[Worker] OpenTelemetry initialized');

