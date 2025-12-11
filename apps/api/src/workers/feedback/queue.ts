import { JobsOptions } from 'bullmq';
import { getQueue, createWorker, BULLMQ_CONFIG } from '../../lib/bullmq';
import { runFeedbackRequestForEvent } from './runFeedbackRequestForEvent';
import { logger } from '../logger';
import { config } from '../../env';

/**
 * Feedback Request Queue
 * Sends feedback requests to participants after an event ends
 */

// Queue name
const QUEUE_NAME = 'event-feedback';

// Job payload type
export type FeedbackRequestPayload = {
  eventId: string;
};

// Get the queue (creates if not exists)
export const feedbackQueue = getQueue<FeedbackRequestPayload>(QUEUE_NAME, {
  createDeadLetterQueue: true,
});

// =============================================================================
// Job ID Builder
// =============================================================================

function buildJobId(eventId: string) {
  return `feedback-request-${eventId}`;
}

// =============================================================================
// Queue Operations
// =============================================================================

/**
 * Schedule feedback request to be sent 1 hour after event ends
 * @param eventId - Event ID
 * @param endAt - Event end date
 */
export async function enqueueFeedbackRequest(eventId: string, endAt: Date) {
  logger.debug({ eventId, endAt }, 'Enqueueing feedback request');

  const now = Date.now();
  // 1 hour after event end in production, 5 seconds in development
  const delayAfterEnd = config.isProduction ? 60 * 60 * 1000 : 5 * 1000;
  const runAt = new Date(endAt).getTime() + delayAfterEnd;
  const delay = runAt - now;

  if (delay <= 0) {
    logger.info(
      { eventId, endAt },
      '[enqueueFeedbackRequest] Event already ended, skipping.'
    );
    return;
  }

  logger.info(
    { eventId, endAt, delayMs: delay },
    '[enqueueFeedbackRequest] Scheduling feedback request...'
  );

  const opts: JobsOptions = {
    delay,
    jobId: buildJobId(eventId),
  };

  await feedbackQueue.add('send', { eventId }, opts);
  logger.info(
    { eventId },
    '[enqueueFeedbackRequest] Feedback request scheduled.'
  );
}

/**
 * Immediately send feedback request (manual trigger)
 * @param eventId - Event ID
 */
export async function enqueueFeedbackRequestNow(eventId: string) {
  logger.info(
    { eventId },
    '[enqueueFeedbackRequestNow] Queueing immediate feedback request...'
  );

  const opts: JobsOptions = {
    jobId: `${buildJobId(eventId)}-manual-${Date.now()}`,
  };

  await feedbackQueue.add('send', { eventId }, opts);
  logger.info(
    { eventId },
    '[enqueueFeedbackRequestNow] Immediate feedback request queued.'
  );
}

/**
 * Clear feedback request for an event
 * @param eventId - Event ID
 */
export async function clearFeedbackRequest(eventId: string) {
  logger.info({ eventId }, '[clearFeedbackRequest] Removing feedback job...');
  const jobId = buildJobId(eventId);
  const job = await feedbackQueue.getJob(jobId);

  if (job) {
    try {
      await job.remove();
      logger.info({ eventId, jobId }, '[clearFeedbackRequest] Job removed');
    } catch (e) {
      logger.warn(
        { err: e, eventId, jobId },
        '[clearFeedbackRequest] Remove failed'
      );
    }
  } else {
    logger.debug({ eventId, jobId }, '[clearFeedbackRequest] No job found');
  }
}

/**
 * Reschedule feedback request (e.g., when event endAt changes)
 * @param eventId - Event ID
 * @param newEndAt - New event end date
 */
export async function rescheduleFeedbackRequest(
  eventId: string,
  newEndAt: Date
) {
  logger.info(
    { eventId, newEndAt },
    '[rescheduleFeedbackRequest] Rescheduling...'
  );
  await clearFeedbackRequest(eventId);
  await enqueueFeedbackRequest(eventId, newEndAt);
}

// =============================================================================
// Worker Bootstrap
// =============================================================================

/**
 * Bootstrap the feedback worker
 * Should be called from a separate worker process
 */
export function bootstrapFeedbackWorker() {
  logger.info('🚀 Starting feedback worker...');

  const worker = createWorker<FeedbackRequestPayload>(
    QUEUE_NAME,
    async (job) => {
      const { eventId } = job.data;
      await runFeedbackRequestForEvent(eventId);
      return { success: true, eventId };
    },
    {
      concurrency: BULLMQ_CONFIG.workerOptions.concurrency,
    }
  );

  logger.info('🎯 Feedback worker bootstrap complete.');

  return worker;
}
