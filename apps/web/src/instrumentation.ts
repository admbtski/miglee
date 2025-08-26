// instrumentation.ts (ładowany wcześnie przez Next App Router)
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { GraphQLInstrumentation } from '@opentelemetry/instrumentation-graphql';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import {
  BatchSpanProcessor,
  ParentBasedSampler,
  TraceIdRatioBasedSampler,
} from '@opentelemetry/sdk-trace-base';
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions';
import { ATTR_SERVICE_NAMESPACE } from '@opentelemetry/semantic-conventions/incubating';

import opentelemetry from '@opentelemetry/api';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import {
  MeterProvider,
  PeriodicExportingMetricReader,
} from '@opentelemetry/sdk-metrics';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';

export async function register() {
  const serviceName =
    process.env.FRONTEND_SSR_OTEL_SERVICE_NAME ||
    'nextjs-ssr-frontend-fallback';

  const exporter = new OTLPTraceExporter({
    url:
      process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT ||
      'http://localhost:4318/v1/traces',
  });

  const provider = new NodeTracerProvider({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: serviceName,
      [ATTR_SERVICE_VERSION]: '1.0.0',
      [ATTR_SERVICE_NAMESPACE]: 'app',
    }),
    sampler: new ParentBasedSampler({
      root: new TraceIdRatioBasedSampler(1),
    }),
    spanProcessors: [new BatchSpanProcessor(exporter)],
  });

  provider.register();

  // const collectorOptions = {
  //   url: '<opentelemetry-collector-url>', // url is optional and can be omitted - default is http://localhost:4318/v1/metrics
  //   headers: {}, // an optional object containing custom headers to be sent with each request
  //   concurrencyLimit: 1, // an optional limit on pending requests
  // };
  const metricExporter = new OTLPMetricExporter();
  const meterProvider = new MeterProvider({
    readers: [
      new PeriodicExportingMetricReader({
        exporter: metricExporter,
        exportIntervalMillis: 1000,
      }),
    ],
  });

  opentelemetry.metrics.setGlobalMeterProvider(meterProvider);

  registerInstrumentations({
    meterProvider: meterProvider,
    instrumentations: [
      new HttpInstrumentation({
        ignoreIncomingRequestHook: (req) => {
          const url = (req as any)?.url ?? '';
          return (
            url.startsWith('/_next/') ||
            url.startsWith('/__nextjs_source-map') ||
            url === '/favicon.ico' ||
            url.startsWith('/health')
          );
        },
      }),
      new GraphQLInstrumentation({
        mergeItems: true,
        allowValues: true,
        depth: 2,
      }), // działa po stronie backendu GraphQL (execute/parse/resolvers)],
    ],
  });

  console.log('[OTEL] NodeTracerProvider initialized (HTTP OTLP exporter).');

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    await provider.shutdown();
    console.log('[OTEL] tracer shut down (SIGTERM)');
    process.exit(0);
  });
  process.on('SIGINT', async () => {
    await provider.shutdown();
    console.log('[OTEL] tracer shut down (SIGINT)');
    process.exit(0);
  });
}
