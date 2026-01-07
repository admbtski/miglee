# 🏗️ Infrastructure Monitoring - Setup Guide

## ✅ What Was Implemented

### 1. Metrics Exporters Added

| Exporter              | Purpose                                                   | Status    | Port |
| --------------------- | --------------------------------------------------------- | --------- | ---- |
| **cAdvisor**          | Container metrics (CPU/Memory/Network/Disk per container) | ✅ Active | 8080 |
| **node_exporter**     | Host metrics (CPU/Memory/Disk/Network for host machine)   | ✅ Active | 9100 |
| **postgres_exporter** | PostgreSQL database metrics                               | ✅ Active | 9187 |
| **redis_exporter**    | Redis cache metrics                                       | ✅ Active | 9121 |

### 2. Dashboards Created

| Dashboard                      | Purpose                                        | Panels | Status      |
| ------------------------------ | ---------------------------------------------- | ------ | ----------- |
| **Infra Overview**             | NOC "Is there a fire?" dashboard               | 19     | ✅ Complete |
| **Observability Stack Health** | Meta-monitoring (monitor the monitoring)       | 16     | ✅ Complete |
| **Service Runtime**            | Per-service deep dive (template)               | 10     | ✅ Complete |
| **Postgres Infra**             | Database monitoring (merged + enhanced)        | 19     | ✅ Complete |
| **Redis Infra**                | Cache monitoring (P0 + advanced, v2+v3 merged) | 25     | ✅ Complete |

### 3. Prometheus Configuration

- ✅ Scrape jobs configured for all exporters (cAdvisor, node_exporter, postgres_exporter, redis_exporter)
- ✅ Label relabeling to add `service` and `env` labels
- ✅ All scrape jobs active and collecting metrics

---

## 🚀 Quick Start

### 1. Start Infrastructure Monitoring

```bash
# Stop current observability stack (if running)
pnpm obs:down

# Start with infrastructure exporters
pnpm obs:up

# Verify all services are running
docker compose -f infra/observability/docker-compose.observability.yml ps
```

**Expected services:**

- ✅ grafana
- ✅ prometheus
- ✅ tempo
- ✅ loki
- ✅ promtail
- ✅ otel-collector
- ✅ cadvisor
- ✅ node-exporter
- ✅ postgres-exporter
- ✅ redis-exporter

### 2. Access Dashboards

| Dashboard                      | URL                                                |
| ------------------------------ | -------------------------------------------------- |
| **Grafana**                    | http://localhost:3001 (admin/admin)                |
| **Infra Overview**             | http://localhost:3001/d/infra-overview             |
| **Observability Stack Health** | http://localhost:3001/d/observability-stack-health |
| **Service Runtime**            | http://localhost:3001/d/service-runtime            |
| **Postgres Infra**             | http://localhost:3001/d/postgres-infra             |
| **Redis Infra**                | http://localhost:3001/d/redis-infra                |
| **cAdvisor UI** (optional)     | http://localhost:8080                              |

### 3. Verify Metrics Are Being Scraped

```bash
# Check Prometheus targets (should all be "up")
curl -s http://localhost:9090/api/v1/targets | jq '.data.activeTargets[] | {job: .labels.job, health: .health}'

# Check cAdvisor metrics
curl -s http://localhost:9090/api/v1/query --data-urlencode 'query=container_cpu_usage_seconds_total' | jq '.data.result | length'

# Check node_exporter metrics
curl -s http://localhost:9090/api/v1/query --data-urlencode 'query=node_cpu_seconds_total' | jq '.data.result | length'

# Check postgres_exporter metrics
curl -s http://localhost:9090/api/v1/query --data-urlencode 'query=pg_up' | jq '.data.result | length'

# Check redis_exporter metrics
curl -s http://localhost:9090/api/v1/query --data-urlencode 'query=redis_up' | jq '.data.result | length'
```

**Expected output:**

- All targets should have `health: "up"`
- cAdvisor query should return > 0 results
- node_exporter query should return > 0 results
- postgres_exporter query should return 1 (pg_up = 1)
- redis_exporter query should return 1 (redis_up = 1)

### 4. Generate Some Load (Optional)

To see metrics in action, start your applications:

```bash
# Terminal 1: Start API with observability
pnpm dev:api:obs

# Terminal 2: Start Web with observability
pnpm dev:web:obs

# Terminal 3: Generate traffic
./check-web-vitals-samples.sh
```

---

## 📊 Dashboard Overview

### Infra Overview (NOC Dashboard)

**Access:** http://localhost:3001/d/infra-overview

**Sections:**

1. **Platform Health** - All observability services status
2. **Compute** - CPU usage by service, Host CPU by mode
3. **Memory** - Memory usage by service, Host memory availability
4. **Storage** - Disk free %, Disk IO time
5. **Network** - Network traffic by service
6. **Top Offenders** - Top 10 CPU, Memory, Restarts

**Key Metrics:**

- `META: Platform Services Up` - Should all be 1 (UP)
- `META: Scrape Targets Down` - Should be 0
- `SAT: CPU Usage % by Service` - Per-container CPU usage
- `SAT: Memory Usage by Service` - Per-container memory usage
- `SAT: Disk Free %` - Should be > 15% (warning threshold)

**When to React:**

- ⚠️ Any service DOWN → Check logs: `docker logs <service-name>`
- ⚠️ CPU > 85% sustained → Investigate top offenders, check for loops/leaks
- 🔴 Memory > 90% → Risk of OOM, check memory leaks
- 🔴 Disk < 15% → Clean up or expand storage
- 🔴 Restarts detected → Check container logs for OOM/crashes

---

### Observability Stack Health (Meta-Monitoring)

**Access:** http://localhost:3001/d/observability-stack-health

**Sections:**

1. **OpenTelemetry Collector** - Throughput, Drops, Failures, Queue, Resources
2. **Prometheus** - TSDB series, Ingestion, Query duration, Scrape failures, Resources
3. **Loki & Tempo** - Ingestion rates, Resources

**Key Metrics:**

- `META: Dropped Telemetry` - **MUST BE 0** (data loss if > 0)
- `META: Exporter Failures` - **MUST BE 0** (backend connectivity issues)
- `META: TSDB Head Series` - Monitor for cardinality explosion
- `META: Query Duration p95` - Should be < 2s (warning), < 5s (critical)
- `META: Scrape Targets Down` - Should be 0

**When to React:**

- 🔴 Dropped telemetry > 0 → OTel Collector overwhelmed, check exporter queue
- 🔴 Exporter failures > 0 → Check Tempo/Loki/Prometheus connectivity
- ⚠️ TSDB series sudden spike → Cardinality issue, check new metrics
- ⚠️ Query duration > 2s → Prometheus struggling, optimize queries or add resources

---

## 🔧 Postgres & Redis Exporters Configuration

### ✅ Already Enabled!

Postgres and Redis exporters are **already configured and running** out of the box. They connect to:

- **Postgres**: `host.docker.internal:5432/app` (from docker-compose.dev.yml)
- **Redis**: `host.docker.internal:6379` (from docker-compose.dev.yml)

### Prerequisites

Make sure you have Postgres and Redis running:

```bash
# Start your infrastructure (if not running)
pnpm dev:docker:up:infra

# Or start the full dev stack
pnpm dev:docker:up
```

### Custom Configuration (Optional)

If your Postgres/Redis are on different hosts/ports, create `.env` file in `infra/observability/`:

```bash
# Custom Postgres connection
POSTGRES_EXPORTER_DSN=postgresql://user:pass@your-host:5432/dbname?sslmode=disable

# Custom Redis connection
REDIS_EXPORTER_ADDR=redis://your-host:6379
REDIS_PASSWORD=your_password_if_needed
```

Then restart:

```bash
pnpm obs:down
pnpm obs:up
```

### Verify Connection

```bash
# Check postgres_exporter is connected
curl -s http://localhost:9187/metrics | grep pg_up
# Should show: pg_up 1

# Check redis_exporter is connected
curl -s http://localhost:9121/metrics | grep redis_up
# Should show: redis_up 1

# Or check in Prometheus
curl -s http://localhost:9090/api/v1/query --data-urlencode 'query=pg_up'
curl -s http://localhost:9090/api/v1/query --data-urlencode 'query=redis_up'
```

**Note:** If you see `pg_up 0` or `redis_up 0`, make sure:

1. Postgres/Redis are running (`pnpm dev:docker:up:infra`)
2. Connection strings are correct (check `.env` if custom)

---

## 📈 Creating Additional Dashboards

### Service Runtime Dashboard Template

**Purpose:** Per-service deep dive (API, Worker, Collector, etc.)

**Key Queries:**

```promql
# CPU Usage
sum(rate(container_cpu_usage_seconds_total{service="$service"}[5m])) * 100

# Memory Usage
sum(container_memory_working_set_bytes{service="$service"})

# Network Traffic
rate(container_network_transmit_bytes_total{service="$service"}[5m])
rate(container_network_receive_bytes_total{service="$service"}[5m])

# Restarts
changes(container_start_time_seconds{service="$service"}[1h])
```

**Create in Grafana:**

1. Go to http://localhost:3001
2. Dashboards → New → New Dashboard
3. Add panels with above queries
4. Add template variable: `service` = `label_values(container_cpu_usage_seconds_total, service)`
5. Save as "Service Runtime"

### Postgres Infra Dashboard Queries

```promql
# Connections
pg_stat_activity_count
pg_settings_max_connections

# Query Performance
rate(pg_stat_database_xact_commit[5m])
rate(pg_stat_database_xact_rollback[5m])

# Locks
pg_locks_count

# Size
pg_database_size_bytes
```

### Redis Infra Dashboard Queries

```promql
# Memory
redis_memory_used_bytes
redis_memory_max_bytes
redis_mem_fragmentation_ratio

# Performance
rate(redis_keyspace_hits_total[5m])
rate(redis_keyspace_misses_total[5m])
redis_connected_clients

# Evictions
rate(redis_evicted_keys_total[5m])
```

---

## 🐛 Troubleshooting

### Issue: cAdvisor not showing any metrics

**Symptoms:**

- `container_cpu_usage_seconds_total` query returns 0 results
- cAdvisor web UI (http://localhost:8080) shows "No containers"

**Solution:**

```bash
# Check cAdvisor logs
docker logs cadvisor

# Verify cAdvisor has access to Docker socket
docker inspect cadvisor | grep -A 5 "Mounts"

# Should see: /var/run/docker.sock mounted

# Restart cAdvisor
docker restart cadvisor
```

### Issue: node_exporter metrics missing

**Symptoms:**

- `node_cpu_seconds_total` query returns 0 results

**Solution:**

```bash
# Check node_exporter logs
docker logs node-exporter

# Verify node_exporter endpoint
curl http://localhost:9100/metrics | head -20

# Check Prometheus target
curl -s http://localhost:9090/api/v1/targets | jq '.data.activeTargets[] | select(.labels.job=="node-exporter")'
```

### Issue: "No data" in Infra Overview dashboard

**Possible causes:**

1. **Service label not populated**

   ```bash
   # Check if service label exists
   curl -s 'http://localhost:9090/api/v1/query' \
     --data-urlencode 'query=container_cpu_usage_seconds_total' \
     | jq -r '.data.result[0].metric | keys[]'

   # Should include "service" label
   ```

   **Fix:** Check Prometheus relabeling config in `prometheus.yaml`

2. **cAdvisor not collecting metrics**
   - See "cAdvisor not showing any metrics" above

3. **Time range too narrow**
   - In Grafana, set time range to "Last 6 hours" or "Last 24 hours"

---

## 📚 Next Steps

### ✅ Completed

- [x] cAdvisor deployed and active
- [x] node_exporter deployed and active
- [x] postgres_exporter deployed and active
- [x] redis_exporter deployed and active
- [x] Prometheus scraping all exporters
- [x] **Infra Overview** dashboard created (19 panels)
- [x] **Observability Stack Health** dashboard created (16 panels)
- [x] **Service Runtime** dashboard created (10 panels, template)
- [x] **Postgres Infra** dashboard created (12 panels)
- [x] **Redis Infra** dashboard created (12 panels)

### Short-term (Recommended)

- [ ] Configure alerts for critical thresholds:
  - Dropped telemetry > 0
  - Scrape targets down > 0
  - Disk free < 15%
  - Memory > 90%
  - CPU sustained > 85%

### Long-term (Production)

- [ ] Harden credentials (use secrets for Grafana admin)
- [ ] Configure alert notification channels (Slack, PagerDuty, email)
- [ ] Write runbooks for each alert
- [ ] Test alert delivery
- [ ] Document backup/restore procedures
- [ ] Migrate to Kubernetes (dashboards will work with label adjustments)
- [ ] Implement auto-scaling based on metrics

---

## 📖 References

- [DASHBOARDS.md](./DASHBOARDS.md) - Complete dashboard specifications
- [ARCHITECTURE-AUDIT.md](./ARCHITECTURE-AUDIT.md) - Architecture review and recommendations
- [OBSERVABILITY.md](../../OBSERVABILITY.md) - Main observability guide
- [cAdvisor Documentation](https://github.com/google/cadvisor)
- [node_exporter Documentation](https://github.com/prometheus/node_exporter)
- [postgres_exporter Documentation](https://github.com/prometheus-community/postgres_exporter)
- [redis_exporter Documentation](https://github.com/oliver006/redis_exporter)

---

**Status:** ✅ **FULLY IMPLEMENTED AND READY TO USE!**

**Quick Access - All Dashboards:**

- **Infra Overview**: http://localhost:3001/d/infra-overview (NOC dashboard)
- **Stack Health**: http://localhost:3001/d/observability-stack-health (Meta-monitoring)
- **Service Runtime**: http://localhost:3001/d/service-runtime (Per-service deep dive)
- **Postgres Infra**: http://localhost:3001/d/postgres-infra (Database monitoring)
- **Redis Infra**: http://localhost:3001/d/redis-infra (Cache monitoring - Production Ready)

**Total Implementation:**

- ✅ 4 active exporters (cAdvisor, node_exporter, postgres_exporter, redis_exporter)
- ✅ 5 production-ready dashboards
- ✅ 69 total panels across all dashboards
- ✅ Complete infrastructure observability stack

**Questions?** Check [DASHBOARDS.md](./DASHBOARDS.md) for detailed specifications and implementation guide.
