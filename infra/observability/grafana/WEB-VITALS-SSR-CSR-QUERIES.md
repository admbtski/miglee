# 📊 Web Vitals - SSR vs CSR Queries

## Jak Dodać Panele SSR vs CSR do Dashboardu

Po uruchomieniu aplikacji z nowymi metrykami (`environment` i `render_type`), możesz dodać panele porównujące SSR vs CSR.

---

## 🎯 Query 1: LCP p75 - SSR vs CSR

**Type**: Time series  
**Title**: LCP p75 - SSR vs CSR  
**Description**: LCP p75 comparison: SSR (server-rendered) vs CSR (client-rendered)

```promql
# Query A (SSR)
histogram_quantile(0.75, 
  sum(rate(app_web_vitals_lcp_milliseconds_bucket{
    web_vital_route=~"$route", 
    web_vital_device=~"$device",
    web_vital_render_type="ssr"
  }[5m])) by (le)
)

# Query B (CSR)
histogram_quantile(0.75, 
  sum(rate(app_web_vitals_lcp_milliseconds_bucket{
    web_vital_route=~"$route", 
    web_vital_device=~"$device",
    web_vital_render_type="csr"
  }[5m])) by (le)
)
```

**Legend**:
- Query A: `SSR`
- Query B: `CSR`

**Thresholds**:
- Green: < 2500ms
- Yellow: 2500-4000ms
- Red: > 4000ms

---

## 🎯 Query 2: INP p75 - SSR vs CSR

**Type**: Time series  
**Title**: INP p75 - SSR vs CSR  
**Description**: INP p75 comparison: SSR vs CSR

```promql
# Query A (SSR)
histogram_quantile(0.75, 
  sum(rate(app_web_vitals_inp_milliseconds_bucket{
    web_vital_route=~"$route", 
    web_vital_device=~"$device",
    web_vital_render_type="ssr"
  }[5m])) by (le)
)

# Query B (CSR)
histogram_quantile(0.75, 
  sum(rate(app_web_vitals_inp_milliseconds_bucket{
    web_vital_route=~"$route", 
    web_vital_device=~"$device",
    web_vital_render_type="csr"
  }[5m])) by (le)
)
```

**Legend**:
- Query A: `SSR`
- Query B: `CSR`

**Thresholds**:
- Green: < 200ms
- Yellow: 200-500ms
- Red: > 500ms

---

## 🎯 Query 3: CLS p75 - SSR vs CSR

**Type**: Time series  
**Title**: CLS p75 - SSR vs CSR  
**Description**: CLS p75 comparison: SSR vs CSR

```promql
# Query A (SSR)
histogram_quantile(0.75, 
  sum(rate(app_web_vitals_cls_bucket{
    web_vital_route=~"$route", 
    web_vital_device=~"$device",
    web_vital_render_type="ssr"
  }[5m])) by (le)
)

# Query B (CSR)
histogram_quantile(0.75, 
  sum(rate(app_web_vitals_cls_bucket{
    web_vital_route=~"$route", 
    web_vital_device=~"$device",
    web_vital_render_type="csr"
  }[5m])) by (le)
)
```

**Legend**:
- Query A: `SSR`
- Query B: `CSR`

**Thresholds**:
- Green: < 0.1
- Yellow: 0.1-0.25
- Red: > 0.25

---

## 🌍 Query 4: Environment Filter

Dodaj nową zmienną do dashboardu:

**Variable Name**: `environment`  
**Type**: Query  
**Label**: Environment  
**Query**:
```promql
label_values(app_web_vitals_lcp_milliseconds_count, web_vital_environment)
```

**Include All**: Yes  
**Multi-value**: No

---

## 🎯 Query 5: Performance by Environment

**Type**: Time series  
**Title**: LCP p75 by Environment  
**Description**: Compare LCP across dev/staging/production

```promql
histogram_quantile(0.75, 
  sum(rate(app_web_vitals_lcp_milliseconds_bucket{
    web_vital_route=~"$route", 
    web_vital_device=~"$device"
  }[5m])) by (le, web_vital_environment)
)
```

**Legend**: `{{web_vital_environment}}`

---

## 📋 Jak Dodać Nową Sekcję w Dashboardzie

1. **Otwórz dashboard**: http://localhost:3001/d/web-vitals-production

2. **Dodaj nową sekcję (Row)**:
   - Kliknij **Add** → **Row**
   - Title: `🖥️ SSR vs CSR Comparison`
   - Kliknij **Add**

3. **Dodaj panele**:
   - Kliknij **Add** → **Visualization**
   - Wybierz **Time series**
   - Wklej queries z powyższych przykładów
   - Skonfiguruj legend, thresholds, i opcje wyświetlania
   - Kliknij **Apply**

4. **Zapisz dashboard**:
   - Kliknij **Save dashboard** (ikona dyskietki)
   - Dodaj commit message, np. "Add SSR vs CSR comparison"

---

## 🔄 Export Dashboard JSON

Po dodaniu wszystkich paneli:

1. Kliknij **Dashboard settings** (ikona koła zębatego)
2. Przejdź do **JSON Model**
3. Skopiuj całość
4. Nadpisz plik:
   ```
   infra/observability/grafana/provisioning/dashboards/json/web-vitals-production.json
   ```

---

## ✅ Weryfikacja

Sprawdź czy nowe labele są dostępne:

```bash
# 1. Check environment label
curl -s 'http://localhost:9090/api/v1/label/web_vital_environment/values' | jq '.data'

# Expected: ["development", "production", "staging"]

# 2. Check render_type label
curl -s 'http://localhost:9090/api/v1/label/web_vital_render_type/values' | jq '.data'

# Expected: ["ssr", "csr"]

# 3. Test query
curl -s 'http://localhost:9090/api/v1/query?query=app_web_vitals_lcp_milliseconds_count{web_vital_render_type="ssr"}' | jq '.data.result | length'

# Expected: > 0 (if metrics exist)
```

---

## 🚀 Restart Web App

Po zmianach w kodzie, zrestartuj aplikację web:

```bash
# Stop current process
pkill -f "node.*apps/web"

# Start with observability
cd /Users/abartski/dev-vibe/miglee
pnpm dev:web:obs
```

Po kilku minutach aktywnego użytkowania, nowe metryki z `environment` i `render_type` powinny pojawić się w Prometheus.

---

## 📊 Expected Results

Po dodaniu paneli SSR vs CSR, powinieneś zobaczyć:

### Typowe Wzorce:

**SSR (Server-Side Rendered)**:
- ✅ **Lepszy LCP**: Szybsza pierwsza zawartość (pre-rendered HTML)
- ⚠️ **Gorszy TTFB**: Dłuższy czas serwera (rendering + data fetching)
- ✅ **Lepszy CLS**: Mniej layout shifts (pre-calculated dimensions)

**CSR (Client-Side Rendered)**:
- ⚠️ **Gorszy LCP**: Czeka na JS bundle + render
- ✅ **Lepszy TTFB**: Szybsza odpowiedź serwera (static HTML)
- ⚠️ **Gorszy CLS**: Więcej layout shifts (dynamic content loading)

### Wnioski:

80% problemów CWV w produkcji pochodzi z **client-side rendering** (CSR).

Jeśli widzisz:
- LCP CSR > 3s → Optimize bundle size, use SSR dla critical pages
- CLS CSR > 0.2 → Pre-allocate space for dynamic content, use skeleton loaders
- INP CSR > 300ms → Reduce JavaScript execution, defer non-critical scripts

---

**Następny krok**: Sprawdź `ALERT-RULES.md` dla konfiguracji alertów Grafana.

