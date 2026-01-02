/**
 * Availability / Scheduling Observability
 */

import { getMeter } from '@appname/observability/metrics';
import { trace, SpanStatusCode } from '@opentelemetry/api';
import type { Span, Counter } from '@opentelemetry/api';
import { logger } from '../pino';

// Lazy initialization
let _meter: ReturnType<typeof getMeter> | null = null;
let _tracer: ReturnType<typeof trace.getTracer> | null = null;

function meter() {
  if (!_meter) _meter = getMeter('scheduling');
  return _meter;
}

function tracer() {
  if (!_tracer) _tracer = trace.getTracer('scheduling');
  return _tracer;
}

let _scheduleSet: Counter | null = null;
let _scheduleFire: Counter | null = null;
let _scheduleCancel: Counter | null = null;
let _availabilityChange: Counter | null = null;
let _timezoneUsage: Counter | null = null;

function scheduleSet() {
  if (!_scheduleSet) {
    _scheduleSet = meter().createCounter('schedule.set', { description: 'Schedule set operations', unit: '1' });
  }
  return _scheduleSet;
}

function scheduleFire() {
  if (!_scheduleFire) {
    _scheduleFire = meter().createCounter('schedule.fire', { description: 'Scheduled events that fired', unit: '1' });
  }
  return _scheduleFire;
}

function scheduleCancel() {
  if (!_scheduleCancel) {
    _scheduleCancel = meter().createCounter('schedule.cancel', { description: 'Schedule cancellations', unit: '1' });
  }
  return _scheduleCancel;
}

function availabilityChange() {
  if (!_availabilityChange) {
    _availabilityChange = meter().createCounter('availability.change', { description: 'User availability changes', unit: '1' });
  }
  return _availabilityChange;
}

function timezoneUsage() {
  if (!_timezoneUsage) {
    _timezoneUsage = meter().createCounter('timezone.usage', { description: 'Timezone usage distribution', unit: '1' });
  }
  return _timezoneUsage;
}

export type ScheduleType = 'event_publication' | 'reminder' | 'feedback_request';
export type ScheduleResult = 'ok' | 'failed' | 'already_published' | 'past_date' | 'invalid_timezone';
export type AvailabilityAction = 'set' | 'update' | 'remove';

interface ScheduleSetContext {
  scheduleType: ScheduleType;
  eventId: string;
  actorId: string;
  publishAt: Date;
  timezone: string;
  serverNow: Date;
  result: ScheduleResult;
  errorReason?: string;
}

export function trackScheduleSet(ctx: ScheduleSetContext): void {
  scheduleSet().add(1, { schedule_type: ctx.scheduleType, result: ctx.result, timezone_region: getTimezoneRegion(ctx.timezone) });
  const logLevel = ctx.result === 'ok' ? 'info' : 'warn';
  logger[logLevel]({
    scheduling: 'set', scheduleType: ctx.scheduleType, eventId: ctx.eventId, actorId: ctx.actorId, publishAt: ctx.publishAt.toISOString(),
    timezone: ctx.timezone, serverNow: ctx.serverNow.toISOString(), deltaMs: ctx.publishAt.getTime() - ctx.serverNow.getTime(), result: ctx.result, errorReason: ctx.errorReason,
  }, `Schedule ${ctx.scheduleType} ${ctx.result}`);
}

interface ScheduleFireContext {
  scheduleType: ScheduleType;
  eventId: string;
  scheduledAt: Date;
  actualFiredAt: Date;
  result: 'ok' | 'failed';
  errorReason?: string;
}

export function trackScheduleFire(ctx: ScheduleFireContext): void {
  scheduleFire().add(1, { schedule_type: ctx.scheduleType, result: ctx.result });
  const driftMs = ctx.actualFiredAt.getTime() - ctx.scheduledAt.getTime();
  const logLevel = ctx.result === 'ok' ? 'info' : 'error';
  logger[logLevel]({ scheduling: 'fire', scheduleType: ctx.scheduleType, eventId: ctx.eventId, scheduledAt: ctx.scheduledAt.toISOString(), actualFiredAt: ctx.actualFiredAt.toISOString(), driftMs, result: ctx.result, errorReason: ctx.errorReason }, `Schedule ${ctx.scheduleType} fire ${ctx.result}`);
}

interface ScheduleCancelContext {
  scheduleType: ScheduleType;
  eventId: string;
  actorId: string;
  wasScheduledFor: Date;
  reason?: string;
}

export function trackScheduleCancel(ctx: ScheduleCancelContext): void {
  scheduleCancel().add(1, { schedule_type: ctx.scheduleType });
  logger.info({ scheduling: 'cancel', scheduleType: ctx.scheduleType, eventId: ctx.eventId, actorId: ctx.actorId, wasScheduledFor: ctx.wasScheduledFor.toISOString(), reason: ctx.reason }, `Schedule ${ctx.scheduleType} canceled`);
}

interface AvailabilityContext {
  userId: string;
  action: AvailabilityAction;
  timezone?: string;
  dayOfWeek?: number;
  startTime?: string;
  endTime?: string;
}

export function trackAvailabilityChange(ctx: AvailabilityContext): void {
  availabilityChange().add(1, { action: ctx.action, timezone_region: ctx.timezone ? getTimezoneRegion(ctx.timezone) : 'unknown' });
  logger.debug({ availability: ctx.action, userId: ctx.userId, timezone: ctx.timezone, dayOfWeek: ctx.dayOfWeek, startTime: ctx.startTime, endTime: ctx.endTime }, `Availability ${ctx.action}`);
}

export function trackTimezoneUsage(timezone: string): void {
  timezoneUsage().add(1, { timezone_region: getTimezoneRegion(timezone) });
}

export async function traceSchedulingOperation<T>(operationName: string, ctx: { eventId: string; actorId: string }, fn: (span: Span) => Promise<T>): Promise<T> {
  return tracer().startActiveSpan(`scheduling.${operationName}`, async (span) => {
    span.setAttribute('scheduling.operation', operationName);
    span.setAttribute('scheduling.event_id', ctx.eventId);
    span.setAttribute('scheduling.actor_id', ctx.actorId);
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

function getTimezoneRegion(timezone: string): string {
  const parts = timezone.split('/');
  return parts[0] || 'unknown';
}
