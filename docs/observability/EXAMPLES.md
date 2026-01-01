# Observability Examples

Real-world code examples showing how to use the observability package.

---

## 📋 Table of Contents

1. [Backend Examples](#backend-examples)
   - [GraphQL Resolvers](#graphql-resolvers)
   - [BullMQ Jobs](#bullmq-jobs)
   - [Manual Spans](#manual-spans)
2. [Frontend Examples](#frontend-examples)
   - [User Interactions](#user-interactions)
   - [API Calls](#api-calls)
   - [Error Tracking](#error-tracking)

---

## Backend Examples

### GraphQL Resolvers

GraphQL operations are **automatically traced** by `mercuriusTracingPlugin`.

```typescript
// apps/api/src/plugins/mercurius.ts
import { mercuriusTracingPlugin } from '@appname/observability/graphql';

await fastify.register(mercurius, {
  schema,
  context: createContext,
});

// Wrap GraphQL hooks with tracing
mercuriusTracingPlugin(fastify, {
  // Optional: trace individual resolvers (careful with cardinality!)
  // traceResolvers: false,
});
```

**Result**: Every GraphQL operation gets a span:
- Span name: `graphql.operation.CreateEvent`
- Attributes: `graphql.operation.name`, `graphql.operation.type`

#### Manual Resolver Tracing

For critical resolvers, add manual spans:

```typescript
// apps/api/src/graphql/resolvers/event.resolver.ts
import { withJobSpan } from '@appname/observability';

export const eventResolvers = {
  Mutation: {
    createEvent: async (parent, args, context) => {
      return withJobSpan('resolver.createEvent', async (span) => {
        span.setAttribute('event.visibility', args.input.visibility);
        span.setAttribute('user.id', context.user.id);

        // Business logic
        const event = await context.prisma.event.create({
          data: args.input,
        });

        // Enqueue reminders
        await enqueueReminders(event.id, event.startAt);

        return event;
      });
    },
  },
};
```

---

### BullMQ Jobs

Jobs are **automatically traced** if you use `addJobWithTrace()` and `createWorker()`.

#### Producer (API)

```typescript
// apps/api/src/graphql/resolvers/event.resolver.ts
import { addJobWithTrace } from '@/lib/bullmq';
import { remindersQueue } from '@/workers/reminders/queue';

export const eventResolvers = {
  Mutation: {
    createEvent: async (parent, args, context) => {
      const event = await context.prisma.event.create({ data: args.input });

      // Add job with automatic trace propagation
      await addJobWithTrace(
        remindersQueue,
        'send',
        { eventId: event.id, minutesBefore: 60 },
        { delay: calculateDelay(event.startAt, 60) }
      );

      return event;
    },
  },
};
```

#### Consumer (Worker)

```typescript
// apps/api/src/workers/reminders/queue.ts
import { createWorker } from '@/lib/bullmq';
import { runReminderForEvent } from './runReminderForEvent';

export function bootstrapRemindersWorker() {
  // Processor is automatically wrapped with tracing
  const worker = createWorker<ReminderPayload>(
    'event-reminders',
    async (job) => {
      const { eventId, minutesBefore } = job.data;
      await runReminderForEvent(eventId, minutesBefore);
      return { success: true, eventId };
    }
  );

  return worker;
}
```

**Result**: 
- API span: `graphql.operation.CreateEvent`
  - Child: `job.enqueue.reminders`
- Worker span: `job.event-reminders.send` (1 hour later)
  - Parent: API span (via trace context)

#### Manual Job Spans

For complex jobs, add child spans:

```typescript
// apps/api/src/workers/reminders/runReminderForEvent.ts
import { withJobSpan } from '@appname/observability';

export async function runReminderForEvent(
  eventId: string,
  minutesBefore: number
) {
  // Fetch event
  const event = await withJobSpan('fetch-event', async (span) => {
    span.setAttribute('event.id', eventId);
    return prisma.event.findUnique({ where: { id: eventId } });
  });

  if (!event) return;

  // Fetch attendees
  const attendees = await withJobSpan('fetch-attendees', async (span) => {
    span.setAttribute('event.id', eventId);
    const result = await prisma.eventMember.findMany({
      where: { eventId, notifyReminders: true },
    });
    span.setAttribute('attendees.count', result.length);
    return result;
  });

  // Send notifications
  await withJobSpan('send-notifications', async (span) => {
    span.setAttribute('notifications.count', attendees.length);
    await Promise.all(
      attendees.map((a) => sendNotification(a.userId, event, minutesBefore))
    );
  });
}
```

**Result**: Worker span has 3 child spans:
- `fetch-event`
- `fetch-attendees`
- `send-notifications`

---

### Manual Spans

For any business logic, create manual spans:

```typescript
// apps/api/src/services/payment.service.ts
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('payment-service');

export async function processPayment(userId: string, amount: number) {
  const span = tracer.startSpan('payment.process', {
    attributes: {
      'user.id': userId,
      'payment.amount': amount,
      'payment.currency': 'EUR',
    },
  });

  try {
    // Call payment provider
    const result = await stripe.charges.create({
      amount: amount * 100,
      currency: 'eur',
      customer: userId,
    });

    span.setAttribute('payment.id', result.id);
    span.setAttribute('payment.status', result.status);
    span.setStatus({ code: SpanStatusCode.OK });

    return result;
  } catch (error) {
    span.recordException(error);
    span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
    throw error;
  } finally {
    span.end();
  }
}
```

**Or use the helper**:

```typescript
import { withJobSpan } from '@appname/observability';

export async function processPayment(userId: string, amount: number) {
  return withJobSpan(
    'payment.process',
    async (span) => {
      span.setAttribute('user.id', userId);
      span.setAttribute('payment.amount', amount);

      const result = await stripe.charges.create({
        amount: amount * 100,
        currency: 'eur',
        customer: userId,
      });

      span.setAttribute('payment.id', result.id);
      return result;
    },
    { 'payment.currency': 'EUR' }
  );
}
```

---

## Frontend Examples

### User Interactions

Track critical user flows:

```typescript
// apps/web/src/features/events/components/EventForm.tsx
'use client';

import { withBrowserSpan } from '@appname/observability/browser';
import { useMutation } from '@tanstack/react-query';

export function EventForm() {
  const createEventMutation = useMutation({
    mutationFn: async (data: EventInput) => {
      return withBrowserSpan(
        'user.create_event',
        async (span) => {
          span.setAttribute('event.visibility', data.visibility);
          span.setAttribute('event.category', data.categoryId);

          // GraphQL mutation (automatically includes traceparent header)
          const result = await gqlClient.request(CREATE_EVENT, { input: data });

          span.setAttribute('event.id', result.createEvent.id);
          return result;
        },
        {
          'user.action': 'form_submit',
          'form.name': 'event_create',
        }
      );
    },
  });

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      createEventMutation.mutate(formData);
    }}>
      {/* form fields */}
    </form>
  );
}
```

**Result**:
- Frontend span: `user.create_event`
  - Backend span: `graphql.operation.CreateEvent` (child via traceparent)
    - Worker span: `job.event-reminders.send` (grandchild)

---

### API Calls

API calls **automatically include traceparent** via `requestMiddleware`.

```typescript
// apps/web/src/lib/api/client.ts
import { GraphQLClient } from 'graphql-request';
import { injectTraceHeaders } from '@appname/observability/browser';

export const gqlClient = new GraphQLClient(env.apiUrl, {
  credentials: 'include',
  requestMiddleware: (request) => {
    const headers = injectTraceHeaders(request.headers);
    return { ...request, headers };
  },
});
```

**For manual fetch**:

```typescript
import { injectTraceHeaders } from '@appname/observability/browser';

async function uploadImage(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const headers = injectTraceHeaders({
    'X-Upload-Type': 'avatar',
  });

  return fetch('/api/upload', {
    method: 'POST',
    headers,
    body: formData,
  });
}
```

---

### Error Tracking

Errors are **automatically tracked** by `ErrorBoundary` with trace context.

```typescript
// apps/web/src/app/layout.tsx
import { ErrorBoundary } from '@/components/ui/error-boundary';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ErrorBoundary
          onError={(error, errorInfo) => {
            // Optional: send to Sentry
            const traceId = getCurrentTraceId();
            Sentry.captureException(error, {
              contexts: {
                trace: { trace_id: traceId },
                react: { componentStack: errorInfo.componentStack },
              },
            });
          }}
        >
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
```

**Manual error tracking**:

```typescript
import { getCurrentTraceId, getCurrentSpanId } from '@appname/observability/browser';

try {
  await riskyOperation();
} catch (error) {
  const traceId = getCurrentTraceId();
  const spanId = getCurrentSpanId();

  console.error('Operation failed', {
    error,
    traceId,
    spanId,
    route: window.location.pathname,
  });

  // Send to error tracking service
  Sentry.captureException(error, {
    contexts: {
      trace: { trace_id: traceId, span_id: spanId },
    },
  });
}
```

---

## 🔍 Debugging: Find Correlated Data in Grafana

### 1. Start with a trace

1. Go to **Grafana → Explore → Tempo**
2. Find a trace (e.g., search for `CreateEvent`)
3. Click on the trace → see full waterfall
4. Copy the **trace_id** (e.g., `abc123def456`)

### 2. Find all logs for that trace

1. Go to **Grafana → Explore → Loki**
2. Run query:

```logql
{service_name=~"miglee-.*"} | json | trace_id="abc123def456"
```

**Result**: All logs across API, workers, web that share the same trace!

### 3. Find metrics for that trace

1. Go to **Grafana → Explore → Prometheus**
2. Run query:

```promql
# Request duration for this operation
histogram_quantile(0.95, 
  sum(rate(http_server_request_duration_seconds_bucket{
    route="/graphql", 
    operation="CreateEvent"
  }[5m])) by (le)
)
```

---

## 💡 Best Practices

### 1. **Keep span names low-cardinality**

❌ **Bad**: `user.click.button.submit.form.create_event.page.events.tab.details`
✅ **Good**: `user.create_event`

❌ **Bad**: `fetch-user-${userId}` (high cardinality!)
✅ **Good**: `fetch-user` + attribute `user.id`

### 2. **Use attributes for high-cardinality data**

```typescript
// ❌ Bad
const span = tracer.startSpan(`payment-${paymentId}`);

// ✅ Good
const span = tracer.startSpan('payment.process');
span.setAttribute('payment.id', paymentId);
```

### 3. **Don't trace everything**

- ✅ Trace: Business operations, external calls, critical paths
- ❌ Don't trace: Utility functions, simple getters, loops

### 4. **Consistent naming**

- **Backend**: `service.operation` (e.g., `payment.process`, `notification.send`)
- **Frontend**: `user.action` (e.g., `user.create_event`, `user.submit_form`)
- **Workers**: `job.queue.operation` (auto-generated)

### 5. **Use span attributes for filtering**

```typescript
span.setAttribute('user.subscription', 'pro');
span.setAttribute('event.visibility', 'public');
span.setAttribute('payment.amount', 1999);
```

**Then in Grafana**:

```traceql
{ span.user.subscription = "pro" && span.event.visibility = "public" }
```

---

## 🎯 Quick Reference

| Use Case | Function | Location |
|----------|----------|----------|
| GraphQL auto-tracing | `mercuriusTracingPlugin()` | `@appname/observability/graphql` |
| BullMQ producer | `addJobWithTrace()` | `@appname/observability` |
| BullMQ consumer | `createWorker()` | `@appname/observability` |
| Manual span | `withJobSpan()` | `@appname/observability` |
| Frontend span | `withBrowserSpan()` | `@appname/observability/browser` |
| Get trace ID | `getCurrentTraceId()` | `@appname/observability/browser` |
| Inject headers | `injectTraceHeaders()` | `@appname/observability/browser` |
| Error boundary | `<ErrorBoundary>` | `@/components/ui/error-boundary` |

---

**More questions?** Check [Quick Start Guide](./QUICK-START.md) or [Implementation Guide](./PHASE-2-3-IMPLEMENTATION.md)! 🚀

