# Observability Quick Start Guide

## 🚀 5-Minute Setup

### Prerequisites
- Docker & Docker Compose installed
- pnpm installed
- Ports available: 3000 (Grafana), 4318 (OTel), 9090 (Prometheus)

---

## Step 1: Install Dependencies

```bash
# Install all dependencies (includes @appname/observability)
pnpm install
```

**Note**: This ensures the observability package is properly linked in the workspace.

---

## Step 2: Start Observability Stack

```bash
cd infra/observability
docker-compose -f docker-compose.observability.yml up -d
```

**Wait ~30 seconds** for all services to start. Then verify:

```bash
docker ps | grep -E "grafana|tempo|loki|otel-collector"
```

You should see 6 running containers:
- ✅ grafana (port 3000)
- ✅ tempo
- ✅ loki
- ✅ prometheus (port 9090)
- ✅ otel-collector (port 4318)
- ✅ promtail

---

## Step 3: Start API & Workers

Open 3 terminals:

**Terminal 1: API**
```bash
cd apps/api
pnpm install
pnpm dev
```

**Terminal 2: Reminders Worker**
```bash
cd apps/api
pnpm worker:reminders
```

**Terminal 3: Feedback Worker**
```bash
cd apps/api
pnpm worker:feedback
```

Check logs for:
```
[Observability] ✅ Initialization complete
```

---

## Step 4: Start Web App

**Terminal 4:**
```bash
cd apps/web
pnpm install
pnpm dev
```

Open browser: http://localhost:3001

---

## Step 5: Generate Test Traffic

### Option A: Manual Testing
1. Go to http://localhost:3001
2. Create an event
3. Join an event
4. Interact with the app

### Option B: Automated (TODO: smoke tests)
```bash
pnpm obs:test
```

---

## Step 6: Explore in Grafana

Open: **http://localhost:3000**

**Default credentials**:
- Username: `admin`
- Password: `admin123`

### 6.1 View Traces (Tempo)

1. Click **Explore** (compass icon) in left sidebar
2. Select **Tempo** datasource
3. Click **Search** tab
4. Choose recent traces (e.g., last 15 minutes)
5. Click on any trace to see full waterfall

**Example trace**:
```
┌─ HTTP POST /graphql (200ms)
│  ├─ graphql.operation.CreateEvent (150ms)
│  │  ├─ prisma.create.Event (80ms)
│  │  └─ redis.set (10ms)
│  └─ job.enqueue.reminders (20ms)
│
└─ job.event-reminders.send (50ms) ← 1 hour later
   └─ notification.send (40ms)
```

### 6.2 Search Logs (Loki)

1. Click **Explore**
2. Select **Loki** datasource
3. Run query:

```logql
{service_name="miglee-api"} | json | trace_id != ""
```

**Find logs by trace_id**:
```logql
{service_name="miglee-api"} | json | trace_id="abc123def456"
```

### 6.3 View Metrics (Prometheus)

1. Click **Explore**
2. Select **Prometheus** datasource
3. Run query:

```promql
# HTTP request duration (p95)
histogram_quantile(0.95, sum(rate(http_server_request_duration_seconds_bucket[5m])) by (le, route, method))

# Web vitals (LCP by route)
histogram_quantile(0.75, sum(rate(web_vitals_lcp_bucket[5m])) by (le, route, device))

# Job queue depth
bullmq_jobs_waiting{queue="event-reminders"}
```

### 6.4 View Dashboards

1. Click **Dashboards** (4 squares icon)
2. Browse folders:
   - **API Overview**: Request rate, latency, errors
   - **Workers**: Job processing, queue depth
   - **Web Vitals**: LCP, CLS, INP by route/device
   - **Logs Explorer**: Full-text search across all services

---

## 🎯 Quick Verification Checklist

- [ ] Grafana opens at http://localhost:3000
- [ ] API logs show "OpenTelemetry initialized"
- [ ] Workers log "Worker ready"
- [ ] Web app loads at http://localhost:3001
- [ ] Create event → see trace in Grafana Tempo
- [ ] Copy trace_id → find logs in Loki
- [ ] See web vitals metrics in Prometheus

---

## 🐛 Troubleshooting

### Grafana shows "No datasources found"

**Fix**: Wait 30 seconds, then refresh. Provisioning takes time.

If still not working:
```bash
docker logs grafana
```

Look for: `Provisioned datasources: Tempo, Loki, Prometheus`

### API logs show "OTLP export failed"

**Fix**: Check OTel Collector is running:
```bash
docker ps | grep otel-collector
curl http://localhost:13133  # Health check
```

If unhealthy:
```bash
docker logs otel-collector
docker restart otel-collector
```

### No traces in Tempo

**Fix**: Check trace generation:
```bash
# API should log traces in dev mode
grep "trace_id" apps/api/logs/api.log

# Check Tempo ingestion
docker logs tempo | grep "trace_id"
```

### Workers not processing jobs

**Fix**: Check Redis connection:
```bash
docker ps | grep redis
docker logs redis
```

Check worker logs:
```bash
cd apps/api
pnpm worker:reminders  # Should show "Worker ready"
```

### Web vitals not showing

**Fix**: Check browser console:
```javascript
// Should see:
[web-vitals] LCP 2400 good { route: '/event/123', device: 'desktop', ... }
```

Check API endpoint:
```bash
curl -X POST http://localhost:3001/api/vitals \
  -H "Content-Type: application/json" \
  -d '{"name":"LCP","value":2400}'
```

---

## 🧹 Cleanup

### Stop everything:
```bash
# Stop observability stack
cd infra/observability
docker-compose -f docker-compose.observability.yml down

# Stop API & workers (Ctrl+C in terminals)
# Stop web (Ctrl+C)
```

### Remove data (optional):
```bash
docker-compose -f docker-compose.observability.yml down -v
```

---

## 📚 Next Steps

- [Full Implementation Guide](./PHASE-2-3-IMPLEMENTATION.md)
- [Kubernetes Deployment](./kubernetes-deployment.md)
- [Grafana Dashboards](../../infra/observability/grafana/provisioning/dashboards/)
- [OTel Collector Config](../../infra/observability/otel-collector/)

---

## 💡 Pro Tips

### 1. **Use TraceQL (Tempo query language)**

Find slow requests:
```traceql
{ duration > 1s }
```

Find errors:
```traceql
{ status = error }
```

Find specific operations:
```traceql
{ name =~ ".*CreateEvent.*" }
```

### 2. **Correlate logs with traces**

In Grafana Explore:
1. View trace in Tempo
2. Click "Logs for this span"
3. Automatically jumps to Loki with trace_id filter

### 3. **Create alerts**

Example: Alert on high error rate:
```promql
rate(http_server_requests_total{status=~"5.."}[5m]) > 0.05
```

### 4. **Export dashboards**

```bash
# Export
curl -u admin:admin123 http://localhost:3000/api/dashboards/uid/api-overview > dashboard.json

# Import
curl -X POST -u admin:admin123 \
  http://localhost:3000/api/dashboards/db \
  -H "Content-Type: application/json" \
  -d @dashboard.json
```

---

**Happy Observing! 🔍📊**

