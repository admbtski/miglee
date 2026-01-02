/**
 * OpenTelemetry Tracing Setup
 *
 * Initializes distributed tracing with:
 * - Automatic instrumentation (HTTP, Fastify, Redis)
 * - OTLP export (works with local Collector or Grafana Cloud)
 * - Resource detection (K8s, container)
 * - Context propagation (W3C Trace Context)
 */

import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SEMRESATTRS_SERVICE_NAME, SEMRESATTRS_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { BatchSpanProcessor, ConsoleSpanExporter, SpanProcessor } from '@opentelemetry/sdk-trace-base';
import { TraceIdRatioBasedSampler, ParentBasedSampler } from '@opentelemetry/sdk-trace-base';
import { containerDetector as _containerDetector } from '@opentelemetry/resource-detector-container';
import { FastifyInstrumentation } from '@opentelemetry/instrumentation-fastify';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { RedisInstrumentation as Redis4Instrumentation } from '@opentelemetry/instrumentation-redis-4';
import { PinoInstrumentation } from '@opentelemetry/instrumentation-pino';

import { getObservabilityConfig, validateConfig, getResourceAttributes } from './config';

let sdk: NodeSDK | null = null;

/**
 * Initialize OpenTelemetry tracing
 *
 * Call this ONCE at application startup, before any other imports
 */
export async function initTracing(): Promise<NodeSDK | null> {
  const config = getObservabilityConfig();
  
  // Validate config (throws in production if misconfigured)
  validateConfig(config);
  
  // Skip if tracing is disabled
  if (!config.enableTracing) {
    if (config.debug) {
      console.log('[Observability] Tracing disabled');
    }
    return null;
  }
  
  // Skip if no OTLP endpoint (development without collector)
  if (!config.otlpEndpoint) {
    console.warn(
      '[Observability] OTLP endpoint not configured. ' +
      'Run "pnpm obs:up" to start local observability stack.'
    );
    return null;
  }
  
  if (config.debug) {
    console.log('[Observability] Initializing tracing...', {
      serviceName: config.serviceName,
      environment: config.environment,
      otlpEndpoint: config.otlpEndpoint,
      sampleRate: config.traceSampleRate,
    });
  }
  
  // Resource with service info + K8s attributes
  const resource = new Resource({
    [SEMRESATTRS_SERVICE_NAME]: config.serviceName,
    [SEMRESATTRS_SERVICE_VERSION]: config.serviceVersion,
    ...getResourceAttributes(config),
  });
  
  // OTLP exporter (HTTP)
  const traceExporter = new OTLPTraceExporter({
    url: `${config.otlpEndpoint}/v1/traces`,
    headers: {},
    // Timeout for export
    timeoutMillis: 10000,
  });
  
  // Span processors
  const spanProcessors: SpanProcessor[] = [
    // Batch processor for production efficiency
    new BatchSpanProcessor(traceExporter, {
      maxQueueSize: 2048,
      maxExportBatchSize: 512,
      scheduledDelayMillis: 5000,
      exportTimeoutMillis: 30000,
    }),
  ];
  
  // Add console exporter in debug mode
  if (config.debug) {
    spanProcessors.push(
      new BatchSpanProcessor(new ConsoleSpanExporter(), {
        maxQueueSize: 100,
        scheduledDelayMillis: 1000,
      })
    );
  }
  
  // Sampler: parent-based with ratio
  const sampler = new ParentBasedSampler({
    root: new TraceIdRatioBasedSampler(config.traceSampleRate),
  });
  
  // SDK initialization
  sdk = new NodeSDK({
    resource,
    spanProcessors: spanProcessors as any, // Type assertion for version compatibility
    sampler,
    instrumentations: [
      // HTTP instrumentation (incoming/outgoing requests)
      new HttpInstrumentation({
        ignoreIncomingRequestHook: (req) => {
          // Skip health check endpoints
          const url = req.url || '';
          return url.includes('/health') || url.includes('/_next/') || url.includes('/favicon');
        },
        requestHook: (span, request) => {
          // Add custom attributes
          span.setAttribute('http.client_ip', request.socket?.remoteAddress || 'unknown');
        },
      }),
      
      // Fastify instrumentation
      new FastifyInstrumentation({
        requestHook: (span, info) => {
          // Add route name as span name
          if (info.request.routeOptions?.url) {
            span.updateName(`HTTP ${info.request.method} ${info.request.routeOptions.url}`);
          }
        },
      }),
      
      // Pino instrumentation (inject trace context into logs)
      new PinoInstrumentation({
        logHook: (_span, _record) => {
          // This injects trace_id and span_id into Pino logs
          // Already handled by instrumentation, but we can customize here
        },
      }),
      
      // Redis instrumentation (ioredis v4+)
      new Redis4Instrumentation({
        dbStatementSerializer: (cmdName, cmdArgs) => {
          // Redact sensitive data in Redis commands
          if (['SET', 'GET', 'HSET', 'HGET'].includes(cmdName.toUpperCase())) {
            return `${cmdName} [REDACTED]`;
          }
          return `${cmdName} ${cmdArgs.slice(0, 2).join(' ')}`;
        },
      }),
      
      // Auto-instrumentations for common libraries
      // Includes: dns, net, pg (postgres), undici (fetch), etc.
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': {
          enabled: false, // Too noisy
        },
        '@opentelemetry/instrumentation-dns': {
          enabled: config.debug, // Only in debug
        },
      }),
    ],
  });
  
  // Start SDK
  try {
    await sdk.start();
    
    if (config.debug) {
      console.log('[Observability] ✅ Tracing initialized successfully');
    }
    
    // Graceful shutdown
    process.on('SIGTERM', async () => {
      try {
        await sdk?.shutdown();
        console.log('[Observability] Tracing shut down gracefully');
      } catch (error) {
        console.error('[Observability] Error shutting down tracing', error);
      }
    });
    
    return sdk;
  } catch (error) {
    console.error('[Observability] Failed to initialize tracing:', error);
    return null;
  }
}

/**
 * Shutdown tracing
 * Called during graceful shutdown
 */
export async function shutdownTracing(): Promise<void> {
  if (sdk) {
    await sdk.shutdown();
    sdk = null;
  }
}

/**
 * Get the initialized SDK instance
 */
export function getSDK(): NodeSDK | null {
  return sdk;
}

