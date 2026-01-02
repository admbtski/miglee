/**
 * Security / Dev-Only Endpoints Observability
 */

import { getMeter } from '@appname/observability/metrics';
import type { Counter } from '@opentelemetry/api';
import { logger } from '../pino';

// Lazy initialization
let _meter: ReturnType<typeof getMeter> | null = null;

function meter() {
  if (!_meter) _meter = getMeter('security');
  return _meter;
}

let _devEndpointAccess: Counter | null = null;
let _securityAlert: Counter | null = null;

function devEndpointAccess() {
  if (!_devEndpointAccess) {
    _devEndpointAccess = meter().createCounter('security.dev_endpoint.access', { description: 'Dev-only endpoint access attempts', unit: '1' });
  }
  return _devEndpointAccess;
}

function securityAlert() {
  if (!_securityAlert) {
    _securityAlert = meter().createCounter('security.alert', { description: 'Security alerts triggered', unit: '1' });
  }
  return _securityAlert;
}

export type DevEndpoint = 'dev_login' | 'dev_logout' | 'dev_seed' | 'dev_reset';
export type SecurityAlertType = 'dev_endpoint_in_production' | 'suspicious_auth_pattern' | 'rate_limit_breach' | 'invalid_token_flood' | 'unauthorized_admin_attempt';

interface DevEndpointContext {
  endpoint: DevEndpoint;
  environment: string;
  allowed: boolean;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export function trackDevEndpointAccess(ctx: DevEndpointContext): void {
  devEndpointAccess().add(1, { endpoint: ctx.endpoint, environment: ctx.environment, allowed: String(ctx.allowed) });

  if (ctx.environment === 'production' && !ctx.allowed) {
    logger.error({ security: 'dev_endpoint_blocked', endpoint: ctx.endpoint, environment: ctx.environment, userId: ctx.userId, ipPrefix: ctx.ipAddress?.split('.').slice(0, 2).join('.'), userAgentPrefix: ctx.userAgent?.substring(0, 50) }, `SECURITY: Dev endpoint ${ctx.endpoint} called in ${ctx.environment}`);
    trackSecurityAlert({ alertType: 'dev_endpoint_in_production', severity: 'critical', details: { endpoint: ctx.endpoint, userId: ctx.userId } });
  } else {
    logger.debug({ security: 'dev_endpoint_access', endpoint: ctx.endpoint, environment: ctx.environment, allowed: ctx.allowed }, `Dev endpoint ${ctx.endpoint} accessed`);
  }
}

interface SecurityAlertContext {
  alertType: SecurityAlertType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  ipAddress?: string;
  details?: Record<string, unknown>;
}

export function trackSecurityAlert(ctx: SecurityAlertContext): void {
  securityAlert().add(1, { alert_type: ctx.alertType, severity: ctx.severity });
  const logLevel = ctx.severity === 'critical' || ctx.severity === 'high' ? 'error' : 'warn';
  logger[logLevel]({ security: 'alert', alertType: ctx.alertType, severity: ctx.severity, userId: ctx.userId, ipPrefix: ctx.ipAddress?.split('.').slice(0, 2).join('.'), details: ctx.details, timestamp: new Date().toISOString() }, `SECURITY ALERT [${ctx.severity.toUpperCase()}]: ${ctx.alertType}`);
}

export function trackDevLogin(environment: string, userId: string | undefined, ipAddress?: string, userAgent?: string): void {
  trackDevEndpointAccess({ endpoint: 'dev_login', environment, allowed: environment !== 'production', userId, ipAddress, userAgent });
}

export function trackDevLogout(environment: string, userId: string | undefined, ipAddress?: string): void {
  trackDevEndpointAccess({ endpoint: 'dev_logout', environment, allowed: environment !== 'production', userId, ipAddress });
}

export function trackSuspiciousAuth(userId: string | undefined, pattern: string, ipAddress?: string): void {
  trackSecurityAlert({ alertType: 'suspicious_auth_pattern', severity: 'medium', userId, ipAddress, details: { pattern } });
}

export function trackRateLimitBreach(endpoint: string, requestCount: number, windowSeconds: number, userId?: string, ipAddress?: string): void {
  trackSecurityAlert({ alertType: 'rate_limit_breach', severity: requestCount > 1000 ? 'high' : 'medium', userId, ipAddress, details: { endpoint, requestCount, windowSeconds, requestsPerSecond: requestCount / windowSeconds } });
}

export function trackUnauthorizedAdminAttempt(userId: string, attemptedAction: string, userRole: string, ipAddress?: string): void {
  trackSecurityAlert({ alertType: 'unauthorized_admin_attempt', severity: 'high', userId, ipAddress, details: { attemptedAction, userRole } });
}

export function isDevEndpointAllowed(environment: string): boolean {
  return environment !== 'production';
}

export function requireDevEnvironment(environment: string, endpoint: DevEndpoint, ctx?: { userId?: string; ipAddress?: string; userAgent?: string }): void {
  if (!isDevEndpointAllowed(environment)) {
    trackDevEndpointAccess({ endpoint, environment, allowed: false, ...ctx });
    throw new Error(`${endpoint} is not available in ${environment} environment`);
  }
  trackDevEndpointAccess({ endpoint, environment, allowed: true, ...ctx });
}
