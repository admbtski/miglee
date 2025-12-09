# Miglee - Platforma Spotkań i Wydarzeń Sportowych

Miglee to nowoczesna platforma do organizacji i uczestnictwa w wydarzeniach sportowych oraz aktywnościach. Umożliwia użytkownikom tworzenie, wyszukiwanie i dołączanie do wydarzeń, komunikację w czasie rzeczywistym oraz zarządzanie członkostwem.

## 📋 Spis Treści

- [Przegląd](#przegląd)
- [Architektura](#architektura)
- [Struktura Projektu](#struktura-projektu)
- [Technologie](#technologie)
- [Baza Danych](#baza-danych)
- [API GraphQL](#api-graphql)
- [Frontend](#frontend)
- [Konfiguracja](#konfiguracja)
- [Rozwój](#rozwój)
- [Deployment](#deployment)

## 🎯 Przegląd

Miglee to monorepo zawierające:

- **API** - Serwer GraphQL oparty na Fastify
- **Web** - Aplikacja Next.js z React
- **Contracts** - Wspólne definicje GraphQL

### Główne Funkcjonalności

- 🎪 **Zarządzanie Wydarzeniami** - Tworzenie, edycja, publikacja wydarzeń
- 👥 **Członkostwo** - System zapisów (otwarte, na zaproszenie, wymagające zatwierdzenia)
- 💬 **Komunikacja** - Chat wydarzeń, wiadomości prywatne, komentarze
- ⭐ **Oceny i Opinie** - System recenzji i feedbacku po wydarzeniu
- 🔔 **Powiadomienia** - Real-time powiadomienia o wydarzeniach
- 💳 **Monetyzacja** - Subskrypcje użytkowników i sponsoring wydarzeń (Stripe)
- 🗺️ **Mapy** - Wizualizacja wydarzeń na mapie z klastrowaniem
- 🌍 **Wielojęzyczność** - Wsparcie dla wielu języków (pl, en, de)
- 🎨 **Personalizacja** - Dostosowywanie wyglądu wydarzeń

## 🏗️ Architektura

### Monorepo Structure

```
miglee/
├── apps/
│   ├── api/          # Backend GraphQL API (Fastify)
│   └── web/          # Frontend Next.js App
├── packages/
│   ├── contracts/    # GraphQL schema i fragmenty
│   └── config/       # Wspólna konfiguracja TypeScript
└── docker/           # Konfiguracja Docker
```

### Stack Technologiczny

**Backend:**

- Fastify - Framework HTTP
- GraphQL (Mercurius) - API layer
- Prisma - ORM dla PostgreSQL
- PostgreSQL - Baza danych z PostGIS
- Redis - Cache i pub/sub
- BullMQ - Kolejki zadań
- Stripe - Płatności
- AWS S3 - Przechowywanie mediów

**Frontend:**

- Next.js 15 - Framework React
- React 19 - Biblioteka UI
- TypeScript - Typowanie statyczne
- Tailwind CSS - Stylowanie
- TanStack Query - Zarządzanie stanem serwera
- GraphQL Codegen - Generowanie typów
- MapLibre GL - Mapy
- Framer Motion - Animacje

## 📁 Struktura Projektu

### Backend (`apps/api/`)

```
api/
├── src/
│   ├── graphql/
│   │   ├── resolvers/      # Resolvery GraphQL
│   │   │   ├── query/      # Query resolvers
│   │   │   ├── mutation/  # Mutation resolvers
│   │   │   ├── subscription/ # Subscription resolvers
│   │   │   └── fields/     # Field resolvers
│   │   ├── context.ts      # GraphQL context
│   │   └── codegen.ts      # Codegen config
│   ├── lib/                # Biblioteki pomocnicze
│   │   ├── billing/        # Integracja Stripe
│   │   ├── geo/            # Funkcje geograficzne
│   │   ├── media/          # Przetwarzanie obrazów
│   │   └── ...
│   ├── plugins/            # Fastify plugins
│   │   ├── mercurius.ts    # GraphQL plugin
│   │   ├── jwt.ts          # Autentykacja
│   │   ├── rate-limit.ts   # Rate limiting
│   │   └── ...
│   ├── workers/            # Background workers
│   │   ├── reminders/      # Przypomnienia o wydarzeniach
│   │   └── feedback/       # Wysyłanie feedback requests
│   ├── server.ts           # Konfiguracja serwera
│   └── index.ts            # Entry point
├── prisma/
│   ├── schema.prisma       # Schema bazy danych
│   └── migrations/         # Migracje bazy danych
└── package.json
```

### Frontend (`apps/web/`)

```
web/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── [locale]/       # Lokalizowane strony
│   │   └── api/            # API routes
│   ├── components/         # Komponenty UI
│   │   ├── ui/            # Podstawowe komponenty
│   │   ├── layout/        # Komponenty layoutu
│   │   └── ...
│   ├── features/          # Feature-based modules
│   │   ├── events/        # Funkcjonalność wydarzeń
│   │   ├── chat/         # Chat
│   │   ├── billing/      # Płatności
│   │   └── ...
│   ├── lib/               # Biblioteki pomocnicze
│   │   ├── api/          # GraphQL client
│   │   ├── i18n/         # Internacjonalizacja
│   │   └── ...
│   └── hooks/            # React hooks
└── package.json
```

## 🛠️ Technologie

### Backend Dependencies

**Core:**

- `fastify` - Framework HTTP
- `mercurius` - GraphQL server dla Fastify
- `@prisma/client` - Prisma ORM
- `graphql` - GraphQL runtime

**Database & Cache:**

- `ioredis` - Redis client
- `bullmq` - Queue management
- `mqemitter-redis` - Pub/sub dla GraphQL subscriptions

**Authentication & Security:**

- `@fastify/jwt` - JWT authentication
- `@fastify/helmet` - Security headers
- `@fastify/rate-limit` - Rate limiting
- `@fastify/cors` - CORS handling

**Media & Storage:**

- `@aws-sdk/client-s3` - AWS S3 client
- `sharp` - Image processing
- `blurhash` - Blur hash generation

**Monitoring:**

- `@opentelemetry/*` - OpenTelemetry instrumentation
- `pino` - Logging

**Other:**

- `stripe` - Payment processing
- `resend` - Email sending
- `zod` - Schema validation

### Frontend Dependencies

**Core:**

- `next` - Next.js framework
- `react` - React library
- `typescript` - TypeScript

**State Management:**

- `@tanstack/react-query` - Server state
- `mutative` - Immutable updates

**UI:**

- `tailwindcss` - CSS framework
- `framer-motion` - Animations
- `lucide-react` - Icons
- `sonner` - Toast notifications

**GraphQL:**

- `graphql-request` - GraphQL client
- `graphql-ws` - WebSocket client
- `@graphql-typed-document-node/core` - Typed documents

**Maps:**

- `maplibre-gl` - Map rendering
- `deck.gl` - Data visualization

**Forms:**

- `react-hook-form` - Form handling
- `@hookform/resolvers` - Form validation
- `zod` - Schema validation

## 🗄️ Baza Danych

### Prisma Schema

Baza danych wykorzystuje PostgreSQL z rozszerzeniem PostGIS do obsługi danych geograficznych.

### Główne Modele

#### User (Użytkownik)

- Podstawowe informacje (email, name, avatar)
- Role (ADMIN, MODERATOR, USER)
- Status weryfikacji i zawieszenia
- Preferencje (locale, timezone)
- Relacje do profilu, prywatności, statystyk

#### Event (Wydarzenie)

- Informacje podstawowe (title, description, notes)
- Daty (startAt, endAt)
- Lokalizacja (lat, lng, address, placeId, geom)
- Widoczność i tryb dołączania
- Status publikacji (DRAFT, PUBLISHED, SCHEDULED)
- Relacje do kategorii, tagów, członków

#### EventMember (Członkostwo)

- Relacja użytkownik-wydarzenie
- Role (OWNER, MODERATOR, PARTICIPANT)
- Status (JOINED, PENDING, INVITED, REJECTED, BANNED, etc.)
- Historia zmian (EventMemberEvent)

#### Notification (Powiadomienie)

- Rodzaj powiadomienia (NotificationKind)
- Odbiorca i aktor
- Polimorficzny target (entityType, entityId)
- Status przeczytania

#### Comment & Review

- Komentarze z threading (2-poziomowy)
- Recenzje z oceną 1-5
- Soft delete i moderacja

#### DmThread & DmMessage

- Wątki wiadomości prywatnych
- Wiadomości z reakcjami
- Status przeczytania

#### EventChatMessage

- Wiadomości w czacie wydarzenia
- Reakcje i threading

#### Billing Models

- `UserSubscription` - Subskrypcje użytkowników
- `UserPlanPeriod` - Okresy planów (subskrypcja lub jednorazowe)
- `EventSponsorship` - Sponsoring wydarzeń
- `EventSponsorshipPeriod` - Historia transakcji sponsoringu

### Enums

- `Visibility` - PUBLIC, HIDDEN
- `JoinMode` - OPEN, REQUEST, INVITE_ONLY
- `Mode` - ONE_TO_ONE, GROUP, CUSTOM
- `MeetingKind` - ONSITE, ONLINE, HYBRID
- `EventMemberStatus` - JOINED, PENDING, INVITED, etc.
- `PublicationStatus` - DRAFT, PUBLISHED, SCHEDULED
- `SubscriptionPlan` - PLUS, PRO
- `EventPlan` - FREE, PLUS, PRO

## 🔌 API GraphQL

### Endpoint

- **HTTP:** `http://localhost:4000/graphql`
- **WebSocket:** `ws://localhost:4000/graphql`

### Główne Query

```graphql
# Użytkownicy
me: SessionUser
user(id: ID, name: String): User
users(...): UsersResult

# Wydarzenia
events(...): EventsResult
event(id: ID!): Event
myEvents(...): [EventMember!]!
myMembershipForEvent(eventId: ID!): EventMember

# Członkostwo
eventMembers(eventId: ID!, ...): [EventMember!]!
eventMemberStats(eventId: ID!): EventMemberStats!
eventPermissions(eventId: ID!): EventPermissions!

# Komunikacja
comments(eventId: ID!, ...): CommentsResult
reviews(eventId: ID!, ...): ReviewsResult
eventMessages(eventId: ID!, ...): EventMessagesConnection
dmThreads(...): DmThreadsResult
dmMessages(threadId: ID!, ...): DmMessagesConnection

# Powiadomienia
notifications(recipientId: ID!, ...): NotificationsResult

# Mapy
clusters(bbox: BBoxInput!, zoom: Float!, filters: ClusterFiltersInput): [Cluster!]!
regionEvents(region: String!, ...): RegionEventPage

# Billing
myPlan: UserPlanInfo!
mySubscription: UserSubscription
eventSponsorship(eventId: ID!): EventSponsorship
```

### Główne Mutations

```graphql
# Wydarzenia
createEvent(input: CreateEventInput!): Event!
updateEvent(id: ID!, input: UpdateEventInput!): Event!
deleteEvent(id: ID!): Boolean!
publishEvent(id: ID!): Event!
scheduleEventPublication(id: ID!, publishAt: DateTime!): Event!

# Członkostwo
requestJoinEventWithAnswers(input: RequestJoinEventInput!): Event!
leaveEvent(eventId: ID!): Event!
acceptInvite(eventId: ID!): Event!
approveJoinRequest(input: ApproveJoinRequestInput!): Event!
rejectJoinRequest(input: RejectJoinRequestInput!): Event!
kickMember(input: KickMemberInput!): Event!
banMember(input: BanMemberInput!): Event!

# Komunikacja
createComment(input: CreateCommentInput!): Comment!
sendEventMessage(input: SendEventMessageInput!): EventChatMessage!
sendDmMessage(input: SendDmMessageInput!): DmMessage!

# Recenzje i Feedback
submitReviewAndFeedback(input: SubmitReviewAndFeedbackInput!): SubmitReviewAndFeedbackResult!

# Billing
createSubscriptionCheckout(input: CreateSubscriptionCheckoutInput!): CheckoutSession!
createEventSponsorshipCheckout(input: CreateEventSponsorshipCheckoutInput!): EventSponsorshipCheckout!
cancelSubscription(immediately: Boolean): Boolean!
```

### Subscriptions

```graphql
# Powiadomienia
subscription {
  notificationAdded(recipientId: ID!): Notification!
  notificationBadgeChanged(recipientId: ID!): NotificationBadgeChanged!
}

# Chat wydarzeń
subscription {
  eventMessageAdded(eventId: ID!): EventChatMessage!
  eventTyping(eventId: ID!): TypingIndicator!
}

# Wiadomości prywatne
subscription {
  dmMessageAdded(threadId: ID!): DmMessage!
  dmTyping(threadId: ID!): TypingIndicator!
}
```

## 🎨 Frontend

### Struktura Stron

Aplikacja wykorzystuje Next.js App Router z routingiem opartym na lokalizacji:

```
app/
├── [locale]/              # Lokalizowane strony
│   ├── layout.tsx         # Layout dla danej lokalizacji
│   ├── page.tsx           # Strona główna
│   ├── events/           # Lista wydarzeń
│   ├── events/[id]/      # Szczegóły wydarzenia
│   ├── account/          # Panel użytkownika
│   │   ├── events/       # Moje wydarzenia
│   │   ├── view/         # Mój profil
│   │   └── plans-and-bills/ # Płatności
│   └── ...
```

### Komponenty

**UI Components** (`components/ui/`):

- Podstawowe komponenty (Button, Input, Card, etc.)
- Komponenty formularzy
- Modals i dialogs

**Feature Components** (`features/`):

- `events/` - Komponenty wydarzeń
- `chat/` - Komponenty czatu
- `billing/` - Komponenty płatności
- `maps/` - Komponenty map

### State Management

- **TanStack Query** - Cache i synchronizacja danych serwera
- **React Context** - Globalny stan (theme, locale)
- **Local State** - useState, useReducer dla lokalnego stanu

### Styling

- **Tailwind CSS** - Utility-first CSS
- **CSS Variables** - Dynamiczne theming
- **Framer Motion** - Animacje

## ⚙️ Konfiguracja

### Zmienne Środowiskowe

#### Backend (`apps/api/.env`)

```env
# Server
NODE_ENV=development
PORT=4000
HOST=localhost

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/miglee

# JWT
JWT_SECRET=your-secret-key-min-32-chars

# CORS
CORS_ORIGINS=http://localhost:3000

# Redis
REDIS_URL=redis://localhost:6379

# Media Storage
MEDIA_STORAGE_PROVIDER=LOCAL  # or S3
UPLOADS_PATH=./uploads

# S3 (if using S3)
S3_ENDPOINT=https://s3.amazonaws.com
S3_REGION=us-east-1
S3_BUCKET=your-bucket
S3_ACCESS_KEY_ID=your-key
S3_SECRET_ACCESS_KEY=your-secret

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# URLs
APP_URL=http://localhost:3000
API_URL=http://localhost:4000
```

#### Frontend (`apps/web/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Baza Danych

#### Setup PostgreSQL z PostGIS

```bash
# Uruchom PostgreSQL z Docker
docker-compose -f docker/docker-compose.dev.yml up -d

# Uruchom migracje
cd apps/api
pnpm prisma:migrate

# Seed bazy danych (opcjonalnie)
pnpm prisma:seed
```

## 🚀 Rozwój

### Wymagania

- Node.js >= 22.18.0
- pnpm >= 10.14.0
- PostgreSQL 14+ z PostGIS
- Redis

### Instalacja

```bash
# Zainstaluj zależności
pnpm install

# Uruchom bazę danych
pnpm db:up

# Uruchom migracje
cd apps/api
pnpm prisma:migrate

# Uruchom seed (opcjonalnie)
pnpm prisma:seed
```

### Uruchomienie

```bash
# Uruchom wszystkie aplikacje (API + Web)
pnpm dev

# Lub osobno:
cd apps/api && pnpm dev
cd apps/web && pnpm dev
```

### Skrypty

```bash
# Development
pnpm dev              # Uruchom wszystkie aplikacje
pnpm build            # Build wszystkich aplikacji
pnpm typecheck        # Sprawdź typy TypeScript
pnpm lint             # Lint kodu

# Database
pnpm db:up            # Uruchom PostgreSQL
pnpm db:down          # Zatrzymaj PostgreSQL
pnpm db:logs          # Logi PostgreSQL

# GraphQL
pnpm gql:gen          # Generuj typy GraphQL
```

### Struktura Pracy

1. **Feature Branch** - Twórz branch dla nowej funkcjonalności
2. **Commits** - Używaj konwencjonalnych commitów
3. **Code Review** - Wszystkie zmiany wymagają review
4. **Tests** - Dodawaj testy dla nowych funkcji

## 📦 Deployment

### Build

```bash
# Build wszystkich aplikacji
pnpm build

# Build API
cd apps/api && pnpm build

# Build Web
cd apps/web && pnpm build
```

### Production Environment

1. **Database** - PostgreSQL z PostGIS na produkcji
2. **Redis** - Redis instance dla cache i pub/sub
3. **Storage** - S3 dla mediów (lub lokalne storage)
4. **CDN** - CDN dla statycznych assetów
5. **Monitoring** - OpenTelemetry + monitoring solution

### Docker

Projekt zawiera konfigurację Docker Compose dla developmentu:

```yaml
# docker/docker-compose.dev.yml
services:
  postgres:
    image: postgis/postgis:14-3.1
    # ...
  redis:
    image: redis:7-alpine
    # ...
```

## 📚 Dodatkowe Zasoby

### Dokumentacja Techniczna

- [Prisma Schema](./apps/api/prisma/schema.prisma) - Pełna definicja bazy danych
- [GraphQL Schema](./packages/contracts/graphql/schema.graphql) - Pełna definicja API
- [Architecture TODOs](./docs/architecture-todos.md) - Lista zadań architektonicznych

### Kluczowe Koncepty

#### Status Publikacji Wydarzeń

- **DRAFT** - Wydarzenie nieopublikowane, widoczne tylko dla właściciela/moderatorów
- **SCHEDULED** - Zaplanowane do publikacji w określonym czasie
- **PUBLISHED** - Opublikowane i widoczne zgodnie z ustawieniami widoczności

#### Tryby Dołączania

- **OPEN** - Każdy może dołączyć
- **REQUEST** - Wymaga zatwierdzenia przez właściciela/moderatora
- **INVITE_ONLY** - Tylko na zaproszenie

#### System Powiadomień

Powiadomienia są wysyłane przez:

- WebSocket subscriptions (real-time)
- Email (opcjonalnie, zgodnie z preferencjami)
- Push notifications (w przyszłości)

#### Billing System

- **User Subscriptions** - Subskrypcje użytkowników (PLUS, PRO)
- **Event Sponsorships** - Sponsoring wydarzeń (PLUS, PRO)
- Integracja ze Stripe dla płatności

## 🤝 Wsparcie

Dla pytań i wsparcia, skontaktuj się z zespołem deweloperskim.

---

**Miglee** - Connect Through Sports & Activities 🎾⚽🏃‍♂️
