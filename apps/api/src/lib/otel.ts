import FastifyOtelInstrumentation from '@fastify/otel';
import opentelemetry, { diag } from '@opentelemetry/api';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { GraphQLInstrumentation } from '@opentelemetry/instrumentation-graphql';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { IORedisInstrumentation } from '@opentelemetry/instrumentation-ioredis';
import { resourceFromAttributes } from '@opentelemetry/resources';
import {
  AggregationType,
  InstrumentType,
  MeterProvider,
  PeriodicExportingMetricReader,
} from '@opentelemetry/sdk-metrics';
import { NodeSDK } from '@opentelemetry/sdk-node';
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
import { PrismaInstrumentation } from '@prisma/instrumentation';

const serviceName = process.env.BACKEND_OTEL_SERVICE_NAME || 'api';

// diag.setLogger(new DiagConsoleLogger(), {

// })

const traceExporter = new OTLPTraceExporter({
  url:
    process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT ||
    `${process.env.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/traces`,
});

const resource = resourceFromAttributes({
  [ATTR_SERVICE_NAME]: serviceName,
  [ATTR_SERVICE_VERSION]: '1.0.0',
  [ATTR_SERVICE_NAMESPACE]: 'app',
  // [ATTR_DEPLOYMENT_ENVIRONMENT_NAME]: process.env.NODE_ENV || 'development',
  // [ATTR_SERVICE_INSTANCE_ID]: process.env.HOSTNAME ?? `pid-${process.pid}`,
  // [ATTR_HOST_NAME]: require('os').hostname(),
  // [ATTR_OS_TYPE]: process.platform,
  // [ATTR_PROCESS_PID]: process.pid,
  // [ATTR_PROCESS_RUNTIME_NAME]: 'nodejs',
  // [ATTR_PROCESS_RUNTIME_VERSION]: process.version,
});

const metricExporter = new OTLPMetricExporter();
const meterProvider = new MeterProvider({
  readers: [
    new PeriodicExportingMetricReader({
      exporter: metricExporter,
      exportIntervalMillis: 1000,
    }),
  ],
  views: [
    {
      instrumentName: 'http_server_request_duration_seconds',
      instrumentType: InstrumentType.HISTOGRAM,
      description: 'HTTP server request duration',
      instrumentUnit: 's',
      aggregation: {
        type: AggregationType.EXPLICIT_BUCKET_HISTOGRAM,
        options: {
          boundaries: [
            0.001, 0.002, 0.003, 0.005, 0.0075, 0.01, 0.015, 0.02, 0.03, 0.05,
            0.075, 0.1, 0.15, 0.2, 0.3, 0.5, 0.75, 1,
          ],
        },
      },
    },
    {
      instrumentName: 'graphql_resolver_duration_seconds',
      instrumentType: InstrumentType.HISTOGRAM,
      description: 'Resolver durations',
      instrumentUnit: 's',
      aggregation: {
        type: AggregationType.EXPLICIT_BUCKET_HISTOGRAM,
        options: {
          boundaries: [
            0.001, 0.002, 0.003, 0.005, 0.0075, 0.01, 0.015, 0.02, 0.03, 0.05,
            0.075, 0.1, 0.15, 0.2, 0.3, 0.5, 0.75, 1,
          ],
        },
      },
    },
    {
      instrumentName: 'db_query_duration_seconds',
      instrumentType: InstrumentType.HISTOGRAM,
      description: 'Resolver durations',
      instrumentUnit: 's',
      aggregation: {
        type: AggregationType.EXPLICIT_BUCKET_HISTOGRAM,
        options: {
          boundaries: [
            0.001, 0.002, 0.003, 0.005, 0.0075, 0.01, 0.015, 0.02, 0.03, 0.05,
            0.075, 0.1, 0.15, 0.2, 0.3, 0.5, 0.75, 1,
          ],
        },
      },
    },
    {
      instrumentName: 'graphql_operation_duration_seconds',
      instrumentType: InstrumentType.HISTOGRAM,
      description: 'GraphQL operation duration',
      instrumentUnit: 's',
      aggregation: {
        type: AggregationType.EXPLICIT_BUCKET_HISTOGRAM,
        options: {
          boundaries: [
            0.001, 0.002, 0.003, 0.005, 0.0075, 0.01, 0.015, 0.02, 0.03, 0.05,
            0.075, 0.1, 0.15, 0.2, 0.3, 0.5, 0.75, 1,
          ],
        },
      },
    },
  ],
});

opentelemetry.metrics.setGlobalMeterProvider(meterProvider);

const sdk = new NodeSDK({
  resource,
  sampler: new ParentBasedSampler({
    root: new TraceIdRatioBasedSampler(1),
  }),
  spanProcessors: [new BatchSpanProcessor(traceExporter)],
  instrumentations: [
    new HttpInstrumentation({
      ignoreIncomingRequestHook: (req) => {
        const url = (req as any)?.url ?? '';
        return (
          url.startsWith('/health') ||
          url.startsWith('/favicon.ico') ||
          url.startsWith('/__webpack_hmr') ||
          url.startsWith('/graphiql') ||
          url.startsWith('/playground') ||
          url.startsWith('/assets')
        );
      },
      ignoreOutgoingRequestHook: (request: any) => {
        const path: string | undefined =
          request?.path || request?.pathname || request?.href;
        return (
          !!path && (/\/v1\/traces$/.test(path) || /\/v1\/metrics$/.test(path))
        );
      },
    }),
    new FastifyOtelInstrumentation({
      servername: serviceName,
      registerOnInitialization: true,
      ignorePaths: (opts: any) => {
        const url = opts?.url ?? '';
        return (
          url.startsWith('/health') ||
          (url === '/graphql' &&
            opts?.body?.operationName === 'IntrospectionQuery')
        );
      },
      // ignorePaths: (opts: any) => opts?.url?.startsWith?.('/health'),
      requestHook: (span: any, req: any) => {
        span.setAttribute('http.request_id', req.id);
        span.updateName(`${req.method} ${req.routerPath ?? req.url}`);
      },
    }),
    new GraphQLInstrumentation({
      mergeItems: true,
      allowValues: true,
      depth: 2,
    }),
    new PrismaInstrumentation({}),
    new IORedisInstrumentation(),
  ],
});

export async function startOtel() {
  try {
    diag.info('⏳ OTel SDK starting');
    await sdk.start();
    diag.info('✅ OTel SDK started');
  } catch (err) {
    diag.error('❌ OTel SDK starting error', { err });
  }
}

export async function stopOtel() {
  try {
    diag.info('⏳ OTel SDK is being shutdown');
    await sdk.shutdown();
    diag.info('✅ OTel SDK was being shutdown');
  } catch (err) {
    diag.error('❌ OTel SDK shutdown error', { err });
  }
}
