# 🔍 Debug Web Vitals w Grafanie

## ✅ Status:

- **Collector**: ✅ Otrzymuje metryki OTLP
- **Port 8889**: ✅ Eksportuje metryki `app_web_vitals_*`  
- **Prometheus**: ✅ Scrapuje i ma metryki (16 buckets)
- **Metryki**: ✅ ŚWIEŻE (timestamp: teraz)

## 🧪 Test w Grafana Explore

### Krok 1: Otwórz Explore

```
http://localhost:3001/explore
```

### Krok 2: Wybierz Prometheus datasource

### Krok 3: Przetestuj queries

**Query 1: Podstawowe (bez filtra)**
```promql
app_web_vitals_lcp_milliseconds_bucket
```
**Oczekiwany rezultat**: Powinno pokazać ~16 serii

---

**Query 2: Z filtrem route (regex .*)**
```promql
app_web_vitals_lcp_milliseconds_bucket{web_vital_route=~".*"}
```
**Oczekiwany rezultat**: Powinno pokazać wszystkie route

---

**Query 3: Histogram quantile (p75)**
```promql
histogram_quantile(0.75, 
  sum(rate(app_web_vitals_lcp_milliseconds_bucket[5m])) by (le)
)
```
**Oczekiwany rezultat**: Jedna wartość (p75 latencji)

---

**Query 4: Dashboard style (z $route = All)**
```promql
histogram_quantile(0.75,
  sum(rate(app_web_vitals_lcp_milliseconds_bucket{web_vital_route=~".+"}[5m])) by (le)
)
```
**Oczekiwany rezultat**: Jedna wartość

## 🎯 Sprawdź Dashboard

### Otwórz Web Vitals dashboard:
```
http://localhost:3001/d/web-vitals
```

### Sprawdź:

1. **Time Range** (prawy górny róg)
   - Ustaw na "Last 1 hour" lub "Last 6 hours"
   - Kliknij "Refresh dashboard" (ikona reload)

2. **Zmienna $route**
   - U góry powinien być dropdown "Route"
   - Sprawdź czy są wartości (np. `/test`, `/en/events`)
   - Wybierz "All" lub konkretną route

3. **Panele**
   - Czy pokazują "No data"?
   - Czy jest "Loading..."?
   - Czy jest błąd query?

## 🐛 Możliwe Problemy

### Problem 1: "No data" mimo że metryki są

**Rozwiązanie:**
- Kliknij panel → Edit
- Sprawdź query w zakładce "Query"
- Kliknij "Query inspector" → "Refresh"
- Sprawdź czy jest błąd w "Query" tab

### Problem 2: Zmienna $route jest pusta

**Rozwiązanie:**
- Dashboard Settings → Variables
- Kliknij na "route" variable
- Sprawdź query: `label_values(app_web_vitals_lcp_milliseconds_count, web_vital_route)`
- Kliknij "Update" i "Run query"
- Powinno pokazać listę routes

### Problem 3: Rate() zwraca no data

**Przyczyna:** `rate()` wymaga co najmniej 2 data points w time window

**Rozwiązanie:**
- Zmień `[5m]` na `[1m]` w query
- Lub zaczekaj 1-2 minuty i odśwież dashboard

### Problem 4: Time range jest za stary

**Rozwiązanie:**
- Ustaw "Last 1 hour"
- Odśwież dashboard (Ctrl/Cmd + R)

## 📊 Weryfikacja Manualnie

### Sprawdź metryki są w Prometheus:

```bash
# 1. Wszystkie Web Vitals metryki
curl -s 'http://localhost:9090/api/v1/label/__name__/values' | jq -r '.data[] | select(contains("web_vitals"))'

# 2. Dostępne routes
curl -s 'http://localhost:9090/api/v1/label/web_vital_route/values' | jq '.data'

# 3. Liczba buckets dla LCP
curl -s 'http://localhost:9090/api/v1/query?query=app_web_vitals_lcp_milliseconds_bucket' | jq '.data.result | length'
```

## 🚀 Generowanie Świeżych Metryk

Jeśli dashboard nadal pusty, wygeneruj świeże metryki:

```bash
# 1. Otwórz aplikację
open http://localhost:3000

# 2. Nawiguj między stronami (5-10 kliknięć)
# - Kliknij różne linki
# - Przejdź na różne strony
# - Scrolluj i wykonuj interakcje

# 3. Poczekaj 2 minuty

# 4. Odśwież dashboard w Grafanie
```

## 🔧 Force Refresh Dashboard

Jeśli nic nie pomaga:

```bash
cd /Users/abartski/dev-vibe/miglee/infra/observability
docker compose -f docker-compose.observability.yml restart grafana
```

Poczekaj 30 sekund, potem:
```
open http://localhost:3001/d/web-vitals
```

---

**Co dokładnie widzisz w dashboardzie?**
- "No data"?
- Pusty wykres?
- Błąd query?
- Loading...?

Prześlij screenshot lub opisz dokładnie co widzisz!

