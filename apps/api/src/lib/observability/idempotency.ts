/**
 * Idempotency / Create-or-Get Observability
 */

import { getMeter } from '@appname/observability/metrics';
import { trace, SpanStatusCode } from '@opentelemetry/api';
import type { Span, Counter } from '@opentelemetry/api';
import { logger } from '../pino';

// Lazy initialization
let _meter: ReturnType<typeof getMeter> | null = null;
let _tracer: ReturnType<typeof trace.getTracer> | null = null;

function meter() {
  if (!_meter) _meter = getMeter('idempotency');
  return _meter;
}

function tracer() {
  if (!_tracer) _tracer = trace.getTracer('idempotency');
  return _tracer;
}

let _idempotencyResult: Counter | null = null;
let _uniqueViolation: Counter | null = null;
let _duplicateDetected: Counter | null = null;

function idempotencyResult() {
  if (!_idempotencyResult) {
    _idempotencyResult = meter().createCounter('idempotency.result', { description: 'Idempotency check results', unit: '1' });
  }
  return _idempotencyResult;
}

function uniqueViolation() {
  if (!_uniqueViolation) {
    _uniqueViolation = meter().createCounter('idempotency.unique_violation', { description: 'Unique constraint violations', unit: '1' });
  }
  return _uniqueViolation;
}

function duplicateDetected() {
  if (!_duplicateDetected) {
    _duplicateDetected = meter().createCounter('idempotency.duplicate_detected', { description: 'Duplicates detected and handled', unit: '1' });
  }
  return _duplicateDetected;
}

export type IdempotencyOperationType = 'dm_thread' | 'join_request' | 'checkout' | 'notification' | 'invite_usage';
export type IdempotencyResult = 'created' | 'existing' | 'conflict_resolved';

interface IdempotencyContext {
  operationType: IdempotencyOperationType;
  idempotencyKey?: string;
  entityId?: string;
  userId?: string;
  result: IdempotencyResult;
}

export function trackIdempotency(ctx: IdempotencyContext): void {
  idempotencyResult().add(1, { operation_type: ctx.operationType, result: ctx.result });
  if (ctx.result === 'existing' || ctx.result === 'conflict_resolved') {
    logger.debug({ idempotency: ctx.operationType, result: ctx.result, hasIdempotencyKey: !!ctx.idempotencyKey, entityId: ctx.entityId, userId: ctx.userId }, `Idempotency ${ctx.result}: ${ctx.operationType}`);
  }
}

interface UniqueViolationContext {
  operationType: IdempotencyOperationType;
  constraintName?: string;
  entityType: string;
  userId?: string;
  recovered: boolean;
}

export function trackUniqueViolation(ctx: UniqueViolationContext): void {
  uniqueViolation().add(1, { operation_type: ctx.operationType, entity_type: ctx.entityType, recovered: String(ctx.recovered) });
  logger.warn({ idempotency: 'unique_violation', operationType: ctx.operationType, constraintName: ctx.constraintName, entityType: ctx.entityType, userId: ctx.userId, recovered: ctx.recovered }, `Unique violation in ${ctx.operationType} (recovered: ${ctx.recovered})`);
}

interface DuplicateContext {
  operationType: IdempotencyOperationType;
  entityType: string;
  originalId: string;
  duplicateId?: string;
  userId?: string;
  action: 'merged' | 'ignored' | 'deleted';
}

export function trackDuplicateDetected(ctx: DuplicateContext): void {
  duplicateDetected().add(1, { operation_type: ctx.operationType, entity_type: ctx.entityType, action: ctx.action });
  logger.warn({ idempotency: 'duplicate_detected', operationType: ctx.operationType, entityType: ctx.entityType, originalId: ctx.originalId, duplicateId: ctx.duplicateId, userId: ctx.userId, action: ctx.action }, `Duplicate ${ctx.entityType} detected, action: ${ctx.action}`);
}

export const trackDmThreadIdempotency = {
  created(threadId: string, userId: string, _otherUserId: string) { trackIdempotency({ operationType: 'dm_thread', entityId: threadId, userId, result: 'created' }); },
  existing(threadId: string, userId: string) { trackIdempotency({ operationType: 'dm_thread', entityId: threadId, userId, result: 'existing' }); },
};

export const trackJoinRequestIdempotency = {
  created(eventId: string, userId: string) { trackIdempotency({ operationType: 'join_request', entityId: eventId, userId, result: 'created' }); },
  existing(eventId: string, userId: string) { trackIdempotency({ operationType: 'join_request', entityId: eventId, userId, result: 'existing' }); },
  conflictResolved(eventId: string, userId: string) { trackIdempotency({ operationType: 'join_request', entityId: eventId, userId, result: 'conflict_resolved' }); },
};

export const trackCheckoutIdempotency = {
  created(checkoutId: string, userId: string, idempotencyKey?: string) { trackIdempotency({ operationType: 'checkout', entityId: checkoutId, userId, idempotencyKey, result: 'created' }); },
  existing(checkoutId: string, userId: string, idempotencyKey?: string) { trackIdempotency({ operationType: 'checkout', entityId: checkoutId, userId, idempotencyKey, result: 'existing' }); },
};

export async function traceIdempotentOperation<T>(operationType: IdempotencyOperationType, ctx: { userId?: string; idempotencyKey?: string }, fn: (span: Span) => Promise<{ result: T; wasExisting: boolean }>): Promise<T> {
  return tracer().startActiveSpan(`idempotent.${operationType}`, async (span) => {
    span.setAttribute('idempotency.operation_type', operationType);
    if (ctx.userId) span.setAttribute('idempotency.user_id', ctx.userId);
    span.setAttribute('idempotency.has_key', !!ctx.idempotencyKey);
    try {
      const { result, wasExisting } = await fn(span);
      span.setAttribute('idempotency.was_existing', wasExisting);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '';
      if (errorMessage.includes('Unique constraint') || errorMessage.includes('duplicate key')) {
        span.setAttribute('idempotency.unique_violation', true);
      }
      span.recordException(error as Error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    } finally {
      span.end();
    }
  });
}
