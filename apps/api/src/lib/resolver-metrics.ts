import { logger } from './pino';

export function resolverWithMetrics<TArgs extends any[], TResult>(
  type: string,
  field: string,
  fn: (...args: TArgs) => Promise<TResult> | TResult
): (...args: TArgs) => Promise<TResult> {
  return async (...args: TArgs) => {
    const labels = { type, field };
    const t0 = process.hrtime.bigint();

    try {
      return await fn(...args);
    } catch (e) {
      throw e;
    } finally {
      const durS = Number(process.hrtime.bigint() - t0) / 1e9;
      logger.debug(
        {
          type: labels.type,
          field: labels.field,
          durationMs: Math.round(durS * 1000),
        },
        'GQL resolver completed'
      );
    }
  };
}
