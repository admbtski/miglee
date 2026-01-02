/**
 * Media Upload Observability
 *
 * CRITICAL: Classic abuse vector (many URLs, lots of data, confirming others' uploads).
 */

import { getMeter } from '@appname/observability/metrics';
import { trace, SpanStatusCode } from '@opentelemetry/api';
import type { Span, Counter, Histogram } from '@opentelemetry/api';
import { logger } from '../pino';

// Lazy initialization
let _meter: ReturnType<typeof getMeter> | null = null;
let _tracer: ReturnType<typeof trace.getTracer> | null = null;

function meter() {
  if (!_meter) _meter = getMeter('media');
  return _meter;
}

function tracer() {
  if (!_tracer) _tracer = trace.getTracer('media');
  return _tracer;
}

let _presignCreated: Counter | null = null;
let _confirmOk: Counter | null = null;
let _confirmFailed: Counter | null = null;
let _uploadFileSize: Histogram | null = null;
let _presignToConfirmTime: Histogram | null = null;
let _presignRateLimited: Counter | null = null;

function presignCreated() {
  if (!_presignCreated) {
    _presignCreated = meter().createCounter('media.presign.created', { description: 'Presigned URLs generated', unit: '1' });
  }
  return _presignCreated;
}

function confirmOk() {
  if (!_confirmOk) {
    _confirmOk = meter().createCounter('media.confirm.ok', { description: 'Successful upload confirmations', unit: '1' });
  }
  return _confirmOk;
}

function confirmFailed() {
  if (!_confirmFailed) {
    _confirmFailed = meter().createCounter('media.confirm.failed', { description: 'Failed upload confirmations', unit: '1' });
  }
  return _confirmFailed;
}

function uploadFileSize() {
  if (!_uploadFileSize) {
    _uploadFileSize = meter().createHistogram('media.upload.file_size', { description: 'Uploaded file size in bytes', unit: 'bytes' });
  }
  return _uploadFileSize;
}

function presignToConfirmTime() {
  if (!_presignToConfirmTime) {
    _presignToConfirmTime = meter().createHistogram('media.presign_to_confirm', { description: 'Time between presign and confirm', unit: 'ms' });
  }
  return _presignToConfirmTime;
}

function presignRateLimited() {
  if (!_presignRateLimited) {
    _presignRateLimited = meter().createCounter('media.presign.rate_limited', { description: 'Presign rate limit hits', unit: '1' });
  }
  return _presignRateLimited;
}

export type MediaPurpose = 'user_avatar' | 'event_cover' | 'event_gallery' | 'message_attachment' | 'other';

interface PresignContext {
  userId: string;
  purpose: MediaPurpose;
  entityId?: string;
}

export function trackPresignCreated(ctx: PresignContext): void {
  presignCreated().add(1, { purpose: ctx.purpose });
  logger.debug({ media: 'presign_created', userId: ctx.userId, purpose: ctx.purpose, entityId: ctx.entityId }, `Presign created: ${ctx.purpose}`);
}

export function trackPresignRateLimited(userId: string, purpose: MediaPurpose): void {
  presignRateLimited().add(1, { purpose });
  logger.warn({ media: 'presign_rate_limited', userId, purpose }, 'Presign rate limited');
}

interface ConfirmContext {
  userId: string;
  purpose: MediaPurpose;
  entityId?: string;
  success: boolean;
  fileSize?: number;
  mimeType?: string;
  presignedAt?: Date;
  errorReason?: string;
}

export function trackConfirmUpload(ctx: ConfirmContext): void {
  const attributes = { purpose: ctx.purpose, mime_bucket: getMimeBucket(ctx.mimeType) };

  if (ctx.success) {
    confirmOk().add(1, attributes);
    if (ctx.fileSize) uploadFileSize().record(ctx.fileSize, attributes);
    if (ctx.presignedAt) presignToConfirmTime().record(Date.now() - ctx.presignedAt.getTime(), attributes);
    logger.debug({ media: 'confirm_ok', userId: ctx.userId, purpose: ctx.purpose, entityId: ctx.entityId, fileSize: ctx.fileSize }, `Upload confirmed: ${ctx.purpose}`);
  } else {
    confirmFailed().add(1, { ...attributes, error: ctx.errorReason || 'unknown' });
    logger.warn({ media: 'confirm_failed', userId: ctx.userId, purpose: ctx.purpose, entityId: ctx.entityId, errorReason: ctx.errorReason }, `Upload confirm failed: ${ctx.purpose}`);
  }
}

export async function traceMediaOperation<T>(operationName: string, purpose: MediaPurpose, fn: (span: Span) => Promise<T>): Promise<T> {
  return tracer().startActiveSpan(`media.${operationName}`, async (span) => {
    span.setAttribute('media.purpose', purpose);
    span.setAttribute('media.operation', operationName);

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

function getMimeBucket(mimeType?: string): string {
  if (!mimeType) return 'unknown';
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'other';
}
