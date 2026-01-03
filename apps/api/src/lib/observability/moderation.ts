/**
 * Moderation / Admin / Audit Observability
 *
 * SECURITY & COMPLIANCE - High impact operations
 *
 * All operations here require MANDATORY audit logging.
 */

import { getMeter } from '@appname/observability/metrics';
import { trace, SpanStatusCode } from '@opentelemetry/api';
import type { Span, Counter, Histogram } from '@opentelemetry/api';
import { logger } from '../pino';

// Lazy initialization
let _meter: ReturnType<typeof getMeter> | null = null;
let _tracer: ReturnType<typeof trace.getTracer> | null = null;

function meter() {
  if (!_meter) _meter = getMeter('moderation');
  return _meter;
}

function tracer() {
  if (!_tracer) _tracer = trace.getTracer('moderation');
  return _tracer;
}

// Metrics (lazy)
let _reportsCreated: Counter | null = null;
let _reportsResolved: Counter | null = null;
let _adminActions: Counter | null = null;
let _userBlocks: Counter | null = null;
let _auditExports: Counter | null = null;
let _auditExportSize: Histogram | null = null;

function reportsCreated() {
  if (!_reportsCreated) {
    _reportsCreated = meter().createCounter('moderation.reports.created', {
      description: 'Reports created',
      unit: '1',
    });
  }
  return _reportsCreated;
}

function reportsResolved() {
  if (!_reportsResolved) {
    _reportsResolved = meter().createCounter('moderation.reports.resolved', {
      description: 'Reports resolved',
      unit: '1',
    });
  }
  return _reportsResolved;
}

function adminActions() {
  if (!_adminActions) {
    _adminActions = meter().createCounter('moderation.admin.actions', {
      description: 'Admin moderation actions',
      unit: '1',
    });
  }
  return _adminActions;
}

function userBlocks() {
  if (!_userBlocks) {
    _userBlocks = meter().createCounter('moderation.blocks', {
      description: 'User block actions',
      unit: '1',
    });
  }
  return _userBlocks;
}

function auditExports() {
  if (!_auditExports) {
    _auditExports = meter().createCounter('moderation.audit.exports', {
      description: 'Audit log exports',
      unit: '1',
    });
  }
  return _auditExports;
}

function auditExportSize() {
  if (!_auditExportSize) {
    _auditExportSize = meter().createHistogram('moderation.audit.export_size', {
      description: 'Audit export size in records',
      unit: '1',
    });
  }
  return _auditExportSize;
}

// Types
export type ReportReason = 'spam' | 'harassment' | 'inappropriate' | 'fraud' | 'other';
export type ReportStatus = 'pending' | 'investigating' | 'resolved_action_taken' | 'resolved_no_action' | 'dismissed';

interface ReportContext {
  reportId: string;
  reporterUserId: string;
  targetType: 'user' | 'event' | 'message' | 'comment' | 'review' | 'chat';
  targetId: string;
  reason: ReportReason;
}

export function trackReportCreated(ctx: ReportContext): void {
  reportsCreated().add(1, { target_type: ctx.targetType, reason: ctx.reason });
  logger.info({
    audit: 'moderation.report.created',
    reportId: ctx.reportId,
    reporterUserId: ctx.reporterUserId,
    targetType: ctx.targetType,
    targetId: ctx.targetId,
    reason: ctx.reason,
  }, 'Report created');
}

interface ReportResolutionContext {
  reportId: string;
  moderatorId: string;
  previousStatus: ReportStatus;
  newStatus: ReportStatus;
  actionTaken?: string;
}

export function trackReportResolved(ctx: ReportResolutionContext): void {
  reportsResolved().add(1, {
    previous_status: ctx.previousStatus,
    new_status: ctx.newStatus,
    action_taken: ctx.actionTaken ? 'yes' : 'no',
  });
  logger.info({
    audit: 'moderation.report.resolved',
    reportId: ctx.reportId,
    moderatorId: ctx.moderatorId,
    previousStatus: ctx.previousStatus,
    newStatus: ctx.newStatus,
    actionTaken: ctx.actionTaken,
  }, `Report resolved: ${ctx.newStatus}`);
}

export type AdminAction =
  | 'suspend_user' | 'unsuspend_user' | 'delete_user' | 'delete_event'
  | 'delete_comment' | 'delete_review' | 'delete_message'
  | 'hide_content' | 'unhide_content' | 'update_user' | 'update_event';

interface AdminActionContext {
  adminId: string;
  action: AdminAction;
  targetType: string;
  targetId: string;
  reason?: string;
  diff?: Record<string, unknown>;
}

export function trackAdminAction(ctx: AdminActionContext): void {
  adminActions().add(1, { action: ctx.action, target_type: ctx.targetType });
  logger.warn({
    audit: 'moderation.admin.action',
    adminId: ctx.adminId,
    action: ctx.action,
    targetType: ctx.targetType,
    targetId: ctx.targetId,
    reason: ctx.reason,
    diff: ctx.diff,
  }, `Admin action: ${ctx.action}`);
}

interface BlockContext {
  blockerId: string;
  blockedId: string;
  action: 'block' | 'unblock';
}

export function trackUserBlock(ctx: BlockContext): void {
  userBlocks().add(1, { action: ctx.action });
  logger.info({
    audit: 'moderation.block',
    blockerId: ctx.blockerId,
    blockedId: ctx.blockedId,
    action: ctx.action,
  }, `User ${ctx.action}`);
}

interface AuditExportContext {
  userId: string;
  eventId?: string;
  exportType: 'audit_logs' | 'checkin_logs' | 'user_data';
  recordCount: number;
  format: 'csv' | 'json' | 'pdf';
  async: boolean;
  durationMs: number;
}

export function trackAuditExport(ctx: AuditExportContext): void {
  auditExports().add(1, { export_type: ctx.exportType, format: ctx.format, async: String(ctx.async) });
  auditExportSize().record(ctx.recordCount, { export_type: ctx.exportType });
  logger.info({
    audit: 'moderation.audit.export',
    userId: ctx.userId,
    eventId: ctx.eventId,
    exportType: ctx.exportType,
    recordCount: ctx.recordCount,
    format: ctx.format,
    async: ctx.async,
    durationMs: ctx.durationMs,
  }, `Audit export: ${ctx.exportType}`);
}

interface ArchiveContext {
  eventId: string;
  userId: string;
  recordCount: number;
  archiveSize: number;
  durationMs: number;
}

export function trackAuditArchive(ctx: ArchiveContext): void {
  logger.info({
    audit: 'moderation.audit.archive',
    eventId: ctx.eventId,
    userId: ctx.userId,
    recordCount: ctx.recordCount,
    archiveSize: ctx.archiveSize,
    durationMs: ctx.durationMs,
  }, 'Audit logs archived');
}

export async function traceModerationOperation<T>(
  operationName: string,
  ctx: { actorId: string; targetId?: string; [key: string]: unknown },
  fn: (span: Span) => Promise<T>
): Promise<T> {
  return tracer().startActiveSpan(`moderation.${operationName}`, async (span) => {
    span.setAttribute('moderation.actor_id', ctx.actorId);
    if (ctx.targetId) span.setAttribute('moderation.target_id', ctx.targetId);
    span.setAttribute('moderation.operation', operationName);

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
