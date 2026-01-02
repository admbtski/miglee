/**
 * Read Receipts / Unread Counters Observability
 */

import { getMeter } from '@appname/observability/metrics';
import { trace, SpanStatusCode } from '@opentelemetry/api';
import type { Span, Counter, Histogram } from '@opentelemetry/api';
import { logger } from '../pino';

// Lazy initialization
let _meter: ReturnType<typeof getMeter> | null = null;
let _tracer: ReturnType<typeof trace.getTracer> | null = null;

function meter() {
  if (!_meter) _meter = getMeter('unread');
  return _meter;
}

function tracer() {
  if (!_tracer) _tracer = trace.getTracer('unread');
  return _tracer;
}

let _unreadRecompute: Histogram | null = null;
let _markReadResult: Counter | null = null;
let _unreadDivergence: Counter | null = null;
let _unreadQueryLatency: Histogram | null = null;

function unreadRecompute() {
  if (!_unreadRecompute) {
    _unreadRecompute = meter().createHistogram('unread.recompute.duration', { description: 'Unread count recomputation duration', unit: 'ms' });
  }
  return _unreadRecompute;
}

function markReadResult() {
  if (!_markReadResult) {
    _markReadResult = meter().createCounter('unread.mark_read.result', { description: 'Mark as read operation results', unit: '1' });
  }
  return _markReadResult;
}

function unreadDivergence() {
  if (!_unreadDivergence) {
    _unreadDivergence = meter().createCounter('unread.divergence', { description: 'Unread count divergence detected', unit: '1' });
  }
  return _unreadDivergence;
}

function unreadQueryLatency() {
  if (!_unreadQueryLatency) {
    _unreadQueryLatency = meter().createHistogram('unread.query.latency', { description: 'Unread query latency', unit: 'ms' });
  }
  return _unreadQueryLatency;
}

export type UnreadEntityType = 'event_chat' | 'dm_thread' | 'dm_message';
export type MarkReadResult = 'ok' | 'failed' | 'no_change';

interface UnreadRecomputeContext {
  entityType: UnreadEntityType;
  entityId: string;
  userId: string;
  durationMs: number;
  previousCount?: number;
  newCount?: number;
}

export function trackUnreadRecompute(ctx: UnreadRecomputeContext): void {
  unreadRecompute().record(ctx.durationMs, { entity_type: ctx.entityType });
  if (ctx.durationMs > 100 || (ctx.previousCount !== undefined && ctx.previousCount !== ctx.newCount)) {
    logger.debug({ unread: 'recompute', entityType: ctx.entityType, entityId: ctx.entityId, userId: ctx.userId, durationMs: ctx.durationMs, previousCount: ctx.previousCount, newCount: ctx.newCount }, `Unread recompute: ${ctx.entityType}`);
  }
}

interface MarkReadContext {
  entityType: UnreadEntityType;
  entityId: string;
  userId: string;
  result: MarkReadResult;
  messagesMarked?: number;
  errorReason?: string;
}

export function trackMarkRead(ctx: MarkReadContext): void {
  markReadResult().add(1, { entity_type: ctx.entityType, result: ctx.result, error_reason: ctx.errorReason || 'none' });
  if (ctx.result === 'failed') {
    logger.error({ unread: 'mark_read_failed', entityType: ctx.entityType, entityId: ctx.entityId, userId: ctx.userId, errorReason: ctx.errorReason }, `Mark read failed: ${ctx.entityType}`);
  }
}

interface DivergenceContext {
  entityType: UnreadEntityType;
  entityId: string;
  userId: string;
  cachedCount: number;
  actualCount: number;
  diff: number;
}

export function trackUnreadDivergence(ctx: DivergenceContext): void {
  unreadDivergence().add(1, { entity_type: ctx.entityType, direction: ctx.diff > 0 ? 'over' : 'under' });
  logger.warn({ unread: 'divergence', entityType: ctx.entityType, entityId: ctx.entityId, userId: ctx.userId, cachedCount: ctx.cachedCount, actualCount: ctx.actualCount, diff: ctx.diff }, `Unread divergence: cached=${ctx.cachedCount}, actual=${ctx.actualCount}`);
}

interface UnreadQueryContext {
  entityType: UnreadEntityType;
  userId: string;
  latencyMs: number;
  resultCount: number;
  unreadOnly?: boolean;
}

export function trackUnreadQuery(ctx: UnreadQueryContext): void {
  unreadQueryLatency().record(ctx.latencyMs, { entity_type: ctx.entityType, unread_only: String(ctx.unreadOnly ?? false) });
  if (ctx.latencyMs > 200) {
    logger.debug({ unread: 'query', entityType: ctx.entityType, userId: ctx.userId, latencyMs: ctx.latencyMs, resultCount: ctx.resultCount, unreadOnly: ctx.unreadOnly }, `Slow unread query: ${ctx.entityType}`);
  }
}

export async function traceUnreadOperation<T>(operationName: string, ctx: { userId: string; entityType: UnreadEntityType; entityId?: string }, fn: (span: Span) => Promise<T>): Promise<T> {
  return tracer().startActiveSpan(`unread.${operationName}`, async (span) => {
    span.setAttribute('unread.operation', operationName);
    span.setAttribute('unread.entity_type', ctx.entityType);
    span.setAttribute('unread.user_id', ctx.userId);
    if (ctx.entityId) span.setAttribute('unread.entity_id', ctx.entityId);
    try {
      const result = await fn(span);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    } finally {
      span.end();
    }
  });
}

export async function measureTime<T>(fn: () => Promise<T>): Promise<{ result: T; durationMs: number }> {
  const start = Date.now();
  const result = await fn();
  return { result, durationMs: Date.now() - start };
}
