/**
 * Export / Archive Observability
 *
 * CRITICAL: Exports do large scans, long requests, large payloads.
 */

import { getMeter } from '@appname/observability/metrics';
import { trace, SpanStatusCode } from '@opentelemetry/api';
import type { Span, Counter, Histogram } from '@opentelemetry/api';
import { logger } from '../pino';

// Lazy initialization
let _meter: ReturnType<typeof getMeter> | null = null;
let _tracer: ReturnType<typeof trace.getTracer> | null = null;

function meter() {
  if (!_meter) _meter = getMeter('export');
  return _meter;
}

function tracer() {
  if (!_tracer) _tracer = trace.getTracer('export');
  return _tracer;
}

let _exportLatency: Histogram | null = null;
let _exportRecordCount: Histogram | null = null;
let _exportPayloadSize: Histogram | null = null;
let _exportLimitHit: Counter | null = null;
let _archiveLatency: Histogram | null = null;
let _archiveRecordCount: Histogram | null = null;
let _exportTimeouts: Counter | null = null;

function exportLatency() {
  if (!_exportLatency) {
    _exportLatency = meter().createHistogram('export.latency', { description: 'Export operation latency', unit: 'ms' });
  }
  return _exportLatency;
}

function exportRecordCount() {
  if (!_exportRecordCount) {
    _exportRecordCount = meter().createHistogram('export.record_count', { description: 'Number of records exported', unit: '1' });
  }
  return _exportRecordCount;
}

function exportPayloadSize() {
  if (!_exportPayloadSize) {
    _exportPayloadSize = meter().createHistogram('export.payload_size', { description: 'Export payload size in bytes', unit: 'bytes' });
  }
  return _exportPayloadSize;
}

function exportLimitHit() {
  if (!_exportLimitHit) {
    _exportLimitHit = meter().createCounter('export.limit_hit', { description: 'Number of times export limit was reached', unit: '1' });
  }
  return _exportLimitHit;
}

function archiveLatency() {
  if (!_archiveLatency) {
    _archiveLatency = meter().createHistogram('archive.latency', { description: 'Archive operation latency', unit: 'ms' });
  }
  return _archiveLatency;
}

function archiveRecordCount() {
  if (!_archiveRecordCount) {
    _archiveRecordCount = meter().createHistogram('archive.record_count', { description: 'Number of records archived', unit: '1' });
  }
  return _archiveRecordCount;
}

function exportTimeouts() {
  if (!_exportTimeouts) {
    _exportTimeouts = meter().createCounter('export.timeouts', { description: 'Export operation timeouts', unit: '1' });
  }
  return _exportTimeouts;
}

export type ExportType = 'audit_logs' | 'checkin_logs' | 'members' | 'events';
export type ExportFormat = 'json' | 'csv' | 'pdf';

interface ExportContext {
  exportType: ExportType;
  userId: string;
  eventId?: string;
  format?: ExportFormat;
  recordCount: number;
  payloadSize?: number;
  durationMs: number;
  limitHit?: boolean;
  async?: boolean;
}

export function trackExport(ctx: ExportContext): void {
  const attributes = { type: ctx.exportType, format: ctx.format || 'json', async: String(ctx.async || false) };
  exportLatency().record(ctx.durationMs, attributes);
  exportRecordCount().record(ctx.recordCount, attributes);
  if (ctx.payloadSize) exportPayloadSize().record(ctx.payloadSize, attributes);
  if (ctx.limitHit) exportLimitHit().add(1, attributes);

  if (ctx.recordCount > 1000 || ctx.durationMs > 5000) {
    logger.info({
      export: ctx.exportType,
      userId: ctx.userId,
      eventId: ctx.eventId,
      recordCount: ctx.recordCount,
      payloadSize: ctx.payloadSize,
      durationMs: ctx.durationMs,
      limitHit: ctx.limitHit,
    }, `Export completed: ${ctx.exportType}`);
  }
}

export function trackExportTimeout(exportType: ExportType, userId: string, eventId?: string): void {
  exportTimeouts().add(1, { type: exportType });
  logger.error({ export: exportType, userId, eventId }, `Export timeout: ${exportType}`);
}

interface ArchiveContext {
  eventId: string;
  userId: string;
  recordCount: number;
  archiveSize?: number;
  durationMs: number;
}

export function trackArchive(ctx: ArchiveContext): void {
  archiveLatency().record(ctx.durationMs, {});
  archiveRecordCount().record(ctx.recordCount, {});
  logger.info({
    audit: 'archive.completed',
    eventId: ctx.eventId,
    userId: ctx.userId,
    recordCount: ctx.recordCount,
    archiveSize: ctx.archiveSize,
    durationMs: ctx.durationMs,
  }, 'Audit logs archived');
}

export async function traceExportOperation<T>(
  operationName: string,
  exportType: ExportType,
  fn: (span: Span) => Promise<T>
): Promise<T> {
  return tracer().startActiveSpan(`export.${exportType}.${operationName}`, async (span) => {
    span.setAttribute('export.type', exportType);
    span.setAttribute('export.operation', operationName);

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
