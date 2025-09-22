// resolvers/index.ts
import opentelemetry from '@opentelemetry/api';

// ====== METRYKI GQL RESOLVERÓW ======
const meter = opentelemetry.metrics.getMeter('api');

// Histogram czasu (sekundy). Buckety ustaw w MeterProvider.views (OTel v2).
const gqlResolverDur = meter.createHistogram(
  'graphql_resolver_duration_seconds'
);

const gqlActive = meter.createUpDownCounter('graphql_resolver_active', {
  description: 'Concurrent resolver executions',
});

const gqlTotal = meter.createCounter('graphql_resolver_total', {
  description: 'Total resolver calls',
});

const gqlErrors = meter.createCounter('graphql_resolver_errors_total', {
  description: 'Resolver errors',
});

export function resolverWithMetrics<TArgs extends any[], TResult>(
  type: string,
  field: string,
  fn: (...args: TArgs) => Promise<TResult> | TResult
): (...args: TArgs) => Promise<TResult> {
  return async (...args: TArgs) => {
    const labels = { type, field };
    const t0 = process.hrtime.bigint();

    gqlActive.add(1, labels);
    gqlTotal.add(1, labels);

    try {
      return await fn(...args);
    } catch (e) {
      gqlErrors.add(1, labels);
      throw e;
    } finally {
      const durS = Number(process.hrtime.bigint() - t0) / 1e9;
      gqlResolverDur.record(durS, labels);
      gqlActive.add(-1, labels);
      console.log(
        '[GQL] %s.%s dur=%d ms',
        labels.type,
        labels.field,
        Math.round(durS * 1000)
      );
    }
  };
}
