# 📝 Local API Logs Implementation

## Przegląd

Logi z lokalnego API (uruchamianego przez `pnpm dev:api:obs`) są teraz automatycznie wysyłane do Loki przez OpenTelemetry Collector.

## 🔧 Architektura

```
┌────────────────────────────────────────────────────────┐
│  LOGS Z DOCKER CONTAINERS (Produkcja)                 │
└────────────────────────────────────────────────────────┘
API (Docker) → stdout → /var/lib/docker/containers/*.log
                             ↓
                         Promtail
                             ↓
                           Loki
                             ↓
                        Grafana ✅


┌────────────────────────────────────────────────────────┐
│  LOGS Z LOCAL API (Development)                       │
└────────────────────────────────────────────────────────┘
API (local) → Pino → pino-pretty (terminal) ✅
                  ↓
             pino-opentelemetry-transport
                  ↓
                OTLP → OpenTelemetry Collector
                             ↓
                           Loki
                             ↓
                        Grafana ✅
```

## ✅ Zaimplementowane Komponenty

### 1. Pino OpenTelemetry Transport

**Plik:** `apps/api/src/lib/pino.ts`

**Funkcjonalność:**
- **Dual-mode logging** w development:
  - `pino-pretty` → Kolorowe logi w terminalu (dla developera)
  - `pino-opentelemetry-transport` → OTLP logs do Collectora (dla Loki)
- Automatyczna detekcja: włącza OTLP tylko gdy `OTEL_EXPORTER_OTLP_ENDPOINT` jest ustawiony
- Resource attributes: `service.name`, `service.version`, `deployment.environment`

**Konfiguracja:**
```typescript
// Multi-transport dla dev + OTLP
{
  targets: [
    {
      target: 'pino-pretty',  // Terminal (dla developera)
      level: level,
      options: { colorize: true, ... }
    },
    {
      target: 'pino-opentelemetry-transport',  // OTLP → Loki
      level: level,
      options: {
        resourceAttributes: {
          'service.name': name,
          'service.version': '1.0.0',
          'deployment.environment': env,
        },
        logRecordProcessorOptions: [
          {
            recordProcessorType: 'batch',
            exporterOptions: {
              protocol: 'http/json',
              endpoint: `${OTEL_ENDPOINT}/v1/logs`,
            },
          },
        ],
      },
    },
  ],
}
```

### 2. OpenTelemetry Collector - Loki Exporter

**Plik:** `infra/observability/otel-collector/otel-collector.dev.yaml`

**Konfiguracja Loki Exportera:**
```yaml
exporters:
  loki:
    endpoint: http://loki:3100/loki/api/v1/push
    default_labels_enabled:
      exporter: true
      job: true
      level: true
      service: true
```

**Logs Pipeline:**
```yaml
service:
  pipelines:
    logs:
      receivers: [otlp]
      processors:
        - memory_limiter
        - resource
        - attributes/redact  # Usuwa wrażliwe dane
        - transform         # Normalizuje atrybuty
        - batch
      exporters: [loki, debug]
```

### 3. Grafana Logs Explorer Dashboard

**Plik:** `infra/observability/grafana/provisioning/dashboards/json/logs-explorer.json`

**Zaktualizowane Query:**
```logql
# Wspiera oba źródła logów
{compose_service=~"$service"} |~ "$search"           # Docker containers
or 
{exporter="OTLP", job=~"$service"} |~ "$search"      # Local API
```

**Zmienne:**
- `$service` - Dynamicznie pobiera serwisy z obu źródeł:
  ```logql
  label_values(compose_service) or label_values({exporter="OTLP"}, job)
  ```

## 🚀 Użycie

### 1. Uruchom Observability Stack

```bash
pnpm obs:up
```

### 2. Uruchom API z Observability

```bash
pnpm dev:api:obs
```

**Co się dzieje:**
- API uruchamia się z `OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318`
- Pino wykrywa endpoint i automatycznie włącza OTLP transport
- Logi są wysyłane zarówno do:
  - **Terminal** (pino-pretty) → dla real-time debugging
  - **Loki** (przez OTLP) → dla analizy w Grafanie

### 3. Zobacz Logi w Grafanie

Otwórz **Logs Explorer**: http://localhost:3001/d/logs-explorer

**Dostępne filtry:**
- **Service**: Wybierz `appname-api` (lub `All`)
- **Search**: Szukaj po dowolnym tekście (np. `error`, `graphql`, `POST`)

## 🔍 Weryfikacja

### Sprawdź czy logi trafiają do Collectora

```bash
# Metryki Collectora
curl -s http://localhost:8888/metrics | grep 'otelcol_exporter_sent_log_records{exporter="loki"'

# Powinno pokazać liczbę > 0
```

### Sprawdź czy logi są w Loki

```bash
# Query Loki
curl -s -G 'http://localhost:3100/loki/api/v1/query' \
  --data-urlencode 'query={exporter="OTLP"}' \
  --data-urlencode 'limit=5' | jq '.status, (.data.result | length)'

# Powinno zwrócić: "success" i liczbę > 0
```

### Sprawdź dostępne labels

```bash
curl -s 'http://localhost:3100/loki/api/v1/labels' | jq '.data'

# Powinno zawierać: "exporter", "job", "level"
```

## 📊 Labels w Loki

### Logi z Docker Containers (Promtail)

```
compose_project="observability"
compose_service="otel-collector"
container="otel-collector"
job="otel-collector"
level="info"
```

### Logi z Local API (OTLP)

```
exporter="OTLP"
job="appname-api"
level="info"
service="app"
```

## 🔧 Troubleshooting

### Problem: Logi NIE trafiają do Loki

**Krok 1: Sprawdź czy API ma OTEL endpoint**
```bash
env | grep OTEL_EXPORTER_OTLP_ENDPOINT
# Powinno być: http://localhost:4318
```

**Krok 2: Sprawdź logi API**
```bash
tail -f /tmp/api-obs*.log | grep -i "opentelemetry\|transport"
```

**Krok 3: Sprawdź Collector**
```bash
docker logs otel-collector --tail=50 | grep -i "loki\|error"
```

**Krok 4: Sprawdź Loki**
```bash
docker logs loki --tail=50 | grep -i "error\|push"
```

### Problem: Duplikowane logi (terminal + Loki)

**To jest zamierzone!** 

W development chcemy:
- ✅ Logi w terminalu (pino-pretty) → szybki debugging
- ✅ Logi w Loki (OTLP) → analiza i historia

Jeśli chcesz **tylko terminal**, uruchom API bez OTLP:
```bash
pnpm dev  # Zamiast pnpm dev:api:obs
```

### Problem: Collector pokazuje "sent 0 logs"

**Przyczyna:** Pino może nie wysyłać logów przez OTLP.

**Rozwiązanie:**
1. Zrestartuj API
2. Wygeneruj ruch (curl do GraphQL)
3. Poczekaj 10 sekund (batching)
4. Sprawdź ponownie metryki

## 🎯 Korzyści Tej Implementacji

### Dla Developera:
- ✅ **Zero zmian w flow** - Logi nadal w terminalu jak zwykle
- ✅ **Real-time debugging** - pino-pretty z kolorami i formatowaniem
- ✅ **Opcjonalne** - Działa tylko z `pnpm dev:api:obs`

### Dla Team Lead:
- ✅ **Centralne logi** - Wszystkie logi w jednym miejscu (Grafana)
- ✅ **Trace correlation** - Logi linkowane z traces (trace_id, span_id)
- ✅ **Przeszukiwalne** - LogQL queries w Grafanie
- ✅ **Historia** - Loki retencja (domyślnie 2h w dev)

### Dla Produkcji:
- ✅ **Identyczna architektura** - Docker → Promtail → Loki (bez zmian)
- ✅ **Battle-tested** - Używa oficjalnego `pino-opentelemetry-transport`
- ✅ **Wydajne** - Batching, async processing w worker thread

## 📚 Referencje

- [pino-opentelemetry-transport](https://github.com/pinojs/pino-opentelemetry-transport)
- [OpenTelemetry Logs](https://opentelemetry.io/docs/specs/otel/logs/)
- [Loki Label Best Practices](https://grafana.com/docs/loki/latest/get-started/labels/)

## 🎉 Podsumowanie

**Pytanie:** "Dlaczego logi są zbierane tylko z Docker containers?"

**Odpowiedź:** Były! Teraz już nie są. 🚀

Logi z lokalnego API (`pnpm dev:api:obs`) trafiają do Loki przez:
```
Pino → pino-opentelemetry-transport → OTLP → Collector → Loki
```

**Status:** ✅ **W pełni działające!**

**Collector metrics:**
- `otelcol_exporter_sent_log_records{exporter="loki"}` > 0 ✅

**Loki query:**
- `{exporter="OTLP"}` zwraca logi ✅

**Grafana:**
- Logs Explorer pokazuje logi z Local API ✅

---

*Implementowane: 2025-01-05*

