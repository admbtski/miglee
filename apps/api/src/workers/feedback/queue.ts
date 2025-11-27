import { Queue, Worker, JobsOptions } from 'bullmq';
import IORedis from 'ioredis';
import { runFeedbackRequestForIntent } from './runFeedbackRequestForIntent';
import { logger } from '../logger';

export const connection = new IORedis({
  host: process.env.REDIS_HOST ?? 'redis',
  port: Number(process.env.REDIS_PORT ?? 6379),
  retryStrategy: (times: number) => Math.min(500 + times * 250, 5000),
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
  connectTimeout: 5_000,
  lazyConnect: false,
  keepAlive: 10_000,
});

// Queue for feedback requests (sent after event ends)
export const feedbackQueue = new Queue('intent-feedback', { connection });

export type FeedbackRequestPayload = {
  intentId: string;
};

function buildJobId(intentId: string) {
  return `feedback-request:${intentId}`;
}

/**
 * Schedule feedback request to be sent 1 hour after event ends
 * @param intentId - Intent ID
 * @param endAt - Event end date
 */
export async function enqueueFeedbackRequest(intentId: string, endAt: Date) {
  const now = Date.now();
  const oneHourAfterEnd = new Date(endAt).getTime() + 60 * 60 * 1000; // 1 hour
  const delay = oneHourAfterEnd - now;

  if (delay <= 0) {
    logger.info(
      { intentId, endAt },
      '[enqueueFeedbackRequest] Event already ended, skipping.'
    );
    return;
  }

  logger.info(
    { intentId, endAt, delayMs: delay },
    '[enqueueFeedbackRequest] Scheduling feedback request...'
  );

  const opts: JobsOptions = {
    delay,
    attempts: 3,
    removeOnComplete: 1000,
    removeOnFail: 5000,
    jobId: buildJobId(intentId),
  };

  await feedbackQueue.add('send', { intentId }, opts);
  logger.info(
    { intentId },
    '[enqueueFeedbackRequest] Feedback request scheduled.'
  );
}

/**
 * Clear feedback request for an intent
 * @param intentId - Intent ID
 */
export async function clearFeedbackRequest(intentId: string) {
  logger.info({ intentId }, '[clearFeedbackRequest] Removing feedback job...');
  const jobId = buildJobId(intentId);
  const job = await feedbackQueue.getJob(jobId);

  if (job) {
    try {
      await job.remove();
      logger.info({ intentId, jobId }, '[clearFeedbackRequest] Job removed');
    } catch (e) {
      logger.warn(
        { err: e, intentId, jobId },
        '[clearFeedbackRequest] Remove failed'
      );
    }
  } else {
    logger.debug({ intentId, jobId }, '[clearFeedbackRequest] No job found');
  }
}

/**
 * Reschedule feedback request (e.g., when event endAt changes)
 * @param intentId - Intent ID
 * @param newEndAt - New event end date
 */
export async function rescheduleFeedbackRequest(
  intentId: string,
  newEndAt: Date
) {
  logger.info(
    { intentId, newEndAt },
    '[rescheduleFeedbackRequest] Rescheduling...'
  );
  await clearFeedbackRequest(intentId);
  await enqueueFeedbackRequest(intentId, newEndAt);
}

/**
 * Bootstrap the feedback worker
 */
export function bootstrapFeedbackWorker() {
  logger.info('🚀 Starting feedback worker...');

  const worker = new Worker<FeedbackRequestPayload>(
    'intent-feedback',
    async (job) => {
      const { intentId } = job.data;
      logger.info(
        { jobId: job.id, intentId },
        '[Worker] Executing feedback request job...'
      );
      try {
        await runFeedbackRequestForIntent(intentId);
        logger.info(
          { intentId },
          '[Worker] Feedback request sent successfully.'
        );
      } catch (err) {
        logger.error({ err, intentId }, '[Worker] Feedback request failed.');
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
