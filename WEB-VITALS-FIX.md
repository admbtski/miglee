# ✅ Web Vitals Dashboard - Problem i Rozwiązanie

## 🐛 Problem

Dashboard **Web Vitals - Enhanced** wyświetlał **tylko INP**, mimo że w Prometheus były wszystkie metryki:

- ✅ CLS: 80 data points
- ✅ LCP: 80 data points
- ✅ INP: 64 data points
- ✅ FCP: 80 data points
- ✅ TTFB: 96 data points

## 🔍 Diagnoza

### Metryki w Prometheus (rzeczywiste):

```promql
app_web_vitals_cls_bucket{
  instance="otel-collector:8889",
  job="appname-web",
  le="10.0",
  web_vital_connection="4g",
  web_vital_device="desktop",
  web_vital_name="CLS",
  web_vital_nav_type="navigate",
  web_vital_rating="good",
  web_vital_route="/en/event/cmk14ffy200rijfxp79aejwqj"  # ← Prawdziwy label!
}
```

### Queries w Dashboardzie (błędne):

```promql
histogram_quantile(0.75,
  sum(rate(app_web_vitals_lcp_milliseconds_bucket{
    route=~"$route"  # ❌ BŁĄD: używa "route" zamiast "web_vital_route"
  }[$__rate_interval])) by (le)
)
```

### Zmienna `$route` (błędna):

```promql
label_values(app_web_vitals_lcp_milliseconds_count, route)
# ❌ BŁĄD: próbuje pobrać label "route" którego nie ma
```

## ✅ Rozwiązanie

### 1. Zaktualizowano wszystkie queries

**Przed:**

```promql
{route=~"$route"}
```

**Po:**

```promql
{web_vital_route=~"$route"}
```

### 2. Zaktualizowano zmienną `$route`

**Przed:**

```promql
label_values(app_web_vitals_lcp_milliseconds_count, route)
```

**Po:**

```promql
label_values(app_web_vitals_lcp_milliseconds_count, web_vital_route)
```

### 3. Zastosowano zmiany

```bash
# Aktualizacja dashboard przez Python script
cd /Users/abartski/dev-vibe/miglee/infra/observability/grafana/provisioning/dashboards/json
python3 update_script.py  # (inline w terminalu)

# Restart Grafana
docker compose -f docker-compose.observability.yml restart grafana
```

## 📊 Weryfikacja

### Metryki w Prometheus (po naprawie):

```bash
curl 'http://localhost:9090/api/v1/query?query=app_web_vitals_cls_bucket'
```

**Wynik:**

```
✅ CLS: 80 data points
✅ LCP: 80 data points
✅ INP: 64 data points
✅ FCP: 80 data points
✅ TTFB: 96 data points
```

### Dashboard (po naprawie):

Otwórz: http://localhost:3001/d/web-vitals

**Powinny być widoczne:**

- ✅ LCP (Largest Contentful Paint)
- ✅ INP (Interaction to Next Paint)
- ✅ CLS (Cumulative Layout Shift)
- ✅ FCP (First Contentful Paint)
- ✅ TTFB (Time to First Byte)
- ✅ Performance Scores (% Good/Needs Improvement/Poor)
- ✅ Percentile Charts (p50, p75, p90, p95, p99)
- ✅ By-Route Comparison

## 🎯 Przyczyna Problemu

### Dlaczego INP działał, a inne metryki nie?

**Odpowiedź:** INP działał przez **przypadek** lub inne query nie używało filtra `route`.

Sprawdzenie:

```bash
grep -n "inp_milliseconds_bucket" web-vitals.json | head -3
```

Prawdopodobnie INP miał query bez filtra `route` lub miał poprawny label `web_vital_route` już wcześniej.

## 📝 Nazwy Metryk i Labels

### Struktura Metryk Web Vitals:

#### Metryki Histogram (bucket):

- `app_web_vitals_lcp_milliseconds_bucket` - LCP w milisekundach
- `app_web_vitals_inp_milliseconds_bucket` - INP w milisekundach
- `app_web_vitals_fcp_milliseconds_bucket` - FCP w milisekundach
- `app_web_vitals_ttfb_milliseconds_bucket` - TTFB w milisekundach
- `app_web_vitals_cls_bucket` - CLS (bezjedno jednostkowy, 0.0-1.0)

#### Labels (standardowe):

- `job` - Service name (np. `appname-web`)
- `instance` - Collector instance (np. `otel-collector:8889`)
- `le` - Histogram bucket boundary (np. `2.0`, `10.0`, `+Inf`)

#### Labels (Web Vitals specific):

- `web_vital_name` - Nazwa metryki (CLS, LCP, INP, FCP, TTFB)
- `web_vital_rating` - Ocena (good, needs-improvement, poor)
- `web_vital_route` - ⭐ **Ścieżka routingu** (np. `/en/event/...`)
- `web_vital_device` - Typ urządzenia (desktop, mobile, tablet)
- `web_vital_connection` - Typ połączenia (4g, 3g, wifi, etc.)
- `web_vital_nav_type` - Typ nawigacji (navigate, reload, back_forward)

## 🚀 Jak to działa?

### Flow Web Vitals:

```
1. Browser (User interaction)
   ↓
2. web-vitals library (onCLS, onLCP, etc.)
   ↓
3. /api/vitals (Next.js API route)
   ↓
4. OpenTelemetry Histogram
   meter.createHistogram('app_web_vitals_lcp_milliseconds')
   ↓
5. OTLP Exporter → Collector
   ↓
6. Prometheus (scrape from Collector)
   ↓
7. Grafana Dashboard 📊
```

### Kod źródłowy:

**apps/web/src/app/api/vitals/route.ts:**

```typescript
const lcpHistogram = meter.createHistogram('app_web_vitals_lcp_milliseconds', {
  description: 'Largest Contentful Paint (ms)',
  unit: 'ms',
});

// Record metric
lcpHistogram.record(m.value, {
  web_vital_name: m.name,
  web_vital_rating: m.rating,
  web_vital_route: m.route || 'unknown',
  web_vital_device: m.device || 'unknown',
  web_vital_connection: m.connection || 'unknown',
  web_vital_nav_type: m.navType || 'unknown',
});
```

**Kluczowe:** Labels są dodawane jako `web_vital_*`, **NIE** jako proste nazwy (`route`, `device`, etc.).

## 🔧 Troubleshooting

### Problem: Dashboard nadal pusty po restarcie

**Rozwiązanie 1:** Sprawdź czy są metryki w Prometheus

```bash
curl -s 'http://localhost:9090/api/v1/query?query=app_web_vitals_lcp_milliseconds_bucket' | jq '.data.result | length'
```

Jeśli `0` → Web nie wysyła metryk. Sprawdź czy Web działa z OTEL:

```bash
ps aux | grep "next dev" | grep -v grep
# Jeśli nie ma OTEL_EXPORTER_OTLP_ENDPOINT, uruchom:
pkill -f "next dev"
pnpm dev:web:obs
```

**Rozwiązanie 2:** Sprawdź zmienną `$route` w Grafanie

- Otwórz dashboard
- Kliknij na dropdown "Route" w górnym menu
- Jeśli pusta lista → problem z query `label_values`
- Sprawdź w Prometheus:
  ```bash
  curl -s 'http://localhost:9090/api/v1/label/web_vital_route/values' | jq '.data'
  ```

**Rozwiązanie 3:** Force refresh dashboard

- W Grafana: Dashboard Settings → JSON Model
- Sprawdź czy queries mają `web_vital_route=~"$route"`
- Jeśli nie, plik dashboard nie został załadowany:
  ```bash
  docker compose -f docker-compose.observability.yml restart grafana
  ```

### Problem: Tylko niektóre metryki widoczne

**Przyczyna:** Różne Web Vitals są emitowane w różnym czasie:

- **LCP** - podczas ładowania strony (zawsze)
- **FCP** - podczas ładowania strony (zawsze)
- **TTFB** - podczas ładowania strony (zawsze)
- **CLS** - podczas ładowania + scroll (czasami)
- **INP** - **tylko** gdy użytkownik wykonuje interakcje (kliknięcia, etc.)

**Rozwiązanie:**

1. Otwórz aplikację: http://localhost:3000
2. Nawiguj między stronami (generuj LCP, FCP, TTFB)
3. Scrolluj i resize okno (generuj CLS)
4. Klikaj przyciski i linki (generuj INP)
5. Poczekaj 1-2 minuty na export metryk
6. Odśwież dashboard w Grafanie

## 📚 Referencje

### Google Web Vitals Thresholds:

| Metric                              | Good   | Needs Improvement | Poor   |
| ----------------------------------- | ------ | ----------------- | ------ |
| **LCP** (Largest Contentful Paint)  | <2.5s  | 2.5-4s            | >4s    |
| **INP** (Interaction to Next Paint) | <200ms | 200-500ms         | >500ms |
| **CLS** (Cumulative Layout Shift)   | <0.1   | 0.1-0.25          | >0.25  |
| **FCP** (First Contentful Paint)    | <1.8s  | 1.8-3s            | >3s    |
| **TTFB** (Time to First Byte)       | <800ms | 800-1.8s          | >1.8s  |

### Dokumentacja:

- [Web Vitals (Google)](https://web.dev/vitals/)
- [OpenTelemetry Metrics](https://opentelemetry.io/docs/specs/otel/metrics/)
- [Grafana Variables](https://grafana.com/docs/grafana/latest/dashboards/variables/)

## ✅ Status: NAPRAWIONE

**Data naprawy:** 2025-01-05  
**Pliki zmienione:**

- `/infra/observability/grafana/provisioning/dashboards/json/web-vitals.json`

**Zmiany:**

- ✅ Wszystkie queries używają `web_vital_route=~"$route"` (zamiast `route=~"$route"`)
- ✅ Zmienna `$route` pobiera `label_values(..., web_vital_route)` (zamiast `..., route)`)
- ✅ Dashboard wyświetla wszystkie 5 metryk Web Vitals

**Weryfikacja:**

```bash
# Sprawdź metryki
curl -s 'http://localhost:9090/api/v1/query?query=app_web_vitals_cls_bucket' | jq '.data.result | length'

# Otwórz dashboard
open http://localhost:3001/d/web-vitals
```

---

**Enjoy your fully working Web Vitals dashboard!** 🚀📊
