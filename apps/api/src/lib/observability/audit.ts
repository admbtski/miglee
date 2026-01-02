/**
 * Audit Logging Module
 *
 * Provides structured audit logging for compliance-critical operations.
 * Audit logs are tagged with `audit:` prefix for easy filtering in Loki.
 *
 * Usage:
 * ```ts
 * import { auditLog } from './lib/observability/audit';
 *
 * auditLog({
 *   action: 'billing.checkout.created',
 *   actorId: userId,
 *   targetId: eventId,
 *   outcome: 'success',
 *   details: { plan: 'pro', priceId: 'price_xxx' },
 * });
 * ```
 */

import { logger } from '../pino';

// =============================================================================
// Types
// =============================================================================

export type AuditOutcome = 'success' | 'failure' | 'denied' | 'error';

export interface AuditLogEntry {
  // Required fields
  action: string;           // e.g., 'billing.checkout.created', 'membership.banned'
  actorId: string;          // Who performed the action

  // Optional fields
  targetId?: string;        // What was affected (userId, eventId, etc.)
  targetType?: string;      // 'user' | 'event' | 'message' | etc.
  outcome?: AuditOutcome;
  reason?: string;          // Why (especially for denials)
  previousState?: unknown;  // State before change
  newState?: unknown;       // State after change
  details?: Record<string, unknown>; // Additional context

  // Correlation
  requestId?: string;
  traceId?: string;

  // Security
  ip?: string;
  userAgent?: string;
}

// =============================================================================
// Main Audit Function
// =============================================================================

/**
 * Log an audit event
 *
 * All audit logs are:
 * - Tagged with `audit: true` for filtering
 * - Logged at INFO level (always persisted)
 * - Structured for easy querying in Loki
 */
export function auditLog(entry: AuditLogEntry): void {
  const logData = {
    audit: true,
    ...entry,
    timestamp: new Date().toISOString(),
  };

  // Use INFO level to ensure it's always logged
  logger.info(logData, `[AUDIT] ${entry.action}`);
}

// =============================================================================
// Convenience Functions for Common Audit Events
// =============================================================================

/**
 * Audit a state change (e.g., membership role, event status)
 */
export function auditStateChange(
  action: string,
  actorId: string,
  targetId: string,
  previousState: unknown,
  newState: unknown,
  details?: Record<string, unknown>
): void {
  auditLog({
    action,
    actorId,
    targetId,
    outcome: 'success',
    previousState,
    newState,
    details,
  });
}

/**
 * Audit an access denial
 */
export function auditAccessDenied(
  action: string,
  actorId: string,
  targetId: string,
  reason: string
): void {
  auditLog({
    action,
    actorId,
    targetId,
    outcome: 'denied',
    reason,
  });
}

/**
 * Audit a data export
 */
export function auditDataExport(
  actorId: string,
  exportType: string,
  targetId: string | undefined,
  recordCount: number,
  format: string
): void {
  auditLog({
    action: `export.${exportType}`,
    actorId,
    targetId,
    outcome: 'success',
    details: {
      recordCount,
      format,
    },
  });
}

/**
 * Audit a security-sensitive operation
 */
export function auditSecurityEvent(
  action: string,
  actorId: string,
  details: Record<string, unknown>,
  ip?: string,
  userAgent?: string
): void {
  auditLog({
    action: `security.${action}`,
    actorId,
    outcome: 'success',
    details,
    ip,
    userAgent,
  });
}

// =============================================================================
// PII Redaction Helpers
// =============================================================================

/**
 * Redact sensitive fields from an object for logging
 */
export function redactPII<T extends Record<string, unknown>>(
  obj: T,
  fieldsToRedact: (keyof T)[] = []
): Partial<T> {
  const redacted = { ...obj };

  // Default fields to always redact
  const defaultRedactFields = [
    'password',
    'passwordHash',
    'token',
    'accessToken',
    'refreshToken',
    'apiKey',
    'secret',
    'creditCard',
    'ssn',
    'email',
    'phone',
    'address',
  ];

  const allFieldsToRedact = [...defaultRedactFields, ...fieldsToRedact.map(String)];

  for (const field of Object.keys(redacted)) {
    if (allFieldsToRedact.some((f) => field.toLowerCase().includes(f.toLowerCase()))) {
      (redacted as Record<string, unknown>)[field] = '[REDACTED]';
    }
  }

  return redacted;
}

/**
 * Get a safe subset of object for logging
 */
export function safeForLogging<T extends Record<string, unknown>>(
  obj: T,
  allowedFields: (keyof T)[]
): Partial<T> {
  const result: Partial<T> = {};

  for (const field of allowedFields) {
    if (field in obj) {
      result[field] = obj[field];
    }
  }

  return result;
}

