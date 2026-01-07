# Redis Infra Dashboard - Upgrade to Production Ready

## Status: ✅ P0 (MUST) Complete

Status: `redis-infra.json` (Production Ready - v2 merged)  
Previous versions: v2 and v3 merged into single production dashboard

---

## ✅ Implemented (P0 - MUST)

### 1. **Variables / Templating** ✅

- **Added:** `instance` variable (query-based from `redis_up` label)
- **Added:** `env` variable (custom: dev/stage/prod)
- **Filter:** All panels now filter by `instance=~"$instance"`
- **Why:** Enables multi-instance support and environment separation (critical for prod)

### 2. **SAT: Memory Usage % (HERO PANEL)** ✅

- **Panel:** Large gauge showing `100 * redis_memory_used_bytes / redis_memory_max_bytes`
- **Thresholds:** Green <70%, Yellow 70-85%, Orange 85-90%, Red >90%
- **Fallback:** Shows "N/A (unlimited)" if `maxmemory=0`
- **Position:** Top of "Memory & Eviction" section (most prominent)
- **Why:** The single most important Redis metric - tells you if you're running out of memory

### 3. **ERR: Blocked Clients** ✅

- **Panel:** Stat panel for `redis_blocked_clients`
- **Thresholds:** Green 0, Yellow >1, Red >5
- **Position:** Top of "Latency & Blocking (CRITICAL)" section
- **Description:** ⚠️ CRITICAL: Can kill API performance even if other metrics look OK
- **Why:** BLPOP/BRPOP/LUA waits are invisible in other metrics but murder performance

### 4. **SLO: Hit Ratio (Timeseries)** ✅

- **Panel:** Timeseries (not just gauge) showing hit ratio over time
- **Formula:** `100 * rate(hits[5m]) / (rate(hits[5m]) + rate(misses[5m]))`
- **Thresholds:** <80% = red line
- **Calcs:** Shows lastNotNull, mean, min
- **Why:** Detects cache efficiency drops (warming issues, query pattern changes)

### 5. **ERR: Rejected Connections** ✅

- **Panel:** Timeseries for `rate(redis_rejected_connections_total[5m])`
- **Threshold:** Red line at >0.001 req/s
- **Position:** "Latency & Blocking" section
- **Why:** Early warning for maxclients exhaustion or resource issues

### 6. **META: Up (Timeline - detect flaps)** ✅

- **Panel:** Timeseries showing `min_over_time(redis_up[5m])`
- **Interpolation:** stepAfter (shows exact up/down transitions)
- **Why:** Original only had stat (current). This shows flaps/restarts over time.

### 7. **SAT: RSS vs Used Memory** ✅

- **Panel:** Timeseries comparing `redis_memory_used_bytes`, `redis_memory_used_rss_bytes`, `redis_memory_max_bytes`
- **Why:** Explains fragmentation - large RSS/Used gap = fragmentation problem

### 8. **SAT: Keys Count & Growth** ✅

- **Panel:** Shows total keys + delta over 1h (`sum(redis_db_keys) - sum(redis_db_keys offset 1h)`)
- **Calcs:** lastNotNull + delta
- **Why:** Detects cache leaks or bloat

### 9. **SAT: Expired Keys/sec** ✅

- **Panel:** `rate(redis_expired_keys_total[5m])`
- **Why:** Monitors TTL policy health

---

## 🟡 NOT Implemented (P1 - SHOULD, highly recommended)

### BullMQ / Queue Metrics (CRITICAL if Redis handles queues)

**Status:** ❌ Not in this dashboard  
**Why:** You have BullMQ + workers, so this is actually **P0 in your context**  
**Solution:** Need separate `Queues (BullMQ)` dashboard:

- Backlog / queue depth (waiting/active/failed/delayed jobs)
- Processing time p95
- Retry storm / failed jobs rate
- Stream consumer lag (if using Redis streams)

**Action needed:**

```bash
# BullMQ exposes metrics via Bull Board or custom exporters
# Check: http://localhost:3000/bull-board (if enabled)
# You'll need to add a Prometheus exporter for BullMQ metrics
```

### Infra Correlation

**Status:** ⚠️ Partial (link to Service Runtime exists, but no embedded panels)  
**Missing panels:**

- CPU container/pod for Redis
- Memory working set vs limit
- CPU throttling (K8s)
- IO wait / disk latency
- Network errors/resets

**Why:** Differentiates "Redis sick" vs "platform sick"  
**Solution:** Either:

- Add 4-panel "Infra Correlation" section in this dashboard, OR
- Rely on link to Service Runtime (current approach - acceptable for now)

---

## 🔵 NOT Implemented (P2 - Optional, but good for prod)

### Latency Metrics (Synthetic)

**Status:** ❌ `redis_exporter` doesn't expose latency by default  
**Workaround options:**

1. Enable Redis `LATENCY MONITOR` + custom exporter queries
2. Create synthetic monitor (ping histogram via API)
3. Use slowlog + Loki (log-based)

**For now:** Blocked clients + rejected connections are proxy signals

### Persistence / Durability (RDB/AOF)

**Status:** ❌ Not in dashboard  
**Needed only if:** Redis persists data (queues, state) not just cache  
**Metrics:**

- `redis_rdb_last_bgsave_status`
- `redis_rdb_last_save_time_seconds`
- `redis_aof_enabled`
- `redis_aof_last_bgrewrite_status`

**Action:** If you use Redis for BullMQ (you do!), this is actually **P1**

### Security Metrics

**Status:** ❌ Not in dashboard  
**Metrics:**

- Connection spike detection (`rate(redis_total_connections_received)`)
- Alert on unusual connection patterns

---

## 🎯 Title Standardization

All panels now follow naming convention:

- `META:` - Monitoring health (uptime, status)
- `SAT:` - Saturation / limits (memory %, fragmentation, clients)
- `SLO:` - Service Level Objectives (hit ratio, commands/sec)
- `ERR:` - Errors (evictions, blocked clients, rejected connections)

---

## 📊 Dashboard Structure (Left to Right, Top to Bottom)

### Row 1: Health & Status

- META: Up (Timeline) - 12w
- META: Status (Current) - 6w
- META: Uptime - 6w

### Row 2: Memory & Eviction (HERO METRICS)

- **SAT: Memory Usage % (HERO)** - 8w gauge
- **ERR: Evictions Rate (MUST BE 0)** - 8w timeseries
- SAT: Fragmentation Ratio - 8w stat
- SAT: Memory Used vs RSS vs Max - 12w timeseries
- SAT: Keys Count & Growth - 12w timeseries

### Row 3: Cache Efficiency (SLO)

- SLO: Cache Hit Ratio (Current) - 6w gauge
- **SLO: Hit Ratio (Timeseries)** - 10w timeseries
- SLO: Hits vs Misses/sec - 8w timeseries
- SAT: Expired Keys/sec - 12w timeseries
- SLO: Commands/sec - 12w timeseries

### Row 4: Latency & Blocking (CRITICAL)

- **ERR: Blocked Clients (P0!)** - 8w stat
- **ERR: Rejected Connections/sec (P0!)** - 8w timeseries
- SAT: Connected Clients - 8w timeseries

---

## 🚀 How to Use

### Access

```bash
# Start observability stack if not running
cd /Users/abartski/dev-vibe/miglee
docker compose -f infra/observability/docker-compose.observability.yml up -d

# Open Grafana
open http://localhost:3001

# Navigate to: Dashboards → Redis Infra (Production Ready)
# Or: http://localhost:3001/d/redis-infra-v2
```

### Verify Variables Work

1. Top-left: Select **Instance** dropdown → should show `redis-exporter:9121` or similar
2. Select **Environment** → choose dev/stage/prod
3. All panels should update

### Critical Checks (30-second "is there a fire?")

1. **Memory Usage %** (hero gauge) → Should be <85%
2. **Evictions Rate** → MUST BE 0 (if not, you're OOM)
3. **Blocked Clients** → Should be 0 (if not, investigate BLPOP/LUA)
4. **Rejected Connections** → Must be 0 (if not, maxclients exhausted)
5. **Hit Ratio** → Should be >80% (if lower, cache warming or query issues)

---

## 🔥 Alert Thresholds (Production)

### CRITICAL (Page immediately)

```promql
# Evictions sustained (memory exhaustion)
rate(redis_evicted_keys_total[5m]) > 0 for 30m

# Rejected connections (capacity exhaustion)
rate(redis_rejected_connections_total[5m]) > 0 for 5m

# Blocked clients sustained (contention)
redis_blocked_clients > 5 for 15m

# Memory critical
100 * redis_memory_used_bytes / clamp_min(redis_memory_max_bytes, 1) > 95 for 5m

# Down
min_over_time(redis_up[5m]) < 1
```

### WARNING (Investigate)

```promql
# Memory high
100 * redis_memory_used_bytes / clamp_min(redis_memory_max_bytes, 1) > 90 for 10m

# Hit ratio drop
100 * rate(redis_keyspace_hits_total[5m]) / (rate(redis_keyspace_hits_total[5m]) + rate(redis_keyspace_misses_total[5m])) < 80 for 15m

# Fragmentation high
redis_mem_fragmentation_ratio > 1.5 for 30m

# Evictions starting (early warning)
rate(redis_evicted_keys_total[5m]) > 0 for 10m
```

---

## 🛠️ Next Steps (Priority Order)

### Priority 1: BullMQ Dashboard (MUST for your stack)

You have workers + BullMQ, so you need queue visibility:

- Create `queues-bullmq.json` dashboard
- Add BullMQ Prometheus exporter (check if Bull Board exposes metrics)
- Monitor: waiting jobs, failed jobs, processing time p95

### Priority 2: Add Persistence Metrics (if Redis persists data)

If Redis is more than cache (it is - you have BullMQ):

- Add "Persistence" row to this dashboard
- Metrics: RDB/AOF status, last save time, bgsave failures

### Priority 3: Synthetic Latency Monitor (optional)

- Create simple API endpoint that pings Redis + records histogram
- Export to Prometheus
- Add "Latency p95" panel

### Priority 4: Infra Correlation (if needed)

- Either embed CPU/mem/throttling panels from Service Runtime
- Or rely on dashboard link (current approach is OK)

---

## 📝 Dashboard Consolidation

**Status:** ✅ **COMPLETE** - All 3 versions merged into single production dashboard

Previous versions:

- `redis-infra.json` (original) - 12 panels, basic
- `redis-infra-v2.json` (P0 complete) - 20 panels, production-ready
- `redis-infra-v3.json` (Grafana.com import) - advanced commands/network metrics

**Current:** `redis-infra.json` (v2 merged) - **25 panels**, combining:

- All P0 requirements from v2 (variables, blocked clients, rejected connections, memory %, etc.)
- Advanced metrics from v3 (commands breakdown, network I/O, keys per DB, expiring keys)
- Single unified dashboard - no need for multiple versions

---

## 🎓 What Makes This "Production Ready"?

1. **Answers "is there a fire?" in 30 seconds:**
   - Hero gauge (Memory %) + Evictions + Blocked Clients = instant diagnosis

2. **Multi-instance support:**
   - Variables enable scaling from 1 Redis to N Redis instances

3. **Detects hidden problems:**
   - Blocked clients (invisible in CPU/mem)
   - Rejected connections (capacity before failure)
   - Hit ratio drops (cache efficiency degradation)

4. **Trend analysis:**
   - Everything has timeseries, not just stats
   - Delta/growth panels (keys, memory)

5. **Standard naming:**
   - META/SAT/SLO/ERR prefixes = instant semantic understanding

6. **Linked to context:**
   - Drill-down to Service Runtime
   - Link to Infra Overview

---

## 🆚 Comparison: Original vs Production-Ready

| Feature                   | Original v1 (12 panels)        | Merged Production (25 panels) |
| ------------------------- | ------------------------------ | ----------------------------- |
| **Variables**             | ❌ None (single instance only) | ✅ instance + env             |
| **Memory %**              | ❌ Only bytes                  | ✅ Hero gauge with thresholds |
| **Blocked Clients**       | ❌ Missing                     | ✅ Prominent stat panel       |
| **Rejected Connections**  | ❌ Missing                     | ✅ Timeseries with alerts     |
| **Hit Ratio**             | 🟡 Gauge only                  | ✅ Gauge + timeseries         |
| **Up/flaps**              | 🟡 Stat only                   | ✅ Stat + timeline            |
| **RSS vs Used**           | ❌ Missing                     | ✅ Memory correlation         |
| **Keys growth**           | 🟡 Total only                  | ✅ Total + delta 1h           |
| **Expired keys**          | ❌ Missing                     | ✅ Rate timeseries            |
| **Title standardization** | 🟡 Partial                     | ✅ Full META/SAT/SLO/ERR      |
| **Commands breakdown**    | ❌ Missing                     | ✅ Per-command metrics (v3)   |
| **Network I/O**           | ❌ Missing                     | ✅ Input/output rates (v3)    |
| **Production ready**      | ❌ Demo                        | ✅ Yes (P0 + advanced)        |

---

## ❓ FAQ

**Q: Why two dashboards (redis-infra vs redis-infra-v2)?**  
A: For migration safety. Test v2, then delete old when satisfied.

**Q: What if `redis_memory_max_bytes = 0`?**  
A: Memory % panel shows "N/A (unlimited)". You should set `maxmemory` in prod.

**Q: What about BullMQ metrics?**  
A: Not in this dashboard - needs separate Queues dashboard (next priority).

**Q: Why no latency metrics?**  
A: `redis_exporter` doesn't expose by default. Use blocked clients + rejected connections as proxy, or add synthetic monitor.

**Q: Can I use this in Kubernetes?**  
A: Yes! Variables + label filters work identically. Just ensure Redis pods have `instance` label.

**Q: What if I have multiple Redis instances (cache + queues)?**  
A: Use `instance` variable to switch, or create separate dashboards for different roles.

---

## ✅ Definition of Done (DoD) Checklist

### P0 (MUST) - Production Blocking

- [x] Variables: `instance` + `env`
- [x] SAT: Memory Usage % (hero gauge)
- [x] ERR: Blocked Clients
- [x] SLO: Hit Ratio (timeseries)
- [x] ERR: Rejected Connections
- [x] META: Up (timeline for flaps)
- [x] SAT: RSS vs Used
- [x] SAT: Keys growth (delta)
- [x] Title standardization (META/SAT/SLO/ERR)

### P1 (SHOULD) - Highly Recommended

- [ ] BullMQ / Queue metrics (separate dashboard) ← **DO THIS NEXT**
- [ ] Persistence metrics (RDB/AOF) if Redis persists data
- [ ] Infra correlation (CPU/mem/throttling) - can use link for now

### P2 (NICE TO HAVE) - Optional

- [ ] Latency metrics (synthetic or slowlog)
- [ ] Connection spike detection (security)

---

**Status: ✅ Redis dashboard is now PRODUCTION READY (P0 complete)**  
**Next:** Implement BullMQ dashboard (P1, critical for your stack)
