# 🔭 Observability Stack

Full observability infrastructure for local development and prod-like testing.

## 📦 Stack Components

| Component          | Purpose                     | Port      | URL                   |
| ------------------ | --------------------------- | --------- | --------------------- |
| **Grafana**        | Dashboards, Alerts, Explore | 3001      | http://localhost:3001 |
| **Prometheus**     | Metrics storage             | 9090      | http://localhost:9090 |
| **Tempo**          | Distributed tracing         | 3200      | (internal)            |
| **Loki**           | Log aggregation             | 3100      | (internal)            |
| **OTel Collector** | Telemetry gateway           | 4317/4318 | OTLP gRPC/HTTP        |
| **Promtail**       | Log collector               | -         | (internal)            |

## 🚀 Quick Start

```bash
# Start observability stack (dev mode - 100% sampling)
pnpm obs:up

# Check status
pnpm obs:ps

# View logs
pnpm obs:logs

# Stop stack
pnpm obs:down
```

## 📊 Access Points

### Grafana (Main UI)

- **URL**: http://localhost:3001
- **Login**: admin / admin (dev only)
- **Features**:
  - Pre-configured datasources (Prometheus, Tempo, Loki)
  - Pre-built dashboards (API, Workers, Web Vitals, Logs)
  - Alerting rules

### Available Dashboards

1. **API Overview (RED)** - Request rate, errors, duration
2. **Workers (BullMQ)** - Job throughput, fail rate, queue depth
3. **Web Vitals** - LCP, CLS, INP, FCP, TTFB
4. **Logs Explorer** - Full-text search with trace correlation

## 🔧 Configuration

### Environment Variables

| Variable               | Default | Description                              |
| ---------------------- | ------- | ---------------------------------------- |
| `OTEL_ENV`             | `dev`   | Collector config: dev, staging, prodlike |
| `TEMPO_RETENTION`      | `1h`    | Trace retention (dev)                    |
| `LOKI_RETENTION`       | `2h`    | Log retention (dev)                      |
| `PROMETHEUS_RETENTION` | `24h`   | Metrics retention (dev)                  |

### Switching Environments

```bash
# Development (100% sampling)
OTEL_ENV=dev pnpm obs:up

# Staging (50% sampling + tail sampling)
OTEL_ENV=staging pnpm obs:up

# Production-like (10% + tail sampling, strict PII redaction)
OTEL_ENV=prodlike pnpm obs:up
```

## 📡 Sending Telemetry

### From Application

Your app should send telemetry to the OTel Collector:

```typescript
// Environment variables for your app
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
OTEL_SERVICE_NAME=appname-api
OTEL_SERVICE_VERSION=1.0.0
```

### OTLP Endpoints

| Protocol | Endpoint         |
| -------- | ---------------- |
| gRPC     | `localhost:4317` |
| HTTP     | `localhost:4318` |

## 🔍 Correlating Signals

### Logs → Traces

Click on any log line with `trace_id` to jump directly to the trace in Tempo.

### Metrics → Traces

Metrics with exemplars link to specific traces that caused the data point.

### Traces → Logs

From a trace, click "Logs for this span" to see related logs in Loki.

## 📈 Metrics Naming Convention

All app metrics use the `app_` prefix:

```
app_http_server_request_duration_seconds{...}
app_job_duration_seconds{...}
app_queue_depth{...}
app_web_vitals_lcp{...}
```

## 🚨 Alerts

Pre-configured alerts (in Grafana):

1. **API 5xx Error Rate > 5%** - Critical
2. **API Latency p95 > 1000ms** - Warning
3. **Worker Queue Depth > 100** - Warning
4. **Worker Job Fail Rate > 10%** - Critical

## 💾 Data Persistence

All data is persisted in Docker volumes:

- `obs-grafana-data` - Grafana state
- `obs-tempo-data` - Traces
- `obs-loki-data` - Logs
- `obs-prometheus-data` - Metrics

To reset all data:

```bash
pnpm obs:down
docker volume rm obs-grafana-data obs-tempo-data obs-loki-data obs-prometheus-data
```

## 🐛 Troubleshooting

### Stack won't start

```bash
# Check Docker resources
docker system df

# View startup logs
docker compose -f infra/observability/docker-compose.observability.yml logs

# Check health
docker compose -f infra/observability/docker-compose.observability.yml ps
```

### No data in Grafana

1. Check OTel Collector is receiving data:

   ```bash
   curl http://localhost:13133/  # Health check
   ```

2. Check Collector logs:

   ```bash
   docker logs otel-collector
   ```

3. Verify app is sending to correct endpoint

### Trace not linked to logs

Ensure your Pino logs include `trace_id` field:

```json
{ "level": "info", "trace_id": "abc123...", "msg": "Request completed" }
```

## 📁 File Structure

```
infra/observability/
├── docker-compose.observability.yml
├── otel-collector/
│   ├── otel-collector.dev.yaml
│   ├── otel-collector.staging.yaml
│   └── otel-collector.prodlike.yaml
├── grafana/
│   └── provisioning/
│       ├── datasources/datasources.yaml
│       ├── dashboards/
│       │   ├── dashboards.yaml
│       │   └── json/*.json
│       └── alerting/alerts.yaml
├── tempo/tempo.yaml
├── loki/loki.yaml
├── prometheus/prometheus.yaml
├── promtail/promtail.yaml
└── README.md
```

## 🔄 Retention Settings

| Environment  | Traces | Logs   | Metrics |
| ------------ | ------ | ------ | ------- |
| Dev          | 1h     | 2h     | 24h     |
| Staging      | 24h    | 48h    | 7d      |
| Prod-like    | 24h    | 48h    | 7d      |
| Production\* | 3-7d   | 14-30d | 30-90d  |

\*Production uses managed observability (Grafana Cloud, etc.)

## 📚 Next Steps

After setting up the infrastructure:

1. **Phase 1**: Add OTel SDK to API (`packages/observability`)
2. **Phase 2**: Instrument workers with trace propagation
3. **Phase 3**: Enhance web-vitals with route/trace context
4. **Phase 4**: Add business metrics (events, payments)
