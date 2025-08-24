import FastifyOtelInstrumentation from '@fastify/otel';
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { GraphQLInstrumentation } from '@opentelemetry/instrumentation-graphql';
import { resourceFromAttributes } from '@opentelemetry/resources';
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
import {
  ATTR_DEPLOYMENT_ENVIRONMENT_NAME,
  ATTR_HOST_NAME,
  ATTR_OS_TYPE,
  ATTR_PROCESS_PID,
  ATTR_PROCESS_RUNTIME_NAME,
  ATTR_PROCESS_RUNTIME_VERSION,
  ATTR_SERVICE_INSTANCE_ID,
  ATTR_SERVICE_NAMESPACE,
} from '@opentelemetry/semantic-conventions/incubating';
import { PrismaInstrumentation } from '@prisma/instrumentation';

const ENABLE_GRAPHQL_RESOLVER_SPANS = process.env.OTEL_GQL_RESOLVERS === '1';

const sampler =
  process.env.NODE_ENV === 'production'
    ? new ParentBasedSampler({
        root: new TraceIdRatioBasedSampler(
          Number(process.env.OTEL_TRACES_SAMPLER_RATIO ?? 0.1)
        ),
      })
    : new ParentBasedSampler({ root: new TraceIdRatioBasedSampler(1) }); // always_on

const serviceName = process.env.OTEL_SERVICE_NAME || 'api';

const traceExporter = new OTLPTraceExporter({
  url:
    process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT ||
    `${process.env.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/traces`,
});

const resource = resourceFromAttributes({
  [ATTR_SERVICE_NAME]: serviceName,
  [ATTR_SERVICE_VERSION]: '1.0.0',
  [ATTR_SERVICE_NAMESPACE]: 'app',
  [ATTR_DEPLOYMENT_ENVIRONMENT_NAME]: process.env.NODE_ENV || 'development',
  [ATTR_SERVICE_INSTANCE_ID]: process.env.HOSTNAME ?? `pid-${process.pid}`,
  [ATTR_HOST_NAME]: require('os').hostname(),
  [ATTR_OS_TYPE]: process.platform,
  [ATTR_PROCESS_PID]: process.pid,
  [ATTR_PROCESS_RUNTIME_NAME]: 'nodejs',
  [ATTR_PROCESS_RUNTIME_VERSION]: process.version,
});

const sdk = new NodeSDK({
  resource,
  sampler,
  spanProcessors: [new BatchSpanProcessor(traceExporter)],
  instrumentations: [
    getNodeAutoInstrumentations({}),
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
      allowValues: false,
      depth: 2,
      ignoreTrivialResolveSpans: true,
      ignoreResolveSpans: !ENABLE_GRAPHQL_RESOLVER_SPANS,
      mergeItems: true,
    }),
    new PrismaInstrumentation(),
  ],
});

sdk.start();
diag.info('✅ OTel SDK started');

const shutdown = async () => {
  const timer = setTimeout(() => process.exit(0), 2000).unref();
  try {
    await sdk.shutdown();
    diag.info('✅ OTel SDK shutdown');
  } catch (err) {
    diag.error('❌ OTel SDK shutdown error', { err });
  } finally {
    clearTimeout(timer);
  }
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
