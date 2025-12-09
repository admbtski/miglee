# Architektura Systemu Miglee

## Przegląd Architektury

Miglee to aplikacja typu monorepo z podziałem na backend (GraphQL API) i frontend (Next.js). System wykorzystuje PostgreSQL jako główną bazę danych, Redis do cache i pub/sub, oraz integruje się z zewnętrznymi serwisami (Stripe, S3).

## Architektura Ogólna

```
┌─────────────────┐
│   Next.js App   │
│   (Frontend)    │
└────────┬────────┘
         │ HTTP/WebSocket
         │ GraphQL
         ▼
┌─────────────────┐
│  Fastify Server │
│  GraphQL API    │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌────────┐
│PostgreSQL│ │ Redis  │
│(PostGIS) │ │        │
└────────┘ └────────┘
    │
    ▼
┌────────┐
│  S3    │
│(Media) │
└────────┘
```

## Warstwy Aplikacji

### 1. Frontend Layer (Next.js)

**Struktura:**

- **App Router** - Routing oparty na systemie plików
- **Server Components** - Komponenty renderowane po stronie serwera
- **Client Components** - Komponenty interaktywne
- **API Routes** - Endpointy API Next.js (jeśli potrzebne)

**State Management:**

- **TanStack Query** - Server state (cache, synchronizacja)
- **React Context** - Global state (theme, locale)
- **Local State** - useState, useReducer

**Komunikacja z Backend:**

- **GraphQL Client** - graphql-request dla queries/mutations
- **WebSocket Client** - graphql-ws dla subscriptions

### 2. API Layer (Fastify + GraphQL)

**Struktura:**

- **Fastify** - HTTP framework
- **Mercurius** - GraphQL server
- **Plugins** - Modularne funkcjonalności
- **Resolvers** - Logika biznesowa

**Warstwy Resolverów:**

1. **Query Resolvers** - Pobieranie danych
2. **Mutation Resolvers** - Modyfikacja danych
3. **Subscription Resolvers** - Real-time updates
4. **Field Resolvers** - Rozwiązywanie pól złożonych

### 3. Data Layer

**Prisma ORM:**

- **Schema** - Definicja modeli danych
- **Client** - Typowany dostęp do bazy
- **Migrations** - Wersjonowanie schematu

**PostgreSQL:**

- **Tabele** - Główne dane aplikacji
- **PostGIS** - Rozszerzenie geograficzne
- **Indeksy** - Optymalizacja zapytań

**Redis:**

- **Cache** - Cache zapytań
- **Pub/Sub** - Subscriptions GraphQL
- **Sessions** - Sesje użytkowników (opcjonalnie)

## Przepływ Danych

### Query Flow

```
1. User Action (Frontend)
   ↓
2. GraphQL Query (graphql-request)
   ↓
3. Fastify Server (HTTP)
   ↓
4. Mercurius (GraphQL Parser)
   ↓
5. Resolver (Business Logic)
   ↓
6. Prisma Client (Database Query)
   ↓
7. PostgreSQL (Data)
   ↓
8. Response (JSON)
   ↓
9. TanStack Query (Cache)
   ↓
10. React Component (Update UI)
```

### Mutation Flow

```
1. User Action (Frontend)
   ↓
2. GraphQL Mutation
   ↓
3. Fastify Server
   ↓
4. Authentication/Authorization Check
   ↓
5. Validation (Zod)
   ↓
6. Business Logic (Resolver)
   ↓
7. Database Transaction (Prisma)
   ↓
8. Side Effects (Notifications, Emails)
   ↓
9. Response
   ↓
10. Cache Invalidation (TanStack Query)
   ↓
11. UI Update
```

### Subscription Flow

```
1. User Subscribes (Frontend)
   ↓
2. WebSocket Connection (graphql-ws)
   ↓
3. Mercurius Subscription Resolver
   ↓
4. Redis Pub/Sub Subscribe
   ↓
5. Event Occurs (Backend)
   ↓
6. Publish to Redis
   ↓
7. Redis Pub/Sub Notify
   ↓
8. Mercurius Publish
   ↓
9. WebSocket Send
   ↓
10. Frontend Receive (Real-time Update)
```

## Autentykacja i Autoryzacja

### JWT Authentication

1. **Login** - Użytkownik loguje się (dev mode lub OAuth)
2. **Token Generation** - Serwer generuje JWT
3. **Token Storage** - Cookie (httpOnly, secure)
4. **Request** - Token w cookie lub Authorization header
5. **Verification** - Fastify JWT plugin weryfikuje token
6. **Context** - User object w GraphQL context

### Authorization

**Role-based:**

- `ADMIN` - Pełny dostęp
- `MODERATOR` - Moderacja treści
- `USER` - Standardowy użytkownik

**Resource-based:**

- Właściciel wydarzenia (`Event.ownerId`)
- Moderator wydarzenia (`EventMember.role = MODERATOR`)
- Uczestnik wydarzenia (`EventMember.status = JOINED`)

**Permission Checks:**

- W resolvers sprawdzane są uprawnienia
- Helper functions: `requireAuth()`, `requireOwner()`, etc.

## System Powiadomień

### Architektura

```
Event Trigger
    ↓
Notification Service
    ↓
┌───────────┬───────────┐
│           │           │
▼           ▼           ▼
Database  Redis      Email
(Store)   (Pub/Sub)  (Send)
    │           │
    └─────┬─────┘
          │
    WebSocket
    (Real-time)
```

### Typy Powiadomień

1. **Event Lifecycle** - Utworzenie, aktualizacja, anulowanie
2. **Membership** - Zaproszenia, zatwierdzenia, odrzucenia
3. **Messages** - Nowe wiadomości w czacie
4. **Reviews** - Nowe recenzje
5. **System** - Powiadomienia systemowe

### Implementacja

- **Database** - Tabela `Notification` dla historii
- **Redis Pub/Sub** - Real-time delivery
- **GraphQL Subscription** - Subskrypcja w frontend
- **Email** - Opcjonalnie przez Resend

## System Płatności

### Stripe Integration

**User Subscriptions:**

1. User wybiera plan (PLUS/PRO)
2. `createSubscriptionCheckout` tworzy Stripe Checkout Session
3. User płaci przez Stripe
4. Webhook `checkout.session.completed` aktualizuje bazę
5. `UserSubscription` i `UserPlanPeriod` są tworzone

**Event Sponsorships:**

1. Owner wybiera plan dla wydarzenia
2. `createEventSponsorshipCheckout` tworzy sesję
3. Płatność przez Stripe
4. Webhook aktualizuje `EventSponsorship`
5. Wydarzenie otrzymuje plan (PLUS/PRO)

**Webhook Handler:**

- Endpoint: `/webhooks/stripe`
- Weryfikacja podpisu
- Przetwarzanie eventów
- Aktualizacja bazy danych

## System Mediów

### Storage

**Local Storage:**

- Pliki w `uploads/` directory
- Struktura: `uploads/original/` i `uploads/cache/`
- Varianty obrazów generowane on-demand

**S3 Storage:**

- Konfiguracja przez zmienne środowiskowe
- Presigned URLs dla uploadów
- CDN dla assetów

### Image Processing

1. **Upload** - Użytkownik przesyła obraz
2. **Validation** - Sprawdzenie typu i rozmiaru
3. **Processing** - Sharp generuje varianty (WebP)
4. **Blurhash** - Generowanie blur hash dla placeholder
5. **Storage** - Zapis do S3 lub lokalnie
6. **Database** - Zapis `MediaAsset` record

## Background Workers

### BullMQ Queues

**Reminders Worker:**

- Sprawdza nadchodzące wydarzenia
- Wysyła przypomnienia użytkownikom
- Uruchamiany przez cron

**Feedback Worker:**

- Wysyła prośby o feedback po zakończeniu wydarzenia
- Uruchamiany przez cron lub ręcznie

**Queue Management:**

- Redis jako broker
- BullMQ jako queue manager
- Workers jako osobne procesy

## Optymalizacja

### Database

- **Indeksy** - Na często queryowanych kolumnach
- **PostGIS** - Indeksy geograficzne dla zapytań mapowych
- **Connection Pooling** - Prisma connection pool
- **Query Optimization** - Eager loading, select only needed fields

### Caching

- **TanStack Query** - Cache na frontend
- **Redis** - Cache na backend (opcjonalnie)
- **CDN** - Cache dla statycznych assetów

### Performance

- **DataLoader** - Batch loading dla N+1 queries
- **Pagination** - Cursor-based dla dużych list
- **Lazy Loading** - Ładowanie danych na żądanie
- **Image Optimization** - WebP format, responsive sizes

## Bezpieczeństwo

### Security Headers

- **Helmet** - Security headers (CSP, XSS protection, etc.)
- **CORS** - Konfiguracja dozwolonych originów
- **Rate Limiting** - Ochrona przed abuse

### Data Validation

- **Zod** - Schema validation
- **Prisma** - Type-safe database queries
- **GraphQL** - Type system validation

### Input Sanitization

- **GraphQL** - Automatyczna walidacja typów
- **Zod** - Walidacja inputów w resolvers
- **Prisma** - SQL injection protection

## Monitoring i Logging

### Logging

- **Pino** - Structured logging
- **Log Levels** - fatal, error, warn, info, debug, trace
- **Request IDs** - Korelacja logów
- **OpenTelemetry** - Distributed tracing (opcjonalnie)

### Metrics

- **OpenTelemetry** - Metrics collection
- **Prometheus** - Metrics storage (opcjonalnie)
- **Custom Metrics** - Business metrics

## Deployment

### Development

- **Local PostgreSQL** - Docker Compose
- **Local Redis** - Docker Compose
- **Hot Reload** - tsx watch dla API, Next.js dla web

### Production

**Infrastructure:**

- **PostgreSQL** - Managed database (AWS RDS, etc.)
- **Redis** - Managed cache (AWS ElastiCache, etc.)
- **S3** - Object storage dla mediów
- **CDN** - CloudFront lub podobne
- **Load Balancer** - Dla skalowania

**Deployment:**

- **API** - Node.js process (PM2, systemd, Docker)
- **Web** - Next.js standalone build
- **Workers** - Osobne procesy dla background jobs

**Scaling:**

- **Horizontal** - Wiele instancji API
- **Vertical** - Większe instancje
- **Database** - Read replicas
- **Cache** - Redis cluster

## Przyszłe Rozszerzenia

### Planowane Funkcjonalności

1. **Mobile App** - React Native aplikacja
2. **Push Notifications** - Firebase Cloud Messaging
3. **Analytics** - Wbudowany system analityczny
4. **Search** - Elasticsearch dla zaawansowanego wyszukiwania
5. **Video Calls** - Integracja z WebRTC
6. **Social Features** - Więcej funkcji społecznościowych

### Techniczne Ulepszenia

1. **GraphQL Federation** - Podział na mikroserwisy
2. **gRPC** - Dla komunikacji między serwisami
3. **Kubernetes** - Orchestracja kontenerów
4. **Service Mesh** - Istio lub podobne
5. **Event Sourcing** - Dla audytu i historii
