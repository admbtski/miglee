import {
  Queue,
  Worker,
  Job,
  QueueEvents,
  JobsOptions,
  WorkerOptions,
} from 'bullmq';
import { Redis } from 'ioredis';
import { config } from '../env';
import { createBullMQConnection, registerRedisConnection } from './redis';
import { logger } from './pino';
import { injectTraceContext, wrapJobProcessor } from '@appname/observability';

/**
 * Production-ready BullMQ configuration
 * Centralized queue management with retry policies, dead-letter queues, and monitoring
 */

// =============================================================================
// Configuration
// =============================================================================

export const BULLMQ_CONFIG = {
  // Default job options
  defaultJobOptions: {
    // Number of retry attempts
    attempts: config.isProduction ? 3 : 5,

    // Backoff strategy
    backoff: {
      type: 'exponential' as const,
      delay: config.isProduction ? 5000 : 1000, // 5s prod, 1s dev
    },

    // Remove completed jobs after N jobs
    removeOnComplete: {
      count: config.isProduction ? 100 : 1000,
      age: 24 * 60 * 60, // 24 hours
    },

    // Keep failed jobs for inspection
    removeOnFail: {
      count: config.isProduction ? 500 : 5000,
      age: 7 * 24 * 60 * 60, // 7 days
    },
  },

  // Worker options
  workerOptions: {
    // Concurrency - how many jobs to process in parallel
    concurrency: config.isProduction ? 5 : 2,

    // Lock duration - how long a job can run before considered stalled
    lockDuration: 30000, // 30 seconds

    // Stalled job check interval
    stalledInterval: 30000, // 30 seconds

    // Max stalled count before moving to failed
    maxStalledCount: 2,

    // Use sandboxed processors for isolation
    useWorkerThreads: false,
  },

  // Dead-letter queue suffix
  deadLetterSuffix: '-dlq',
};

// =============================================================================
// Queue Registry
// =============================================================================

interface QueueInfo {
  queue: Queue;
  connection: Redis;
  events?: QueueEvents;
  worker?: Worker;
}

const queueRegistry = new Map<string, QueueInfo>();

// =============================================================================
// Queue Factory
// =============================================================================

/**
 * Create or get a BullMQ queue with production-ready configuration
 */
export function getQueue<T = unknown>(
  name: string,
  options: {
    createDeadLetterQueue?: boolean;
    defaultJobOptions?: Partial<JobsOptions>;
  } = {}
): Queue<T> {
  const existing = queueRegistry.get(name);
  if (existing) {
    return existing.queue as Queue<T>;
  }

  const connection = createBullMQConnection(name);
  registerRedisConnection(connection);

  const queue = new Queue<T>(name, {
    connection,
    defaultJobOptions: {
      ...BULLMQ_CONFIG.defaultJobOptions,
      ...options.defaultJobOptions,
    },
  });

  // Create dead-letter queue if requested
  if (options.createDeadLetterQueue !== false) {
    const dlqName = `${name}${BULLMQ_CONFIG.deadLetterSuffix}`;
    const dlqConnection = createBullMQConnection(dlqName);
    registerRedisConnection(dlqConnection);

    const dlq = new Queue(dlqName, {
      connection: dlqConnection,
      defaultJobOptions: {
        removeOnComplete: false, // Keep for inspection
        removeOnFail: false,
      },
    });

    queueRegistry.set(dlqName, { queue: dlq, connection: dlqConnection });
  }

  // Create queue events for monitoring
  const eventsConnection = createBullMQConnection(`${name}-events`);
  registerRedisConnection(eventsConnection);

  const events = new QueueEvents(name, { connection: eventsConnection });

  // Log queue events
  events.on('completed', ({ jobId, returnvalue }) => {
    logger.debug({ queue: name, jobId, returnvalue }, 'Job completed');
  });

  events.on('failed', ({ jobId, failedReason }) => {
    logger.error({ queue: name, jobId, failedReason }, 'Job failed');
  });

  events.on('stalled', ({ jobId }) => {
    logger.warn({ queue: name, jobId }, 'Job stalled');
  });

  events.on('progress', ({ jobId, data }) => {
    logger.debug({ queue: name, jobId, progress: data }, 'Job progress');
  });

  queueRegistry.set(name, { queue, connection, events });

  logger.info({ queue: name }, 'BullMQ queue created');

  return queue;
}

/**
 * Add a job to the queue with automatic trace context injection
 * 
 * @example
 * ```ts
 * await addJobWithTrace(queue, 'send-email', { email: 'user@example.com' });
 * ```
 */
export async function addJobWithTrace<T extends Record<string, unknown>>(
  queue: Queue<T>,
  jobName: string,
  data: T,
  options?: JobsOptions
) {
  const dataWithTrace = injectTraceContext(data);
  return queue.add(jobName, dataWithTrace, options);
}

// =============================================================================
// Worker Factory
// =============================================================================

/**
 * Create a BullMQ worker with production-ready configuration
 * 
 * Automatically wraps processor with OTel tracing for end-to-end correlation.
 */
export function createWorker<T = unknown>(
  queueName: string,
  processor: (job: Job<T>) => Promise<unknown>,
  options: Partial<WorkerOptions> = {}
): Worker<T> {
  const connection = createBullMQConnection(`${queueName}-worker`);
  registerRedisConnection(connection);

  // Wrap processor with OTel tracing
  const tracedProcessor = wrapJobProcessor(processor);

  const worker = new Worker<T>(
    queueName,
    async (job) => {
      const startTime = Date.now();

      try {
        logger.info(
          {
            queue: queueName,
            jobId: job.id,
            jobName: job.name,
            attempt: job.attemptsMade + 1,
          },
          'Processing job'
        );

        const result = await tracedProcessor(job);

        logger.info(
          {
            queue: queueName,
            jobId: job.id,
            durationMs: Date.now() - startTime,
          },
          'Job completed'
        );

        return result;
      } catch (error) {
        const isLastAttempt =
          job.attemptsMade + 1 >=
          (job.opts.attempts ?? BULLMQ_CONFIG.defaultJobOptions.attempts);

        logger.error(
          {
            queue: queueName,
            jobId: job.id,
            attempt: job.attemptsMade + 1,
            maxAttempts: job.opts.attempts,
            isLastAttempt,
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
          },
          isLastAttempt ? 'Job failed permanently' : 'Job failed, will retry'
        );

        // Move to dead-letter queue on last attempt
        if (isLastAttempt) {
          await moveToDeadLetter(queueName, job, error);
        }

        throw error;
      }
    },
    {
      connection,
      ...BULLMQ_CONFIG.workerOptions,
      ...options,
    }
  );

  // Worker event logging
  worker.on('ready', () => {
    logger.info({ queue: queueName }, 'Worker ready');
  });

  worker.on('error', (err) => {
    logger.error({ queue: queueName, err }, 'Worker error');
  });

  worker.on('stalled', (jobId) => {
    logger.warn({ queue: queueName, jobId }, 'Job stalled');
  });

  worker.on('closing', () => {
    logger.info({ queue: queueName }, 'Worker closing');
  });

  worker.on('closed', () => {
    logger.info({ queue: queueName }, 'Worker closed');
  });

  // Register worker with queue
  const queueInfo = queueRegistry.get(queueName);
  if (queueInfo) {
    queueInfo.worker = worker;
  }

  logger.info({ queue: queueName }, 'BullMQ worker created');

  return worker;
}

// =============================================================================
// Dead Letter Queue Handling
// =============================================================================

/**
 * Move a failed job to the dead-letter queue
 */
async function moveToDeadLetter<T>(
  queueName: string,
  job: Job<T>,
  error: unknown
): Promise<void> {
  const dlqName = `${queueName}${BULLMQ_CONFIG.deadLetterSuffix}`;
  const dlqInfo = queueRegistry.get(dlqName);

  if (!dlqInfo) {
    logger.warn(
      { queue: queueName, jobId: job.id },
      'No dead-letter queue found'
    );
    return;
  }

  try {
    await dlqInfo.queue.add(
      'failed-job',
      {
        originalQueue: queueName,
        originalJobId: job.id,
        originalJobName: job.name,
        data: job.data,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        attemptsMade: job.attemptsMade,
        failedAt: new Date().toISOString(),
      },
      {
        removeOnComplete: false,
        removeOnFail: false,
      }
    );

    logger.info(
      { queue: queueName, dlq: dlqName, jobId: job.id },
      'Job moved to dead-letter queue'
    );
  } catch (dlqError) {
    logger.error(
      { queue: queueName, jobId: job.id, err: dlqError },
      'Failed to move job to dead-letter queue'
    );
  }
}

// =============================================================================
// Queue Inspection Helpers
// =============================================================================

export interface QueueStats {
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: number;
}

/**
 * Get stats for all registered queues
 */
export async function getAllQueueStats(): Promise<QueueStats[]> {
  const stats: QueueStats[] = [];

  for (const [name, info] of queueRegistry) {
    try {
      const counts = await info.queue.getJobCounts();
      stats.push({
        name,
        waiting: counts.waiting ?? 0,
        active: counts.active ?? 0,
        completed: counts.completed ?? 0,
        failed: counts.failed ?? 0,
        delayed: counts.delayed ?? 0,
        paused: counts.paused ?? 0,
      });
    } catch (error) {
      logger.error({ queue: name, err: error }, 'Failed to get queue stats');
    }
  }

  return stats;
}

/**
 * Get failed jobs from a queue
 */
export async function getFailedJobs(
  queueName: string,
  start = 0,
  end = 20
): Promise<Job[]> {
  const queueInfo = queueRegistry.get(queueName);
  if (!queueInfo) return [];

  return queueInfo.queue.getFailed(start, end);
}

/**
 * Retry a failed job
 */
export async function retryJob(
  queueName: string,
  jobId: string
): Promise<void> {
  const queueInfo = queueRegistry.get(queueName);
  if (!queueInfo) {
    throw new Error(`Queue ${queueName} not found`);
  }

  const job = await queueInfo.queue.getJob(jobId);
  if (!job) {
    throw new Error(`Job ${jobId} not found`);
  }

  await job.retry();
  logger.info({ queue: queueName, jobId }, 'Job retried');
}

/**
 * Retry all failed jobs in dead-letter queue
 */
export async function reprocessDeadLetterQueue(
  queueName: string
): Promise<number> {
  const dlqName = `${queueName}${BULLMQ_CONFIG.deadLetterSuffix}`;
  const dlqInfo = queueRegistry.get(dlqName);
  const mainQueueInfo = queueRegistry.get(queueName);

  if (!dlqInfo || !mainQueueInfo) {
    throw new Error(`Queues not found for ${queueName}`);
  }

  const failedJobs = await dlqInfo.queue.getJobs([
    'waiting',
    'active',
    'delayed',
  ]);
  let reprocessed = 0;

  for (const job of failedJobs) {
    try {
      const data = job.data as { data: unknown; originalJobName: string };
      await mainQueueInfo.queue.add(data.originalJobName, data.data, {
        ...BULLMQ_CONFIG.defaultJobOptions,
        attempts: 1, // Single retry attempt for reprocessed jobs
      });
      await job.remove();
      reprocessed++;
    } catch (error) {
      logger.error(
        { queue: queueName, jobId: job.id, err: error },
        'Failed to reprocess DLQ job'
      );
    }
  }

  logger.info(
    { queue: queueName, reprocessed },
    'Dead-letter queue reprocessed'
  );
  return reprocessed;
}

// =============================================================================
// Graceful Shutdown
// =============================================================================

/**
 * Close all workers and queues gracefully
 */
export async function closeAllQueues(): Promise<void> {
  logger.info('Closing all BullMQ queues and workers...');

  const closePromises: Promise<void>[] = [];

  for (const [name, info] of queueRegistry) {
    // Close worker first
    if (info.worker) {
      closePromises.push(
        info.worker.close().catch((err) => {
          logger.error({ queue: name, err }, 'Error closing worker');
        })
      );
    }

    // Close events
    if (info.events) {
      closePromises.push(
        info.events.close().catch((err) => {
          logger.error({ queue: name, err }, 'Error closing queue events');
        })
      );
    }

    // Close queue
    closePromises.push(
      info.queue.close().catch((err) => {
        logger.error({ queue: name, err }, 'Error closing queue');
      })
    );
  }

  await Promise.allSettled(closePromises);
  logger.info('All BullMQ queues closed');
}
