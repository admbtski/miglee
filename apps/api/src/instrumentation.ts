/**
 * Instrumentation Setup
 *
 * This file MUST be imported FIRST, before any other imports.
 * OpenTelemetry auto-instrumentation patches modules at load time.
 */

import { initObservability } from '@appname/observability';

// Initialize observability synchronously
// This must happen before any other imports to properly instrument libraries
await initObservability();

console.log('[API] Observability initialized');

