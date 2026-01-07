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

```graphqlm
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

---

## 🏗️ Infrastructure Dashboards (Production-Ready Recommendations)

### Goals and Design Principles

**Primary Goal:** Answer these questions in 30-60 seconds:

1. Does the platform have resources? (CPU/RAM/Disk/Network)
2. Is there overload or degradation? (throttling, OOM, IO wait, storage latency)
3. Which service is at fault? (API vs Postgres vs Redis vs Tempo/Loki/Prometheus/Collector)
4. Is the problem local or systemic? (one container/node vs entire cluster)

**Design Principles (avoid "monitoring porn"):**

- Every panel has "what this means" + "when to react"
- Prefer percentiles + trends over averages
- Full drill-down: overview → service → instance/pod → logs/traces
- Same structure for Docker Compose and Kubernetes (only metric sources differ)

---

### Minimum Production Dashboard Set

#### A. Infra Overview (NOC Dashboard - "Is there a fire?")

**Purpose:** Single screen to detect platform-wide issues.

**Required Sections:**

1. **Platform Health**
   - Uptime (Prometheus, Grafana, Loki, Tempo, OTel Collector)
   - Scrape success rate / scrape duration
   - Queue / backlog (BullMQ/Redis if applicable)

2. **Compute**
   - CPU usage (%) + CPU throttling (critical for K8s)
   - Load average / runnable processes (for nodes)

3. **Memory**
   - Memory usage (%) + OOM kills (or restart count)
   - Working set vs limit (K8s) / RSS (Docker)

4. **Storage**
   - Disk free %
   - Disk IO latency / IO wait (often mistaken for code issues)

5. **Network**
   - Network in/out (per node and per service)
   - Connection errors / resets

6. **Top Offenders**
   - Top N: CPU by service
   - Top N: Memory by service
   - Top N: Restarts by service
   - Top N: Disk I/O by service

**Alert Thresholds:**

- CPU usage: >85% for 10 min (warning), >95% for 5 min (critical)
- CPU throttling: >5% for 10 min (warning), >15% for 5 min (critical)
- Memory usage: >90% of limit for 10 min (warning), >95% for 5 min (critical)
- OOM kills / restart loop: immediate (critical)
- Disk free: <15% (warning), <8% (critical)
- IO wait: >10% for 10 min (warning), >20% for 5 min (critical)

---

#### B. Service Runtime (Per Service Deep Dive)

**Purpose:** Answer "Is this service sick internally, or hit by external factors?"

**Applies to:** API, Web, Worker, OTel Collector, Grafana, etc.

**Required Panels:**

1. **Runtime Metrics**
   - RPS / throughput (for application services)
   - CPU / Memory (with limits)
   - Restarts / OOM / exit codes
   - Network (connections, errors)

2. **Node.js Specific (API/Workers)**
   - Event loop lag (p95)
   - Heap used / heap limit
   - GC pauses (p95)
   - Unhandled rejections / exceptions

3. **Dependency Saturation**
   - Number of connections to Postgres from API
   - Redis connection pool usage

**Alert Thresholds:**

- Event loop lag p95: >200ms for 5 min (warning), >500ms for 5 min (critical)
- Heap usage: >85% for 10 min (warning), >92% for 5 min (critical)

---

#### C. Postgres Infra

**Purpose:** Separate dashboard for database health (DB is always a separate world).

**Required Panels:**

1. **Connections & Saturation**
   - Active connections / max
   - Idle vs active
   - Connection wait / pool saturation

2. **Query Performance**
   - Transactions/sec
   - Query time p95
   - Slow queries count (top N)

3. **Locks & Contention**
   - Locks count (by type)
   - Longest lock age
   - Deadlocks

4. **Vacuum / Bloat (Production Recommended)**
   - Dead tuples / bloat indicators
   - Autovacuum activity
   - Table/index size growth

**Alert Thresholds:**

- Active connections: >80% of max for 10 min (warning), >90% for 5 min (critical)
- Query time p95: 2× baseline for 10 min (warning)
- Deadlocks: >0 in 5 min (critical)
- Long lock: >30s (warning), >120s (critical)

---

#### D. Redis Infra ✅ **PRODUCTION READY (P0 Complete)**

**Status:** ✨ **Upgraded to Production Ready** (v2) - [Full details](./REDIS-DASHBOARD-UPGRADE.md) | [Quick Start](./REDIS-DASHBOARD-QUICKSTART.md)

**Purpose:** Cache performance and memory pressure monitoring with production-grade observability.

**Dashboard:** `redis-infra-v2.json` (20 panels, 4 rows)

**Key Improvements (P0):**

- ✅ Variables: `instance` + `env` (multi-instance support)
- ✅ Memory Usage % (hero gauge with thresholds)
- ✅ Blocked Clients (critical for BullMQ/performance)
- ✅ Rejected Connections (capacity exhaustion detection)
- ✅ Hit Ratio timeseries (trend analysis)
- ✅ Keys growth tracking (leak detection)
- ✅ Flap detection (uptime timeline)

**Required Panels (Implemented):**

1. **Health & Status**
   - META: Up (timeline - detect flaps)
   - META: Status (current)
   - META: Uptime

2. **Memory & Eviction (HERO METRICS)**
   - SAT: Memory Usage % (hero gauge) ⭐
   - ERR: Evictions Rate (MUST BE 0) ⭐
   - SAT: Fragmentation Ratio
   - SAT: Memory Used vs RSS vs Max
   - SAT: Keys Count & Growth

3. **Cache Efficiency (SLO)**
   - SLO: Cache Hit Ratio (gauge)
   - SLO: Hit Ratio (timeseries) ⭐
   - SLO: Hits vs Misses/sec
   - SAT: Expired Keys/sec
   - SLO: Commands/sec

4. **Latency & Blocking (CRITICAL)**
   - ERR: Blocked Clients ⭐ (P0!)
   - ERR: Rejected Connections/sec ⭐ (P0!)
   - SAT: Connected Clients

**Alert Thresholds (Production):**

- **CRITICAL:**
  - Evictions: >0 sustained for 30 min (memory exhaustion)
  - Rejected connections: >0 for 5 min (capacity exhausted)
  - Blocked clients: >5 for 15 min (contention)
  - Memory: >95% for 5 min
  - Down: min_over_time(redis_up[5m]) < 1
- **WARNING:**
  - Memory: >90% for 10 min
  - Hit ratio: <80% for 15 min
  - Fragmentation: >1.5 for 30 min
  - Evictions: >0 for 10 min (early warning)

**Next Steps (P1):**

- [ ] BullMQ queue metrics (separate dashboard - critical for your stack)
- [ ] Persistence metrics (RDB/AOF) if Redis persists data
- [ ] Infra correlation (CPU/mem/throttling) - link exists, can embed

**Migration:** Old dashboard (`redis-infra.json`) kept for comparison. Use v2 for production.

---

#### E. Observability Stack Health (Meta-Monitoring)

**Purpose:** Monitor the monitoring system ("so your eyes don't go dark").

**Required Panels:**

1. **OTel Collector**
   - Receiver throughput (spans/logs/metrics)
   - Dropped spans/logs/metrics (CRITICAL)
   - Exporter failures / retries
   - Queue size / backpressure

2. **Prometheus**
   - TSDB head series
   - Ingestion rate
   - Query duration p95
   - Memory / CPU
   - Target scrape down count

3. **Loki/Tempo (Recommended)**
   - Ingestion rate
   - Query latency p95
   - Errors rate
   - Storage / compaction issues

**Alert Thresholds:**

- Dropped telemetry: >0 for 5 min (critical)
- Exporter failures: >0 for 5 min (critical)
- Targets down: >0 for 5 min (warning), >10 min (critical)
- Prometheus query duration p95: >2s for 10 min (warning), >5s for 5 min (critical)

---

### Metrics Sources by Environment

#### Docker Compose (Local / Dev)

**Container Metrics (cAdvisor):**

```
container_cpu_usage_seconds_total
container_memory_working_set_bytes
container_memory_rss
container_network_receive_bytes_total
container_network_transmit_bytes_total
container_fs_usage_bytes
```

**Host Metrics (node_exporter):**

```
node_cpu_seconds_total{mode="idle|system|user|iowait"}
node_load1, node_load5, node_load15
node_memory_MemAvailable_bytes
node_filesystem_avail_bytes
node_disk_read_bytes_total
node_disk_io_time_seconds_total
```

**Postgres (postgres_exporter):**

```
pg_stat_activity_count
pg_settings_max_connections
pg_database_size_bytes
pg_stat_database_xact_commit
pg_locks_count
```

**Redis (redis_exporter):**

```
redis_memory_used_bytes
redis_memory_max_bytes
redis_mem_fragmentation_ratio
redis_connected_clients
redis_keyspace_hits_total
redis_keyspace_misses_total
redis_evicted_keys_total
```

**OTel Collector (self-metrics):**

```
otelcol_receiver_accepted_spans
otelcol_receiver_refused_spans
otelcol_processor_dropped_spans
otelcol_exporter_send_failed_spans
otelcol_exporter_queue_size
```

**Prometheus (self-metrics):**

```
up
scrape_duration_seconds
prometheus_tsdb_head_series
prometheus_tsdb_head_chunks
prometheus_engine_query_duration_seconds
```

**Service Label Mapping (Docker Compose):**

```
container_label_com_docker_compose_service
```

---

#### Kubernetes (Production)

**Pod/Container (kubelet/cAdvisor):**

```
container_cpu_usage_seconds_total
container_cpu_cfs_throttled_seconds_total  # CRITICAL for K8s
container_memory_working_set_bytes
```

**Cluster State (kube-state-metrics):**

```
kube_pod_status_phase
kube_pod_container_status_ready
kube_pod_container_status_restarts_total
kube_pod_container_status_last_terminated_reason  # OOMKilled detection
kube_pod_container_resource_requests
kube_pod_container_resource_limits
kube_deployment_status_replicas_available
kube_node_status_condition
```

**Node (node_exporter as DaemonSet):**

```
Same as Docker Compose node metrics
```

**Postgres/Redis in K8s:**

- Option A: Managed (RDS/Elasticache) - use provider metrics
- Option B: Self-hosted - same exporters + K8s resource metrics

**Service Label Mapping (Kubernetes):**

```
namespace, pod, container → map to "service" via relabel rules
```

---

### Label Standards and Required Filters

**Global Template Variables (MUST HAVE):**

- `env` (dev/stage/prod)
- `service` (api, web, worker-\*, postgres, redis, prometheus, grafana, loki, tempo, otel-collector)
- `instance` (host:port / pod name)
- `namespace` (K8s; constant "local" for Compose)
- `container` (container name)

**Every panel MUST respect at least:** `env` + `service`

**Panel Naming Convention:**

- `SLO:` - symptom affecting users
- `SAT:` - saturation / limit
- `ERR:` - errors
- `DEP:` - dependency
- `META:` - monitoring the monitoring

---

### Definition of Done (DoD) - Dashboard Checklist

**Global Requirements (all dashboards):**

- [ ] Has template variables: env, service, instance, namespace, container
- [ ] Each panel follows naming convention (SLO/SAT/ERR/DEP/META)
- [ ] Drill-down links: to Loki (logs), Tempo (traces), related dashboards
- [ ] "Related dashboards" section at top (minimum 3 links)

**Per Dashboard:**

**Infra Overview:**

- [ ] Platform health section (META: Up, Scrape errors, Scrape duration)
- [ ] Compute section (SAT: CPU usage, CPU throttling, Load)
- [ ] Memory section (SAT: Memory usage, ERR: OOM kills, SAT: Memory pressure)
- [ ] Storage section (SAT: Disk free, SAT: IO wait, SAT: FS errors)
- [ ] Network section (SAT: Net in/out, ERR: TCP resets, SAT: Connections)
- [ ] Top offenders (Top 10 CPU, Memory, Restarts, Error logs)

**Service Runtime:**

- [ ] Runtime section (SAT: CPU%, Memory%, ERR: Restarts, SAT: FD/handles, SAT: Network)
- [ ] Node.js section (SAT: Event loop lag, SAT: Heap, SAT: GC, ERR: Exceptions)
- [ ] SLO section (SLO: RPS, SLO: Duration p50/p95/p99, ERR: 5xx rate)

**Postgres Infra:**

- [ ] Connections section (SAT: Active/max, SAT: Idle vs active, SAT: Pool saturation)
- [ ] Query performance (SLO: TX/sec, SLO: Query time p95, SAT: Slow queries)
- [ ] Locks section (ERR: Locks count, ERR: Lock age, SAT: Deadlocks)
- [ ] Vacuum section (SAT: Dead tuples, SAT: Autovacuum, SAT: Size growth)

**Redis Infra:**

- [ ] Memory section (SAT: Used/max, SAT: Fragmentation, ERR: Evictions, SAT: Keys)
- [ ] Performance section (SLO: Commands/sec, SLO: Hit/Miss ratio, SAT: Clients, ERR: Rejected)

**Observability Stack Health:**

- [ ] OTel Collector (META: Throughput, META: Drops, META: Failures, META: Queue)
- [ ] Prometheus (META: Series, META: Ingestion, META: Query duration, META: Scrape down)
- [ ] Loki/Tempo (META: Ingestion, META: Query latency, META: Errors, META: Compaction)

**Alerts (for each critical threshold):**

- [ ] Alert rule defined
- [ ] Runbook with: description, 3 verification steps, links to dashboards/logs/traces
- [ ] Link to runbook in alert annotation

---

### Retention and Cardinality Requirements

**Retention (Production):**

- Prometheus: 30-90 days (metrics)
- Loki: 14-30 days (logs)
- Tempo: 3-7 days (traces)

**Cardinality (CRITICAL):**

- ⚠️ **DO NOT** use as labels: `userId`, `trace_id`, `span_id`, full URLs, full GraphQL queries
- ✅ **USE** as labels: `env`, `service`, `instance`, `namespace`, `container`
- Monitor: `prometheus_tsdb_head_series` (alert if sudden spike)
- Monitor: GraphQL operation name cardinality (alert if >100 unique operations)

---

### Implementation Checklist

**Phase 1: Metrics Collection (Foundation)**

- [ ] cAdvisor deployed (Docker Compose) OR kubelet metrics configured (K8s)
- [ ] node_exporter deployed (DaemonSet for K8s)
- [ ] postgres_exporter deployed and scraping
- [ ] redis_exporter deployed and scraping
- [ ] OTel Collector self-metrics exposed (port 8888)
- [ ] Prometheus self-monitoring enabled
- [ ] kube-state-metrics deployed (K8s only)

**Phase 2: Service Label Unification (CRITICAL)**

- [ ] Decided on service label source:
  - Docker: `container_label_com_docker_compose_service`
  - K8s: `namespace/pod/container` mapped to `service` via relabel
  - OTel: `service.name` mapped to Prometheus `service_name`
- [ ] All dashboards use consistent service label
- [ ] Verified with test queries

**Phase 3: Dashboard Creation**

- [ ] Infra Overview created and tested
- [ ] Service Runtime template created (works for API, Web, Worker, Collector)
- [ ] Postgres Infra created and tested
- [ ] Redis Infra created and tested
- [ ] Observability Stack Health created and tested

**Phase 4: Alerting**

- [ ] Alert rules created for all critical thresholds
- [ ] Runbooks written (one per alert)
- [ ] Notification channels configured (Slack, PagerDuty, email)
- [ ] Test alerts fired and verified
- [ ] Escalation policy documented

**Phase 5: Documentation**

- [ ] Metric sources documented (per environment)
- [ ] Dashboard guide updated
- [ ] Runbooks added to alert annotations
- [ ] On-call playbook created
- [ ] Backup/restore procedures documented

---

### Critical Risks and Anti-Patterns

**Risks (what you'll be blind to if you skip):**

| If you skip...         | You'll be blind to...                          |
| ---------------------- | ---------------------------------------------- |
| CPU throttling metrics | "CPU looks fine but service is slow"           |
| IO wait monitoring     | Disk issues masquerading as DB/Prisma problems |
| Connection saturation  | DB/Redis connection pool exhaustion            |
| Meta-monitoring        | Observability stack failure during incidents   |

**Anti-Patterns to Avoid:**

- ❌ Using averages instead of percentiles (hides outliers)
- ❌ No drill-down links (dead-end dashboards)
- ❌ High-cardinality labels (Prometheus explodes)
- ❌ Missing "what this means" context (confusion during incidents)
- ❌ Alerts without runbooks (panic during pages)
- ❌ Same retention for all data (cost explosion)

---

### Compatibility: Compose → Kubernetes Migration

**Design for portability:**

1. **Same dashboard structure** - only metric sources change
2. **Use variables** - `env`, `service`, `instance` work in both
3. **Abstract service label** - define once, map differently per environment
4. **Test with both** - verify dashboards work in dev (Compose) and prod (K8s)

**Example: CPU Usage Panel**

```promql
# Docker Compose version
rate(container_cpu_usage_seconds_total{
  container_label_com_docker_compose_service=~"$service"
}[5m])

# Kubernetes version
rate(container_cpu_usage_seconds_total{
  pod=~"$service.*",
  namespace="$namespace"
}[5m])

# Universal version (with relabeling)
rate(container_cpu_usage_seconds_total{
  service="$service",  # mapped via relabel rules
  env="$env"
}[5m])
```

---

## 🎯 Next Steps

### For Existing Application Dashboards

1. **Set up Alerting** - Configure alerts for high error rates or slow operations
2. **Add Custom Metrics** - Track business-specific metrics (signups, purchases, etc.)
3. **Production Setup** - Deploy to Kubernetes with proper retention and scaling
4. **Distributed Tracing** - Explore traces in Tempo to debug slow operations

### For New Infrastructure Dashboards (Recommended)

1. **Assess Current State** - Which metrics sources are already available?
2. **Deploy Missing Exporters** - postgres_exporter, redis_exporter, node_exporter
3. **Unify Service Labels** - Decide on label mapping strategy (Docker vs K8s vs OTel)
4. **Start with Infra Overview** - Single "NOC" dashboard for platform health
5. **Add Service Runtime** - Deep dive per service (API, Worker, Collector)
6. **Complete the Set** - Postgres, Redis, Observability Stack Health
7. **Configure Alerts** - Critical thresholds first, nice-to-haves later
8. **Write Runbooks** - For each alert, document "what now?"
9. **Test in Staging** - Before production deployment
10. **Monitor Cardinality** - Continuous vigilance to prevent metric explosion

For production deployment, see: `/docs/observability/kubernetes-deployment.md`
