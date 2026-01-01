# Phase 2 & 3 Implementation Summary

## ✅ Phase 2: Workers (BullMQ) - Completed

### What was implemented

#### 1. **BullMQ Trace Propagation** (`packages/observability/src/bullmq.ts`)

- **`injectTraceContext(data)`**: Injects current OTel trace context into job data
- **`wrapJobProcessor(processor)`**: Extracts trace context and creates child span for job execution
- **`withJobSpan(name, fn)`**: Manual span creation for complex job steps

#### 2. **API: BullMQ Integration** (`apps/api/src/lib/bullmq.ts`)

- Modified `createWorker()` to automatically wrap processors with tracing
- Added `addJobWithTrace()` helper for adding jobs with automatic trace injection
- All workers now have end-to-end trace correlation with API requests

#### 3. **Worker Instrumentation**

- Created `apps/api/src/workers/instrumentation.ts` for OTel SDK initialization
- Added instrumentation import to all worker entrypoints:
  - `apps/api/src/workers/reminders/worker.ts`
  - `apps/api/src/workers/feedback/worker.ts`
  - `apps/api/src/workers/audit-archive/worker.ts`
- Modified worker logger to include trace context (`apps/api/src/workers/logger.ts`)

#### 4. **Queue Updates**

- Updated all queue operations to use `addJobWithTrace()`:
  - `apps/api/src/workers/reminders/queue.ts`
  - `apps/api/src/workers/feedback/queue.ts`
  - `apps/api/src/workers/audit-archive/queue.ts`

### How it works

```typescript
// API creates job (with trace context)
await addJobWithTrace(queue, 'send-email', { email: 'user@example.com' });

// Worker picks up job and continues trace
const worker = createWorker('email-queue', async (job) => {
  // Job execution is automatically traced
  // Logs include trace_id, span_id
  await sendEmail(job.data.email);
});
```

### Benefits

- **End-to-end correlation**: API request → Job execution
- **Automatic**: No manual span creation needed
- **Consistent**: All workers use the same pattern

---

## ✅ Phase 3: Frontend (Next.js) - Completed

### What was implemented

#### 1. **Browser Utilities** (`packages/observability/src/browser.ts`)

- **`getCurrentTraceId()`**: Get active trace ID for correlation
- **`getCurrentSpanId()`**: Get active span ID
- **`injectTraceHeaders(headers)`**: Add traceparent to HTTP headers
- **`getDeviceType()`**: Detect mobile/tablet/desktop
- **`getCurrentRoute()`**: Get current page route
- **`getConnectionType()`**: Detect network connection type
- **`withBrowserSpan(name, fn)`**: Manual span creation for user interactions

#### 2. **Web Vitals Enhancement** (`apps/web/src/lib/config/web-vitals.tsx`)

- Added **trace_id**, **span_id** for correlation with backend
- Added **route** (e.g., `/event/123`) for page-level analysis
- Added **device** (mobile/tablet/desktop) for device-specific insights
- Added **connection** (4g/3g/wifi) for network-specific insights

#### 3. **Web Vitals API Endpoint** (`apps/web/src/app/api/vitals/route.ts`)

- Records metrics to OTel as histograms:
  - `web.vitals.lcp` (Largest Contentful Paint)
  - `web.vitals.cls` (Cumulative Layout Shift)
  - `web.vitals.inp` (Interaction to Next Paint)
  - `web.vitals.fcp` (First Contentful Paint)
  - `web.vitals.ttfb` (Time to First Byte)
- Attributes: `route`, `device`, `connection`, `rating`, `nav_type`

#### 4. **API Client Tracing** (`apps/web/src/lib/api/client.ts`)

- Added `requestMiddleware` to inject `traceparent` header into all GraphQL requests
- Enables backend to continue frontend-initiated traces

#### 5. **Error Boundary Enhancement** (`apps/web/src/components/ui/error-boundary.tsx`)

- Logs errors with **trace_id** and **span_id**
- Displays trace ID in error UI (for support tickets)
- Ready for Sentry integration with trace context

#### 6. **Next.js Instrumentation** (`apps/web/instrumentation.ts`)

- Initializes OTel SDK for server-side Next.js routes
- Automatically called on Next.js startup

### How it works

```typescript
// Frontend sends web vitals with trace context
onLCP((metric) => {
  send({
    name: 'LCP',
    value: 2400,
    traceId: 'abc123',      // ← Correlates with backend
    route: '/event/456',     // ← Page-level analysis
    device: 'mobile',        // ← Device segmentation
    connection: '4g',        // ← Network insights
  });
});

// GraphQL calls include traceparent
gqlClient.request(query); // ← Automatically adds traceparent header

// Errors include trace context
<ErrorBoundary>
  <YourApp />  {/* Errors show trace_id for debugging */}
</ErrorBoundary>
```

### Benefits

- **Frontend → Backend correlation**: Web vitals, errors, and API calls are linked
- **Rich context**: Device, route, connection type for better insights
- **User-friendly**: Error UI shows trace ID for support tickets

---

## 📊 Example: End-to-End Trace

```
┌─────────────────────────────────────────────────────────────────┐
│ Frontend (Browser)                                              │
├─────────────────────────────────────────────────────────────────┤
│ 1. User clicks "Create Event"                                   │
│    trace_id: abc123                                             │
│    span: user.click.create_event                                │
│                                                                 │
│ 2. GraphQL mutation (with traceparent header)                   │
│    ├─> traceparent: 00-abc123-def456-01                        │
│    └─> POST /graphql                                            │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ API (Fastify + GraphQL)                                         │
├─────────────────────────────────────────────────────────────────┤
│ 3. GraphQL operation: CreateEvent                               │
│    trace_id: abc123 (continued from frontend)                   │
│    span: graphql.operation.CreateEvent                          │
│                                                                 │
│ 4. Database insert (Prisma)                                     │
│    span: prisma.create.Event                                    │
│                                                                 │
│ 5. Enqueue reminder jobs                                        │
│    ├─> addJobWithTrace(remindersQueue, ...)                    │
│    └─> Job data includes __traceContext: { traceparent: ... }  │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ Worker (BullMQ)                                                 │
├─────────────────────────────────────────────────────────────────┤
│ 6. Process reminder job (1 hour later)                          │
│    trace_id: abc123 (continued from API)                        │
│    span: job.event-reminders.send                               │
│                                                                 │
│ 7. Send notification                                            │
│    span: notification.send                                      │
└─────────────────────────────────────────────────────────────────┘
```

### Logs with Correlation

```json
// Frontend error
{
  "level": "error",
  "msg": "Form validation failed",
  "trace_id": "abc123",
  "span_id": "def456",
  "route": "/event/create"
}

// API log
{
  "level": "info",
  "msg": "GraphQL operation",
  "trace_id": "abc123",
  "span_id": "ghi789",
  "operation": "CreateEvent"
}

// Worker log
{
  "level": "info",
  "msg": "Processing job",
  "trace_id": "abc123",
  "span_id": "jkl012",
  "job_id": "reminder:60m:event-456"
}
```

**All logs share `trace_id: abc123`** → Easy to find all related activity in Loki!

---

## 🚀 Next Steps

### To test locally:

1. **Start observability stack**:

   ```bash
   cd infra/observability
   docker-compose -f docker-compose.observability.yml up -d
   ```

2. **Start API with instrumentation**:

   ```bash
   cd apps/api
   pnpm dev
   ```

3. **Start workers**:

   ```bash
   cd apps/api
   pnpm worker:reminders
   pnpm worker:feedback
   pnpm worker:audit
   ```

4. **Start web**:

   ```bash
   cd apps/web
   pnpm dev
   ```

5. **Open Grafana**: http://localhost:3000
   - Explore traces in **Tempo**
   - Search logs in **Loki** (filter by `trace_id`)
   - View metrics in **Prometheus**

### To verify it works:

1. Create an event in the UI
2. Check **Grafana → Explore → Tempo** for the full trace
3. Copy the `trace_id` from the trace
4. Go to **Grafana → Explore → Loki** and search:
   ```logql
   {service_name="miglee-api"} | json | trace_id="<your-trace-id>"
   ```
5. See all correlated logs!

---

## 📝 Configuration

### Environment Variables

**API & Workers**:

```bash
# OTel Collector endpoint
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318

# Service name (auto-detected, but can override)
OTEL_SERVICE_NAME=miglee-api

# Optional: Build SHA for versioning
BUILD_SHA=abc123def456
```

**Web** (Next.js):

```bash
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
OTEL_SERVICE_NAME=miglee-web
BUILD_SHA=abc123def456
```

### Sampling (Production)

Edit `infra/observability/otel-collector/otel-collector.prodlike.yaml`:

```yaml
processors:
  tail_sampling:
    policies:
      - name: errors-always
        type: status_code
        status_code: { status_codes: [ERROR] }

      - name: slow-requests
        type: latency
        latency: { threshold_ms: 1000 }

      - name: sample-10-percent
        type: probabilistic
        probabilistic: { sampling_percentage: 10 }
```

---

## 🎯 Key Files Changed

### Shared Package

- ✅ `packages/observability/package.json` (added dependencies + exports)
- ✅ `packages/observability/src/bullmq.ts` (new)
- ✅ `packages/observability/src/browser.ts` (new)
- ✅ `packages/observability/src/index.ts` (updated exports)

### API

- ✅ `apps/api/package.json` (added @opentelemetry/api dependency)
- ✅ `apps/api/src/lib/bullmq.ts` (trace propagation)
- ✅ `apps/api/src/workers/instrumentation.ts` (new)
- ✅ `apps/api/src/workers/logger.ts` (trace mixin)
- ✅ `apps/api/src/workers/*/worker.ts` (instrumentation import)
- ✅ `apps/api/src/workers/*/queue.ts` (addJobWithTrace)

### Web

- ✅ `apps/web/package.json` (added @appname/observability dependency)
- ✅ `apps/web/instrumentation.ts` (new)
- ✅ `apps/web/src/lib/config/web-vitals.tsx` (enhanced)
- ✅ `apps/web/src/app/api/vitals/route.ts` (OTel metrics)
- ✅ `apps/web/src/lib/api/client.ts` (traceparent headers)
- ✅ `apps/web/src/components/ui/error-boundary.tsx` (trace context)

---

## 🎉 Summary

**Phase 2 (Workers)**: ✅ Complete

- End-to-end trace correlation: API → Worker
- Automatic trace propagation in BullMQ jobs
- All workers instrumented

**Phase 3 (Frontend)**: ✅ Complete

- Web vitals with trace context + device/route/connection
- GraphQL client propagates traceparent
- Error boundary includes trace_id
- Next.js server-side instrumentation

**Total Lines Changed**: ~500 lines
**New Files Created**: 6
**Zero Breaking Changes**: All opt-in, backward compatible

---

## 🔍 Debugging Tips

### 1. **No traces showing up in Grafana?**

- Check OTel Collector logs: `docker logs otel-collector`
- Verify `OTEL_EXPORTER_OTLP_ENDPOINT` is set correctly
- Check API/worker logs for "OpenTelemetry initialized"

### 2. **Logs missing trace_id?**

- Ensure `pinoTraceMixin` is configured in logger
- Check that instrumentation runs **before** other imports
- Verify active span exists (use `getCurrentTraceId()`)

### 3. **Workers not correlating with API?**

- Check that `addJobWithTrace()` is used (not `queue.add()`)
- Verify worker has `import '../instrumentation'` as first line
- Inspect job data: should have `__traceContext` field

### 4. **Web vitals not showing up?**

- Check browser console for web-vitals logs
- Verify `/api/vitals` endpoint receives data
- Check Prometheus for `web_vitals_*` metrics

### 5. **Module not found errors?**

If you see errors like:

- `Can't resolve '@appname/observability'`
- `Can't resolve '@opentelemetry/auto-instrumentations-node'`

**Fix**: Run `pnpm install` to ensure all dependencies are installed correctly.

The observability package requires:

- `@opentelemetry/auto-instrumentations-node` - for automatic instrumentation
- `@opentelemetry/api` - core API
- Various instrumentation packages (Fastify, Pino, Redis, etc.)

These are all declared in `packages/observability/package.json` and should be installed automatically.

---

**Questions?** Check `packages/observability/README.md` or ask! 🚀
