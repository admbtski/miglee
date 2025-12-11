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

- [ ] Fastify startuje z:
  - [ ] `logger` ustawionym na Pino w JSON w production (bez `pino-pretty`).
  - [ ] `trustProxy` poprawnie skonfigurowane, jeśli działa za reverse proxy (Nginx/Ingress).
- [ ] Obsługiwane są sygnały:
  - [ ] `SIGTERM`
  - [ ] `SIGINT`
  - [ ] (opcjonalnie) `SIGUSR2` dla restartów narzędzi.
- [ ] Zaimplementowany jest **graceful shutdown**:
  - [ ] Fastify przestaje przyjmować nowe requesty,
  - [ ] czeka określony czas na dokończenie bieżących requestów,
  - [ ] zamyka połączenia do DB (`prisma.$disconnect()`),
  - [ ] zamyka połączenia do Redis,
  - [ ] zamyka BullMQ workers,
  - [ ] dopiero wtedy `process.exit`.

### 2.2. Health-checki

- [ ] Endpoint `/health/live`:
  - [ ] zwraca 200, jeśli proces żyje,
  - [ ] nie robi ciężkich operacji (bez zapytań do DB),
  - [ ] używany jako **liveness probe**.
- [ ] Endpoint `/health/ready`:
  - [ ] sprawdza Postgresa (`SELECT 1`),
  - [ ] sprawdza Redis (`PING`),
  - [ ] zwracany status: `ok` / `degraded` / `fail`,
  - [ ] status HTTP: 200 (ok/degraded), 503 (fail),
  - [ ] używany jako **readiness probe**.
- [ ] Stary `/health` działa, ale może być oznaczony jako legacy (jeśli jest potrzebna kompatybilność wstecz).

---

## 3. Auth & Sesje

### 3.1. Autentykacja

- [ ] W **production** nie używasz `x-user-id` jako mechanizmu auth:
  - [ ] Wszystkie requesty wymagające auth korzystają z `Authorization: Bearer <JWT>`.
- [ ] JWT:
  - [ ] jest podpisywany `JWT_SECRET` z ENV,
  - [ ] ma sensowny czas życia (np. 15–60 min),
  - [ ] zawiera minimalnie: `sub` (userId), ewentualnie role.
- [ ] Jeśli są refresh tokeny:
  - [ ] trzymane są albo w cookie HttpOnly, albo w DB/Redis,
  - [ ] można je unieważnić (logout/rotate).

### 3.2. Autoryzacja / role

- [ ] Istnieje centralny moduł guardów:
  - [ ] `requireAuth`,
  - [ ] `requireAdmin`,
  - [ ] `requireEventAccess`,
  - [ ] `requireChatAccess`,
  - [ ] ewentualnie inne (`requireOrgOwner`, itp.).
- [ ] Wszystkie krytyczne mutacje/querki:
  - [ ] `createEvent`, `updateEvent`, `cancelEvent`, `deleteEvent`,
  - [ ] `joinEvent`, `leaveEvent`, `kickMember`, `banMember`, `updateMemberRole`,
  - [ ] `sendEventMessage`, `sendDM`, `editMessage`, `deleteMessage`,
  - [ ] `createUserCheckout`, `createEventCheckout`, `cancelSubscription`,
  - [ ] `uploadMedia`, `deleteMedia`,
  - [ ] `banUser`, `unbanUser`, `deleteUser`,
  - [ ] używają odpowiednich guardów z jednego miejsca (brak ręcznego `if (!ctx.user)` po losowych resolverach).

### 3.3. Dostęp do paneli admin / narzędzi

- [ ] Bull Board `/admin/queues`:
  - [ ] w dev – może być open,
  - [ ] w production – wymaga:
    - [ ] flagi `ENABLE_BULL_BOARD=true`,
    - [ ] **autentykacji**,
    - [ ] sprawdzenia **roli ADMIN**.
- [ ] Ewentualne inne endpointy admin (np. metrics, debug):
  - [ ] nie są publicznie dostępne w produkcji bez autentykacji.

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
  - [ ] `event.startAt`, `event.visibility`, `event.lat/lng` (jeśli geofiltrowanie / PostGIS),
  - [ ] foreign key’e typu `userId`, `eventId`, `recipientId`,
  - [ ] unikalne pola (`email`, slug kategorii/tagów, itd.).
- [ ] Są indeksy pod typowe filtry (np. `notifications` po `recipientId`, `readAt IS NULL`).
- [ ] Masz włączony / przetestowany `statement_timeout` (np. 30s) w production.

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

- [ ] Konfiguracja połączenia:
  - [ ] retry policy jest **ograniczona** (nie nieskończona),
  - [ ] sensowny `connectTimeout`, `commandTimeout`.
- [ ] Klienci Redis:
  - [ ] `healthRedis` – tylko health check,
  - [ ] `rateLimitRedis` – rate limiting,
  - [ ] `redisEmitter` – pub/sub do Mercurius,
  - [ ] `BullMQ` – osobne connection (jeśli używasz).
- [ ] Redis padnie → API:
  - [ ] nadaje sensowny error (np. `SERVICE_UNAVAILABLE` dla elementów wymagających Redis),
  - [ ] nie ubija całego procesu (chyba że to design).

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
  - [ ] ma klucz unikalny (np. `eventId` z Stripe) → **idempotencja**.
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
  - [ ] `customer.subscription.deleted` / `canceled` → downgrade na FREE.
- [ ] Błędy płatności:
  - [ ] `invoice.payment_failed` jest obsłużone (log, ewentualna notyfikacja usera).

### 7.3. Testy sandbox

- [ ] Na stagingu odpaliłeś realne scenariusze z **testowym** Stripe:
  - [ ] nowy user → upgrade do PLUS/PRO,
  - [ ] PRO user → cancel subscription → po webhooku wraca na FREE,
  - [ ] event → sponsorship PRO → wygasa → brak PRO feature’ów.

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

### 9.2. Monitoring / alerty

- [ ] Istnieje jakiś minimalny monitoring:
  - [ ] liczba requestów,
  - [ ] liczba błędów 5xx,
  - [ ] czas odpowiedzi (p95/p99),
  - [ ] kolejki (liczba failed/delayed).
- [ ] Są ustawione alerty (nawet proste):
  - [ ] „więcej niż X błędów 5xx w Y minut”,
  - [ ] „DB/Redis nieosiągalny”.

---

## 10. Bezpieczeństwo (security)

### 10.1. HTTP / Headery / CORS

- [ ] `@fastify/helmet`:
  - [ ] ma twardą konfigurację produkcyjną (HSTS, frameguard, COOP/CORP, CSP),
  - [ ] CSP jest zgodne z potrzebami frontu i websockets.
- [ ] CORS:
  - [ ] w production: **konkretne** originy z `CORS_ORIGINS`,
  - [ ] `credentials: true` tylko jeśli potrzebujesz cookies,
  - [ ] brak `origin: '*'` w production.

### 10.2. Cookies (jeśli używasz)

- [ ] W production:
  - [ ] `secure: true`,
  - [ ] `httpOnly: true`,
  - [ ] `sameSite: 'lax'` lub `strict`,
  - [ ] `domain` ustawiony na domenę (lub subdomenę) appki.

### 10.3. Rate limiting i abuse

- [ ] `@fastify/rate-limit`:
  - [ ] globalny limit (np. 100/min/IP),
  - [ ] osobne limity dla:
    - [ ] `/auth/login`, `/auth/register`, reset hasła,
    - [ ] endpointów uploadu,
    - [ ] potencjalnie drogich operacji (search, map).
- [ ] Chat:
  - [ ] masz dodatkowy limiter na wysyłanie wiadomości (per user/per event).
- [ ] Raporty/zgłoszenia:
  - [ ] są limitowane (np. max 10 reportów dziennie na usera).

---

## 11. GDPR / Prywatność / Dane użytkownika

- [ ] Endpoint `deleteMyAccount`:
  - [ ] jest zaimplementowany,
  - [ ] decyzja:
    - [ ] hard delete (user i większość jego danych znika),
    - [ ] **lub** soft delete + anonimizacja (np. „Deleted user”) + zachowanie minimalnej historii biznesowej.
- [ ] Logi:
  - [ ] nie zawierają haseł, tokenów, pełnych numerów kart, etc.,
  - [ ] starasz się nie logować pełnych payloadów osobowych (email, imię) w każdym request logu.
- [ ] Dane w DB:
  - [ ] wrażliwe pola (np. maile) są tam, gdzie muszą być,
  - [ ] masz świadomość, jak użytkownik może poprosić o eksport danych (nawet jeśli jeszcze nie jest to w UI).

---

## 12. Testy i jakość

### 12.1. TypeScript, ESLint

- [ ] `pnpm typecheck` przechodzi bez błędów.
- [ ] `pnpm lint` przechodzi (albo przynajmniej nie ma błędów krytycznych).
- [ ] TS ma włączone sensowne opcje (`strict` lub prawie-strict).

### 12.2. Testy integracyjne (minimum)

- [ ] Istnieje pakiet testów integracyjnych (np. Vitest + Supertest), który pokrywa:
  - [ ] `me` / auth,
  - [ ] `createEvent` / `updateEvent` / `joinEvent` / `leaveEvent`,
  - [ ] `kickMember` / `banMember` (permissions),
  - [ ] `sendEventMessage` (chat + guard),
  - [ ] `createUserCheckout` (z mockiem Stripe),
  - [ ] webhook handler (symulacja eventów Stripe).
- [ ] Testy te są odpalane w CI dla każdego PR na gałąź prod/staging.

### 12.3. Smoke test po deployu

- [ ] Istnieje prosty skrypt (CLI/test), który:
  - [ ] odpytuje `/health/ready`,
  - [ ] wykonuje prosty GraphQL query (np. `events` z limitem 1),
  - [ ] failuje deploy, jeśli coś jest nie tak.

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

---

## 15. Scenariusze manualne do przejścia przed startem

- [ ] Rejestracja / logowanie → poprawne działanie i błędy.
- [ ] Stworzenie eventu → join/leave → check chat.
- [ ] Ktoś inny dołącza, owner może go promować/degradować/kickować/banować.
- [ ] Event z limitem miejsc → przekroczenie → WAITLIST → automatyczna promocja po zwolnieniu miejsca.
- [ ] Sponsoring eventu → PRO → wygasa → sprawdzasz, że PRO-feature’y znikają.
- [ ] User plan PRO → cancel → wraca do FREE.
- [ ] Kasowanie własnego konta → logika danych (messages, reviews, membershipy).

---

**Jeśli wszystkie pola powyżej są odhaczone – backend Miglee jest bardzo solidnie przygotowany na pierwsze PRO / produkcyjne wdrożenie.** 💪
