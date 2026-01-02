/**
 * Business Gates / Rules Engine Observability
 */

import { getMeter } from '@appname/observability/metrics';
import type { Counter, Histogram } from '@opentelemetry/api';
import { logger } from '../pino';

// Lazy initialization
let _meter: ReturnType<typeof getMeter> | null = null;

function meter() {
  if (!_meter) _meter = getMeter('gates');
  return _meter;
}

let _gateDenied: Counter | null = null;
let _gateGranted: Counter | null = null;
let _gateLatency: Histogram | null = null;

function gateDenied() {
  if (!_gateDenied) {
    _gateDenied = meter().createCounter('gate.denied', { description: 'Business gate denials', unit: '1' });
  }
  return _gateDenied;
}

function gateGranted() {
  if (!_gateGranted) {
    _gateGranted = meter().createCounter('gate.granted', { description: 'Business gate grants', unit: '1' });
  }
  return _gateGranted;
}

function gateLatency() {
  if (!_gateLatency) {
    _gateLatency = meter().createHistogram('gate.check.latency', { description: 'Business gate check latency', unit: 'ms' });
  }
  return _gateLatency;
}

export type GateType = 'can_submit_feedback' | 'can_review' | 'can_join_event' | 'can_create_event' | 'can_access_feature' | 'is_blocked' | 'is_suspended' | 'has_plan_access';

export type GateDenialReason =
  | 'TOO_EARLY' | 'TOO_LATE' | 'EVENT_NOT_ENDED' | 'EVENT_ENDED' | 'EXPIRED'
  | 'NOT_MEMBER' | 'NOT_PARTICIPANT' | 'NOT_JOINED' | 'ALREADY_SUBMITTED' | 'ALREADY_JOINED' | 'ALREADY_PENDING'
  | 'PLAN_TOO_LOW' | 'FEATURE_DISABLED' | 'QUOTA_EXCEEDED' | 'RATE_LIMITED'
  | 'SUSPENDED' | 'BLOCKED' | 'BANNED' | 'DELETED'
  | 'EVENT_FULL' | 'EVENT_CLOSED' | 'EVENT_CANCELED' | 'EVENT_DELETED'
  | 'NOT_AUTHENTICATED' | 'FORBIDDEN' | 'UNKNOWN';

interface GateDeniedContext {
  gate: GateType;
  reason: GateDenialReason;
  userId?: string;
  eventId?: string;
  featureName?: string;
  requiredPlan?: string;
  currentPlan?: string;
}

export function trackGateDenied(ctx: GateDeniedContext): void {
  gateDenied().add(1, { gate: ctx.gate, reason: ctx.reason, feature: ctx.featureName || 'none' });
  logger.info({ gate: 'denied', gateType: ctx.gate, reason: ctx.reason, userId: ctx.userId, eventId: ctx.eventId, featureName: ctx.featureName, requiredPlan: ctx.requiredPlan, currentPlan: ctx.currentPlan }, `Gate denied: ${ctx.gate} - ${ctx.reason}`);
}

interface GateGrantedContext {
  gate: GateType;
  userId?: string;
  eventId?: string;
  featureName?: string;
}

export function trackGateGranted(ctx: GateGrantedContext): void {
  gateGranted().add(1, { gate: ctx.gate, feature: ctx.featureName || 'none' });
}

interface GateCheckContext {
  gate: GateType;
  userId?: string;
  eventId?: string;
}

export async function trackGateCheck<T extends boolean | { allowed: boolean; reason?: string }>(ctx: GateCheckContext, fn: () => Promise<T>): Promise<T> {
  const startTime = Date.now();
  try {
    const result = await fn();
    const latencyMs = Date.now() - startTime;
    gateLatency().record(latencyMs, { gate: ctx.gate });
    const granted = typeof result === 'boolean' ? result : result.allowed;
    if (granted) trackGateGranted({ gate: ctx.gate, userId: ctx.userId, eventId: ctx.eventId });
    return result;
  } catch (error) {
    gateLatency().record(Date.now() - startTime, { gate: ctx.gate });
    throw error;
  }
}

export const trackFeedbackGate = {
  denied(userId: string, eventId: string, reason: GateDenialReason) { trackGateDenied({ gate: 'can_submit_feedback', reason, userId, eventId }); },
  granted(userId: string, eventId: string) { trackGateGranted({ gate: 'can_submit_feedback', userId, eventId }); },
};

export const trackReviewGate = {
  denied(userId: string, eventId: string, reason: GateDenialReason) { trackGateDenied({ gate: 'can_review', reason, userId, eventId }); },
  granted(userId: string, eventId: string) { trackGateGranted({ gate: 'can_review', userId, eventId }); },
};

export const trackPlanGate = {
  denied(userId: string, featureName: string, requiredPlan: string, currentPlan: string) { trackGateDenied({ gate: 'has_plan_access', reason: 'PLAN_TOO_LOW', userId, featureName, requiredPlan, currentPlan }); },
  granted(userId: string, featureName: string) { trackGateGranted({ gate: 'has_plan_access', userId, featureName }); },
};

export const trackJoinGate = {
  denied(userId: string, eventId: string, reason: GateDenialReason) { trackGateDenied({ gate: 'can_join_event', reason, userId, eventId }); },
  granted(userId: string, eventId: string) { trackGateGranted({ gate: 'can_join_event', userId, eventId }); },
};
