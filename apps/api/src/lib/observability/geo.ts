/**
 * Search / Map / Geo Observability
 *
 * CRITICAL: Often the most expensive DB queries (PostGIS + FTS + sort + pagination).
 * DO NOT use keywords, bbox, placeId as labels/attributes (cardinality!)
 */

import { getMeter } from '@appname/observability/metrics';
import { trace, SpanStatusCode } from '@opentelemetry/api';
import type { Span, Counter, Histogram } from '@opentelemetry/api';
import { logger } from '../pino';

// Lazy initialization
let _meter: ReturnType<typeof getMeter> | null = null;
let _tracer: ReturnType<typeof trace.getTracer> | null = null;

function meter() {
  if (!_meter) _meter = getMeter('geo');
  return _meter;
}

function tracer() {
  if (!_tracer) _tracer = trace.getTracer('geo');
  return _tracer;
}

let _geoQueryLatency: Histogram | null = null;
let _geoQueryDbTime: Histogram | null = null;
let _geoQueryResultCount: Histogram | null = null;
let _geoQueryPayloadSize: Histogram | null = null;
let _geoQueryErrors: Counter | null = null;

function geoQueryLatency() {
  if (!_geoQueryLatency) {
    _geoQueryLatency = meter().createHistogram('geo.query.latency', { description: 'Geo query latency', unit: 'ms' });
  }
  return _geoQueryLatency;
}

function geoQueryDbTime() {
  if (!_geoQueryDbTime) {
    _geoQueryDbTime = meter().createHistogram('geo.query.db_time', { description: 'Database time for geo queries', unit: 'ms' });
  }
  return _geoQueryDbTime;
}

function geoQueryResultCount() {
  if (!_geoQueryResultCount) {
    _geoQueryResultCount = meter().createHistogram('geo.query.result_count', { description: 'Number of results from geo queries', unit: '1' });
  }
  return _geoQueryResultCount;
}

function geoQueryPayloadSize() {
  if (!_geoQueryPayloadSize) {
    _geoQueryPayloadSize = meter().createHistogram('geo.query.payload_size', { description: 'Response payload size', unit: 'bytes' });
  }
  return _geoQueryPayloadSize;
}

function geoQueryErrors() {
  if (!_geoQueryErrors) {
    _geoQueryErrors = meter().createCounter('geo.query.errors', { description: 'Geo query errors', unit: '1' });
  }
  return _geoQueryErrors;
}

export type GeoQueryType = 'clusters' | 'region_events' | 'events_near' | 'events_search';

interface GeoQueryContext {
  queryType: GeoQueryType;
  resultCount: number;
  latencyMs: number;
  dbTimeMs?: number;
  payloadBytes?: number;
  hasFilters?: boolean;
  zoom?: number;
}

export function trackGeoQuery(ctx: GeoQueryContext): void {
  const attributes = {
    query_type: ctx.queryType,
    has_filters: String(ctx.hasFilters || false),
    zoom_bucket: ctx.zoom ? getZoomBucket(ctx.zoom) : 'none',
  };

  geoQueryLatency().record(ctx.latencyMs, attributes);
  geoQueryResultCount().record(ctx.resultCount, attributes);

  if (ctx.dbTimeMs) geoQueryDbTime().record(ctx.dbTimeMs, attributes);
  if (ctx.payloadBytes) geoQueryPayloadSize().record(ctx.payloadBytes, attributes);

  if (ctx.latencyMs > 1000) {
    logger.warn({
      geo: ctx.queryType,
      latencyMs: ctx.latencyMs,
      dbTimeMs: ctx.dbTimeMs,
      resultCount: ctx.resultCount,
      hasFilters: ctx.hasFilters,
    }, `Slow geo query: ${ctx.queryType}`);
  }
}

export function trackGeoQueryError(queryType: GeoQueryType, error: string): void {
  geoQueryErrors().add(1, { query_type: queryType, error_type: error.substring(0, 50) });
}

export async function traceGeoQuery<T>(
  queryType: GeoQueryType,
  fn: (span: Span) => Promise<T>,
  context?: { hasFilters?: boolean; zoom?: number }
): Promise<{ result: T; latencyMs: number }> {
  const startTime = Date.now();

  return tracer().startActiveSpan(`geo.query.${queryType}`, async (span) => {
    span.setAttribute('geo.query_type', queryType);
    if (context?.hasFilters !== undefined) span.setAttribute('geo.has_filters', context.hasFilters);
    if (context?.zoom !== undefined) span.setAttribute('geo.zoom_bucket', getZoomBucket(context.zoom));

    try {
      const result = await fn(span);
      span.setStatus({ code: SpanStatusCode.OK });
      return { result, latencyMs: Date.now() - startTime };
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: error instanceof Error ? error.message : 'Unknown error' });
      trackGeoQueryError(queryType, error instanceof Error ? error.message : 'unknown');
      throw error;
    } finally {
      span.end();
    }
  });
}

function getZoomBucket(zoom: number): string {
  if (zoom <= 5) return 'country';
  if (zoom <= 10) return 'region';
  if (zoom <= 14) return 'city';
  return 'street';
}
