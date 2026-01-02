/**
 * Notifications Observability
 */

import { getMeter } from '@appname/observability/metrics';
import type { Counter, Histogram } from '@opentelemetry/api';
import { logger } from '../pino';

// Lazy initialization
let _meter: ReturnType<typeof getMeter> | null = null;

function meter() {
  if (!_meter) _meter = getMeter('notifications');
  return _meter;
}

let _notificationsCreated: Counter | null = null;
let _notificationsSent: Counter | null = null;
let _notificationsFailed: Counter | null = null;
let _notificationsRead: Counter | null = null;
let _notificationLatency: Histogram | null = null;

function notificationsCreated() {
  if (!_notificationsCreated) {
    _notificationsCreated = meter().createCounter('notifications.created', { description: 'Notifications created', unit: '1' });
  }
  return _notificationsCreated;
}

function notificationsSent() {
  if (!_notificationsSent) {
    _notificationsSent = meter().createCounter('notifications.sent', { description: 'Notifications delivered', unit: '1' });
  }
  return _notificationsSent;
}

function notificationsFailed() {
  if (!_notificationsFailed) {
    _notificationsFailed = meter().createCounter('notifications.failed', { description: 'Notification delivery failures', unit: '1' });
  }
  return _notificationsFailed;
}

function notificationsRead() {
  if (!_notificationsRead) {
    _notificationsRead = meter().createCounter('notifications.read', { description: 'Notifications marked as read', unit: '1' });
  }
  return _notificationsRead;
}

function notificationLatency() {
  if (!_notificationLatency) {
    _notificationLatency = meter().createHistogram('notifications.delivery_latency', { description: 'Time from creation to delivery', unit: 'ms' });
  }
  return _notificationLatency;
}

export type NotificationChannel = 'email' | 'push' | 'in_app';
export type NotificationType = 'event_reminder' | 'event_update' | 'event_canceled' | 'join_request' | 'join_approved' | 'join_rejected' | 'new_member' | 'member_left' | 'new_message' | 'new_review' | 'new_comment' | 'feedback_request' | 'system';

interface NotificationCreatedContext {
  notificationId?: string;
  recipientId: string;
  type: NotificationType;
  entityType?: string;
  entityId?: string;
  dedupeKey?: string;
}

export function trackNotificationCreated(ctx: NotificationCreatedContext): void {
  notificationsCreated().add(1, { type: ctx.type });
  logger.debug({ notification: 'created', notificationId: ctx.notificationId, recipientId: ctx.recipientId, type: ctx.type, entityType: ctx.entityType, entityId: ctx.entityId, dedupeKey: ctx.dedupeKey }, `Notification created: ${ctx.type}`);
}

interface NotificationDeliveryContext {
  notificationId?: string;
  recipientId: string;
  channel: NotificationChannel;
  type: NotificationType;
  success: boolean;
  errorReason?: string;
  latencyMs?: number;
}

export function trackNotificationDelivery(ctx: NotificationDeliveryContext): void {
  const attributes = { channel: ctx.channel, type: ctx.type };
  if (ctx.success) {
    notificationsSent().add(1, attributes);
    if (ctx.latencyMs) notificationLatency().record(ctx.latencyMs, attributes);
  } else {
    notificationsFailed().add(1, { ...attributes, error: ctx.errorReason || 'unknown' });
  }
  const level = ctx.success ? 'debug' : 'warn';
  logger[level]({ notification: 'delivery', notificationId: ctx.notificationId, recipientId: ctx.recipientId, channel: ctx.channel, type: ctx.type, success: ctx.success, errorReason: ctx.errorReason, latencyMs: ctx.latencyMs }, `Notification ${ctx.success ? 'delivered' : 'failed'}: ${ctx.channel}`);
}

interface NotificationReadContext {
  userId: string;
  notificationIds?: string[];
  markAll: boolean;
  count: number;
}

export function trackNotificationRead(ctx: NotificationReadContext): void {
  notificationsRead().add(ctx.count, { mark_all: String(ctx.markAll) });
  logger.trace({ notification: 'read', userId: ctx.userId, markAll: ctx.markAll, count: ctx.count }, `Notifications marked read: ${ctx.count}`);
}

export type EmailType = 'reminder' | 'feedback_request' | 'welcome' | 'password_reset' | 'verification' | 'event_update' | 'join_notification';

interface EmailSentContext {
  recipientId: string;
  emailType: EmailType;
  success: boolean;
  errorReason?: string;
  provider?: string;
}

export function trackEmailSent(ctx: EmailSentContext): void {
  const channel: NotificationChannel = 'email';
  if (ctx.success) {
    notificationsSent().add(1, { channel, type: ctx.emailType });
  } else {
    notificationsFailed().add(1, { channel, type: ctx.emailType, error: ctx.errorReason || 'unknown' });
  }
  const level = ctx.success ? 'info' : 'error';
  logger[level]({ email: ctx.emailType, recipientId: ctx.recipientId, success: ctx.success, errorReason: ctx.errorReason, provider: ctx.provider }, `Email ${ctx.success ? 'sent' : 'failed'}: ${ctx.emailType}`);
}

export function reportNotificationBacklog(channel: NotificationChannel, pendingCount: number): void {
  logger.info({ notification: 'backlog', channel, pendingCount }, `Notification backlog: ${channel} = ${pendingCount}`);
}
