import opentelemetry from '@opentelemetry/api';
import { Prisma, PrismaClient } from '@prisma/client';
import { config } from '../env';

const meter = opentelemetry.metrics.getMeter('api');

const dbTotal = meter.createCounter('db_queries_total', {
  description: 'DB queries',
});

const dbDur = meter.createHistogram('db_query_duration_seconds');

const dbErrors = meter.createCounter('db_query_errors_total', {
  description: 'Błędy Prisma z kodami P20xx',
});

function createPrismaClient() {
  const base = new PrismaClient({
    log: config.isProduction ? [] : ['query', 'info', 'warn', 'error'],
  });

  // Rozszerzenie z metrykami
  return base.$extends({
    name: 'metrics',
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const t0 = process.hrtime.bigint();
          let outcome: 'ok' | 'error' = 'ok';
          let errorCode: string | undefined;

          try {
            const result = await query(args);
            return result;
          } catch (e) {
            outcome = 'error';
            if (e instanceof Prisma.PrismaClientKnownRequestError) {
              errorCode = e.code; // np. P2002, P2025
            }
            throw e;
          } finally {
            const durS = Number(process.hrtime.bigint() - t0) / 1e9;
            const labels = { model, action: operation, outcome };
            dbTotal.add(1, labels);
            dbDur.record(durS, labels);

            if (outcome === 'error') {
              dbErrors.add(1, {
                model,
                action: operation,
                code: errorCode ?? 'UNKNOWN',
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
