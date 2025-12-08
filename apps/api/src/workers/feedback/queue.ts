import { Queue, Worker, JobsOptions } from 'bullmq';
import IORedis from 'ioredis';
import { runFeedbackRequestForEvent } from './runFeedbackRequestForEvent';
import { logger } from '../logger';

export const connection = new IORedis({
  host: process.env.REDIS_HOST ?? 'localhost',
  port: Number(process.env.REDIS_PORT ?? 6379),
  retryStrategy: (times: number) => Math.min(500 + times * 250, 5000),
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
  connectTimeout: 5_000,
  lazyConnect: false,
  keepAlive: 10_000,
});

// Log Redis connection status
connection.on('connect', () => {
  logger.info('✅ Redis connected for feedback queue');
});
connection.on('error', (err) => {
  logger.error({ err }, '❌ Redis connection error for feedback queue');
});

// Queue for feedback requests (sent after event ends)
export const feedbackQueue = new Queue('event-feedback', { connection });

export type FeedbackRequestPayload = {
  eventId: string;
};

function buildJobId(eventId: string) {
  return `feedback-request-${eventId}`;
}

/**
 * Schedule feedback request to be sent 1 hour after event ends
 * @param eventId - Event ID
 * @param endAt - Event end date
 */
export async function enqueueFeedbackRequest(eventId: string, endAt: Date) {
  console.log('kolejka');
  const now = Date.now();
  // const oneHourAfterEnd = new Date(endAt).getTime() + 60 * 1000; // 1 hour
  const oneHourAfterEnd = new Date(endAt).getTime() + 5 * 1000; // 1 hour
  const delay = oneHourAfterEnd - now;

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
    attempts: 3,
    removeOnComplete: 1000,
    removeOnFail: 5000,
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
    attempts: 3,
    removeOnComplete: 1000,
    removeOnFail: 5000,
    jobId: `${buildJobId(eventId)}-manual-${Date.now()}`, // Unique ID for manual sends
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

/**
 * Bootstrap the feedback worker
 */
export function bootstrapFeedbackWorker() {
  logger.info('🚀 Starting feedback worker...');

  const worker = new Worker<FeedbackRequestPayload>(
    'event-feedback',
    async (job) => {
      const { eventId } = job.data;
      logger.info(
        { jobId: job.id, eventId },
        '[Worker] Executing feedback request job...'
      );
      try {
        await runFeedbackRequestForEvent(eventId);
        logger.info(
          { eventId },
          '[Worker] Feedback request sent successfully.'
        );
      } catch (err) {
        logger.error({ err, eventId }, '[Worker] Feedback request failed.');
        throw err;
      }
    },
    { connection }
  );

  worker.on('ready', () =>
    logger.info('✅ Feedback worker ready, listening for jobs...')
  );
  worker.on('error', (err) => logger.error({ err }, '[Worker] Error'));
  worker.on('failed', (job, err) =>
    logger.error({ jobId: job?.id, err }, '[Worker] Job failed')
  );
  worker.on('completed', (job) =>
    logger.debug({ jobId: job.id }, '[Worker] Job completed')
  );

  return worker;
}
