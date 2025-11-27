# Troubleshooting - Manual Feedback Trigger

## Problem: "Failed to enqueue feedback requests"

### Przyczyna

Aplikacja nie może połączyć się z Redis, który jest wymagany przez BullMQ (system kolejek).

### Rozwiązanie

#### 1. Sprawdź czy Redis działa

```bash
# Test połączenia
redis-cli ping
# Powinno zwrócić: PONG
```

#### 2. Uruchom Redis

**macOS (Homebrew):**

```bash
# Zainstaluj (jeśli nie masz)
brew install redis

# Uruchom
brew services start redis

# Lub uruchom w foreground (do testów)
redis-server
```

**Docker:**

```bash
# Z docker-compose
cd docker
docker-compose -f docker-compose.dev.yml up -d redis

# Lub standalone
docker run -d -p 6379:6379 redis:alpine
```

**Linux:**

```bash
sudo systemctl start redis
```

#### 3. Sprawdź zmienne środowiskowe

W pliku `/apps/api/.env` (lub jako env vars):

```env
REDIS_HOST=localhost  # lub 'redis' jeśli Docker
REDIS_PORT=6379
```

#### 4. Zrestartuj aplikację

```bash
# W terminalu gdzie działa @miglee/api:dev
# Ctrl+C i potem:
pnpm run dev

# Powinieneś zobaczyć:
# ✅ Redis connected for feedback queue
# 🚀 Starting feedback worker...
# ✅ Feedback worker ready, listening for jobs...
```

---

## Weryfikacja że działa

### 1. Sprawdź logi przy starcie aplikacji

```
✅ Redis connected for feedback queue
✅ Feedback worker started
🚀 Starting feedback worker...
✅ Feedback worker ready, listening for jobs...
```

### 2. Testuj manualny trigger

1. Zaloguj się jako owner/moderator
2. Przejdź do `/intent/[id]/manage/feedback`
3. Kliknij "Wyślij prośby o feedback"
4. Powinieneś zobaczyć:
   - ✅ Success message: "Wysłano prośby do X uczestników"
   - W logach: `[enqueueFeedbackRequestNow] Immediate feedback request queued`

### 3. Sprawdź kolejkę Redis

```bash
redis-cli
> KEYS *
# Powinno pokazać klucze z BullMQ, np:
# bull:intent-feedback:*

> LLEN "bull:intent-feedback:wait"
# Liczba jobów czekających

> EXIT
```

---

## Alternatywne rozwiązanie (bez Redis)

Jeśli nie chcesz używać Redis w development, możesz tymczasowo zmodyfikować kod:

### Opcja A: Bezpośrednie wywołanie (sync)

W `/apps/api/src/graphql/resolvers/mutation/feedback-questions.ts`:

```typescript
// Zamiast:
await enqueueFeedbackRequestNow(intentId);

// Użyj bezpośrednio:
import { runFeedbackRequestForIntent } from '../../../workers/feedback/runFeedbackRequestForIntent';
await runFeedbackRequestForIntent(intentId);
```

**Uwaga:** To wyśle emaile synchronicznie, co może spowolnić response.

### Opcja B: Wyłącz worker w development

W `.env`:

```env
ENABLE_WORKERS=false
```

I w `src/index.ts`:

```typescript
if (process.env.ENABLE_WORKERS !== 'false') {
  feedbackWorker = bootstrapFeedbackWorker();
}
```

---

## Często spotykane błędy

### Error: "ECONNREFUSED 127.0.0.1:6379"

**Problem:** Redis nie działa  
**Rozwiązanie:** Uruchom Redis (patrz punkt 2)

### Error: "getaddrinfo ENOTFOUND redis"

**Problem:** Zły REDIS_HOST  
**Rozwiązanie:** Zmień na `localhost` zamiast `redis`

### Warning: "Failed to start feedback worker"

**Problem:** Redis niedostępny  
**Rozwiązanie:** To tylko warning - aplikacja będzie działać, ale feedback trigger nie zadziała. Uruchom Redis.

### Error: "Cannot find module './runFeedbackRequestForIntent'"

**Problem:** TypeScript cache  
**Rozwiązanie:** Restart TypeScript servera w VSCode (Cmd+Shift+P → "TypeScript: Restart TS Server")

---

## Architektura (dla zrozumienia)

```
Manual Trigger Flow:
┌─────────────────────────────────────────────────────────┐
│ 1. User clicks "Wyślij prośby"                         │
│    ↓                                                     │
│ 2. GraphQL mutation: sendFeedbackRequests              │
│    ↓                                                     │
│ 3. Validation (permissions, event status)              │
│    ↓                                                     │
│ 4. enqueueFeedbackRequestNow(intentId)                 │
│    ↓                                                     │
│ 5. BullMQ adds job to Redis queue                      │
│    ↓                                                     │
│ 6. Worker picks up job (async)                         │
│    ↓                                                     │
│ 7. runFeedbackRequestForIntent(intentId)               │
│    ↓                                                     │
│ 8. Sends emails via Resend + creates notifications     │
│    ↓                                                     │
│ 9. Updates FeedbackTracking (emailSentAt)              │
└─────────────────────────────────────────────────────────┘
```

**Dlaczego kolejka?**

- Async processing (nie blokuje response)
- Retry mechanism (3 attempts)
- Skalowalne (worker może być na innym serwerze)
- Persistence (jobs przetrwają restart aplikacji)

---

## Status aplikacji

Po naprawieniu powinno działać:

- ✅ Import loggera fixed (używa `lib/pino.ts`)
- ✅ Worker bootstrap w `src/index.ts`
- ✅ Redis connection logging
- ✅ Better error messages w mutation
- ✅ Nowa funkcja `enqueueFeedbackRequestNow()` bez delay

**Następny krok:** Uruchom Redis i zrestartuj aplikację! 🚀
