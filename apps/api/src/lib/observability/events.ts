/**
 * Event Lifecycle & Publication Observability
 *
 * CORE FUNCTIONALITY - Can kill DB and budget
 *
 * Tracked operations:
 * - Event queries (latency, result count, empty rate)
 * - Event CRUD operations
 * - Publication state changes
 * - Geo/Map queries (clusters)
 */

import { getMeter } from '@appname/observability/metrics';
import { trace, SpanStatusCode } from '@opentelemetry/api';
import type { Span, Counter, Histogram } from '@opentelemetry/api';
import { logger } from '../pino';

// Lazy initialization - meters created on first use to ensure MeterProvider is set
let _meter: ReturnType<typeof getMeter> | null = null;
let _tracer: ReturnType<typeof trace.getTracer> | null = null;

function meter() {
  if (!_meter) _meter = getMeter('events');
  return _meter;
}

function tracer() {
  if (!_tracer) _tracer = trace.getTracer('events');
  return _tracer;
}

// =============================================================================
// Query Metrics (lazy)
// =============================================================================

let _eventsQueryLatency: Histogram | null = null;
let _eventsQueryResultCount: Histogram | null = null;
let _eventsQueryEmpty: Counter | null = null;
let _clustersQueryLatency: Histogram | null = null;

function eventsQueryLatency() {
  if (!_eventsQueryLatency) {
    _eventsQueryLatency = meter().createHistogram('events.query.latency', {
      description: 'Events query latency in milliseconds',
      unit: 'ms',
    });
  }
  return _eventsQueryLatency;
}

function eventsQueryResultCount() {
  if (!_eventsQueryResultCount) {
    _eventsQueryResultCount = meter().createHistogram(
      'events.query.result_count',
      {
        description: 'Number of events returned by query',
        unit: '1',
      }
    );
  }
  return _eventsQueryResultCount;
}

function eventsQueryEmpty() {
  if (!_eventsQueryEmpty) {
    _eventsQueryEmpty = meter().createCounter('events.query.empty', {
      description: 'Queries returning zero results',
      unit: '1',
    });
  }
  return _eventsQueryEmpty;
}

function clustersQueryLatency() {
  if (!_clustersQueryLatency) {
    _clustersQueryLatency = meter().createHistogram('events.clusters.latency', {
      description: 'Clusters (map) query latency',
      unit: 'ms',
    });
  }
  return _clustersQueryLatency;
}

// =============================================================================
// Lifecycle Metrics (lazy)
// =============================================================================

let _eventCreated: Counter | null = null;
let _eventPublished: Counter | null = null;
let _eventCanceled: Counter | null = null;
let _eventDeleted: Counter | null = null;
let _eventStateChange: Counter | null = null;

function eventCreated() {
  if (!_eventCreated) {
    _eventCreated = meter().createCounter('events.created', {
      description: 'Events created',
      unit: '1',
    });
  }
  return _eventCreated;
}

function eventPublished() {
  if (!_eventPublished) {
    _eventPublished = meter().createCounter('events.published', {
      description: 'Events published',
      unit: '1',
    });
  }
  return _eventPublished;
}

function eventCanceled() {
  if (!_eventCanceled) {
    _eventCanceled = meter().createCounter('events.canceled', {
      description: 'Events canceled',
      unit: '1',
    });
  }
  return _eventCanceled;
}

function eventDeleted() {
  if (!_eventDeleted) {
    _eventDeleted = meter().createCounter('events.deleted', {
      description: 'Events deleted',
      unit: '1',
    });
  }
  return _eventDeleted;
}

function eventStateChange() {
  if (!_eventStateChange) {
    _eventStateChange = meter().createCounter('events.state_change', {
      description: 'Event state transitions',
      unit: '1',
    });
  }
  return _eventStateChange;
}

// =============================================================================
// Query Tracking
// =============================================================================

interface EventsQueryContext {
  queryName: 'events' | 'regionEvents' | 'clusters' | 'event';
  filters?: string[]; // e.g., ['category', 'date', 'geo']
  resultCount: number;
  latencyMs: number;
  cached?: boolean;
}

export function trackEventsQuery(ctx: EventsQueryContext): void {
  const attributes = {
    query: ctx.queryName,
    cached: String(ctx.cached || false),
    // Note: Don't use high-cardinality values like ownerId, keywords as labels!
    has_filters: ctx.filters?.length ? 'yes' : 'no',
  };

  if (ctx.queryName === 'clusters') {
    clustersQueryLatency().record(ctx.latencyMs, attributes);
  } else {
    eventsQueryLatency().record(ctx.latencyMs, attributes);
  }

  eventsQueryResultCount().record(ctx.resultCount, attributes);

  if (ctx.resultCount === 0) {
    eventsQueryEmpty().add(1, attributes);
  }

  // Debug log for slow queries (don't log every query in prod)
  if (ctx.latencyMs > 500) {
    logger.warn(
      {
        query: ctx.queryName,
        latencyMs: ctx.latencyMs,
        resultCount: ctx.resultCount,
        filters: ctx.filters,
      },
      `Slow events query: ${ctx.queryName}`
    );
  }
}

// =============================================================================
// Lifecycle Tracking
// =============================================================================

export type EventLifecycleAction =
  | 'created'
  | 'updated'
  | 'published'
  | 'scheduled_publication'
  | 'canceled_publication'
  | 'unpublished'
  | 'canceled'
  | 'deleted'
  | 'join_closed'
  | 'join_reopened';

interface EventLifecycleContext {
  eventId: string;
  userId: string;
  action: EventLifecycleAction;
  visibility?: string;
  previousState?: string;
  newState?: string;
}

export function trackEventLifecycle(ctx: EventLifecycleContext): void {
  const attributes = {
    action: ctx.action,
    visibility: ctx.visibility || 'unknown',
  };

  switch (ctx.action) {
    case 'created':
      eventCreated().add(1, attributes);
      break;
    case 'published':
    case 'scheduled_publication':
      eventPublished().add(1, attributes);
      break;
    case 'canceled':
      eventCanceled().add(1, attributes);
      break;
    case 'deleted':
      eventDeleted().add(1, attributes);
      break;
    default:
      eventStateChange().add(1, attributes);
  }

  logger.info(
    {
      audit: 'events.lifecycle',
      action: ctx.action,
      eventId: ctx.eventId,
      userId: ctx.userId,
      visibility: ctx.visibility,
      previousState: ctx.previousState,
      newState: ctx.newState,
    },
    `Event ${ctx.action}`
  );
}

// =============================================================================
// Tracing Wrapper
// =============================================================================

export async function traceEventsQuery<T>(
  queryName: string,
  fn: (span: Span) => Promise<T>,
  context?: { filters?: string[] }
): Promise<{ result: T; latencyMs: number }> {
  const startTime = Date.now();

  return tracer().startActiveSpan(`events.query.${queryName}`, async (span) => {
    span.setAttribute('events.query_name', queryName);
    if (context?.filters) {
      span.setAttribute('events.filters', context.filters.join(','));
    }

    try {
      const result = await fn(span);
      span.setStatus({ code: SpanStatusCode.OK });
      return { result, latencyMs: Date.now() - startTime };
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

export async function traceEventMutation<T>(
  operationName: string,
  ctx: { eventId?: string; userId: string },
  fn: (span: Span) => Promise<T>
): Promise<T> {
  return tracer().startActiveSpan(
    `events.mutation.${operationName}`,
    async (span) => {
      span.setAttribute('user.id', ctx.userId);
      if (ctx.eventId) span.setAttribute('event.id', ctx.eventId);
      span.setAttribute('events.operation', operationName);

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
    }
  );
}
