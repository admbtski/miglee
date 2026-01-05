# 🚀 Quick Fix - Web Vitals Dashboard

## ✅ Status: Wszystko działa w backendzie!

- ✅ Metryki w Prometheus: **96 serii**
- ✅ Query przez Grafana API: **18 data points**
- ✅ Zmienne: `$route` działa poprawnie
- ⚠️ Problem: **Dashboard cache** w Grafanie

---

## 🔧 Rozwiązanie Krok po Kroku

### Krok 1: Hard Refresh Przeglądarki

1. Otwórz dashboard:
   ```
   http://localhost:3001/d/web-vitals
   ```

2. Zrób **Hard Refresh**:
   - **Windows/Linux**: `Ctrl + Shift + R`
   - **Mac**: `Cmd + Shift + R`

3. Poczekaj 5-10 sekund na załadowanie

---

### Krok 2: Jeśli nadal "No data" - Test w Explore

1. Otwórz **Grafana Explore**:
   ```
   http://localhost:3001/explore
   ```

2. Upewnij się że wybrany datasource = **Prometheus**

3. Wklej query:
   ```promql
   app_web_vitals_lcp_milliseconds_bucket
   ```

4. Kliknij **Run query** (lub Shift+Enter)

**Oczekiwany rezultat**: Powinno pokazać ~96 serii z metrykami

---

### Krok 3: Test histogram quantile

W Explore wklej:
```promql
histogram_quantile(0.75, 
  sum(rate(app_web_vitals_lcp_milliseconds_bucket[5m])) by (le)
)
```

**Oczekiwany rezultat**: Wykres z wartościami p75 dla LCP

---

### Krok 4: Jeśli Explore działa, ale dashboard nie

Dashboard ma problem z cache. Rozwiązania:

#### Opcja A: Re-import Dashboard

1. Otwórz:
   ```
   http://localhost:3001/dashboard/import
   ```

2. Kliknij **"Upload JSON file"**

3. Wybierz plik:
   ```
   /Users/abartski/dev-vibe/miglee/infra/observability/grafana/provisioning/dashboards/json/web-vitals.json
   ```

4. Zmień **UID** na `web-vitals-new` (inny niż obecny)

5. Kliknij **Import**

6. Otwórz nowy dashboard

#### Opcja B: Edit Panel i Force Refresh

1. Kliknij na dowolny panel (np. "LCP (p75)")

2. Kliknij **Edit** (ikona ołówka)

3. W query editorze kliknij **Query inspector** (ikona info)

4. Kliknij **Refresh**

5. Sprawdź czy są dane w "Data" tab

6. Jeśli są dane, kliknij **Apply** i wróć do dashboardu

#### Opcja C: Clear Browser Cache

1. Otwórz DevTools: `F12` lub `Ctrl+Shift+I` (Win) / `Cmd+Option+I` (Mac)

2. Kliknij prawym na **Reload** button w przeglądarce

3. Wybierz **"Empty Cache and Hard Reload"**

---

## 🧪 Szybki Test - Czy Metryki Są Dostępne?

Wykonaj w terminalu:

```bash
# Test 1: Czy metryki są w Prometheus?
curl -s 'http://localhost:9090/api/v1/query?query=app_web_vitals_lcp_milliseconds_bucket' | jq '.data.result | length'
# Powinno zwrócić liczbę > 0

# Test 2: Czy Grafana widzi metryki?
curl -s -u admin:admin "http://localhost:3001/api/datasources/proxy/uid/prometheus/api/v1/query?query=app_web_vitals_lcp_milliseconds_bucket" | jq '.data.result | length'
# Powinno zwrócić tę samą liczbę

# Test 3: Czy routes są dostępne?
curl -s 'http://localhost:9090/api/v1/label/web_vital_route/values' | jq '.data'
# Powinno pokazać listę routes
```

---

## 🐛 Jeśli Nadal Nie Działa

### Check 1: Console Errors

1. Otwórz DevTools (`F12`)
2. Przejdź do tab **Console**
3. Odśwież dashboard
4. Sprawdź czy są **czerwone błędy**

Możliwe błędy:
- `Template variables could not be initialized` → Problem z variable query
- `Query error` → Problem z query syntax
- `Datasource not found` → Problem z datasource config

### Check 2: Panel Settings

1. Kliknij panel → **Edit**
2. Sprawdź **Query options** (dolny panel):
   - **Min interval**: powinno być puste lub `1m`
   - **Relative time**: powinno być puste
   - **Time shift**: powinno być puste

3. Sprawdź **Visualization**:
   - Type: `Time series` lub `Stat`
   - Nie powinno być żadnych custom thresholds blokujących dane

### Check 3: Time Range

1. Sprawdź time range w prawym górnym rogu
2. Kliknij i wybierz **Custom range**
3. Ustaw:
   - From: `now-6h`
   - To: `now`
4. Kliknij **Apply time range**

---

## 📊 Co Powinno Być Widoczne

Po naprawie dashboard powinien pokazywać:

### Metryki Core Web Vitals:
- ✅ **LCP** (Largest Contentful Paint) - p75 wartość
- ✅ **INP** (Interaction to Next Paint) - p75 wartość
- ✅ **CLS** (Cumulative Layout Shift) - p75 wartość
- ✅ **FCP** (First Contentful Paint) - p75 wartość
- ✅ **TTFB** (Time to First Byte) - p75 wartość

### Performance Scores:
- % użytkowników z "Good" experience
- Rozkład Good/Needs Improvement/Poor

### Charts:
- Percentile charts (p50, p75, p90, p95, p99)
- Score distribution
- By-route comparison

---

## 🚀 Generowanie Więcej Danych

Jeśli dashboard działa ale ma mało danych:

1. **Otwórz aplikację**: http://localhost:3000

2. **Nawiguj aktywnie** (5-10 minut):
   - Klikaj różne strony
   - Scrolluj
   - Zmieniaj rozmiar okna (generuje CLS)
   - Klikaj przyciski (generuje INP)

3. **Poczekaj 2-3 minuty** na export metryk

4. **Odśwież dashboard** w Grafanie

---

## ✅ Podsumowanie Testów API

Wszystkie testy API działają:
```bash
✅ Prometheus ma metryki: 96 serii
✅ Grafana API widzi metryki: 96 serii  
✅ Query histogram_quantile działa: 18 data points
✅ Variable $route zwraca routes: 6 routes
✅ Metryki są świeże: timestamp = now
```

**Problem jest TYLKO w dashboardzie UI, nie w danych!**

---

**Co dokładnie widzisz po hard refresh? Opisz lub zrób screenshot!** 📸

