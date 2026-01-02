/**
 * Instrumentation Setup
 *
 * This file MUST be imported FIRST, before any other imports.
 * OpenTelemetry auto-instrumentation patches modules at load time.
 */

// Load .env FIRST so OTEL variables are available
import dotenv from 'dotenv';
dotenv.config();

import { initObservability } from '@appname/observability';

// Initialize observability synchronously
// This must happen before any other imports to properly instrument libraries
// Config is loaded from environment variables automatically
await initObservability();

console.log('[API] Observability initialized');

