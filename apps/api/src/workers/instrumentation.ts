/**
 * Worker OpenTelemetry Instrumentation
 * 
 * This module initializes the OTel SDK for worker processes.
 * 
 * IMPORTANT: This must be imported as the FIRST line in each worker entrypoint
 * to ensure all subsequent imports are properly instrumented.
 */

import { initObservability } from '@appname/observability';

// Initialize OpenTelemetry SDK for worker
// Config is loaded from environment variables automatically
await initObservability();

console.log('[Worker] OpenTelemetry initialized');

