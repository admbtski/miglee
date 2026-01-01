import { JobsOptions } from 'bullmq';
import { getQueue, createWorker, BULLMQ_CONFIG, addJobWithTrace } from '../../lib/bullmq';
import { runAuditLogArchive } from './run-audit-archive';
import { logger } from '../logger';
import { config } from '../../env';

/**
 * Audit Log Archive Queue
 *
 * Archives and deletes audit logs for events that have ended.
 * - Production: 30 days after event ends
 * - Development: 30 minutes after event ends
 */

// Queue name
const QUEUE_NAME = 'audit-archive';

// Job payload type
export type AuditArchivePayload = {
  eventId: string;
};

// Get the queue (creates if not exists)
export const auditArchiveQueue = getQueue<AuditArchivePayload>(QUEUE_NAME, {
  createDeadLetterQueue: true,
});

// =============================================================================
// Job ID Builder
// =============================================================================

function buildJobId(eventId: string) {
  return `audit-archive-${eventId}`;
}

// =============================================================================
// Retention Constants
// =============================================================================

/**
 * Get retention delay in milliseconds
 * - Production: 30 days
 * - Development: 30 minutes
 */
function getRetentionDelayMs(): number {
  if (config.isProduction) {
    return 30 * 24 * 60 * 60 * 1000; // 30 days
  }
  return 30 * 60 * 1000; // 30 minutes for dev
}

// =============================================================================
// Queue Operations
// =============================================================================

/**
 * Schedule audit log archival after event ends
 * @param eventId - Event ID
 * @param endAt - Event end date
 */
export async function enqueueAuditArchive(eventId: string, endAt: Date) {
  const retentionDelay = getRetentionDelayMs();
  const now = Date.now();
  const runAt = new Date(endAt).getTime() + retentionDelay;
  const delay = runAt - now;

  if (delay <= 0) {
    // Event already ended and retention period passed - archive immediately
    logger.info(
      { eventId, endAt },
      '[enqueueAuditArchive] Retention period passed, archiving immediately.'
    );
    await addJobWithTrace(
      auditArchiveQueue,
      'archive',
      { eventId },
      { jobId: `${buildJobId(eventId)}-immediate-${Date.now()}` }
    );
    return;
  }

  logger.info(
    { eventId, endAt, delayMs: delay, retentionDays: retentionDelay / (24 * 60 * 60 * 1000) },
    '[enqueueAuditArchive] Scheduling audit archive...'
  );

  const opts: JobsOptions = {
    delay,
    jobId: buildJobId(eventId),
  };

  await addJobWithTrace(auditArchiveQueue, 'archive', { eventId }, opts);
  logger.info(
    { eventId },
    '[enqueueAuditArchive] Audit archive scheduled.'
  );
}

/**
 * Archive audit logs immediately (manual trigger)
 * @param eventId - Event ID
 */
export async function enqueueAuditArchiveNow(eventId: string) {
  logger.info(
    { eventId },
    '[enqueueAuditArchiveNow] Queueing immediate audit archive...'
  );

  const opts: JobsOptions = {
    jobId: `${buildJobId(eventId)}-manual-${Date.now()}`,
  };

  await addJobWithTrace(auditArchiveQueue, 'archive', { eventId }, opts);
  logger.info(
    { eventId },
    '[enqueueAuditArchiveNow] Immediate audit archive queued.'
  );
}

/**
 * Clear scheduled audit archive for an event
 * @param eventId - Event ID
 */
export async function clearAuditArchive(eventId: string) {
  logger.info({ eventId }, '[clearAuditArchive] Removing archive job...');
  const jobId = buildJobId(eventId);
  const job = await auditArchiveQueue.getJob(jobId);

  if (job) {
    try {
      await job.remove();
      logger.info({ eventId, jobId }, '[clearAuditArchive] Job removed');
    } catch (e) {
      logger.warn(
        { err: e, eventId, jobId },
        '[clearAuditArchive] Remove failed'
      );
    }
  } else {
    logger.debug({ eventId, jobId }, '[clearAuditArchive] No job found');
  }
}

/**
 * Reschedule audit archive (e.g., when event endAt changes)
 * @param eventId - Event ID
 * @param newEndAt - New event end date
 */
export async function rescheduleAuditArchive(
  eventId: string,
  newEndAt: Date
) {
  logger.info(
    { eventId, newEndAt },
    '[rescheduleAuditArchive] Rescheduling...'
  );
  await clearAuditArchive(eventId);
  await enqueueAuditArchive(eventId, newEndAt);
}

// =============================================================================
// Worker Bootstrap
// =============================================================================

/**
 * Bootstrap the audit archive worker
 * Should be called from a separate worker process
 */
export function bootstrapAuditArchiveWorker() {
  logger.info('🚀 Starting audit archive worker...');

  const worker = createWorker<AuditArchivePayload>(
    QUEUE_NAME,
    async (job) => {
      const { eventId } = job.data;
      await runAuditLogArchive(eventId);
      return { success: true, eventId };
    },
    {
      concurrency: BULLMQ_CONFIG.workerOptions.concurrency,
    }
  );

  logger.info('🎯 Audit archive worker bootstrap complete.');

  return worker;
}

