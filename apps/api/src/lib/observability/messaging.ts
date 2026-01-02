/**
 * DM / Chat / Comments / Reviews Observability
 *
 * HIGH VOLUME + PRIVACY - Most user data, GDPR concerns
 *
 * IMPORTANT: Never log message content! Only IDs and lengths.
 *
 * Tracked operations:
 * - Message send/edit/delete (throughput, errors)
 * - Chat activity (read marks, typing)
 * - Comments and reviews
 * - Reactions
 */

import { getMeter } from '@appname/observability/metrics';
import { trace, SpanStatusCode } from '@opentelemetry/api';
import type { Span, Counter, Histogram } from '@opentelemetry/api';
import { logger } from '../pino';

// Lazy initialization
let _meter: ReturnType<typeof getMeter> | null = null;
let _tracer: ReturnType<typeof trace.getTracer> | null = null;

function meter() {
  if (!_meter) _meter = getMeter('messaging');
  return _meter;
}

function tracer() {
  if (!_tracer) _tracer = trace.getTracer('messaging');
  return _tracer;
}

// =============================================================================
// Throughput Metrics (lazy)
// =============================================================================

let _messagesSent: Counter | null = null;
let _messagesEdited: Counter | null = null;
let _messagesDeleted: Counter | null = null;
let _messagingErrors: Counter | null = null;
let _messageLatency: Histogram | null = null;
let _messagePayloadSize: Histogram | null = null;
let _commentsCreated: Counter | null = null;
let _reviewsCreated: Counter | null = null;
let _reactionsAdded: Counter | null = null;

function messagesSent() {
  if (!_messagesSent) {
    _messagesSent = meter().createCounter('messaging.sent', {
      description: 'Messages sent',
      unit: '1',
    });
  }
  return _messagesSent;
}

function messagesEdited() {
  if (!_messagesEdited) {
    _messagesEdited = meter().createCounter('messaging.edited', {
      description: 'Messages edited',
      unit: '1',
    });
  }
  return _messagesEdited;
}

function messagesDeleted() {
  if (!_messagesDeleted) {
    _messagesDeleted = meter().createCounter('messaging.deleted', {
      description: 'Messages deleted',
      unit: '1',
    });
  }
  return _messagesDeleted;
}

function messagingErrors() {
  if (!_messagingErrors) {
    _messagingErrors = meter().createCounter('messaging.errors', {
      description: 'Messaging operation errors',
      unit: '1',
    });
  }
  return _messagingErrors;
}

function messageLatency() {
  if (!_messageLatency) {
    _messageLatency = meter().createHistogram('messaging.latency', {
      description: 'Message operation latency',
      unit: 'ms',
    });
  }
  return _messageLatency;
}

function messagePayloadSize() {
  if (!_messagePayloadSize) {
    _messagePayloadSize = meter().createHistogram('messaging.payload_size', {
      description: 'Message payload size in bytes',
      unit: 'bytes',
    });
  }
  return _messagePayloadSize;
}

function commentsCreated() {
  if (!_commentsCreated) {
    _commentsCreated = meter().createCounter('messaging.comments.created', {
      description: 'Comments created',
      unit: '1',
    });
  }
  return _commentsCreated;
}

function reviewsCreated() {
  if (!_reviewsCreated) {
    _reviewsCreated = meter().createCounter('messaging.reviews.created', {
      description: 'Reviews created',
      unit: '1',
    });
  }
  return _reviewsCreated;
}

function reactionsAdded() {
  if (!_reactionsAdded) {
    _reactionsAdded = meter().createCounter('messaging.reactions.added', {
      description: 'Reactions added',
      unit: '1',
    });
  }
  return _reactionsAdded;
}

// =============================================================================
// Message Tracking (Privacy-safe)
// =============================================================================

export type MessageChannel = 'dm' | 'event_chat';
export type MessageOperation = 'send' | 'edit' | 'delete' | 'read';

interface MessageContext {
  channel: MessageChannel;
  operation: MessageOperation;
  userId: string;
  threadId?: string;
  eventId?: string;
  messageLength?: number;
  success: boolean;
  latencyMs?: number;
}

export function trackMessage(ctx: MessageContext): void {
  const attributes = {
    channel: ctx.channel,
    operation: ctx.operation,
    success: String(ctx.success),
  };

  if (ctx.success) {
    switch (ctx.operation) {
      case 'send':
        messagesSent().add(1, attributes);
        if (ctx.messageLength) {
          messagePayloadSize().record(ctx.messageLength, attributes);
        }
        break;
      case 'edit':
        messagesEdited().add(1, attributes);
        break;
      case 'delete':
        messagesDeleted().add(1, attributes);
        break;
    }
  } else {
    messagingErrors().add(1, attributes);
  }

  if (ctx.latencyMs) {
    messageLatency().record(ctx.latencyMs, attributes);
  }

  logger.debug(
    {
      channel: ctx.channel,
      operation: ctx.operation,
      userId: ctx.userId,
      threadId: ctx.threadId,
      eventId: ctx.eventId,
      messageLength: ctx.messageLength,
      success: ctx.success,
    },
    `Message ${ctx.operation}: ${ctx.channel}`
  );
}

// =============================================================================
// Comments & Reviews Tracking
// =============================================================================

export type ContentType = 'comment' | 'review';
export type ContentOperation =
  | 'create'
  | 'update'
  | 'delete'
  | 'hide'
  | 'unhide';

interface ContentContext {
  type: ContentType;
  operation: ContentOperation;
  userId: string;
  entityId: string;
  contentLength?: number;
  rating?: number;
}

export function trackContent(ctx: ContentContext): void {
  const attributes = {
    type: ctx.type,
    operation: ctx.operation,
  };

  if (ctx.operation === 'create') {
    if (ctx.type === 'comment') {
      commentsCreated().add(1, attributes);
    } else {
      reviewsCreated().add(1, {
        ...attributes,
        rating_bucket: getRatingBucket(ctx.rating),
      });
    }
  }

  logger.debug(
    {
      type: ctx.type,
      operation: ctx.operation,
      userId: ctx.userId,
      entityId: ctx.entityId,
      contentLength: ctx.contentLength,
      rating: ctx.rating,
    },
    `${ctx.type} ${ctx.operation}`
  );
}

// =============================================================================
// Reactions Tracking
// =============================================================================

export type ReactionTarget = 'dm_message' | 'event_message' | 'comment';

interface ReactionContext {
  target: ReactionTarget;
  added: boolean;
  userId: string;
  emoji?: string;
}

export function trackReaction(ctx: ReactionContext): void {
  if (ctx.added) {
    reactionsAdded().add(1, { target: ctx.target });
  }

  logger.trace(
    {
      target: ctx.target,
      added: ctx.added,
      userId: ctx.userId,
    },
    `Reaction ${ctx.added ? 'added' : 'removed'}`
  );
}

// =============================================================================
// Tracing Wrapper
// =============================================================================

export async function traceMessagingOperation<T>(
  operationName: string,
  channel: MessageChannel,
  fn: (span: Span) => Promise<T>
): Promise<T> {
  return tracer().startActiveSpan(
    `messaging.${channel}.${operationName}`,
    async (span) => {
      span.setAttribute('messaging.channel', channel);
      span.setAttribute('messaging.operation', operationName);

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
    }
  );
}

// =============================================================================
// Helpers
// =============================================================================

function getRatingBucket(rating?: number): string {
  if (!rating) return 'unknown';
  if (rating <= 2) return 'low';
  if (rating <= 4) return 'medium';
  return 'high';
}
