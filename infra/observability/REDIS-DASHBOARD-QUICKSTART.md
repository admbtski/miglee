# Redis Dashboard - Quick Start (2 min)

## 🚀 Access Dashboard

```bash
# Open Grafana
open http://localhost:3001

# Direct link to production-ready dashboard:
open http://localhost:3001/d/redis-infra
```

**Login:** admin / admin (default)

---

## ⚡ 30-Second Health Check

### 1. **Memory Usage %** (Hero Gauge - top-left)

- **Green (<70%):** ✅ Healthy
- **Yellow (70-85%):** ⚠️ Watch
- **Orange (85-90%):** 🟠 Plan to scale
- **Red (>90%):** 🔥 Critical - scale NOW

**Your current:** `0.57%` ✅ Excellent

### 2. **Evictions Rate** (Must Be 0)

- **0:** ✅ Perfect
- **>0:** 🔥 **CRITICAL** - Redis is running out of memory

**Your current:** `0` ✅ Perfect

### 3. **Blocked Clients** (New in v2!)

- **0:** ✅ No blocking operations
- **1-5:** 🟡 Normal for BullMQ (workers waiting on BLPOP)
- **>10:** 🔴 Investigate contention / long LUA scripts

**Your current:** `3` 🟡 Normal (BullMQ workers waiting for jobs)

### 4. **Rejected Connections**

- **0:** ✅ Healthy
- **>0:** 🔥 **CRITICAL** - maxclients exhausted

**Your current:** `0` ✅ Perfect

### 5. **Cache Hit Ratio**

- **>90%:** ✅ Excellent cache efficiency
- **80-90%:** 🟡 OK
- **<80%:** 🔴 Cache warming or query issues

**Your current:** No data yet (needs traffic)

---

## 📊 Dashboard Features (New in v2)

### Variables (Top-Left Dropdowns)

1. **Instance** - Select Redis instance (useful when you have multiple)
   - Current: `redis-exporter:9121`
   - Set to "All" to see all instances

2. **Environment** - dev/stage/prod
   - Current: `dev`

### Sections (4 Rows)

#### Row 1: **Health & Status**

- Timeline showing restarts/flaps
- Current status + uptime

#### Row 2: **Memory & Eviction (HERO METRICS)** ⭐

- Memory Usage % (HERO gauge)
- Evictions Rate (must be 0)
- Fragmentation ratio
- Memory Used vs RSS vs Max
- Keys count + growth

#### Row 3: **Cache Efficiency (SLO)**

- Hit Ratio (gauge + timeseries)
- Hits vs Misses/sec
- Expired keys/sec
- Commands/sec

#### Row 4: **Latency & Blocking (CRITICAL)** ⭐

- **Blocked Clients** (P0 metric!)
- **Rejected Connections** (P0 metric!)
- Connected Clients

---

## 🔍 Understanding Your Current State

### ✅ What's Healthy

```
Memory Usage:     0.57% (WAY below limit)
Evictions:        0 (perfect)
Rejected Conns:   0 (perfect)
Blocked Clients:  3 (normal for BullMQ)
```

### 🟡 What's Normal But Worth Knowing

**Blocked Clients = 3**  
This is **NORMAL** for BullMQ workers. Here's why:

- BullMQ workers use `BRPOP` (blocking right pop) to wait for new jobs
- When no jobs available, workers "block" waiting for queue push
- 3 blocked = probably 3 worker processes waiting for work
- **Good sign:** Your workers are ready and waiting (not overloaded)

**When to worry:**

- Blocked clients suddenly jumps to 20+ (contention)
- Blocked clients + slow API response (LUA script issue)
- Blocked clients + high CPU (infinite loop in script)

### 📊 What Needs Traffic

**Hit Ratio:** No data yet  
This will populate once your API starts using Redis cache:

```bash
# If you have API running, generate some traffic:
curl http://localhost:3000/api/graphql -X POST \
  -H "Content-Type: application/json" \
  -d '{"query": "{ __typename }"}'
```

---

## 🔗 Quick Links (Top-Right)

1. **Infra Overview** - See Redis in context of entire platform
2. **Service Runtime (Redis)** - Container-level CPU/memory metrics

---

## 🆚 Old vs New Dashboard

| Metric               | Old Dashboard | New Dashboard                 |
| -------------------- | ------------- | ----------------------------- |
| Memory %             | ❌ Only bytes | ✅ Hero gauge with thresholds |
| Blocked Clients      | ❌ Missing    | ✅ Prominent panel            |
| Rejected Connections | ❌ Missing    | ✅ Timeseries                 |
| Hit Ratio            | 🟡 Gauge only | ✅ Gauge + trend              |
| Variables            | ❌ None       | ✅ Instance + env             |
| Flap detection       | ❌ Missing    | ✅ Timeline                   |

---

## 🚨 Alert Simulation (Optional)

Want to see what alerts look like?

### Simulate High Memory

```bash
# Connect to Redis
docker compose -f infra/observability/docker-compose.observability.yml exec redis redis-cli

# Write 1M keys (DO NOT DO IN PROD!)
127.0.0.1:6379> DEBUG POPULATE 1000000

# Watch Memory Usage % gauge turn red
# Then clean up:
127.0.0.1:6379> FLUSHALL
```

### Simulate Evictions

```bash
# Set maxmemory very low
127.0.0.1:6379> CONFIG SET maxmemory 1mb
127.0.0.1:6379> DEBUG POPULATE 100000

# Watch Evictions Rate panel spike
# Restore:
127.0.0.1:6379> CONFIG SET maxmemory 0
```

**⚠️ Don't do this in production!**

---

## 📖 Common Patterns

### Pattern 1: "Redis is slow but metrics look OK"

**Check:**

1. Blocked Clients panel → High?
2. Service Runtime (link) → CPU throttling?
3. Infra Overview → IO wait on host?

### Pattern 2: "Cache hit ratio dropping"

**Likely causes:**

- New queries not cached yet (warming)
- Changed query patterns
- TTL too short
- Keys evicted (check Evictions Rate)

**Fix:**

- Wait for cache warming (natural)
- Adjust TTL
- Increase maxmemory if evicting

### Pattern 3: "Memory growing continuously"

**Check:**

- Keys Count & Growth panel → Delta 1h
- Expired Keys/sec → TTL working?

**Likely causes:**

- No TTL on keys (memory leak)
- Cache keys with dynamic IDs (cardinality explosion)

**Fix:**

- Set TTL on all cache keys
- Review key naming patterns

---

## 🎯 Next Steps

### Immediate

1. ✅ Dashboard loaded
2. ✅ Metrics flowing
3. ✅ Variables working

### When You Have Traffic

1. Generate API traffic
2. Watch Hit Ratio populate
3. Observe Commands/sec

### For Production

1. Review alert thresholds (see `REDIS-DASHBOARD-UPGRADE.md`)
2. Set up BullMQ dashboard (P1 priority)
3. Add persistence metrics if needed (RDB/AOF)

---

## 📚 Documentation

- **Full requirements & changes:** `REDIS-DASHBOARD-UPGRADE.md`
- **Infrastructure setup:** `INFRASTRUCTURE-SETUP.md`
- **All dashboards:** `DASHBOARDS.md`

---

## ❓ FAQ

**Q: Why 3 blocked clients?**  
A: Normal for BullMQ. Workers use BRPOP to wait for jobs.

**Q: Should Memory Usage % be higher?**  
A: 0.57% is fine for dev. In prod, you'll use more. Set maxmemory to avoid OOM.

**Q: What if I have multiple Redis instances?**  
A: Use the "Instance" dropdown (top-left) to switch between them.

**Q: What happened to the old dashboards (v2, v3)?**  
A: They were merged into the single production-ready `redis-infra` dashboard with all P0 features + advanced metrics from v3.

---

## ✅ Health Check Summary

```bash
# Run this to verify everything:
curl -s 'http://localhost:9090/api/v1/query?query=redis_up' | jq '.data.result[0].value[1]'
# Should output: "1"

curl -s 'http://localhost:3001/api/search?query=redis' | jq '.[] | select(.uid == "redis-infra-v2") | .title'
# Should output: "Redis Infra (Production Ready)"
```

**Your status:** ✅ All systems operational!

---

**Dashboard URL:** http://localhost:3001/d/redis-infra-v2  
**Status:** ✅ Production Ready (P0 complete)  
**Next:** Add BullMQ queue metrics (P1)
