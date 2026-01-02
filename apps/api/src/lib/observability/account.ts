/**
 * Account Lifecycle Observability
 *
 * CRITICAL: Most expensive "operationally" - tickets, rollbacks, security.
 */

import { getMeter } from '@appname/observability/metrics';
import { trace, SpanStatusCode } from '@opentelemetry/api';
import type { Span, Counter } from '@opentelemetry/api';
import { logger } from '../pino';

// Lazy initialization
let _meter: ReturnType<typeof getMeter> | null = null;
let _tracer: ReturnType<typeof trace.getTracer> | null = null;

function meter() {
  if (!_meter) _meter = getMeter('account');
  return _meter;
}

function tracer() {
  if (!_tracer) _tracer = trace.getTracer('account');
  return _tracer;
}

let _accountDeleted: Counter | null = null;
let _accountRestorationRequested: Counter | null = null;
let _accountRestored: Counter | null = null;
let _accountSuspended: Counter | null = null;
let _accountUnsuspended: Counter | null = null;
let _accountProfileUpdated: Counter | null = null;

function accountDeleted() {
  if (!_accountDeleted) {
    _accountDeleted = meter().createCounter('account.deleted', { description: 'Accounts deleted', unit: '1' });
  }
  return _accountDeleted;
}

function accountRestorationRequested() {
  if (!_accountRestorationRequested) {
    _accountRestorationRequested = meter().createCounter('account.restoration.requested', { description: 'Account restoration requests', unit: '1' });
  }
  return _accountRestorationRequested;
}

function accountRestored() {
  if (!_accountRestored) {
    _accountRestored = meter().createCounter('account.restored', { description: 'Accounts restored', unit: '1' });
  }
  return _accountRestored;
}

function accountSuspended() {
  if (!_accountSuspended) {
    _accountSuspended = meter().createCounter('account.suspended', { description: 'Accounts suspended', unit: '1' });
  }
  return _accountSuspended;
}

function accountUnsuspended() {
  if (!_accountUnsuspended) {
    _accountUnsuspended = meter().createCounter('account.unsuspended', { description: 'Accounts unsuspended', unit: '1' });
  }
  return _accountUnsuspended;
}

function accountProfileUpdated() {
  if (!_accountProfileUpdated) {
    _accountProfileUpdated = meter().createCounter('account.profile.updated', { description: 'Profile updates', unit: '1' });
  }
  return _accountProfileUpdated;
}

export type AccountDeletionType = 'self' | 'admin';
export type ProfileUpdateField = 'email' | 'name' | 'locale' | 'timezone' | 'avatar' | 'other';

interface DeletionContext {
  userId: string;
  deletionType: AccountDeletionType;
  actorId: string;
  anonymize: boolean;
}

export function trackAccountDeleted(ctx: DeletionContext): void {
  accountDeleted().add(1, { type: ctx.deletionType, anonymize: String(ctx.anonymize) });
  logger.warn({ audit: 'account.deleted', userId: ctx.userId, deletionType: ctx.deletionType, actorId: ctx.actorId, anonymize: ctx.anonymize }, `Account deleted: ${ctx.deletionType}`);
}

interface RestorationRequestContext {
  userId: string;
  email: string;
}

export function trackRestorationRequested(ctx: RestorationRequestContext): void {
  accountRestorationRequested().add(1, {});
  logger.info({ audit: 'account.restoration.requested', userId: ctx.userId, emailDomain: ctx.email.split('@')[1] || 'unknown' }, 'Account restoration requested');
}

interface RestorationContext {
  userId: string;
  actorId: string;
  success: boolean;
  errorReason?: string;
}

export function trackAccountRestored(ctx: RestorationContext): void {
  if (ctx.success) accountRestored().add(1, {});
  logger.info({ audit: 'account.restored', userId: ctx.userId, actorId: ctx.actorId, success: ctx.success, errorReason: ctx.errorReason }, `Account restoration: ${ctx.success ? 'success' : 'failed'}`);
}

interface SuspensionContext {
  userId: string;
  adminId: string;
  reason?: string;
}

export function trackAccountSuspended(ctx: SuspensionContext): void {
  accountSuspended().add(1, {});
  logger.warn({ audit: 'account.suspended', userId: ctx.userId, adminId: ctx.adminId, reason: ctx.reason }, 'Account suspended');
}

export function trackAccountUnsuspended(ctx: Omit<SuspensionContext, 'reason'>): void {
  accountUnsuspended().add(1, {});
  logger.info({ audit: 'account.unsuspended', userId: ctx.userId, adminId: ctx.adminId }, 'Account unsuspended');
}

interface ProfileUpdateContext {
  userId: string;
  field: ProfileUpdateField;
}

export function trackProfileUpdated(ctx: ProfileUpdateContext): void {
  accountProfileUpdated().add(1, { field: ctx.field });
  logger.debug({ account: 'profile.updated', userId: ctx.userId, field: ctx.field }, `Profile updated: ${ctx.field}`);
}

export async function traceAccountOperation<T>(operationName: string, ctx: { userId: string; [key: string]: unknown }, fn: (span: Span) => Promise<T>): Promise<T> {
  return tracer().startActiveSpan(`account.${operationName}`, async (span) => {
    span.setAttribute('account.user_id', ctx.userId);
    span.setAttribute('account.operation', operationName);

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
