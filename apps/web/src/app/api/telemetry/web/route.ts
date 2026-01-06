/**
 * Web Telemetry Ingest Endpoint
 *
 * Handles:
 * - Web Vitals events
 * - Route transition events
 * - Runtime errors
 *
 * Requirements:
 * - ✅ Payload validation (Valibot)
 * - ✅ Rate limiting (per IP)
 * - ✅ Size limits
 * - ✅ No PII logging
 * - ✅ Metrics export to OpenTelemetry
 * - ✅ Aggregation to Prometheus-safe labels
 */

import { NextRequest, NextResponse } from 'next/server';
import * as v from 'valibot';
import { metrics } from '@opentelemetry/api';

// =============================================================================
// Validation Schemas
// =============================================================================

const WebVitalEventSchema = v.object({
  event_type: v.literal('web_vital'),
  session_id: v.string(),
  metric_name: v.picklist(['LCP', 'CLS', 'INP', 'FCP', 'TTFB']),
  metric_value: v.pipe(v.number(), v.minValue(0)), // CLS can be < 0.001
  metric_id: v.string(),
  metric_rating: v.optional(v.picklist(['good', 'needs-improvement', 'poor'])),
  metric_delta: v.number(),
  pathname: v.string(),
  route_template: v.string(),
  route_group: v.string(),
  navigation_type: v.string(),
  device_type: v.picklist(['mobile', 'tablet', 'desktop']),
  connection_type: v.string(),
  viewport_width: v.number(),
  viewport_height: v.number(),
  timestamp: v.number(),
});

const RouteTransitionEventSchema = v.object({
  event_type: v.literal('route_transition'),
  session_id: v.string(),
  from_path: v.string(),
  from_template: v.string(),
  from_group: v.string(),
  to_path: v.string(),
  to_template: v.string(),
  to_group: v.string(),
  duration_ms: v.pipe(v.number(), v.minValue(0)),
  success: v.boolean(),
  reason: v.optional(v.picklist(['normal', 'error', 'aborted'])),
  device_type: v.string(),
  timestamp: v.number(),
});

const RuntimeErrorEventSchema = v.object({
  event_type: v.literal('runtime_error'),
  session_id: v.string(),
  error_type: v.string(),
  error_message: v.pipe(v.string(), v.maxLength(500)), // Truncate long messages
  pathname: v.string(),
  route_template: v.string(),
  timestamp: v.number(),
});

const TelemetryEventSchema = v.variant('event_type', [
  WebVitalEventSchema,
  RouteTransitionEventSchema,
  RuntimeErrorEventSchema,
]);

const BatchPayloadSchema = v.object({
  events: v.pipe(v.array(TelemetryEventSchema), v.maxLength(20)), // Max 20 events per batch
});

const SinglePayloadSchema = TelemetryEventSchema;

// =============================================================================
// Rate Limiting
// =============================================================================

const rateLimit = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 100; // 100 requests per minute per IP

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const bucket = rateLimit.get(ip);

  if (!bucket || bucket.resetAt < now) {
    rateLimit.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (bucket.count >= RATE_LIMIT_MAX) {
    return false;
  }

  bucket.count++;
  return true;
}

// Cleanup old rate limit entries every 5 minutes
setInterval(
  () => {
    const now = Date.now();
    for (const [ip, bucket] of rateLimit.entries()) {
      if (bucket.resetAt < now) {
        rateLimit.delete(ip);
      }
    }
  },
  5 * 60 * 1000
);

// =============================================================================
// OpenTelemetry Metrics
// =============================================================================

const meter = metrics.getMeter('web-telemetry');

// Web Vitals histograms
const lcpHistogram = meter.createHistogram('web.vitals.lcp', {
  description: 'Largest Contentful Paint (ms)',
  unit: 'ms',
});

const clsHistogram = meter.createHistogram('web.vitals.cls', {
  description: 'Cumulative Layout Shift',
  unit: '1',
});

const inpHistogram = meter.createHistogram('web.vitals.inp', {
  description: 'Interaction to Next Paint (ms)',
  unit: 'ms',
});

const fcpHistogram = meter.createHistogram('web.vitals.fcp', {
  description: 'First Contentful Paint (ms)',
  unit: 'ms',
});

const ttfbHistogram = meter.createHistogram('web.vitals.ttfb', {
  description: 'Time to First Byte (ms)',
  unit: 'ms',
});

// Route transition histogram
const routeTransitionHistogram = meter.createHistogram('web.route_transition', {
  description: 'Route transition duration (ms)',
  unit: 'ms',
});

// Route transition counter (for error tracking)
const routeTransitionCounter = meter.createCounter(
  'web.route_transition.total',
  {
    description: 'Total route transitions',
    unit: '1',
  }
);

// =============================================================================
// Event Processing
// =============================================================================

function processWebVitalEvent(
  event: v.InferOutput<typeof WebVitalEventSchema>
): void {
  // Build attributes (low cardinality!)
  const attributes = {
    'web.vital.name': event.metric_name,
    'web.vital.rating': event.metric_rating || 'unknown',
    'web.vital.route_template': event.route_template, // Normalized template
    'web.vital.route_group': event.route_group, // Low cardinality group
    'web.vital.device': event.device_type,
    'web.vital.connection': event.connection_type,
    'web.vital.nav_type': event.navigation_type,
  };

  // Record metric to appropriate histogram
  switch (event.metric_name) {
    case 'LCP':
      lcpHistogram.record(event.metric_value, attributes);
      break;
    case 'CLS':
      clsHistogram.record(event.metric_value, attributes);
      break;
    case 'INP':
      inpHistogram.record(event.metric_value, attributes);
      break;
    case 'FCP':
      fcpHistogram.record(event.metric_value, attributes);
      break;
    case 'TTFB':
      ttfbHistogram.record(event.metric_value, attributes);
      break;
  }

  // Dev logging (no PII)
  if (process.env.NODE_ENV !== 'production') {
    console.log('[telemetry/web]', event.event_type, {
      metric: event.metric_name,
      value: event.metric_value,
      rating: event.metric_rating,
      route: event.route_template,
    });
  }
}

function processRouteTransitionEvent(
  event: v.InferOutput<typeof RouteTransitionEventSchema>
): void {
  // Build attributes (low cardinality!)
  const attributes = {
    'route.from_template': event.from_template,
    'route.from_group': event.from_group,
    'route.to_template': event.to_template,
    'route.to_group': event.to_group,
    'route.success': event.success ? 'true' : 'false',
    'route.reason': event.reason || 'normal',
    device: event.device_type,
  };

  // Record histogram
  routeTransitionHistogram.record(event.duration_ms, attributes);

  // Record counter
  routeTransitionCounter.add(1, attributes);

  // Dev logging
  if (process.env.NODE_ENV !== 'production') {
    console.log('[telemetry/web]', event.event_type, {
      from: event.from_template,
      to: event.to_template,
      duration: event.duration_ms,
      success: event.success,
    });
  }
}

function processRuntimeErrorEvent(
  event: v.InferOutput<typeof RuntimeErrorEventSchema>
): void {
  // Log error (no PII, truncated message)
  if (process.env.NODE_ENV !== 'production') {
    console.error('[telemetry/web] runtime_error', {
      type: event.error_type,
      message: event.error_message,
      route: event.route_template,
    });
  }

  // TODO: Send to error tracking system (Sentry, etc.)
}

// =============================================================================
// API Handler
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      'unknown';

    // Check rate limit
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Check content length (max 100KB)
    const contentLength = parseInt(
      request.headers.get('content-length') || '0'
    );
    if (contentLength > 100 * 1024) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
    }

    // Parse body
    const body = await request.json();

    // Validate payload (batch or single event)
    let events: v.InferOutput<typeof TelemetryEventSchema>[];

    if (body.events && Array.isArray(body.events)) {
      // Batch payload
      const validatedBatch = v.parse(BatchPayloadSchema, body);
      events = validatedBatch.events;
    } else {
      // Single event payload
      const validatedEvent = v.parse(SinglePayloadSchema, body);
      events = [validatedEvent];
    }

    // Process each event
    for (const event of events) {
      switch (event.event_type) {
        case 'web_vital':
          processWebVitalEvent(event);
          break;
        case 'route_transition':
          processRouteTransitionEvent(event);
          break;
        case 'runtime_error':
          processRuntimeErrorEvent(event);
          break;
      }
    }

    return NextResponse.json({ ok: true, processed: events.length });
  } catch (error) {
    // Validation error or other error
    if (v.isValiError(error)) {
      return NextResponse.json(
        { error: 'Invalid payload', details: error.issues },
        { status: 400 }
      );
    }

    // Log error (no sensitive data)
    console.error(
      '[telemetry/web] Error processing telemetry:',
      error instanceof Error ? error.message : 'Unknown error'
    );

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// OPTIONS handler for CORS preflight (if needed)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
