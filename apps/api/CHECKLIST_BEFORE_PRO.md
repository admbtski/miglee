# Miglee API – CHECKLIST_BEFORE_PRO.md

> Kompleksowa checklista przed pierwszym prawdziwym PRO / produkcyjnym startem backendu Miglee.  
> Zakładamy stack: Fastify + Mercurius + Prisma + PostgreSQL + Redis + BullMQ + Stripe + S3/Local Storage.  
> OpenTelemetry – POMINIĘTE w tej checkliście (osobny temat).

---

## 0. Meta / Organizacja

- [ ] Ten plik jest trzymany w repo (np. `apps/api/CHECKLIST_BEFORE_PRO.md`).
- [ ] Istnieje **pojedyncze źródło prawdy**: ta checklista jest aktualizowana, kiedy zmienia się architektura.
- [ ] Każdy punkt ma ownera (do ustalenia wewnętrznie).
- [ ] Dla krytycznych punktów są założone taski w projekcie (Jira/Linear/GitHub Issues).
- [ ] Istnieje prosty opis SLO / celów jakości (np. uptime, max latency, max error-rate) dla API.

---

## 1. Środowiska, ENV i sekrety

### 1.1. Środowiska

- [ ] Są zdefiniowane **osobne** środowiska:
  - [ ] `development`
  - [ ] `staging` / `preprod` (zalecane)
  - [ ] `production`
- [ ] Każde środowisko ma **osobną** bazę danych.
- [ ] Każde środowisko ma **osobny** Redis (albo osobne db/prefiksy, jeśli ten sam cluster).
- [ ] Staging używa **testowego projektu Stripe**, nie live’owego.
- [ ] Staging ma możliwie podobną konfigurację (limity, time-outy, kolejki) do produkcji.

### 1.2. Zmiennie środowiskowe

- [ ] `env.ts` waliduje WSZYSTKIE krytyczne env przez Zod (brak „optional” dla rzeczy, które muszą być).
- [ ] `.env.example` jest zgodne z aktualnym kodem (nie brakuje żadnego wymaganego ENV).
- [ ] W production używasz:
  - [ ] `.env.production` **lub**
  - [ ] secrets managera (Vault/Cloud Secrets Manager), **nie** wrzucasz secretów do repo.
- [ ] Klucz `JWT_SECRET` jest:
  - [ ] długi (min. 32+ znaków),
  - [ ] generowany losowo,
  - [ ] różny per environment (dev vs prod).
- [ ] Wszystkie klucze Stripe są tylko w ENV:
  - [ ] `STRIPE_SECRET_KEY`
  - [ ] `STRIPE_WEBHOOK_SECRET`
  - [ ] `STRIPE_PRICE_*`
- [ ] Wszystkie klucze S3 są tylko w ENV:
  - [ ] `S3_ACCESS_KEY_ID`
  - [ ] `S3_SECRET_ACCESS_KEY`
- [ ] Nie ma żadnych „sample secretów” zahardkodowanych w kodzie (grep na `sk_`, `whsec_`, `AKIA`, itp. → czysto).

---

## 2. Fastify / HTTP / serwer

### 2.1. Konfiguracja serwera

- [x] Fastify startuje z:
  - [x] `logger` ustawionym na Pino w JSON w production (bez `pino-pretty`).
  - [x] `trustProxy` poprawnie skonfigurowane, jeśli działa za reverse proxy (Nginx/Ingress).
- [x] Obsługiwane są sygnały:
  - [x] `SIGTERM`
  - [x] `SIGINT`
  - [x] (opcjonalnie) `SIGUSR2` dla restartów narzędzi.
- [x] Zaimplementowany jest **graceful shutdown**:
  - [x] Fastify przestaje przyjmować nowe requesty,
  - [x] czeka określony czas na dokończenie bieżących requestów,
  - [x] zamyka połączenia do DB (`prisma.$disconnect()`),
  - [x] zamyka połączenia do Redis,
  - [x] zamyka BullMQ workers,
  - [x] dopiero wtedy `process.exit`.

### 2.2. Health-checki

- [x] Endpoint `/health/live`:
  - [x] zwraca 200, jeśli proces żyje,
  - [x] nie robi ciężkich operacji (bez zapytań do DB),
  - [x] używany jako **liveness probe**.
- [x] Endpoint `/health/ready`:
  - [x] sprawdza Postgresa (`SELECT 1`),
  - [x] sprawdza Redis (`PING`),
  - [x] zwracany status: `ok` / `degraded` / `fail`,
  - [x] status HTTP: 200 (ok/degraded), 503 (fail),
  - [x] używany jako **readiness probe**.
- [x] Stary `/health` działa, ale może być oznaczony jako legacy (jeśli jest potrzebna kompatybilność wstecz).

---

## 3. Auth & Sesje

### 3.1. Autentykacja

- [ ] W **production** nie używasz `x-user-id` jako mechanizmu auth:
  - [ ] Wszystkie requesty wymagające auth korzystają z `Authorization: Bearer <JWT>` lub secure cookie.
- [ ] JWT:
  - [ ] jest podpisywany `JWT_SECRET` z ENV,
  - [ ] ma sensowny czas życia (np. 5–15 min dla access tokena),
  - [ ] zawiera minimalnie: `sub` (userId), ewentualnie role/claims.
- [ ] Refresh tokeny:
  - [ ] są generowane losowo i wystarczająco długie,
  - [ ] trzymane są w **httpOnly secure cookie** **lub** w DB/Redis powiązanej z userem,
  - [ ] można je unieważnić (logout/rotate),
  - [ ] mają rotację (wydanie nowego → stary oznaczony jako zużyty/revoked).
- [ ] W DB istnieje model sesji (`UserSession` / `Session`):
  - [ ] powiązany z userId,
  - [ ] trzyma UA/IP/createdAt/expiresAt/revokedAt,
  - [ ] umożliwia „logout ze wszystkich urządzeń”.
- [ ] Flow „reset hasła”:
  - [ ] `PasswordResetToken` lub podobny model,
  - [ ] token czasowy (np. 15–60 min),
  - [ ] endpoint do ustawienia nowego hasła po weryfikacji tokena.
- [ ] Flow „weryfikacja emaila”:
  - [ ] `VerificationToken` w DB,
  - [ ] link z ważnością i jasnym UI po stronie frontu.

### 3.2. Autoryzacja / role

- [ ] Istnieje centralny moduł guardów:
  - [ ] `requireAuth`,
  - [ ] `requireAdmin`,
  - [ ] `requireEventAccess`,
  - [ ] `requireChatAccess`,
  - [ ] ewentualnie inne (`requireOrgOwner`, itp.).
- [ ] Mapa ról i uprawnień (User Role vs EventMemberRole vs Admin/Moderator) jest:
  - [ ] spisana w jednym miejscu (dokument lub kod),
  - [ ] używana jako „źródło prawdy”.
- [ ] Wszystkie krytyczne mutacje/querki:
  - [ ] `createEvent`, `updateEvent`, `cancelEvent`, `deleteEvent`,
  - [ ] `joinEvent`, `leaveEvent`, `kickMember`, `banMember`, `updateMemberRole`,
  - [ ] `sendEventMessage`, `sendDM`, `editMessage`, `deleteMessage`,
  - [ ] `createUserCheckout`, `createEventCheckout`, `cancelSubscription`,
  - [ ] `uploadMedia`, `deleteMedia`,
  - [ ] `banUser`, `unbanUser`, `deleteUser`,
  - [ ] korzystają z odpowiednich guardów z jednego miejsca (brak ręcznego `if (!ctx.user)` rozrzuconego po kodzie).

### 3.3. Dostęp do paneli admin / narzędzi

- [ ] Bull Board `/admin/queues`:
  - [ ] w dev – może być open,
  - [ ] w production – wymaga:
    - [ ] flagi `ENABLE_BULL_BOARD=true`,
    - [ ] **autentykacji**,
    - [ ] sprawdzenia **roli ADMIN**.
- [ ] Ewentualne inne endpointy admin (np. metrics, debug):
  - [ ] nie są publicznie dostępne w produkcji bez autentykacji.
- [ ] Operacje admin/moderation są logowane:
  - [ ] istnieje `AdminActionLog` (kto/co/kiedy/na kim),
  - [ ] logi są powiązane z requestId/userId.

### 3.4. Auth w WebSocket / Subscriptions

- [ ] Połączenie WS (`connection_init`) przekazuje token (JWT lub session cookie).
- [ ] Token jest weryfikowany przy inicjalizacji subskrypcji.
- [ ] Wymuszone jest ponowne uwierzytelnienie przy reconnect’ach (brak „wiecznych” połączeń bez weryfikacji).
- [ ] Subskrypcje korzystają z tych samych guardów, co mutacje (`requireEventAccess`, `requireChatAccess`, itp.).

---

## 4. GraphQL (Mercurius)

### 4.1. Konfiguracja GraphQL

- [ ] GraphiQL:
  - [ ] `NODE_ENV=production` → **wyłączony**,
  - [ ] dostępny tylko w dev/staging.
- [ ] Introspection:
  - [ ] blokowane w production (chyba że świadomie chcesz zostawić),
  - [ ] dostępne w dev/staging.
- [ ] Limit głębokości:
  - [ ] production: max depth (np. 7),
  - [ ] dev: większy (np. 15).
- [ ] Limit złożoności:
  - [ ] production: np. 1000,
  - [ ] dev: np. 5000.

### 4.2. Walidacja wejścia i błędy

- [ ] Mutacje używają Zod lub innych schematów walidacji na wejściu (poza typami GraphQL).
- [ ] Jest globalny `errorFormatter`, który:
  - [ ] maskuje stack trace w production,
  - [ ] rozróżnia błędy „operacyjne” (`BAD_USER_INPUT`, `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, etc.),
  - [ ] loguje pełny error (ze stackiem) do Pino.
- [ ] Na zewnątrz wystawiasz **ograniczoną listę kodów** errorów w `extensions.code`:
  - [ ] np. `BAD_USER_INPUT`, `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_ERROR`, `RATE_LIMIT_EXCEEDED`, `CONFLICT`, `GONE`, `UNPROCESSABLE_ENTITY`.

### 4.3. Paginacja, limity, payloady

- [ ] **Każdy** query listujący dane (events, users, messages, notifications, reviews, etc.):
  - [ ] ma `limit` (domyślny np. 20–50),
  - [ ] ma max limit (np. 100),
  - [ ] nie pozwala na „full table scan” bez limitu.
- [ ] Zwracasz sensowne `pageInfo` (lub offset/limit), żeby front mógł paginować.
- [ ] W dużych payloadach (np. messages, chat) nie zwracasz zbędnych pól (tylko to, co potrzebne na UI).

### 4.4. N+1 / Dataloader

- [ ] Najczęstsze relacje (event → members, event → owner, user → events, notification → entity) mają:
  - [ ] zredukowany problem N+1 (poprzez `include`/`select` albo Dataloader),
  - [ ] jeśli używasz Dataloader – jest on skonfigurowany per-request (w kontekście GraphQL).
- [ ] Zidentyfikowane i poprawione są **najcięższe** zapytania (profilowanie przed prod).

---

## 5. Baza danych (PostgreSQL + Prisma)

### 5.1. Połączenia i migracje

- [ ] W production używasz **tylko**:
  - [ ] `prisma migrate deploy` (nie `migrate dev`).
- [ ] Migrations:
  - [ ] są versionowane,
  - [ ] przetestowane na stagingu,
  - [ ] odpalane w pipeline **przed** startem nowej wersji.
- [ ] Connection pool:
  - [ ] limit połączeń dobrany do wielkości instancji Postgresa (np. 20 per API),
  - [ ] brak przekroczenia `max_connections` na serwerze.

### 5.2. Indeksy i wydajność

- [ ] Kluczowe pola mają indeksy:
  - [ ] `event.startAt`, `event.visibility`, `event.meetingKind`, ew. pola geolokacyjne,
  - [ ] foreign key’e typu `userId`, `eventId`, `recipientId`,
  - [ ] unikalne pola (`email`, slug kategorii/tagów, itd.).
- [ ] Są indeksy pod typowe filtry (np. `notifications` po `recipientId`, `readAt IS NULL`).
- [ ] Masz włączony / przetestowany `statement_timeout` (np. 30s) w production.
- [ ] Konfiguracja slow query log (próg np. 1s w prod) jest ustawiona i sprawdzana.

### 5.3. Dane, consistency

- [ ] Kluczowe relacje mają sens:
  - [ ] `ON DELETE` ustawione (np. `ON DELETE SET NULL` / `RESTRICT` tam, gdzie potrzeba).
- [ ] Soft delete:
  - [ ] tam, gdzie robisz soft delete (user, event), masz:
    - [ ] spójne warunki `WHERE deletedAt IS NULL` w query’ach,
    - [ ] logikę, co się dzieje z powiązanymi obiektami (chat, reviews, membershipy).

---

## 6. Redis / BullMQ

### 6.1. Redis

- [x] Konfiguracja połączenia:
  - [x] retry policy jest **ograniczona** (nie nieskończona),
  - [x] sensowny `connectTimeout`, `commandTimeout`.
- [x] Klienci Redis:
  - [x] `healthRedis` – tylko health check,
  - [x] `rateLimitRedis` – rate limiting (HTTP layer),
  - [x] `chatRedis` – chat features (rate limiting, typing indicators),
  - [x] `redisEmitter` – pub/sub do Mercurius,
  - [x] `BullMQ` – osobne connection (per queue).
- [x] Redis padnie → API:
  - [x] nadaje sensowny error (np. `SERVICE_UNAVAILABLE` dla elementów wymagających Redis),
  - [x] nie ubija całego procesu (graceful degradation, fail-open strategy).

### 6.2. BullMQ

- [ ] Każda kolejka ma:
  - [ ] sensowne `defaultJobOptions`, w tym `attempts`, `backoff`, `removeOnComplete`, `removeOnFail`.
- [ ] Workers:
  - [ ] odpalane są jako **osobny proces** (a nie w tym samym co HTTP, jeśli się da),
  - [ ] mają ustawiony `concurrency` (prod vs dev).
- [ ] Dead-Letter Queue (DLQ):
  - [ ] jest tworzony dla każdej ważnej kolejki,
  - [ ] masz helpery do:
    - [ ] podejrzenia failed jobs,
    - [ ] reprocessingu,
    - [ ] czyszczenia.
- [ ] Bull Board:
  - [ ] jest dostępny,
  - [ ] w produkcji chroniony auth/role (jak wyżej).

### 6.3. Idempotencja jobów i wersjonowanie payloadów

- [ ] Ważne joby (reminders, feedback, maile) są **idempotentne**:
  - [ ] job może zostać wykonany kilka razy (retry, reprocess z DLQ) bez duplikacji efektów (np. double-mail),
  - [ ] istnieje klucz idempotencji (np. eventId + typ + bucket) w logu jobów lub wewnątrz domeny.
- [ ] Payload joba ma pole `version`:
  - [ ] w razie zmian schematu możesz stosować backward-compatible handling,
  - [ ] stare joby nie wywalają workerów przez brak oczekiwanych pól.

---

## 7. Stripe / Billing

### 7.1. Checkout & Webhook flow

- [ ] **Flow** dla:
  - [ ] User subscriptions (PLUS/PRO, monthly/yearly),
  - [ ] User one-off,
  - [ ] Event sponsorship (PLUS/PRO),
  - jest opisany i zaimplementowany end-to-end.
- [ ] Webhook endpoint `/webhooks/stripe`:
  - [ ] weryfikuje podpis (`STRIPE_WEBHOOK_SECRET`),
  - [ ] odrzuca requesty bez poprawnego signature (4xx).
- [ ] Każde zdarzenie Stripe:
  - [ ] jest zapisywane w DB jako `PaymentEvent` (lub podobny),
  - [ ] ma unikalny identyfikator eventu (`stripeEventId` lub podobne pole),
  - [ ] jest objęte unikalnym indeksem → **idempotencja**.
- [ ] Przetwarzanie webhooków:
  - [ ] jest idempotentne (ten sam Stripe event nie zmieni stanu 2x),
  - [ ] w razie błędu – loguje błąd i nie „psuje” planu.

### 7.2. Plany i edge-case’y

- [ ] `UserPlanPeriod`:
  - [ ] dobrze obsługuje nakładające się okresy (np. nowa płatność zanim stara wygaśnie),
  - [ ] jest jednoznaczne, jaki plan obowiązuje **w danym momencie**.
- [ ] `EventSponsorshipPeriod`:
  - [ ] analogicznie – wiesz, czy event ma PRO/PLUS w danym czasie.
- [ ] Obsługa:
  - [ ] `checkout.session.completed` → aktywacja planu/okresu,
  - [ ] `invoice.payment_succeeded` → przedłużenie,
  - [ ] `customer.subscription.deleted` / `canceled` → downgrade na FREE po zdefiniowanym grace period (jeśli stosujesz).
- [ ] Błędy płatności:
  - [ ] `invoice.payment_failed` jest obsłużone (log, ewentualna notyfikacja usera, ewentualny downgrade po kilku próbach).

### 7.3. Testy sandbox

- [ ] Na stagingu odpaliłeś realne scenariusze z **testowym** Stripe:
  - [ ] nowy user → upgrade do PLUS/PRO,
  - [ ] PRO user → cancel subscription → po webhooku wraca na FREE,
  - [ ] event → sponsorship PRO → wygasa → sprawdzasz, że PRO-feature’y znikają.
- [ ] Przetestowane są scenariusze:
  - [ ] user zamyka stronę w trakcie checkoutu,
  - [ ] user próbuje „spamować” checkout (rate-limit + idempotencja).

---

## 8. Media / Storage

### 8.1. Uploady

- [ ] `@fastify/multipart`:
  - [ ] ma ustawione limity rozmiaru (np. 10MB),
  - [ ] limity liczby plików na request,
  - [ ] akceptuje tylko dozwolone typy MIME (obrazy).
- [ ] Flow:
  - [ ] klient dostaje URL (presigned lub lokalny),
  - [ ] uploaduje plik,
  - [ ] potwierdza upload mutacją (`confirmMediaUpload`),
  - [ ] dopiero wtedy plik jest widoczny/publiczny w systemie.
- [ ] API nie działa jak „publiczny file hosting”:
  - [ ] są limity liczby uploadów / pojemności per user,
  - [ ] upload jest objęty rate-limitem.

### 8.2. S3 / lokalne

- [ ] Jeśli `MEDIA_STORAGE_PROVIDER=S3`:
  - [ ] bucket jest **prywatny** (brak publicznego listowania),
  - [ ] publiczny dostęp – tylko przez presigned URLs / CDN.
- [ ] Przy local storage:
  - [ ] ścieżki `UPLOADS_PATH` i `UPLOADS_TMP_PATH` istnieją,
  - [ ] user pod systemem ma uprawnienia do zapisu/odczytu.
- [ ] Image processing:
  - [ ] error’y z Sharp są łapane i zwracane jako czytelne błędy,
  - [ ] generowane są poprawnie rozmiary (original/medium/small/thumb),
  - [ ] nie nadpisujesz plików o tym samym key, chyba że to świadomy design.

---

## 9. Logging (Pino) & Monitoring (bez OTEL)

### 9.1. Logging

- [ ] W production:
  - [ ] logi lecą w JSON,
  - [ ] `LOG_LEVEL` domyślnie `info` (lub `warn`),
  - [ ] `pino-pretty` jest wyłączony.
- [ ] Każdy request:
  - [ ] ma `requestId`,
  - [ ] loguje metodę, ścieżkę, status, czas trwania,
  - [ ] jeśli zalogowany user – `userId` w kontekście loga.
- [ ] Błędy:
  - [ ] logowane są ze stack trace,
  - [ ] przypięte są do `requestId`.
- [ ] W logach nie pojawiają się:
  - [ ] hasła, tokeny, klucze API,
  - [ ] pełne dane wrażliwe (np. numer karty, odpowiedzi join-form, jeśli prywatne).

### 9.2. Monitoring / alerty

- [ ] Istnieje jakiś minimalny monitoring:
  - [ ] liczba requestów,
  - [ ] liczba błędów 5xx,
  - [ ] czas odpowiedzi (p95/p99),
  - [ ] kolejki (liczba failed/delayed),
  - [ ] status DB/Redis.
- [ ] Są ustawione alerty (nawet proste):
  - [ ] „więcej niż X błędów 5xx w Y minut”,
  - [ ] „DB/Redis nieosiągalny przez Z sekund/minut”,
  - [ ] „liczba failed jobs w kolejce > N w czasie T”.
- [ ] Ktoś jest ownerem tych alertów (kto je dostaje i reaguje).

---

## 10. Bezpieczeństwo (security)

### 10.1. HTTP / Headery / CORS

- [x] `@fastify/helmet`:
  - [x] ma twardą konfigurację produkcyjną (HSTS, frameguard, COOP/CORP, CSP),
  - [x] CSP jest zgodne z potrzebami frontu i websockets.
- [x] CORS:
  - [x] w production: **konkretne** originy z `CORS_ORIGINS`,
  - [x] `credentials: true` tylko jeśli potrzebujesz cookies,
  - [x] brak `origin: '*'` w production.

### 10.2. Cookies (jeśli używasz)

- [ ] W production:
  - [ ] `secure: true`,
  - [ ] `httpOnly: true`,
  - [ ] `sameSite: 'lax'` lub `strict`,
  - [ ] `domain` ustawiony na domenę (lub subdomenę) appki.

### 10.3. Rate limiting i abuse

- [x] **LAYER 1 - HTTP/Infrastructure** (`@fastify/rate-limit`):
  - [x] globalny limit (100/min/user w prod, 1000/min w dev),
  - [x] Redis w production, in-memory w dev,
  - [x] osobne presets dla:
    - [x] `/health/*` → read preset (300/min) - K8s polling
    - [x] `/webhooks/stripe` → webhook preset (200/min) - external webhooks
    - [x] `/api/upload/local` → upload preset (20/hour) - file uploads
    - [x] `/admin/queues/stats` → expensive preset (5/min) - admin endpoints
- [x] **LAYER 2 - Domain/Business Logic** (`domainRateLimiter.ts`):
  - [x] Redis ZSET sliding window algorithm
  - [x] Burst protection (anty-spam w krótkich oknach)
  - [x] Rate limiting per domain action:
    - [x] Chat: `chat:event:send` (30/30s, burst 5/5s), `chat:dm:send` (30/30s), edit (5/min), delete (5/min)
    - [x] Event membership: `gql:event:write` (30/min) - join, leave, waitlist, accept invite
    - [x] Feedback: `gql:feedback` (5/min submit), `gql:feedback:send` (3/hour send) - **EMAIL SPAM PROTECTION!**
    - [x] Reports: `gql:report` (10/10min) - abuse reporting
    - [x] Billing: `gql:billing` (10/10min) - **STRIPE SPAM PROTECTION!**
  - [x] GraphQL errors z `retryAfter` dla frontendu
  - [x] Fail-open strategy (Redis errors nie blokują requestów)
- [x] **15 mutations chronionych** rate limitingiem:
  - [x] Billing (5): createSubscriptionCheckout, createOneOffCheckout, createEventSponsorshipCheckout, cancelSubscription, reactivateSubscription
  - [x] Feedback (2): submitReviewAndFeedback, sendFeedbackRequests
  - [x] Event Membership (5): joinMember, acceptInvite, leaveEvent, joinWaitlistOpen, leaveWaitlist
  - [x] Join Requests (2): requestJoinEventWithAnswers, cancelJoinRequest
  - [x] Reports (1): createReport
  - [x] Chat (4): event chat send, DM send, edit, delete

### 10.4. Inne aspekty security

- [ ] Sekrety (Stripe, JWT, S3) nie są dostępne w logach ani w odpowiedziach błędów.
- [ ] Uploadowane pliki są walidowane pod kątem typu (nie tylko rozszerzenia).
- [ ] Nie trzymasz w DB danych, których nie potrzebujesz (data minimization).

---

## 11. GDPR / Prywatność / Dane użytkownika

- [ ] Endpoint `deleteMyAccount`:
  - [ ] jest zaimplementowany,
  - [ ] jasno zdefiniowane, czy:
    - [ ] robisz hard delete (user i większość jego danych znika),
    - [ ] **czy** soft delete + anonimizacja (np. „Deleted user”) + zachowanie minimalnej historii biznesowej (np. recenzje bez danych osobowych).
- [ ] Logi:
  - [ ] nie zawierają haseł, tokenów, pełnych numerów kart, etc.,
  - [ ] starasz się nie logować pełnych payloadów osobowych (email, imię) w każdym request logu,
  - [ ] newralgiczne pola join-form (np. bardzo prywatne odpowiedzi) nie są logowane w całości.
- [ ] Dane w DB:
  - [ ] wrażliwe pola (np. maile) są tylko tam, gdzie muszą być,
  - [ ] jest zdefiniowana polityka retencji (jak długo trzymasz konta soft-deleted, logi, payment events).
- [ ] Eksport danych użytkownika:
  - [ ] jest techniczna możliwość wygenerowania dumpa danych (nawet jeśli nie ma jeszcze UI),
  - [ ] zakres: profil, eventy, membershipy, recenzje, podstawowe działania.
- [ ] Audit log (admin/moderation):
  - [ ] nie przechowuje więcej danych osobowych niż to konieczne (ID zamiast pełnych treści).

---

## 12. Testy i jakość

### 12.1. TypeScript, ESLint

- [x] `pnpm typecheck` przechodzi bez błędów.
- [ ] `pnpm lint` przechodzi (albo przynajmniej nie ma błędów krytycznych).
- [x] TS ma włączone sensowne opcje (`strict` lub prawie-strict).

### 12.2. Testy jednostkowe (unit)

- [ ] Istnieje pakiet testów unitowych (np. Vitest) dla:
  - [ ] logiki waitlist / capacity / joinMode,
  - [ ] guardów auth/permissions (requireEventAccess, requireChatAccess),
  - [ ] rate-limitera domenowego,
  - [ ] serwisów billing (mapowanie eventów Stripe → domena),
  - [ ] helperów czasu, walidacji itp.

### 12.3. Testy integracyjne (minimum)

- [ ] Istnieje pakiet testów integracyjnych (np. Vitest + Supertest), który pokrywa:
  - [ ] `me` / auth (w tym odrzucenie bez tokena),
  - [ ] `createEvent` / `updateEvent` / `joinEvent` / `leaveEvent`,
  - [ ] `kickMember` / `banMember` (permissions),
  - [ ] `sendEventMessage` (chat + guard),
  - [ ] `createUserCheckout` (z mockiem Stripe),
  - [ ] webhook handler (symulacja eventów Stripe),
  - [ ] podstawowe operacje na mediach (request + confirm upload, bez realnego pliku).
- [ ] Testy te są odpalane w CI dla każdego PR na gałąź prod/staging.

### 12.4. Testy E2E / smoke & regression

- [ ] Istnieje przynajmniej prosty zestaw E2E (np. Playwright lub smoke-test CLI), który:
  - [ ] odpytuje `/health/ready`,
  - [ ] wykonuje prosty GraphQL query (np. `events` z limitem 1),
  - [ ] sprawdza minimalny flow: user → createEvent → joinEvent → sendMessage.
- [ ] Ten smoke-test jest odpalany:
  - [ ] po deployu na staging,
  - [ ] po deployu na produkcję (lub w pipeline przed „promocją” releasu).

---

## 13. Kontrakt API / wersjonowanie

- [ ] GraphQL schema:
  - [ ] zmiany „breaking” robisz tylko:
    - [ ] po oznaczeniu pól jako `@deprecated`,
    - [ ] po czasie, gdy front został zaktualizowany.
- [ ] Frontend:
  - [ ] ma wygenerowane typy przez `gql:gen`,
  - [ ] build frontu + api jest częścią jednego pipeline (wykryje breaking changes).
- [ ] Lista krytycznych operacji (używanych w produkcyjnej aplikacji) jest spisana (lub oznaczona w schema) – łatwiej ocenić wpływ zmian.

---

## 14. Deployment

- [ ] Dockerfile został:
  - [ ] przetestowany lokalnie,
  - [ ] nie zawiera devDependencies w finalnym image (multi-stage build).
- [ ] Przed startem kontenera:
  - [ ] odpalasz `prisma migrate deploy`,
  - [ ] ewentualne seedy uruchamiasz osobno (tylko w dev/staging lub ostrożnie w prod).
- [ ] Reverse proxy:
  - [ ] forwarduje nagłówki (`X-Forwarded-For`, `X-Forwarded-Proto`),
  - [ ] wspiera WebSockety na `/graphql` (subskrypcje).
- [ ] Strategia release:
  - [ ] rolling/blue-green jest zdefiniowana,
  - [ ] w razie rollbacku wiadomo, do której wersji i jak wrócić.
- [ ] Backupy:
  - [ ] PostgreSQL ma skonfigurowane regularne backupy,
  - [ ] przynajmniej raz realnie przywróciłeś backup na staging,
  - [ ] backupy plików/S3 (jeśli krytyczne) są skonfigurowane.

---

## 15. Scenariusze manualne do przejścia przed startem

- [ ] Rejestracja / logowanie → poprawne działanie i błędy.
- [ ] Zmiana hasła i reset hasła przez mail.
- [ ] Stworzenie eventu → join/leave → check chat.
- [ ] Ktoś inny dołącza, owner może go promować/degradować/kickować/banować.
- [ ] Event z limitem miejsc → przekroczenie → WAITLIST → automatyczna promocja po zwolnieniu miejsca.
- [ ] Sponsoring eventu → PRO → wygasa → sprawdzasz, że PRO-feature’y znikają.
- [ ] User plan PRO → cancel → wraca do FREE.
- [ ] Wysłanie i otrzymanie wiadomości DM + subskrypcje powiadomień.
- [ ] Kasowanie własnego konta → logika danych (messages, reviews, membershipy).
- [ ] Podstawowy flow feedback/review po evencie (jeśli zaimplementowane).

---

**Jeśli wszystkie pola powyżej są odhaczone – backend Miglee jest bardzo solidnie przygotowany na pierwsze PRO / produkcyjne wdrożenie.** 💪
