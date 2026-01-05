# Grafana Alerting Configuration

## 🚨 Status: Disabled by Default

Alerting rules are **temporarily disabled** (`alerts.yaml.disabled`) for the initial observability setup.

### Why Disabled?

1. **Datasource Dependencies**: Alerts require fully provisioned datasources with correct UIDs
2. **SMTP Configuration**: Email notifications need SMTP setup (optional)
3. **Optional Feature**: Core observability (traces, logs, metrics) works without alerting
4. **Easier Onboarding**: Reduces initial setup complexity

---

## 📋 Available Alert Rules

### API Alerts (`alerts.yaml.disabled`)
- **api-5xx-rate**: Triggers when 5xx error rate > 5% for 5 minutes
- **api-latency-p95**: Triggers when p95 latency > 1000ms for 5 minutes

### Worker Alerts (`alerts.yaml.disabled`)
- **worker-queue-depth**: Triggers when queue depth > 100 jobs for 10 minutes
- **worker-job-fail-rate**: Triggers when job fail rate > 10% for 5 minutes

### Core Web Vitals Alerts (`web-vitals-alerts.yaml`) ✅ **READY TO USE**

**LCP (Largest Contentful Paint)**:
- 🔴 **Critical**: LCP p75 > 4s (fires after 5m)
- 🟡 **Warning**: LCP p75 between 2.5s and 4s (fires after 10m)

**INP (Interaction to Next Paint)**:
- 🔴 **Critical**: INP p75 > 500ms (fires after 5m)
- 🟡 **Warning**: INP p75 between 200ms and 500ms (fires after 10m)

**CLS (Cumulative Layout Shift)**:
- 🔴 **Critical**: CLS p75 > 0.25 (fires after 5m)
- 🟡 **Warning**: CLS p75 between 0.1 and 0.25 (fires after 10m)

**Quality Metrics**:
- ⚠️ **Warning**: % Good experiences < 75% (fires after 15m)
- ⚠️ **Warning**: Low sample count < 0.01 samples/s (fires after 10m)

---

## 🔧 How to Enable Alerting

### Option A: Enable Web Vitals Alerts ONLY (Recommended)

**Web Vitals alerts are ready to use without any changes!**

```bash
# Just restart Grafana to load web-vitals-alerts.yaml
cd infra/observability
docker compose -f docker-compose.observability.yml restart grafana

# Verify alerts loaded
docker logs grafana 2>&1 | grep "web-vitals"
```

Then check: **Grafana** → **Alerting** → **Alert rules** → Look for folder **"Web Vitals"**

You should see 9 alert rules:
- 2 LCP alerts (Critical + Warning)
- 2 INP alerts (Critical + Warning)
- 2 CLS alerts (Critical + Warning)
- 1 Good % alert
- 1 Sample count alert

---

### Option B: Enable ALL Alerts (API + Workers + Web Vitals)

### Step 1: Fix Datasource UIDs (Already Done ✅)

Prometheus datasource already has UID `prometheus` in `../datasources/datasources.yaml`.

### Step 2: Enable API/Worker Alerts

```bash
cd infra/observability/grafana/provisioning/alerting
mv alerts.yaml.disabled alerts.yaml
```

### Step 3: (Optional) Configure SMTP for Email Notifications

Edit `docker-compose.observability.yml`:

```yaml
services:
  grafana:
    environment:
      - GF_SMTP_ENABLED=true
      - GF_SMTP_HOST=smtp.gmail.com:587
      - GF_SMTP_USER=your-email@gmail.com
      - GF_SMTP_PASSWORD=your-app-password
      - GF_SMTP_FROM_ADDRESS=your-email@gmail.com
```

**Alternative notification channels**:
- Slack
- PagerDuty
- Discord
- Webhook

Configure in Grafana UI: **Alerting** → **Contact points**

### Step 4: Restart Grafana

```bash
cd infra/observability
docker compose -f docker-compose.observability.yml restart grafana
```

---

## ✅ Verify Alerting Works

1. **Check datasource connection**:
   ```bash
   curl -u admin:admin123 http://localhost:3000/api/datasources | grep prometheus
   ```

2. **Check alerts are loaded**:
   - Open Grafana: http://localhost:3000
   - Go to **Alerting** → **Alert rules**
   - You should see 4 alert rules

3. **Check logs**:
   ```bash
   docker logs grafana | grep ngalert
   # Should NOT see "data source not found" errors
   ```

---

## 🎯 Alternative: Create Alerts in UI

Instead of provisioning, you can create alerts manually:

1. Go to **Alerting** → **Alert rules** → **New alert rule**
2. Select data source: **Prometheus**
3. Write PromQL query (e.g., `rate(http_server_requests_total{status=~"5.."}[5m])`)
4. Set threshold and notification policy
5. Save

**Advantage**: No need to deal with YAML configuration.

---

## 📊 Monitoring Without Alerts

You can monitor your system effectively without alerting by:

1. **Dashboards**: Use pre-built dashboards (API Overview, Workers, Web Vitals)
2. **Explore**: Use Grafana Explore to query metrics on-demand
3. **Logs**: Search logs in Loki for errors and warnings
4. **Traces**: Inspect slow requests in Tempo

Alerting adds **proactive notifications**, but is not required for observability.

---

## 📚 Resources

- [Grafana Alerting Docs](https://grafana.com/docs/grafana/latest/alerting/)
- [PromQL Examples](https://prometheus.io/docs/prometheus/latest/querying/examples/)
- [Troubleshooting Guide](../../../../docs/observability/TROUBLESHOOTING.md#grafana-alerting-issues)

---

**TL;DR**: Alerts are disabled to simplify initial setup. Enable them later when you need proactive notifications.

