import { JobsOptions } from 'bullmq';
import { getQueue, createWorker, BULLMQ_CONFIG, addJobWithTrace } from '../../lib/bullmq';
import { runReminderForEvent } from './runReminderForEvent';
import { logger } from '../logger';

/**
 * Event Reminders Queue
 * Sends reminder notifications before an event starts
 */

// Queue name
const QUEUE_NAME = 'event-reminders';

// Job payload type
export type ReminderPayload = {
  eventId: string;
  minutesBefore: number;
};

// Get the queue (creates if not exists)
export const remindersQueue = getQueue<ReminderPayload>(QUEUE_NAME, {
  createDeadLetterQueue: true,
});

// =============================================================================
// Reminder Buckets
// =============================================================================

/** Reminder buckets (in minutes): 24h, 12h, 6h, 3h, 1h, 30m, 15m */
export const BUCKETS_MIN = [
  24 * 60, // 24 hours
  12 * 60, // 12 hours
  6 * 60, // 6 hours
  3 * 60, // 3 hours
  60, // 1 hour
  30, // 30 minutes
  15, // 15 minutes
] as const;

// =============================================================================
// Job ID Builder
// =============================================================================

function buildJobId(eventId: string, minutesBefore: number) {
  return `reminder:${minutesBefore}m:${eventId}`;
}

// =============================================================================
// Queue Operations
// =============================================================================

/**
 * Schedule all reminders for an event
 * Skips reminders that are already in the past or too close
 * @param eventId - Event ID
 * @param startAt - Event start date
 */
export async function enqueueReminders(eventId: string, startAt: Date) {
  const now = Date.now();
  logger.info(
    { eventId, startAt },
    '[enqueueReminders] Scheduling reminders...'
  );

  let added = 0;
  for (const minutesBefore of BUCKETS_MIN) {
    const runAt = new Date(startAt).getTime() - minutesBefore * 60 * 1000;
    const delay = runAt - now;

    // Skip if reminder would fire in less than 5 seconds
    if (delay <= 5000) continue;

    const opts: JobsOptions = {
      delay,
      jobId: buildJobId(eventId, minutesBefore),
    };

    await addJobWithTrace(remindersQueue, 'send', { eventId, minutesBefore }, opts);
    added++;
    logger.debug(
      { eventId, minutesBefore, delay },
      '[enqueueReminders] Added job'
    );
  }

  logger.info({ eventId, added }, '[enqueueReminders] Done.');
}

/**
 * Clear all scheduled reminders for an event
 * @param eventId - Event ID
 */
export async function clearReminders(eventId: string) {
  logger.info({ eventId }, '[clearReminders] Removing existing jobs...');
  let removed = 0;

  for (const minutesBefore of BUCKETS_MIN) {
    const jobId = buildJobId(eventId, minutesBefore);
    const job = await remindersQueue.getJob(jobId);

    if (job) {
      try {
        await job.remove();
        removed++;
        logger.debug({ eventId, jobId }, '[clearReminders] Job removed');
      } catch (e) {
        logger.warn(
          { err: e, eventId, jobId },
          '[clearReminders] Remove failed'
        );
      }
    }
  }

  logger.info({ eventId, removed }, '[clearReminders] Done.');
}

/**
 * Reschedule all reminders for an event (when startAt changes)
 * @param eventId - Event ID
 * @param newStartAt - New event start date
 */
export async function rescheduleReminders(eventId: string, newStartAt: Date) {
  logger.info({ eventId, newStartAt }, '[rescheduleReminders] Rescheduling...');
  await clearReminders(eventId);
  await enqueueReminders(eventId, newStartAt);
}

// =============================================================================
// Worker Bootstrap
// =============================================================================

/**
 * Bootstrap the reminders worker
 * Should be called from a separate worker process
 */
export function bootstrapRemindersWorker() {
  logger.info('🚀 Starting reminders worker...');

  const worker = createWorker<ReminderPayload>(
    QUEUE_NAME,
    async (job) => {
      const { eventId, minutesBefore } = job.data;
      await runReminderForEvent(eventId, minutesBefore);
      return { success: true, eventId, minutesBefore };
    },
    {
      concurrency: BULLMQ_CONFIG.workerOptions.concurrency,
    }
  );

  logger.info('🎯 Reminders worker bootstrap complete.');

  return worker;
}
