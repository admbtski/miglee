# @appname/observability

Shared observability package for distributed tracing, metrics, and logging with OpenTelemetry.

## 🎯 Features

- **Distributed Tracing** - Auto-instrumentation for HTTP, Fastify, Redis, Prisma
- **Metrics** - Business metrics, RED metrics, queue monitoring
- **Log Correlation** - Automatic trace_id/span_id injection into Pino logs
- **Environment-Aware** - Works locally (Docker) and on Kubernetes (AWS EKS)
- **Zero Config** - Auto-detects K8s environment, falls back to localhost

## 🚀 Quick Start

### 1. Install in your app

```bash
cd apps/api
pnpm add @appname/observability
```

### 2. Initialize (BEFORE other imports)

```typescript
// apps/api/src/index.ts
import { initObservability } from '@appname/observability';

// Initialize observability FIRST
await initObservability();

// Now import and start your app
import { createServer } from './server';
const server = await createServer();
await server.listen({ port: 4000 });
```

### 3. Enhance Pino logger

```typescript
// apps/api/src/lib/pino.ts
import pino from 'pino';
import { pinoTraceMixin } from '@appname/observability/pino';

export const logger = pino({
  mixin: pinoTraceMixin, // Adds trace_id/span_id to every log
  // ... your other options
});
```

### 4. Add business metrics

```typescript
import { businessMetrics } from '@appname/observability/metrics';

// Track business events
businessMetrics.increment('events.created', { visibility: 'public' });
businessMetrics.increment('payments.success', { plan: 'pro' });
```

## 📦 What Gets Instrumented

### Automatic (Zero Config)

- ✅ **HTTP** - Incoming/outgoing requests
- ✅ **Fastify** - Routes, middleware
- ✅ **Pino** - Log correlation (trace_id/span_id)
- ✅ **Redis** - ioredis v4+ commands
- ✅ **Postgres** - pg driver queries (via auto-instrumentations)
- ✅ **Fetch/Undici** - External API calls

### Manual (Add as needed)

- GraphQL operations (Mercurius)
- Prisma queries (custom spans)
- BullMQ jobs (custom spans)

## 🌍 Environment Configuration

### Local Development

```bash
# .env
OTEL_SERVICE_NAME=appname-api
OTEL_SERVICE_VERSION=1.0.0
NODE_ENV=development

# Auto-detected (points to local Docker stack)
# OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
```

### Kubernetes (AWS EKS)

```yaml
# K8s ConfigMap
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  NODE_ENV: production
  OTEL_SERVICE_NAME: appname-api
  OTEL_SERVICE_VERSION: "1.0.0"
  
  # Points to OTel Collector in cluster
  OTEL_EXPORTER_OTLP_ENDPOINT: http://otel-collector:4318
  
  # Or managed (Grafana Cloud)
  # OTEL_EXPORTER_OTLP_ENDPOINT: https://otlp-gateway-prod-eu-west-0.grafana.net/otlp
```

K8s attributes are auto-detected:
- `k8s.namespace.name`
- `k8s.pod.name`
- `k8s.node.name`
- `service.instance.id` (pod name)

### Grafana Cloud

```yaml
# K8s Secret
apiVersion: v1
kind: Secret
metadata:
  name: grafana-cloud-otlp
data:
  endpoint: <base64-encoded-endpoint>
  auth: <base64-encoded-basic-auth>
```

```yaml
# Use in deployment
env:
  - name: OTEL_EXPORTER_OTLP_ENDPOINT
    valueFrom:
      secretKeyRef:
        name: grafana-cloud-otlp
        key: endpoint
  - name: OTEL_EXPORTER_OTLP_HEADERS
    value: "Authorization=Basic $(GRAFANA_CLOUD_AUTH)"
  - name: GRAFANA_CLOUD_AUTH
    valueFrom:
      secretKeyRef:
        name: grafana-cloud-otlp
        key: auth
```

## 🎛️ Configuration

All configuration via environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `OTEL_SERVICE_NAME` | `SERVICE_NAME` or `unknown-service` | Service identifier |
| `OTEL_SERVICE_VERSION` | `npm_package_version` or `1.0.0` | Service version |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | `http://localhost:4318` (dev) | Collector URL |
| `OTEL_TRACE_SAMPLE_RATE` | `1.0` (dev), `0.5` (staging), `0.1` (prod) | Sampling rate |
| `OTEL_ENABLE_TRACING` | `true` | Enable/disable tracing |
| `OTEL_ENABLE_METRICS` | `true` | Enable/disable metrics |
| `OTEL_DEBUG` | `false` | Verbose logging |

### K8s Auto-Detected

| Variable | K8s Source | Description |
|----------|------------|-------------|
| `KUBERNETES_NAMESPACE` | Downward API | Namespace name |
| `HOSTNAME` | Pod name | Used as `service.instance.id` |
| `K8S_POD_NAME` | Downward API | Pod name |
| `K8S_NODE_NAME` | Downward API | Node name |

Example Downward API setup:

```yaml
env:
  - name: KUBERNETES_NAMESPACE
    valueFrom:
      fieldRef:
        fieldPath: metadata.namespace
  - name: K8S_POD_NAME
    valueFrom:
      fieldRef:
        fieldPath: metadata.name
  - name: K8S_NODE_NAME
    valueFrom:
      fieldRef:
        fieldPath: spec.nodeName
```

## 📊 Metrics

### Pre-built Metrics

```typescript
import { businessMetrics, jobMetrics } from '@appname/observability/metrics';

// Business counters
businessMetrics.increment('events.created', { visibility: 'public' });
businessMetrics.increment('events.joined', { join_mode: 'public' });
businessMetrics.increment('payments.success', { plan: 'pro' });
businessMetrics.increment('payments.failed', { reason: 'card_declined' });

// Job metrics
jobMetrics.recordJob('send-reminder', 'completed', 1.234, { queue: 'reminders' });
jobMetrics.recordJob('process-payment', 'failed', 0.567, { queue: 'billing' });
```

### Custom Metrics

```typescript
import { getMeter } from '@appname/observability/metrics';

const meter = getMeter('my-metrics');

// Counter
const requestCounter = meter.createCounter('api.custom.requests', {
  description: 'Custom request counter',
  unit: '1',
});
requestCounter.add(1, { endpoint: '/api/custom' });

// Histogram (for latencies)
const latencyHistogram = meter.createHistogram('api.custom.duration', {
  description: 'Custom operation duration',
  unit: 'seconds',
});
latencyHistogram.record(0.123, { operation: 'custom' });
```

## 🔗 Log-Trace Correlation

Automatic with Pino:

```typescript
import pino from 'pino';
import { pinoTraceMixin, wrapLoggerWithTracing } from '@appname/observability/pino';

const logger = wrapLoggerWithTracing(
  pino({
    mixin: pinoTraceMixin,
  })
);

// Logs include trace_id and span_id
logger.info('Processing request'); // { trace_id: "abc...", span_id: "123...", msg: "Processing request" }

// Errors are recorded in span
logger.error({ err: new Error('Failed') }, 'Operation failed');
// ^ Also records exception in active span
```

## 🧪 Testing

```typescript
// Disable observability in tests
process.env.OTEL_ENABLE_TRACING = 'false';
process.env.OTEL_ENABLE_METRICS = 'false';

import { initObservability } from '@appname/observability';
await initObservability(); // No-op when disabled
```

## 📚 Advanced Usage

### Manual Spans

```typescript
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('my-service');

await tracer.startActiveSpan('myOperation', async (span) => {
  span.setAttribute('custom.attr', 'value');
  
  try {
    // Your code here
    const result = await doSomething();
    span.setStatus({ code: SpanStatusCode.OK });
    return result;
  } catch (error) {
    span.recordException(error);
    span.setStatus({ code: SpanStatusCode.ERROR });
    throw error;
  } finally {
    span.end();
  }
});
```

### Context Propagation

```typescript
import { context } from '@opentelemetry/api';

// Extract context from request headers
const ctx = propagation.extract(context.active(), request.headers);

// Run code in that context
context.with(ctx, () => {
  // This code inherits the parent trace
  logger.info('Processing with parent context');
});
```

## 🔧 Troubleshooting

### No traces appearing

1. Check OTLP endpoint is set:
   ```bash
   echo $OTEL_EXPORTER_OTLP_ENDPOINT
   ```

2. Verify collector is running:
   ```bash
   curl http://localhost:13133/health
   ```

3. Enable debug mode:
   ```bash
   export OTEL_DEBUG=true
   ```

### Logs missing trace_id

Ensure `pinoTraceMixin` is used:

```typescript
const logger = pino({
  mixin: pinoTraceMixin, // Must be set
});
```

### K8s attributes not appearing

Add Downward API to your deployment (see Configuration section above).

## 📦 Dependencies

- `@opentelemetry/api` - OTel API
- `@opentelemetry/sdk-node` - Node.js SDK
- `@opentelemetry/instrumentation-*` - Auto-instrumentations
- `@opentelemetry/exporter-trace-otlp-http` - OTLP exporter

## 🔗 Related

- [Observability Stack Documentation](../../infra/observability/README.md)
- [OpenTelemetry Docs](https://opentelemetry.io/docs/instrumentation/js/)
- [Grafana Cloud OTLP](https://grafana.com/docs/grafana-cloud/send-data/otlp/)

