# 📊 Grafana Dashboards Guide

## Available Dashboards

### 1. 🚀 API Overview (GraphQL RED)

**URL:** http://localhost:3001/d/api-overview

**Purpose:** Monitor GraphQL API performance using RED metrics (Rate, Errors, Duration)

**Features:**

- ⚡ **Request Rate** - Total GraphQL requests per second
- ❌ **Error Rate** - Percentage of failed operations
- ⏱️ **Latency** - p50, p75, p90, p95, p99 percentiles
- 🔍 **Per-Operation Breakdown** - See which GraphQL operations are slowest/most used
- 📊 **Operation Type Analysis** - Query vs Mutation distribution
- 📋 **Summary Table** - All operations with key metrics at a glance

**Filters:**

- **Service** - Select API service (appname-api)
- **Operation** - Filter by specific GraphQL operation name (or "All")

**Key Metrics:**

```promql
# Request Rate
sum(rate(app_calls_total{service_name="appname-api", graphql_operation_name!=""}[5m]))

# Error Rate %
100 * sum(rate(app_calls_total{status_code="STATUS_CODE_ERROR"}[5m]))
  / sum(rate(app_calls_total[5m]))

# Latency p95
histogram_quantile(0.95,
  sum(rate(app_duration_milliseconds_bucket[5m])) by (le)
)
```

---

### 2. 📋 Logs Explorer

**URL:** http://localhost:3001/d/logs-explorer

**Purpose:** Search and analyze application logs from Loki

**Features:**

- 📝 **Live Log Stream** - Real-time logs from all services
- 📊 **Log Volume** - Visualize log patterns over time
- 🔍 **Log Level Analysis** - Distribution of error/warn/info/debug logs
- ⚠️ **Error & Warning Logs** - Dedicated panels for errors and warnings
- 📈 **Quick Filters** - Pre-built filters for common patterns (errors, exceptions, timeouts)

**Filters:**

- **Service** - Select which service to view logs from (Docker containers OR local API)
- **Search** - Free-text search across all log messages

**📋 Log Sources:**

The Logs Explorer collects logs from **two sources**:

1. **Docker Containers** (via Promtail):
   - `otel-collector`, `loki`, `tempo`, `prometheus`, `grafana`
   - Label: `compose_service=<service-name>`

2. **Local API** (via OpenTelemetry):
   - API running with `pnpm dev:api:obs`
   - Label: `exporter=OTLP, job=appname-api`
   - ✅ **Already configured!** Logs are sent via `pino-opentelemetry-transport`

**🚀 Features:**

- **Dual-mode logging**: See logs in terminal (pino-pretty) AND Loki simultaneously
- **Trace correlation**: Logs include `trace_id` and `span_id` for linking to traces
- **Structured JSON**: All logs are parsed and searchable by fields

---

### 3. 🎨 Web Vitals - Enhanced

**URL:** http://localhost:3001/d/web-vitals

**Purpose:** Monitor frontend performance using Core Web Vitals

**Features:**

- 📊 **Core Web Vitals Overview** - LCP, INP, CLS, FCP, TTFB
- 🎯 **Performance Scores** - % of users with "Good" experience
- 📈 **Percentile Tracking** - p50, p75, p90, p95, p99 for each metric
- 🥧 **Distribution Charts** - Good/Needs Improvement/Poor breakdown
- 🔍 **Per-Route Analysis** - Compare performance across different pages

**Filters:**

- **Route** - Filter by specific page/route (or "All")

**Google Web Vitals Thresholds:**

- **LCP** (Largest Contentful Paint): Good <2.5s, Poor >4s
- **INP** (Interaction to Next Paint): Good <200ms, Poor >500ms
- **CLS** (Cumulative Layout Shift): Good <0.1, Poor >0.25
- **FCP** (First Contentful Paint): Good <1.8s, Poor >3s
- **TTFB** (Time to First Byte): Good <800ms, Poor >1.8s

---

## 🚀 Quick Start

### 1. Start Observability Stack

```bash
cd /Users/abartski/dev-vibe/miglee
pnpm obs:up
```

### 2. Start Application with Observability

```bash
# Option A: Both API and Web
pnpm dev:obs

# Option B: API only
pnpm dev:api:obs

# Option C: Web only
pnpm dev:web:obs
```

### 3. Access Grafana

Open http://localhost:3001

- Username: `admin`
- Password: `admin`

### 4. Generate Traffic

```bash
# GraphQL queries
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"query GetMe { me { id name } }"}'

# Or just browse the app at http://localhost:3000
```

### 5. View Dashboards

- API Overview: http://localhost:3001/d/api-overview
- Logs Explorer: http://localhost:3001/d/logs-explorer
- Web Vitals: http://localhost:3001/d/web-vitals

---

## 📝 Understanding GraphQL Metrics

### How GraphQL Operations are Tracked

When you run a GraphQL query:

```graphql
query GetUserProfile {
  me {
    id
    name
    email
  }
}
```

OpenTelemetry captures:

- **Operation Name:** `GetUserProfile`
- **Operation Type:** `query`
- **Duration:** Time to execute
- **Status:** Success or error

These are exported as metrics:

- `app_calls_total{graphql_operation_name="GetUserProfile", graphql_operation_type="query"}`
- `app_duration_milliseconds_bucket{graphql_operation_name="GetUserProfile"}`

### Anonymous Operations

If you send a query without a name:

```graphql
{
  me {
    id
  }
}
```

It will be tracked as:

- **Operation Name:** `anonymous`

**Best Practice:** Always name your GraphQL operations for better observability!

---

## 🔧 Troubleshooting

### Dashboard shows "No data"

**Check 1: Is observability stack running?**

```bash
docker ps | grep -E "(otel-collector|grafana|prometheus|tempo|loki)"
```

**Check 2: Is API running with observability?**

```bash
# Check if OTEL variables are set
env | grep OTEL

# Should see:
# OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
# OTEL_ENABLE_TRACING=true
# OTEL_ENABLE_METRICS=true
```

**Check 3: Are metrics being collected?**

```bash
# Check Prometheus
curl -s 'http://localhost:9090/api/v1/query?query=app_calls_total' | jq '.data.result | length'

# Should return a number > 0
```

**Check 4: Is collector healthy?**

```bash
docker logs otel-collector --tail 20
# Should see "Everything is ready. Begin running and processing data."
```

### Logs Explorer is empty

**Check 1: Is API running with observability?**

```bash
# Start API with observability
pnpm dev:api:obs

# Check if OTEL endpoint is configured
env | grep OTEL_EXPORTER_OTLP_ENDPOINT
```

**Check 2: Are logs being sent to Collector?**

```bash
# Check Collector metrics
curl -s http://localhost:8888/metrics | grep 'otelcol_exporter_sent_log_records{exporter="loki"'

# Should show a number > 0
```

**Check 3: Verify logs in Loki**

```bash
# Query Loki for OTLP logs
curl -s -G 'http://localhost:3100/loki/api/v1/query' \
  --data-urlencode 'query={exporter="OTLP"}' \
  --data-urlencode 'limit=1' | jq '.data.result | length'

# Should return 1 if logs exist
```

### GraphQL operations show as "POST" instead of operation name

**Reason:** API is not running with the latest code that adds GraphQL tracing.

**Solution:**

1. Stop API: `pkill -f "node.*apps/api"`
2. Restart with observability: `pnpm dev:api:obs`
3. Generate traffic
4. Wait 15-20 seconds for metrics to flush

---

## 📚 Additional Resources

- [OpenTelemetry Docs](https://opentelemetry.io/docs/)
- [Grafana Docs](https://grafana.com/docs/)
- [Google Web Vitals](https://web.dev/vitals/)
- [GraphQL Best Practices](https://graphql.org/learn/best-practices/)

---

## 🎯 Next Steps

1. **Set up Alerting** - Configure alerts for high error rates or slow operations
2. **Add Custom Metrics** - Track business-specific metrics (signups, purchases, etc.)
3. **Production Setup** - Deploy to Kubernetes with proper retention and scaling
4. **Distributed Tracing** - Explore traces in Tempo to debug slow operations

For production deployment, see: `/docs/observability/kubernetes-deployment.md`
