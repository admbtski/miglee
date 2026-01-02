/**
 * State Derivation / Aggregation Observability
 */

import { getMeter } from '@appname/observability/metrics';
import { trace, SpanStatusCode } from '@opentelemetry/api';
import type { Span, Counter, Histogram } from '@opentelemetry/api';
import { logger } from '../pino';

// Lazy initialization
let _meter: ReturnType<typeof getMeter> | null = null;
let _tracer: ReturnType<typeof trace.getTracer> | null = null;

function meter() {
  if (!_meter) _meter = getMeter('derivation');
  return _meter;
}

function tracer() {
  if (!_tracer) _tracer = trace.getTracer('derivation');
  return _tracer;
}

let _derivationLatency: Histogram | null = null;
let _derivationDbTime: Histogram | null = null;
let _derivationRowCount: Histogram | null = null;
let _derivationCacheHit: Counter | null = null;
let _derivationEmptyResult: Counter | null = null;

function derivationLatency() {
  if (!_derivationLatency) {
    _derivationLatency = meter().createHistogram('derivation.latency', { description: 'State derivation latency', unit: 'ms' });
  }
  return _derivationLatency;
}

function derivationDbTime() {
  if (!_derivationDbTime) {
    _derivationDbTime = meter().createHistogram('derivation.db_time', { description: 'Database time for derivations', unit: 'ms' });
  }
  return _derivationDbTime;
}

function derivationRowCount() {
  if (!_derivationRowCount) {
    _derivationRowCount = meter().createHistogram('derivation.row_count', { description: 'Rows processed in derivation', unit: '1' });
  }
  return _derivationRowCount;
}

function derivationCacheHit() {
  if (!_derivationCacheHit) {
    _derivationCacheHit = meter().createCounter('derivation.cache', { description: 'Derivation cache hits/misses', unit: '1' });
  }
  return _derivationCacheHit;
}

function derivationEmptyResult() {
  if (!_derivationEmptyResult) {
    _derivationEmptyResult = meter().createCounter('derivation.empty_result', { description: 'Derivations returning empty/zero results', unit: '1' });
  }
  return _derivationEmptyResult;
}

export type DerivationType = 'review_stats' | 'member_stats' | 'plan_periods' | 'sponsorships' | 'unread_count' | 'event_count' | 'region_aggregation';

interface DerivationContext {
  derivationType: DerivationType;
  entityId?: string;
  userId?: string;
  latencyMs: number;
  dbTimeMs?: number;
  rowCount?: number;
  cacheHit?: boolean;
  isEmpty: boolean;
}

export function trackDerivation(ctx: DerivationContext): void {
  const attributes = { derivation_type: ctx.derivationType, cache_hit: String(ctx.cacheHit ?? false) };
  derivationLatency().record(ctx.latencyMs, attributes);
  if (ctx.dbTimeMs !== undefined) derivationDbTime().record(ctx.dbTimeMs, attributes);
  if (ctx.rowCount !== undefined) derivationRowCount().record(ctx.rowCount, attributes);
  if (ctx.cacheHit !== undefined) derivationCacheHit().add(1, { derivation_type: ctx.derivationType, result: ctx.cacheHit ? 'hit' : 'miss' });
  if (ctx.isEmpty) derivationEmptyResult().add(1, { derivation_type: ctx.derivationType });
  if (ctx.latencyMs > 500 || (ctx.isEmpty && ctx.derivationType === 'review_stats')) {
    logger.debug({ derivation: ctx.derivationType, entityId: ctx.entityId, userId: ctx.userId, latencyMs: ctx.latencyMs, dbTimeMs: ctx.dbTimeMs, rowCount: ctx.rowCount, cacheHit: ctx.cacheHit, isEmpty: ctx.isEmpty }, `Derivation ${ctx.derivationType}: ${ctx.latencyMs}ms, empty=${ctx.isEmpty}`);
  }
}

export function trackReviewStats(eventId: string, latencyMs: number, stats: { count: number; avgRating: number | null }): void {
  trackDerivation({ derivationType: 'review_stats', entityId: eventId, latencyMs, isEmpty: stats.count === 0 });
}

export function trackMemberStats(eventId: string, latencyMs: number, stats: { total: number; joined: number; pending: number }): void {
  trackDerivation({ derivationType: 'member_stats', entityId: eventId, latencyMs, rowCount: stats.total, isEmpty: stats.total === 0 });
}

export function trackPlanPeriods(userId: string, latencyMs: number, periodCount: number): void {
  trackDerivation({ derivationType: 'plan_periods', userId, latencyMs, rowCount: periodCount, isEmpty: periodCount === 0 });
}

export function trackSponsorships(userId: string, latencyMs: number, sponsorshipCount: number): void {
  trackDerivation({ derivationType: 'sponsorships', userId, latencyMs, rowCount: sponsorshipCount, isEmpty: sponsorshipCount === 0 });
}

interface DerivationTraceResult<T> { result: T; latencyMs: number; dbTimeMs?: number; }

export async function traceDerivation<T>(derivationType: DerivationType, ctx: { entityId?: string; userId?: string }, fn: (span: Span, recordDbTime: (ms: number) => void) => Promise<T>): Promise<DerivationTraceResult<T>> {
  const startTime = Date.now();
  let dbTime = 0;
  const recordDbTime = (ms: number) => { dbTime += ms; };

  return tracer().startActiveSpan(`derivation.${derivationType}`, async (span) => {
    span.setAttribute('derivation.type', derivationType);
    if (ctx.entityId) span.setAttribute('derivation.entity_id', ctx.entityId);
    if (ctx.userId) span.setAttribute('derivation.user_id', ctx.userId);
    try {
      const result = await fn(span, recordDbTime);
      const latencyMs = Date.now() - startTime;
      span.setAttribute('derivation.latency_ms', latencyMs);
      span.setAttribute('derivation.db_time_ms', dbTime);
      span.setStatus({ code: SpanStatusCode.OK });
      return { result, latencyMs, dbTimeMs: dbTime };
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    } finally {
      span.end();
    }
  });
}

export async function measureDbTime<T>(fn: () => Promise<T>): Promise<{ result: T; durationMs: number }> {
  const start = Date.now();
  const result = await fn();
  return { result, durationMs: Date.now() - start };
}
