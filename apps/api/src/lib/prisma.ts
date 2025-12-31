import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { config } from '../env';
import { Prisma, PrismaClient } from '../prisma-client/client';
import { logger } from './pino';

// Extend globalThis to include prisma for dev hot-reload caching
declare global {
  // eslint-disable-next-line no-var
  var prisma: ReturnType<typeof createPrismaClient> | undefined;
  // eslint-disable-next-line no-var
  var pgPool: pg.Pool | undefined;
}

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
// PostgreSQL Pool
// =============================================================================

/**
 * Create PostgreSQL connection pool with proper settings
 */
function createPgPool(): pg.Pool {
  const pool = new pg.Pool({
    connectionString: config.dbUrl,
    max: CONNECTION_POOL.connectionLimit,
    idleTimeoutMillis: CONNECTION_POOL.poolTimeout * 1000,
    connectionTimeoutMillis: 10000,
    statement_timeout: QUERY_TIMEOUTS.statementTimeout,
    lock_timeout: Math.floor(QUERY_TIMEOUTS.statementTimeout / 2),
  });

  // Handle pool errors
  pool.on('error', (err) => {
    logger.error({ err }, 'Unexpected PostgreSQL pool error');
  });

  return pool;
}

// =============================================================================
// Prisma Client Factory
// =============================================================================

function createPrismaClient() {
  // Get or create pg pool
  const pool = global.pgPool ?? createPgPool();
  if (!config.isProduction) {
    global.pgPool = pool;
  }

  // Create Prisma adapter
  const adapter = new PrismaPg(pool);

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
    adapter,
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
          // Track error code for potential future metrics
          let errorCode: string | undefined = undefined;

          try {
            const result = await query(args);
            return result;
          } catch (e) {
            outcome = 'error';

            if (e instanceof Prisma.PrismaClientKnownRequestError) {
              errorCode = e.code;
              void errorCode; // Reserved for OTel metrics

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
            // Reserved for future OTel metrics: durS, labels
            void outcome;

            // Track slow queries
            if (durMs > QUERY_TIMEOUTS.slowQueryThreshold) {
              if (config.isProduction) {
                logger.warn(
                  { model, operation, durationMs: Math.round(durMs) },
                  'Slow query detected'
                );
              }
            }

            if (outcome === 'error' || outcome === 'timeout') {
            }
          }
        },
      },
    },
  });
}

export type ExtendedPrismaClient = ReturnType<typeof createPrismaClient>;

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
