/**
 * Permission / Authorization Observability
 *
 * CRITICAL: Auth errors often result in "silent" 403/404.
 */

import { getMeter } from '@appname/observability/metrics';
import type { Counter, Histogram } from '@opentelemetry/api';
import { logger } from '../pino';

// Lazy initialization
let _meter: ReturnType<typeof getMeter> | null = null;

function meter() {
  if (!_meter) _meter = getMeter('authz');
  return _meter;
}

let _authzDenied: Counter | null = null;
let _authzGranted: Counter | null = null;
let _authzCheckLatency: Histogram | null = null;

function authzDenied() {
  if (!_authzDenied) {
    _authzDenied = meter().createCounter('authz.denied', {
      description: 'Authorization denials',
      unit: '1',
    });
  }
  return _authzDenied;
}

function authzGranted() {
  if (!_authzGranted) {
    _authzGranted = meter().createCounter('authz.granted', {
      description: 'Authorization grants',
      unit: '1',
    });
  }
  return _authzGranted;
}

function authzCheckLatency() {
  if (!_authzCheckLatency) {
    _authzCheckLatency = meter().createHistogram('authz.check.latency', {
      description: 'Authorization check latency',
      unit: 'ms',
    });
  }
  return _authzCheckLatency;
}

export type AuthzDenyReason =
  | 'ROLE_TOO_LOW' | 'NOT_MEMBER' | 'NOT_OWNER' | 'NOT_MODERATOR'
  | 'SUSPENDED' | 'BLOCKED' | 'BANNED' | 'NOT_AUTHENTICATED'
  | 'EVENT_NOT_FOUND' | 'USER_NOT_FOUND' | 'RESOURCE_NOT_FOUND'
  | 'PERMISSION_DENIED' | 'RATE_LIMITED' | 'INVALID_TOKEN' | 'EXPIRED_TOKEN' | 'UNKNOWN';

export type AuthzOperation =
  | 'event_read' | 'event_write' | 'event_admin' | 'member_manage'
  | 'checkin_manage' | 'audit_read' | 'audit_export' | 'invite_manage'
  | 'admin_action' | 'dm_send' | 'report_manage';

interface AuthzContext {
  operation: AuthzOperation;
  userId?: string;
  resourceType?: string;
  resourceId?: string;
}

export function trackAuthzDenied(reason: AuthzDenyReason, ctx: AuthzContext): void {
  authzDenied().add(1, {
    reason,
    operation: ctx.operation,
    resource_type: ctx.resourceType || 'unknown',
  });
  logger.warn({
    authz: 'denied',
    reason,
    operation: ctx.operation,
    userId: ctx.userId,
    resourceType: ctx.resourceType,
    resourceId: ctx.resourceId,
  }, `Authz denied: ${reason} for ${ctx.operation}`);
}

export function trackAuthzGranted(ctx: AuthzContext): void {
  authzGranted().add(1, {
    operation: ctx.operation,
    resource_type: ctx.resourceType || 'unknown',
  });
}

export async function trackAuthzCheck<T>(ctx: AuthzContext, fn: () => Promise<T>): Promise<T> {
  const startTime = Date.now();
  try {
    const result = await fn();
    authzCheckLatency().record(Date.now() - startTime, { operation: ctx.operation, result: 'granted' });
    trackAuthzGranted(ctx);
    return result;
  } catch (error) {
    authzCheckLatency().record(Date.now() - startTime, { operation: ctx.operation, result: 'denied' });
    throw error;
  }
}

export function errorCodeToAuthzReason(code: string): AuthzDenyReason {
  switch (code) {
    case 'UNAUTHENTICATED': return 'NOT_AUTHENTICATED';
    case 'FORBIDDEN': return 'PERMISSION_DENIED';
    case 'NOT_FOUND': return 'RESOURCE_NOT_FOUND';
    default: return 'UNKNOWN';
  }
}
