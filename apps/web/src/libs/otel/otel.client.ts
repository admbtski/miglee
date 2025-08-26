'use client';

import { ZoneContextManager } from '@opentelemetry/context-zone';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { DocumentLoadInstrumentation } from '@opentelemetry/instrumentation-document-load';
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch';
import { UserInteractionInstrumentation } from '@opentelemetry/instrumentation-user-interaction';
import { XMLHttpRequestInstrumentation } from '@opentelemetry/instrumentation-xml-http-request';
import { resourceFromAttributes } from '@opentelemetry/resources';
import {
  BatchSpanProcessor,
  ConsoleSpanExporter,
  ParentBasedSampler,
  SimpleSpanProcessor,
  TraceIdRatioBasedSampler,
} from '@opentelemetry/sdk-trace-base';
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions';
import { ATTR_SERVICE_NAMESPACE } from '@opentelemetry/semantic-conventions/incubating';
import {
  MeterProvider,
  PeriodicExportingMetricReader,
} from '@opentelemetry/sdk-metrics';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import opentelemetry from '@opentelemetry/api';
import { GraphQLInstrumentation } from '@opentelemetry/instrumentation-graphql';

// globalna strażka, by nie inicjować 2x (np. fast refresh)
declare global {
  // eslint-disable-next-line no-var
  var __OTEL_WEB_INIT__: boolean | undefined;
}

function canInit() {
  if (typeof window === 'undefined') {
    return false;
  }

  if (globalThis.__OTEL_WEB_INIT__) {
    return false;
  }

  globalThis.__OTEL_WEB_INIT__ = true;

  return true;
}

export function initOtelWeb() {
  if (!canInit()) {
    return;
  }

  const serviceName =
    process.env.NEXT_PUBLIC_FRONTEND_CSR_OTEL_SERVICE_NAME ||
    'nextjs-ssr-frontend-fallback';

  const exporter = new OTLPTraceExporter({
    url:
      process.env.NEXT_PUBLIC_OTEL_EXPORTER_OTLP_TRACES_ENDPOINT ||
      'http://localhost:4318/v1/traces',
  });

  const provider = new WebTracerProvider({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: serviceName,
      [ATTR_SERVICE_VERSION]: '1.0.0',
      [ATTR_SERVICE_NAMESPACE]: 'app',
    }),
    sampler: new ParentBasedSampler({
      root: new TraceIdRatioBasedSampler(1),
    }),
    spanProcessors: [
      new BatchSpanProcessor(exporter),
      new SimpleSpanProcessor(new ConsoleSpanExporter()),
    ],
  });

  provider.register({
    // web only
    contextManager: new ZoneContextManager(),
  });

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

  const ignoreUrls: (string | RegExp)[] = [
    /^\/_next\//,
    /^\/__nextjs_source-map/,
    /^\/favicon\.ico$/,
    /^\/health$/,
  ];

  registerInstrumentations({
    tracerProvider: provider,
    instrumentations: [
      new DocumentLoadInstrumentation(),
      new UserInteractionInstrumentation(),
      new FetchInstrumentation({
        propagateTraceHeaderCorsUrls: [
          // domena API/GraphQL (HTTP)
          /https?:\/\/localhost:3\d{3}\/?.*/, // przykładowo
          /https?:\/\/api\.twojadomena\.pl\/?.*/,
        ],
        ignoreUrls,
        requestHook: function (span, req: any) {
          span.updateName(`${req.method} ${req.url ?? req.path ?? ''}`);
        },
      }),
      new XMLHttpRequestInstrumentation({
        ignoreUrls,
      }),
    ],
  });

  console.log('[OTEL] WebTracerProvider initialized (HTTP OTLP exporter).');

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
