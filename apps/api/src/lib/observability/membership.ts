/**
 * Membership / Join / Invite / Check-in Observability
 *
 * HIGH RISK - Abuse, edge cases, user disputes
 *
 * Tracked operations:
 * - Join requests (outcomes: ok, denied, capacity, closed, banned, alreadyMember)
 * - Invite validation (outcomes: ok, expired, revoked, invalid)
 * - Check-in (outcomes: ok, blocked, rejected, invalidToken, alreadyCheckedIn)
 * - Membership changes (kick, ban, role updates)
 */

import { getMeter } from '@appname/observability/metrics';
import { trace, SpanStatusCode } from '@opentelemetry/api';
import type { Span, Counter } from '@opentelemetry/api';
import { logger } from '../pino';

// Lazy initialization
let _meter: ReturnType<typeof getMeter> | null = null;
let _tracer: ReturnType<typeof trace.getTracer> | null = null;

function meter() {
  if (!_meter) _meter = getMeter('membership');
  return _meter;
}

function tracer() {
  if (!_tracer) _tracer = trace.getTracer('membership');
  return _tracer;
}

// =============================================================================
// Metrics (lazy)
// =============================================================================

let _joinRequestOutcome: Counter | null = null;
let _inviteValidateOutcome: Counter | null = null;
let _checkinOutcome: Counter | null = null;
let _membershipChange: Counter | null = null;
let _waitlistAction: Counter | null = null;

function joinRequestOutcome() {
  if (!_joinRequestOutcome) {
    _joinRequestOutcome = meter().createCounter('membership.join_request.outcome', {
      description: 'Join request outcomes',
      unit: '1',
    });
  }
  return _joinRequestOutcome;
}

function inviteValidateOutcome() {
  if (!_inviteValidateOutcome) {
    _inviteValidateOutcome = meter().createCounter('membership.invite_validate.outcome', {
      description: 'Invite validation outcomes',
      unit: '1',
    });
  }
  return _inviteValidateOutcome;
}

function checkinOutcome() {
  if (!_checkinOutcome) {
    _checkinOutcome = meter().createCounter('membership.checkin.outcome', {
      description: 'Check-in outcomes',
      unit: '1',
    });
  }
  return _checkinOutcome;
}

function membershipChange() {
  if (!_membershipChange) {
    _membershipChange = meter().createCounter('membership.change', {
      description: 'Membership status changes',
      unit: '1',
    });
  }
  return _membershipChange;
}

function waitlistAction() {
  if (!_waitlistAction) {
    _waitlistAction = meter().createCounter('membership.waitlist.action', {
      description: 'Waitlist actions',
      unit: '1',
    });
  }
  return _waitlistAction;
}

// =============================================================================
// Join Request Tracking
// =============================================================================

export type JoinOutcome =
  | 'ok'
  | 'denied'
  | 'capacity'
  | 'closed'
  | 'requires_approval'
  | 'banned'
  | 'already_member'
  | 'error';

interface JoinContext {
  userId: string;
  eventId: string;
  joinMode?: string;
  hasAnswers?: boolean;
}

export function trackJoinRequest(outcome: JoinOutcome, ctx: JoinContext): void {
  joinRequestOutcome().add(1, {
    outcome,
    join_mode: ctx.joinMode || 'unknown',
  });

  logger.info({
    audit: 'membership.join_request',
    outcome,
    userId: ctx.userId,
    eventId: ctx.eventId,
    joinMode: ctx.joinMode,
    hasAnswers: ctx.hasAnswers,
  }, `Join request: ${outcome}`);
}

// =============================================================================
// Invite Validation Tracking
// =============================================================================

export type InviteOutcome = 'ok' | 'expired' | 'revoked' | 'invalid' | 'max_uses' | 'error';

interface InviteContext {
  inviteCode: string;
  eventId?: string;
  userId?: string;
}

export function trackInviteValidation(outcome: InviteOutcome, ctx: InviteContext): void {
  inviteValidateOutcome().add(1, { outcome });

  logger.info({
    audit: 'membership.invite_validate',
    outcome,
    inviteCode: ctx.inviteCode.substring(0, 8) + '...', // Partial for security
    eventId: ctx.eventId,
    userId: ctx.userId,
  }, `Invite validation: ${outcome}`);
}

// =============================================================================
// Check-in Tracking
// =============================================================================

export type CheckinOutcome =
  | 'ok'
  | 'blocked'
  | 'rejected'
  | 'invalid_token'
  | 'already_checked_in'
  | 'not_member'
  | 'error';

export type CheckinMethod = 'self' | 'organizer' | 'qr_event' | 'qr_user';

interface CheckinContext {
  eventId: string;
  userId: string;
  method: CheckinMethod;
  actorId?: string;
}

export function trackCheckin(outcome: CheckinOutcome, ctx: CheckinContext): void {
  checkinOutcome().add(1, {
    outcome,
    method: ctx.method,
  });

  logger.info({
    audit: 'membership.checkin',
    outcome,
    eventId: ctx.eventId,
    userId: ctx.userId,
    method: ctx.method,
    actorId: ctx.actorId,
  }, `Check-in ${ctx.method}: ${outcome}`);
}

// =============================================================================
// Membership Change Tracking (kick, ban, role updates)
// =============================================================================

export type MembershipAction =
  | 'kicked'
  | 'banned'
  | 'unbanned'
  | 'role_updated'
  | 'left'
  | 'invite_accepted'
  | 'approved'
  | 'rejected';

interface MembershipChangeContext {
  eventId: string;
  targetUserId: string;
  actorId: string;
  action: MembershipAction;
  previousRole?: string;
  newRole?: string;
  reason?: string;
}

export function trackMembershipChange(ctx: MembershipChangeContext): void {
  membershipChange().add(1, { action: ctx.action });

  logger.info({
    audit: 'membership.change',
    action: ctx.action,
    eventId: ctx.eventId,
    targetUserId: ctx.targetUserId,
    actorId: ctx.actorId,
    previousRole: ctx.previousRole,
    newRole: ctx.newRole,
    reason: ctx.reason,
  }, `Membership ${ctx.action}`);
}

// =============================================================================
// Waitlist Tracking
// =============================================================================

export type WaitlistAction = 'joined' | 'left' | 'promoted' | 'expired';

interface WaitlistContext {
  eventId: string;
  userId: string;
  position?: number;
}

export function trackWaitlistAction(action: WaitlistAction, ctx: WaitlistContext): void {
  waitlistAction().add(1, { action });

  logger.info({
    audit: 'membership.waitlist',
    action,
    eventId: ctx.eventId,
    userId: ctx.userId,
    position: ctx.position,
  }, `Waitlist ${action}`);
}

// =============================================================================
// Tracing Wrapper
// =============================================================================

export async function traceMembershipOperation<T>(
  operationName: string,
  ctx: { eventId: string; userId?: string; [key: string]: unknown },
  fn: (span: Span) => Promise<T>
): Promise<T> {
  return tracer().startActiveSpan(`membership.${operationName}`, async (span) => {
    span.setAttribute('event.id', ctx.eventId);
    if (ctx.userId) span.setAttribute('user.id', ctx.userId);
    span.setAttribute('membership.operation', operationName);

    try {
      const result = await fn(span);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    } finally {
      span.end();
    }
  });
}
