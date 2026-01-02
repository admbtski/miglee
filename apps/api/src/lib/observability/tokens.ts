/**
 * Token / Secret / Link Operations Observability
 */

import { getMeter } from '@appname/observability/metrics';
import { trace, SpanStatusCode } from '@opentelemetry/api';
import type { Span, Counter } from '@opentelemetry/api';
import { logger } from '../pino';

// Lazy initialization
let _meter: ReturnType<typeof getMeter> | null = null;
let _tracer: ReturnType<typeof trace.getTracer> | null = null;

function meter() {
  if (!_meter) _meter = getMeter('tokens');
  return _meter;
}

function tracer() {
  if (!_tracer) _tracer = trace.getTracer('tokens');
  return _tracer;
}

let _tokenRotation: Counter | null = null;
let _inviteLinkAction: Counter | null = null;
let _inviteValidation: Counter | null = null;
let _tokenAbuseIndicator: Counter | null = null;

function tokenRotation() {
  if (!_tokenRotation) {
    _tokenRotation = meter().createCounter('token.rotation', {
      description: 'Token rotations',
      unit: '1',
    });
  }
  return _tokenRotation;
}

function inviteLinkAction() {
  if (!_inviteLinkAction) {
    _inviteLinkAction = meter().createCounter('invite.link.action', {
      description: 'Invite link actions',
      unit: '1',
    });
  }
  return _inviteLinkAction;
}

function inviteValidation() {
  if (!_inviteValidation) {
    _inviteValidation = meter().createCounter('invite.validation', {
      description: 'Invite link validation results',
      unit: '1',
    });
  }
  return _inviteValidation;
}

function tokenAbuseIndicator() {
  if (!_tokenAbuseIndicator) {
    _tokenAbuseIndicator = meter().createCounter('token.abuse.indicator', {
      description: 'Potential token abuse indicators',
      unit: '1',
    });
  }
  return _tokenAbuseIndicator;
}

export type TokenType = 'event_checkin' | 'member_checkin';
export type InviteAction = 'create' | 'update' | 'revoke' | 'join';
export type InviteValidationResult =
  | 'ok'
  | 'invalid'
  | 'revoked'
  | 'expired'
  | 'capacity_full';

interface TokenRotationContext {
  tokenType: TokenType;
  actorId: string;
  eventId: string;
  memberId?: string;
  reason?: string;
}

export function trackTokenRotation(ctx: TokenRotationContext): void {
  tokenRotation().add(1, {
    token_type: ctx.tokenType,
    event_id: ctx.eventId,
    has_reason: ctx.reason ? 'true' : 'false',
  });
  logger.info(
    {
      token: 'rotation',
      tokenType: ctx.tokenType,
      actorId: ctx.actorId,
      eventId: ctx.eventId,
      memberId: ctx.memberId,
      reason: ctx.reason,
    },
    `Token rotated: ${ctx.tokenType}`
  );
}

interface InviteLinkActionContext {
  action: InviteAction;
  actorId: string;
  eventId: string;
  inviteLinkId?: string;
  maxUses?: number;
  expiresAt?: Date;
}

export function trackInviteLinkAction(ctx: InviteLinkActionContext): void {
  inviteLinkAction().add(1, {
    action: ctx.action,
    event_id: ctx.eventId,
    has_max_uses: ctx.maxUses ? 'true' : 'false',
    has_expiry: ctx.expiresAt ? 'true' : 'false',
  });
  logger.info(
    {
      invite: ctx.action,
      actorId: ctx.actorId,
      eventId: ctx.eventId,
      inviteLinkId: ctx.inviteLinkId,
      maxUses: ctx.maxUses,
      expiresAt: ctx.expiresAt?.toISOString(),
    },
    `Invite link ${ctx.action}`
  );
}

interface InviteLinkValidationContext {
  result: InviteValidationResult;
  eventId: string;
  inviteLinkId?: string;
  code?: string;
  userId?: string;
  ipAddress?: string;
}

export function trackInviteLinkValidation(
  ctx: InviteLinkValidationContext
): void {
  inviteValidation().add(1, { result: ctx.result, event_id: ctx.eventId });
  const logLevel = ctx.result === 'ok' ? 'debug' : 'info';
  logger[logLevel](
    {
      invite: 'validation',
      result: ctx.result,
      eventId: ctx.eventId,
      inviteLinkId: ctx.inviteLinkId,
      codePrefix: ctx.code?.substring(0, 4),
      userId: ctx.userId,
      hasIp: !!ctx.ipAddress,
    },
    `Invite validation: ${ctx.result}`
  );
}

interface AbuseIndicatorContext {
  indicatorType: 'invalid_token_spike' | 'rapid_rotation' | 'mass_invite_usage';
  eventId: string;
  count: number;
  windowMinutes: number;
  userId?: string;
  ipAddress?: string;
}

export function trackTokenAbuseIndicator(ctx: AbuseIndicatorContext): void {
  tokenAbuseIndicator().add(1, {
    indicator_type: ctx.indicatorType,
    event_id: ctx.eventId,
  });
  logger.warn(
    {
      abuse: ctx.indicatorType,
      eventId: ctx.eventId,
      count: ctx.count,
      windowMinutes: ctx.windowMinutes,
      userId: ctx.userId,
      hasIp: !!ctx.ipAddress,
    },
    `Potential token abuse: ${ctx.indicatorType}`
  );
}

export async function traceTokenOperation<T>(
  operationName: string,
  ctx: { actorId: string; eventId: string; tokenType?: TokenType },
  fn: (span: Span) => Promise<T>
): Promise<T> {
  return tracer().startActiveSpan(`token.${operationName}`, async (span) => {
    span.setAttribute('token.operation', operationName);
    span.setAttribute('token.actor_id', ctx.actorId);
    span.setAttribute('token.event_id', ctx.eventId);
    if (ctx.tokenType) span.setAttribute('token.type', ctx.tokenType);
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

export async function traceInviteLinkOperation<T>(
  operationName: string,
  ctx: { actorId: string; eventId: string; inviteLinkId?: string },
  fn: (span: Span) => Promise<T>
): Promise<T> {
  return tracer().startActiveSpan(`invite.${operationName}`, async (span) => {
    span.setAttribute('invite.operation', operationName);
    span.setAttribute('invite.actor_id', ctx.actorId);
    span.setAttribute('invite.event_id', ctx.eventId);
    if (ctx.inviteLinkId) span.setAttribute('invite.link_id', ctx.inviteLinkId);
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
