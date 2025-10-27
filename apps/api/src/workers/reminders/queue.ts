import { Queue, Worker, JobsOptions } from 'bullmq';
import IORedis from 'ioredis';
import { runReminderForIntent } from './runReminderForIntent';
import { logger } from '../logger';

export const connection = new IORedis({
  host: process.env.REDIS_HOST ?? 'redis',
  port: Number(process.env.REDIS_PORT ?? 6379),
  //  password: process.env.REDIS_PASSWORD,

  retryStrategy: (times: number) => Math.min(500 + times * 250, 5000),
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
  connectTimeout: 5_000,
  lazyConnect: false,
  keepAlive: 10_000,

  // tls: {}                       // if rediss://
});

// Jedna kolejka dla wszystkich przypomnień
export const remindersQueue = new Queue('intent-reminders', { connection });

/** Buckety (w minutach): 24h, 12h, 6h, 3h, 1h, 30m, 15m */
export const BUCKETS_MIN = [
  24 * 60,
  12 * 60,
  6 * 60,
  3 * 60,
  60,
  30,
  15,
  10,
  9,
  8,
  7,
  6,
  5,
  4,
  3,
  2,
  1,
] as const;

export type ReminderPayload = {
  intentId: string;
  minutesBefore: number;
};

function buildJobId(intentId: string, minutesBefore: number) {
  return `reminder:${minutesBefore}m:${intentId}`;
}

/** Dodaje wszystkie przypomnienia dla Intentu (pomiń przeszłość/za bliskie) */
export async function enqueueReminders(intentId: string, startAt: Date) {
  const now = Date.now();
  logger.info(
    { intentId, startAt },
    '[enqueueReminders] Scheduling reminders...'
  );

  let added = 0;
  for (const minutesBefore of BUCKETS_MIN) {
    const runAt = new Date(startAt).getTime() - minutesBefore * 60 * 1000;
    const delay = runAt - now;
    if (delay <= 5000) continue;

    const opts: JobsOptions = {
      delay,
      attempts: 3,
      removeOnComplete: 1000,
      removeOnFail: 5000,
      jobId: buildJobId(intentId, minutesBefore),
    };

    await remindersQueue.add('send', { intentId, minutesBefore }, opts);
    added++;
    logger.debug(
      { intentId, minutesBefore, delay },
      '[enqueueReminders] Added job'
    );
  }

  logger.info({ intentId, added }, '[enqueueReminders] Done.');
}

/** Czyści wszystkie przypomnienia */
export async function clearReminders(intentId: string) {
  logger.info({ intentId }, '[clearReminders] Removing existing jobs...');
  let removed = 0;
  for (const minutesBefore of BUCKETS_MIN) {
    const jobId = buildJobId(intentId, minutesBefore);
    const job = await remindersQueue.getJob(jobId);
    if (job) {
      try {
        await job.remove();
        removed++;
        logger.debug({ intentId, jobId }, '[clearReminders] Job removed');
      } catch (e) {
        logger.warn(
          { err: e, intentId, jobId },
          '[clearReminders] Remove failed'
        );
      }
    }
  }
  logger.info({ intentId, removed }, '[clearReminders] Done.');
}

/** Przebudowuje przypomnienia po zmianie startAt */
export async function rescheduleReminders(intentId: string, newStartAt: Date) {
  logger.info(
    { intentId, newStartAt },
    '[rescheduleReminders] Rescheduling...'
  );
  await clearReminders(intentId);
  await enqueueReminders(intentId, newStartAt);
}

/** Worker (uruchamiany osobno) */
export function bootstrapRemindersWorker() {
  logger.info('🚀 Starting reminders worker...');

  const worker = new Worker<ReminderPayload>(
    'intent-reminders',
    async (job) => {
      const { intentId, minutesBefore } = job.data;
      logger.info(
        { jobId: job.id, intentId, minutesBefore },
        '[Worker] Executing reminder job...'
      );
      try {
        await runReminderForIntent(intentId, minutesBefore);
        logger.info(
          { intentId, minutesBefore },
          '[Worker] Reminder sent successfully.'
        );
      } catch (err) {
        logger.error(
          { err, intentId, minutesBefore },
          '[Worker] Reminder failed.'
        );
        throw err;
      }
    },
    { connection }
  );

  worker.on('ready', () =>
    logger.info('✅ Worker ready, listening for jobs...')
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
