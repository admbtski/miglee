/**
 * Soft Delete / Moderation Visibility Observability
 */

import { getMeter } from '@appname/observability/metrics';
import { trace, SpanStatusCode } from '@opentelemetry/api';
import type { Span, Counter } from '@opentelemetry/api';
import { logger } from '../pino';

// Lazy initialization
let _meter: ReturnType<typeof getMeter> | null = null;
let _tracer: ReturnType<typeof trace.getTracer> | null = null;

function meter() {
  if (!_meter) _meter = getMeter('visibility');
  return _meter;
}

function tracer() {
  if (!_tracer) _tracer = trace.getTracer('visibility');
  return _tracer;
}

let _visibilityChange: Counter | null = null;
let _moderationAction: Counter | null = null;

function visibilityChange() {
  if (!_visibilityChange) {
    _visibilityChange = meter().createCounter('visibility.change', { description: 'Content visibility changes', unit: '1' });
  }
  return _visibilityChange;
}

function moderationAction() {
  if (!_moderationAction) {
    _moderationAction = meter().createCounter('moderation.action', { description: 'Moderation actions', unit: '1' });
  }
  return _moderationAction;
}

export type ContentEntityType = 'comment' | 'review' | 'message' | 'event';
export type VisibilityAction = 'hide' | 'unhide' | 'soft_delete' | 'hard_delete' | 'restore';
export type ModerationSource = 'user' | 'moderator' | 'admin' | 'system';

interface VisibilityChangeContext {
  entityType: ContentEntityType;
  entityId: string;
  action: VisibilityAction;
  actorId: string;
  actorRole: ModerationSource;
  eventId?: string;
  previousState?: string;
  newState?: string;
  reason?: string;
}

export function trackVisibilityChange(ctx: VisibilityChangeContext): void {
  visibilityChange().add(1, { entity_type: ctx.entityType, action: ctx.action, actor_role: ctx.actorRole, event_id: ctx.eventId || 'none' });
  logger.info({
    audit: 'visibility_change', entityType: ctx.entityType, entityId: ctx.entityId, action: ctx.action,
    actorId: ctx.actorId, actorRole: ctx.actorRole, eventId: ctx.eventId, previousState: ctx.previousState, newState: ctx.newState, reason: ctx.reason, timestamp: new Date().toISOString(),
  }, `Visibility change: ${ctx.entityType} ${ctx.action}`);
}

interface ModerationActionContext {
  actionType: 'hide' | 'unhide' | 'delete' | 'restore' | 'cancel';
  entityType: ContentEntityType;
  entityId: string;
  actorId: string;
  actorRole: ModerationSource;
  eventId?: string;
  targetUserId?: string;
  reason?: string;
  isHard?: boolean;
}

export function trackModerationAction(ctx: ModerationActionContext): void {
  moderationAction().add(1, { action_type: ctx.actionType, entity_type: ctx.entityType, actor_role: ctx.actorRole, is_hard: String(ctx.isHard ?? false) });
  logger.warn({
    audit: 'moderation_action', actionType: ctx.actionType, entityType: ctx.entityType, entityId: ctx.entityId,
    actorId: ctx.actorId, actorRole: ctx.actorRole, eventId: ctx.eventId, targetUserId: ctx.targetUserId, reason: ctx.reason, isHard: ctx.isHard, timestamp: new Date().toISOString(),
  }, `Moderation action: ${ctx.actionType} ${ctx.entityType}`);
}

export const trackCommentVisibility = {
  hide(actorId: string, commentId: string, eventId: string, reason?: string, actorRole: ModerationSource = 'moderator') {
    trackVisibilityChange({ entityType: 'comment', entityId: commentId, action: 'hide', actorId, actorRole, eventId, previousState: 'visible', newState: 'hidden', reason });
  },
  unhide(actorId: string, commentId: string, eventId: string, actorRole: ModerationSource = 'moderator') {
    trackVisibilityChange({ entityType: 'comment', entityId: commentId, action: 'unhide', actorId, actorRole, eventId, previousState: 'hidden', newState: 'visible' });
  },
};

export const trackReviewVisibility = {
  hide(actorId: string, reviewId: string, eventId: string, reason?: string, actorRole: ModerationSource = 'moderator') {
    trackVisibilityChange({ entityType: 'review', entityId: reviewId, action: 'hide', actorId, actorRole, eventId, previousState: 'visible', newState: 'hidden', reason });
  },
  unhide(actorId: string, reviewId: string, eventId: string, actorRole: ModerationSource = 'moderator') {
    trackVisibilityChange({ entityType: 'review', entityId: reviewId, action: 'unhide', actorId, actorRole, eventId, previousState: 'hidden', newState: 'visible' });
  },
};

export const trackMessageVisibility = {
  softDelete(actorId: string, messageId: string, eventId: string, actorRole: ModerationSource = 'user') {
    trackVisibilityChange({ entityType: 'message', entityId: messageId, action: 'soft_delete', actorId, actorRole, eventId, previousState: 'visible', newState: 'soft_deleted' });
  },
  hardDelete(actorId: string, messageId: string, eventId: string, actorRole: ModerationSource = 'moderator') {
    trackVisibilityChange({ entityType: 'message', entityId: messageId, action: 'hard_delete', actorId, actorRole, eventId, previousState: 'visible', newState: 'deleted' });
  },
};

export const trackEventVisibility = {
  adminDelete(actorId: string, eventId: string, reason?: string) {
    trackModerationAction({ actionType: 'delete', entityType: 'event', entityId: eventId, actorId, actorRole: 'admin', eventId, reason });
  },
  adminRestore(actorId: string, eventId: string) {
    trackModerationAction({ actionType: 'restore', entityType: 'event', entityId: eventId, actorId, actorRole: 'admin', eventId });
  },
  adminCancel(actorId: string, eventId: string, reason?: string) {
    trackModerationAction({ actionType: 'cancel', entityType: 'event', entityId: eventId, actorId, actorRole: 'admin', eventId, reason });
  },
};

export async function traceVisibilityOperation<T>(
  operationName: string,
  ctx: { actorId: string; entityType: ContentEntityType; entityId: string; eventId?: string },
  fn: (span: Span) => Promise<T>
): Promise<T> {
  return tracer().startActiveSpan(`visibility.${operationName}`, async (span) => {
    span.setAttribute('visibility.operation', operationName);
    span.setAttribute('visibility.entity_type', ctx.entityType);
    span.setAttribute('visibility.entity_id', ctx.entityId);
    span.setAttribute('visibility.actor_id', ctx.actorId);
    if (ctx.eventId) span.setAttribute('visibility.event_id', ctx.eventId);
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
