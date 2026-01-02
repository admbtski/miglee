/**
 * Bulk / Reorder / Replace Operations Observability
 */

import { getMeter } from '@appname/observability/metrics';
import { trace, SpanStatusCode } from '@opentelemetry/api';
import type { Span, Counter, Histogram } from '@opentelemetry/api';
import { logger } from '../pino';
import crypto from 'crypto';

// Lazy initialization
let _meter: ReturnType<typeof getMeter> | null = null;
let _tracer: ReturnType<typeof trace.getTracer> | null = null;

function meter() {
  if (!_meter) _meter = getMeter('bulk');
  return _meter;
}

function tracer() {
  if (!_tracer) _tracer = trace.getTracer('bulk');
  return _tracer;
}

let _bulkOperationDuration: Histogram | null = null;
let _bulkOperationDbTime: Histogram | null = null;
let _bulkOperationItemCount: Histogram | null = null;
let _bulkOperationResult: Counter | null = null;

function bulkOperationDuration() {
  if (!_bulkOperationDuration) {
    _bulkOperationDuration = meter().createHistogram('bulk.operation.duration', { description: 'Bulk operation duration', unit: 'ms' });
  }
  return _bulkOperationDuration;
}

function bulkOperationDbTime() {
  if (!_bulkOperationDbTime) {
    _bulkOperationDbTime = meter().createHistogram('bulk.operation.db_time', { description: 'Database time for bulk operations', unit: 'ms' });
  }
  return _bulkOperationDbTime;
}

function bulkOperationItemCount() {
  if (!_bulkOperationItemCount) {
    _bulkOperationItemCount = meter().createHistogram('bulk.operation.item_count', { description: 'Number of items in bulk operation', unit: '1' });
  }
  return _bulkOperationItemCount;
}

function bulkOperationResult() {
  if (!_bulkOperationResult) {
    _bulkOperationResult = meter().createCounter('bulk.operation.result', { description: 'Bulk operation results', unit: '1' });
  }
  return _bulkOperationResult;
}

export type BulkOperationType =
  | 'reorder_feedback_questions' | 'update_feedback_questions' | 'update_join_questions'
  | 'update_agenda' | 'update_faqs' | 'admin_bulk_update_events';

interface BulkOperationContext {
  operationType: BulkOperationType;
  actorId: string;
  eventId?: string;
  itemCount: number;
  durationMs: number;
  dbTimeMs?: number;
  success: boolean;
  errorReason?: string;
  payloadHash?: string;
}

export function hashPayload(payload: unknown): string {
  const json = JSON.stringify(payload);
  return crypto.createHash('sha256').update(json).digest('hex').substring(0, 16);
}

export function trackBulkOperation(ctx: BulkOperationContext): void {
  const attributes = { operation_type: ctx.operationType, result: ctx.success ? 'ok' : 'failed', event_id: ctx.eventId || 'none' };

  bulkOperationDuration().record(ctx.durationMs, attributes);
  bulkOperationItemCount().record(ctx.itemCount, attributes);
  bulkOperationResult().add(1, { ...attributes, error_reason: ctx.errorReason || 'none' });

  if (ctx.dbTimeMs) bulkOperationDbTime().record(ctx.dbTimeMs, attributes);

  const logLevel = ctx.success ? 'info' : 'error';
  logger[logLevel]({
    bulk: ctx.operationType, actorId: ctx.actorId, eventId: ctx.eventId, itemCount: ctx.itemCount,
    durationMs: ctx.durationMs, dbTimeMs: ctx.dbTimeMs, success: ctx.success, errorReason: ctx.errorReason, payloadHash: ctx.payloadHash,
  }, `Bulk operation ${ctx.operationType}: ${ctx.success ? 'ok' : 'failed'}`);
}

export function trackBulkPartialSuccess(operationType: BulkOperationType, actorId: string, eventId: string | undefined, succeeded: number, failed: number, errors: string[]): void {
  bulkOperationResult().add(1, { operation_type: operationType, result: 'partial', event_id: eventId || 'none' });
  logger.warn({ bulk: operationType, actorId, eventId, succeeded, failed, errors: errors.slice(0, 5) }, `Bulk operation ${operationType}: partial success (${succeeded}/${succeeded + failed})`);
}

interface BulkTraceResult<T> { result: T; durationMs: number; dbTimeMs?: number; }

export async function traceBulkOperation<T>(
  operationType: BulkOperationType,
  ctx: { actorId: string; eventId?: string; itemCount: number },
  fn: (span: Span, recordDbTime: (ms: number) => void) => Promise<T>
): Promise<BulkTraceResult<T>> {
  const startTime = Date.now();
  let dbTime = 0;
  const recordDbTime = (ms: number) => { dbTime += ms; };

  return tracer().startActiveSpan(`bulk.${operationType}`, async (span) => {
    span.setAttribute('bulk.operation_type', operationType);
    span.setAttribute('bulk.actor_id', ctx.actorId);
    span.setAttribute('bulk.item_count', ctx.itemCount);
    if (ctx.eventId) span.setAttribute('bulk.event_id', ctx.eventId);

    try {
      const result = await fn(span, recordDbTime);
      const durationMs = Date.now() - startTime;
      span.setAttribute('bulk.duration_ms', durationMs);
      span.setAttribute('bulk.db_time_ms', dbTime);
      span.setStatus({ code: SpanStatusCode.OK });
      trackBulkOperation({ operationType, actorId: ctx.actorId, eventId: ctx.eventId, itemCount: ctx.itemCount, durationMs, dbTimeMs: dbTime, success: true });
      return { result, durationMs, dbTimeMs: dbTime };
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      span.recordException(error as Error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: errorMessage });
      trackBulkOperation({ operationType, actorId: ctx.actorId, eventId: ctx.eventId, itemCount: ctx.itemCount, durationMs, dbTimeMs: dbTime, success: false, errorReason: errorMessage.substring(0, 100) });
      throw error;
    } finally {
      span.end();
    }
  });
}
