import opentelemetry from '@opentelemetry/api';
import { Prisma, PrismaClient } from '@prisma/client';
import { config } from '../env';
import { logger } from './pino';

/**
 * Production-ready Prisma Client configuration
 * Includes connection pooling, timeouts, and metrics
 */

const meter = opentelemetry.metrics.getMeter('api');

const dbTotal = meter.createCounter('db_queries_total', {
  description: 'DB queries',
});

const dbDur = meter.createHistogram('db_query_duration_seconds');

const dbErrors = meter.createCounter('db_query_errors_total', {
  description: 'Prisma errors with codes P20xx',
});

const dbSlowQueries = meter.createCounter('db_slow_queries_total', {
  description: 'Queries exceeding slow query threshold',
});

// =============================================================================
// Configuration
// =============================================================================

// Connection pool settings
const CONNECTION_POOL = {
  // Max connections - adjust based on your Postgres max_connections
  // Rule: (max_connections - 10) / number_of_instances
  // Default Postgres: 100, so with 2 instances: (100-10)/2 = 45
  connectionLimit: config.isProduction ? 20 : 10,

  // Connection timeout (how long to wait for a connection from pool)
  poolTimeout: config.isProduction ? 10 : 30, // seconds
};

// Query timeouts
const QUERY_TIMEOUTS = {
  // Statement timeout - max query execution time
  // Prevents runaway queries from blocking the database
  statementTimeout: config.isProduction ? 30000 : 60000, // 30s prod, 60s dev

  // Transaction timeout - max time for interactive transactions
  transactionTimeout: config.isProduction ? 30000 : 60000, // 30s prod, 60s dev

  // Slow query threshold for logging/metrics
  slowQueryThreshold: config.isProduction ? 1000 : 5000, // 1s prod, 5s dev
};

// =============================================================================
// Database URL with connection parameters
// =============================================================================

/**
 * Build database URL with connection pool and timeout parameters
 * These are passed via the connection string to PostgreSQL
 */
function buildDatabaseUrl(): string {
  const baseUrl = config.dbUrl;

  // Parse existing URL to check if it already has params
  const hasParams = baseUrl.includes('?');
  const separator = hasParams ? '&' : '?';

  // Add connection pool and timeout params
  const params = new URLSearchParams({
    connection_limit: String(CONNECTION_POOL.connectionLimit),
    pool_timeout: String(CONNECTION_POOL.poolTimeout),
    // PostgreSQL statement_timeout (in milliseconds)
    statement_timeout: String(QUERY_TIMEOUTS.statementTimeout),
    // Lock timeout to prevent deadlock waits
    lock_timeout: String(Math.floor(QUERY_TIMEOUTS.statementTimeout / 2)),
  });

  return `${baseUrl}${separator}${params.toString()}`;
}

// =============================================================================
// Prisma Client Factory
// =============================================================================

function createPrismaClient() {
  const databaseUrl = buildDatabaseUrl();

  logger.info(
    {
      connectionLimit: CONNECTION_POOL.connectionLimit,
      poolTimeout: CONNECTION_POOL.poolTimeout,
      statementTimeout: QUERY_TIMEOUTS.statementTimeout,
      transactionTimeout: QUERY_TIMEOUTS.transactionTimeout,
      slowQueryThreshold: QUERY_TIMEOUTS.slowQueryThreshold,
    },
    'Initializing Prisma client with connection settings'
  );

  const base = new PrismaClient({
    datasourceUrl: databaseUrl,
    log: config.isProduction
      ? [
          { level: 'error', emit: 'event' },
          { level: 'warn', emit: 'event' },
        ]
      : [
          { level: 'query', emit: 'event' },
          { level: 'info', emit: 'event' },
          { level: 'warn', emit: 'event' },
          { level: 'error', emit: 'event' },
        ],
    // Transaction options
    transactionOptions: {
      maxWait: 5000, // Max time to wait for transaction to start (5s)
      timeout: QUERY_TIMEOUTS.transactionTimeout, // Max transaction duration
      isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
    },
  });

  // Log events in development
  if (config.isDevelopment) {
    base.$on('query' as never, (e: { query: string; duration: number }) => {
      if (e.duration > QUERY_TIMEOUTS.slowQueryThreshold) {
        logger.warn(
          { query: e.query, duration: e.duration },
          'Slow query detected'
        );
      }
    });
  }

  base.$on('error' as never, (e: { message: string }) => {
    logger.error({ error: e.message }, 'Prisma error');
  });

  base.$on('warn' as never, (e: { message: string }) => {
    logger.warn({ warning: e.message }, 'Prisma warning');
  });

  // Extension with metrics and timeout handling
  return base.$extends({
    name: 'metrics-and-timeouts',
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const t0 = process.hrtime.bigint();
          let outcome: 'ok' | 'error' | 'timeout' = 'ok';
          let errorCode: string | undefined;

          try {
            const result = await query(args);
            return result;
          } catch (e) {
            outcome = 'error';

            if (e instanceof Prisma.PrismaClientKnownRequestError) {
              errorCode = e.code;

              // P2024 = query timeout
              if (e.code === 'P2024') {
                outcome = 'timeout';
                logger.error(
                  { model, operation, code: e.code },
                  'Query timeout - statement exceeded maximum execution time'
                );
              }
            }

            // Check for PostgreSQL timeout errors
            if (e instanceof Error) {
              const message = e.message.toLowerCase();
              if (
                message.includes('statement timeout') ||
                message.includes('canceling statement due to statement timeout')
              ) {
                outcome = 'timeout';
                logger.error(
                  { model, operation },
                  'PostgreSQL statement timeout'
                );
              }
            }

            throw e;
          } finally {
            const durMs = Number(process.hrtime.bigint() - t0) / 1e6;
            const durS = durMs / 1000;
            const labels = { model, action: operation, outcome };

            dbTotal.add(1, labels);
            dbDur.record(durS, labels);

            // Track slow queries
            if (durMs > QUERY_TIMEOUTS.slowQueryThreshold) {
              dbSlowQueries.add(1, { model, action: operation });

              if (config.isProduction) {
                logger.warn(
                  { model, operation, durationMs: Math.round(durMs) },
                  'Slow query detected'
                );
              }
            }

            if (outcome === 'error' || outcome === 'timeout') {
              dbErrors.add(1, {
                model,
                action: operation,
                code: errorCode ?? (outcome === 'timeout' ? 'TIMEOUT' : 'UNKNOWN'),
              });
            }
          }
        },
      },
    },
  });
}

export type ExtendedPrismaClient = ReturnType<typeof createPrismaClient>;

declare global {
  // eslint-disable-next-line no-var
  var prisma: ExtendedPrismaClient | undefined;
}

export const prisma: ExtendedPrismaClient =
  global.prisma ?? createPrismaClient();

if (!config.isProduction) {
  global.prisma = prisma;
}

// =============================================================================
// Health Check Helper
// =============================================================================

/**
 * Check database connectivity with timeout
 */
export async function checkDatabaseHealth(timeoutMs = 5000): Promise<{
  status: 'ok' | 'fail';
  latency?: number;
  error?: string;
}> {
  const start = Date.now();

  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Health check timeout')), timeoutMs)
      ),
    ]);

    return {
      status: 'ok',
      latency: Date.now() - start,
    };
  } catch (error) {
    return {
      status: 'fail',
      latency: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// =============================================================================
// Graceful Shutdown Helper
// =============================================================================

/**
 * Disconnect Prisma client gracefully
 * Called by graceful-shutdown plugin
 */
export async function disconnectPrisma(): Promise<void> {
  logger.info('Disconnecting Prisma client...');
  await prisma.$disconnect();
  logger.info('Prisma client disconnected');
}
