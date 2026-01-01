# Troubleshooting Guide

Common issues and their solutions when setting up the observability stack.

---

## 🔧 Installation Issues

### Error: `Module not found: Can't resolve '@appname/observability'`

**Symptom**:

```
Module not found: Can't resolve '@appname/observability'
  in /apps/web/src/...
```

**Cause**: The `@appname/observability` workspace dependency is not linked.

**Solution**:

```bash
# Re-install dependencies to link workspace packages
pnpm install
```

**Verify**:

```bash
# Check that @appname/observability is in dependencies
cat apps/web/package.json | grep observability
cat apps/api/package.json | grep observability
```

---

### Error: `Can't resolve '@opentelemetry/auto-instrumentations-node'`

**Symptom**:

```
Module not found: Can't resolve '@opentelemetry/auto-instrumentations-node'
  in /packages/observability/src/tracing.ts
```

**Cause**: Missing OpenTelemetry dependencies in `packages/observability/package.json`.

**Solution**:

```bash
# Install dependencies
pnpm install

# Verify the package was installed
ls node_modules/@opentelemetry/auto-instrumentations-node
```

**If still failing**: Check that `packages/observability/package.json` contains:

```json
{
  "dependencies": {
    "@opentelemetry/auto-instrumentations-node": "^0.52.1"
    // ... other OTel packages
  }
}
```

---

### Error: `Cannot find package '@opentelemetry/api'` in API

**Symptom**:

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find package '@opentelemetry/api'
  imported from /apps/api/src/plugins/mercurius.ts
```

**Cause**: The API uses `@opentelemetry/api` directly for custom tracing (e.g., in GraphQL plugin), but it's not in `apps/api` dependencies.

**Solution**:

```bash
# The dependency should already be in package.json
# Just run install
pnpm install
```

**Verify**: Check that `apps/api/package.json` contains:

```json
{
  "dependencies": {
    "@opentelemetry/api": "^1.9.0"
    // ... other dependencies
  }
}
```

**Why needed?**: The `mercurius.ts` plugin has custom tracing logic integrated with security checks, so it imports `@opentelemetry/api` directly.

---

## 🐳 Docker / Stack Issues

### Grafana shows "No datasources found"

**Symptom**: Grafana UI loads but no Tempo/Loki/Prometheus datasources appear.

**Cause**: Provisioning is still in progress or failed.

**Solution**:

```bash
# Wait 30 seconds for provisioning
sleep 30

# Check Grafana logs
docker logs grafana

# Look for: "Provisioned datasources: Tempo, Loki, Prometheus"
```

**If provisioning failed**:

```bash
# Restart Grafana
docker restart grafana

# Or full restart
pnpm obs:down
pnpm obs:up
```

---

### OTel Collector unhealthy or restarting

**Symptom**:

```bash
docker ps
# otel-collector shows "Restarting"
```

**Cause**: Configuration error in `otel-collector.*.yaml`.

**Solution**:

```bash
# Check logs
docker logs otel-collector

# Common issues:
# 1. Invalid YAML syntax
# 2. Unsupported config options (e.g., tls: insecure in health_check)
# 3. Missing environment variables

# Restart after fixing
docker restart otel-collector
```

---

### Tempo: "failed to parse duration"

**Symptom**: Tempo fails to start with error about parsing duration.

**Cause**: Direct environment variable usage in YAML duration fields (not supported).

**Solution**: Use hardcoded values in `infra/observability/tempo/tempo.yaml`:

```yaml
# ❌ Bad - Tempo doesn't support env var interpolation in duration fields
compaction:
  compaction_window: ${TEMPO_RETENTION}

# ✅ Good
compaction:
  compaction_window: 1h
```

---

## 📊 Tracing Issues

### No traces showing up in Grafana

**Symptom**: Grafana Tempo shows no traces even after generating traffic.

**Checklist**:

1. **Check OTLP endpoint**:

   ```bash
   # Should be set in your app
   echo $OTEL_EXPORTER_OTLP_ENDPOINT
   # Expected: http://localhost:4318
   ```

2. **Check OTel Collector is receiving data**:

   ```bash
   # Health check
   curl http://localhost:13133

   # Check logs
   docker logs otel-collector | grep "trace"
   ```

3. **Check app initialization**:

   ```bash
   # API logs should show
   # [Observability] ✅ Initialization complete
   ```

4. **Test with curl**:

   ```bash
   # Send a test trace
   curl -X POST http://localhost:4318/v1/traces \
     -H "Content-Type: application/json" \
     -d '{"resourceSpans":[]}'

   # Should return 200
   ```

5. **Check Tempo ingestion**:
   ```bash
   docker logs tempo | grep "traces"
   ```

---

### Logs missing trace_id

**Symptom**: Logs appear in Loki but don't have `trace_id` field.

**Checklist**:

1. **Check Pino mixin is configured**:

   ```typescript
   // apps/api/src/lib/pino.ts
   import { pinoTraceMixin } from '@appname/observability/pino';

   const logger = pino({
     mixin: pinoTraceMixin, // ← Must be present
   });
   ```

2. **Check instrumentation is first**:

   ```typescript
   // apps/api/src/index.ts
   import './instrumentation'; // ← MUST be first line
   import { createServer } from './server';
   ```

3. **Check active span exists**:

   ```typescript
   import { getCurrentTraceId } from '@appname/observability/browser';

   console.log('trace_id:', getCurrentTraceId());
   // Should print trace ID, not undefined
   ```

---

### Workers not correlating with API traces

**Symptom**: Worker jobs show up as separate traces, not connected to API request.

**Checklist**:

1. **Check using `addJobWithTrace()`**:

   ```typescript
   // ❌ Bad - no trace propagation
   await queue.add('send', { email });

   // ✅ Good - trace context included
   await addJobWithTrace(queue, 'send', { email });
   ```

2. **Check worker has instrumentation**:

   ```typescript
   // apps/api/src/workers/*/worker.ts
   import '../instrumentation'; // ← MUST be first line
   ```

3. **Check job data**:
   ```typescript
   // Job data should have __traceContext field
   console.log(job.data);
   // { email: '...', __traceContext: { traceparent: '...' } }
   ```

---

## 🌐 Frontend Issues

### Web vitals not showing in Prometheus

**Symptom**: No `web_vitals_*` metrics in Prometheus.

**Checklist**:

1. **Check browser console**:

   ```javascript
   // Should see logs like:
   // [web-vitals] LCP 2400 good { route: '/events', device: 'desktop', ... }
   ```

2. **Check `/api/vitals` endpoint**:

   ```bash
   # Test manually
   curl -X POST http://localhost:3001/api/vitals \
     -H "Content-Type: application/json" \
     -d '{"name":"LCP","value":2400}'

   # Should return: {"ok":true}
   ```

3. **Check API logs**:

   ```bash
   # Should show:
   # [api/vitals] LCP 2400 good { route: '/events', ... }
   ```

4. **Check Prometheus scraping**:

   ```bash
   # Query Prometheus
   curl http://localhost:9090/api/v1/query?query=web_vitals_lcp

   # Or in Grafana Explore:
   web_vitals_lcp
   ```

---

### GraphQL requests not propagating trace context

**Symptom**: Frontend → API calls don't show as child spans.

**Checklist**:

1. **Check middleware is configured**:

   ```typescript
   // apps/web/src/lib/api/client.ts
   import { injectTraceHeaders } from '@appname/observability/browser';

   export const gqlClient = new GraphQLClient(url, {
     requestMiddleware: (request) => {
       const headers = injectTraceHeaders(request.headers);
       return { ...request, headers };
     },
   });
   ```

2. **Check headers in browser DevTools**:

   ```
   Network → GraphQL request → Headers
   Should see: traceparent: 00-abc123...
   ```

3. **Check API receives header**:
   ```bash
   # API logs should show incoming traceparent
   ```

---

## 📦 Package Issues

### TypeScript errors in observability package

**Symptom**: `Cannot find module '@opentelemetry/...'` in IDE.

**Solution**:

```bash
# Reload TypeScript server in VS Code
# Cmd+Shift+P → "TypeScript: Restart TS Server"

# Or restart IDE
```

---

### Circular dependency warnings

**Symptom**: `Circular dependency detected` warnings during build.

**Solution**: This is usually safe for observability packages. If it causes issues:

```typescript
// Use dynamic imports
const { initObservability } = await import('@appname/observability');
```

---

## 📊 Grafana Alerting Issues

### Grafana: "data source not found" in alerts

**Symptom**:

```
logger=ngalert.scheduler rule_uid=worker-queue-depth org_id=1
msg="Failed to build rule evaluator" error="failed to build query 'A': data source not found"
```

**Cause**: Alert rules reference datasources by UID before datasources are fully provisioned, or datasource UID is missing.

**Solution 1** - Fix datasource UIDs (recommended):

1. Ensure all datasources have explicit UIDs in `datasources.yaml`:

   ```yaml
   - name: Prometheus
     type: prometheus
     uid: prometheus # ← Must be present
   ```

2. Update alert rules to use correct datasource UIDs in `alerts.yaml`:

   ```yaml
   datasourceUid: prometheus # Must match datasource uid
   ```

3. Restart Grafana:
   ```bash
   docker restart grafana
   ```

**Solution 2** - Disable alerting temporarily (quick fix):

```bash
cd infra/observability/grafana/provisioning/alerting
mv alerts.yaml alerts.yaml.disabled
docker restart grafana
```

Alerts can be added later manually through Grafana UI or re-enabled after fixing datasource UIDs.

**Note**: Alerting is **optional** for initial observability setup. Core features (traces, logs, metrics) work without it.

---

### OTel Collector: "duplicate label names" warning

**Symptom**:

```
failed to convert metric otelcol_receiver_accepted_log_records:
duplicate label names in constant and variable labels
```

**Cause**: OTel Collector internal metrics have conflicting label configurations.

**Impact**: **Harmless** - this is a warning, not an error. Collector continues to function normally.

**Solution**: Ignore this warning for now. It doesn't affect telemetry collection or export.

If you want to suppress it, you can filter these warnings in collector config:

```yaml
# otel-collector config
service:
  telemetry:
    logs:
      level: error # Only show errors, not warnings
```

---

## 🔄 Reset Everything

If all else fails, nuclear option:

```bash
# Stop everything
pnpm obs:down
docker stop $(docker ps -q) 2>/dev/null || true

# Clean volumes
pnpm obs:reset

# Clean node_modules
rm -rf node_modules apps/*/node_modules packages/*/node_modules

# Reinstall
pnpm install

# Restart stack
pnpm obs:up

# Verify
pnpm obs:test
```

---

## 📞 Still Having Issues?

1. **Check logs**:

   ```bash
   # All services
   pnpm obs:logs

   # Specific service
   docker logs grafana
   docker logs otel-collector
   docker logs tempo
   ```

2. **Check health**:

   ```bash
   # OTel Collector
   curl http://localhost:13133

   # Prometheus
   curl http://localhost:9090/-/healthy

   # Grafana
   curl http://localhost:3000/api/health
   ```

3. **Run smoke test**:

   ```bash
   pnpm obs:test
   ```

4. **Check GitHub Issues**: Search for similar problems in the repo.

5. **Ask the team**: Share error logs and steps to reproduce.

---

**Remember**: Most issues are caused by:

- ❌ Missing `pnpm install` after adding dependencies
- ❌ Instrumentation not being imported first
- ❌ Wrong OTLP endpoint
- ❌ OTel Collector misconfiguration

**Always start with**: `pnpm install && pnpm obs:up && pnpm obs:test` 🚀
