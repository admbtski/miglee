# Miglee - Application Summary

## 📋 Spis Treści

1. [Przegląd Aplikacji](#przegląd-aplikacji)
2. [Architektura](#architektura)
3. [Stack Technologiczny](#stack-technologiczny)
4. [Struktura Projektu](#struktura-projektu)
5. [Główne Funkcjonalności](#główne-funkcjonalności)
6. [Baza Danych](#baza-danych)
7. [API & GraphQL](#api--graphql)
8. [Frontend](#frontend)
9. [Systemy Pomocnicze](#systemy-pomocnicze)
10. [Deployment & DevOps](#deployment--devops)

---

## Przegląd Aplikacji

**Miglee** to platforma społecznościowa do organizowania i uczestniczenia w wydarzeniach sportowych i aktywnościach. Użytkownicy mogą:

- Tworzyć i zarządzać wydarzeniami (intents)
- Dołączać do wydarzeń innych użytkowników
- Komunikować się przez czat (DM i event chat)
- Oceniać wydarzenia i użytkowników
- Przeglądać wydarzenia na mapie z clusteringiem
- Otrzymywać powiadomienia w czasie rzeczywistym

**Typ aplikacji:** Full-stack web application (SPA + API)  
**Model biznesowy:** Freemium (Free/Premium/Pro plans)  
**Główni użytkownicy:** Osoby aktywne fizycznie, entuzjaści sportu, organizatorzy wydarzeń

---

## Architektura

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (Next.js)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Web App    │  │  Admin Panel │  │  Public Pages│ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
                           │
                           │ GraphQL + WebSocket
                           ▼
┌─────────────────────────────────────────────────────────┐
│                   API (Fastify + Mercurius)             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   GraphQL    │  │  Subscriptions│  │   Workers    │ │
│  │   Resolvers  │  │   (PubSub)    │  │  (Reminders) │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    DATA LAYER                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  PostgreSQL  │  │    Redis     │  │   PostGIS    │ │
│  │  (Prisma)    │  │  (PubSub)    │  │ (Geo queries)│ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Monorepo Structure

```
miglee/
├── apps/
│   ├── api/          # Backend API (Fastify + GraphQL)
│   └── web/          # Frontend (Next.js 14 App Router)
├── packages/
│   ├── config/       # Shared TypeScript configs
│   └── contracts/    # GraphQL schema & operations
└── docker/           # Docker configs (dev environment)
```

---

## Stack Technologiczny

### Backend

- **Runtime:** Node.js 20+
- **Framework:** Fastify 4.x (high-performance HTTP server)
- **GraphQL:** Mercurius (GraphQL server for Fastify)
- **ORM:** Prisma 5.x
- **Database:** PostgreSQL 15+ with PostGIS extension
- **Cache/PubSub:** Redis 7+
- **Real-time:** GraphQL Subscriptions (WebSocket)
- **Auth:** JWT (cookies + headers)
- **Validation:** Zod
- **Testing:** Jest (unit tests)

### Frontend

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript 5.x
- **UI Library:** React 18
- **Styling:** Tailwind CSS 3.x
- **State Management:**
  - React Query (TanStack Query v5) - server state
  - React Context - local state
- **GraphQL Client:** graphql-request
- **Maps:** Mapbox GL JS + Deck.gl (clustering)
- **Forms:** React Hook Form + Zod
- **Notifications:** Sonner (toast)
- **Icons:** Lucide React
- **Date/Time:** date-fns
- **Virtualization:** react-virtuoso

### DevOps & Monitoring

- **Package Manager:** pnpm (workspaces)
- **Build Tool:** Turbo (monorepo orchestration)
- **Linting:** ESLint + Prettier
- **Type Checking:** TypeScript strict mode
- **Observability:** OpenTelemetry (traces, metrics)
- **Monitoring:** Prometheus + Grafana (optional)
- **Logging:** Pino (structured logging)
- **Development:** Docker Compose (local env)

---

## Struktura Projektu

### Backend (`apps/api/`)

```
apps/api/
├── prisma/
│   ├── schema.prisma              # Database schema
│   ├── migrations/                # Database migrations
│   └── seed.ts                    # Seed data
├── src/
│   ├── graphql/
│   │   ├── resolvers/
│   │   │   ├── query/            # Query resolvers
│   │   │   ├── mutation/         # Mutation resolvers
│   │   │   ├── subscription/     # Subscription resolvers
│   │   │   └── helpers.ts        # Mapping functions
│   │   ├── context.ts            # GraphQL context
│   │   └── codegen.ts            # GraphQL Codegen config
│   ├── lib/
│   │   ├── prisma.ts             # Prisma client
│   │   ├── redis.ts              # Redis client
│   │   ├── pubsub.ts             # PubSub for subscriptions
│   │   ├── geo/                  # PostGIS utilities
│   │   └── chat-utils.ts         # Chat helpers
│   ├── plugins/
│   │   ├── jwt.ts                # JWT authentication
│   │   ├── cors.ts               # CORS configuration
│   │   ├── mercurius.ts          # GraphQL plugin
│   │   ├── rate-limit.ts         # Rate limiting
│   │   └── metrics/              # Prometheus metrics
│   ├── workers/
│   │   └── reminders/            # Background jobs
│   ├── server.ts                 # Fastify server setup
│   └── index.ts                  # Entry point
└── tsconfig.json
```

### Frontend (`apps/web/`)

```
apps/web/
├── src/
│   ├── app/
│   │   ├── [[...slug]]/          # Main app pages (map, list)
│   │   ├── intent/[id]/          # Event detail pages
│   │   ├── account/              # User account pages
│   │   ├── admin/                # Admin panel
│   │   │   ├── users/            # User management
│   │   │   ├── intents/          # Event management
│   │   │   └── comments/         # Comment moderation
│   │   ├── layout.tsx            # Root layout
│   │   └── global-error.tsx      # Error boundary
│   ├── components/
│   │   ├── ui/                   # Reusable UI components
│   │   ├── chat/                 # Chat components
│   │   ├── forms/                # Form components
│   │   └── layout/               # Layout components
│   ├── features/
│   │   ├── auth/                 # Authentication
│   │   ├── intents/              # Event features
│   │   ├── maps/                 # Map features
│   │   ├── notifications/        # Notifications
│   │   └── theme/                # Theme provider
│   ├── lib/
│   │   ├── api/                  # API hooks (React Query)
│   │   ├── config/               # App configuration
│   │   ├── constants/            # Constants
│   │   └── utils/                # Utility functions
│   │       ├── dev-logger.ts     # Developer logging
│   │       ├── toast-manager.ts  # Toast notifications
│   │       └── react-query-config.ts  # React Query setup
│   ├── hooks/                    # Custom React hooks
│   ├── types/                    # TypeScript types
│   └── styles/
│       └── globals.css           # Global styles
└── tsconfig.json
```

### Shared Packages (`packages/`)

```
packages/
├── config/
│   └── tsconfig.base.json        # Base TypeScript config
└── contracts/
    └── graphql/
        ├── schema.graphql        # GraphQL schema
        └── operations/           # GraphQL operations
            ├── intents.graphql
            ├── users.graphql
            ├── comments.graphql
            └── ...
```

---

## Główne Funkcjonalności

### 1. Zarządzanie Wydarzeniami (Intents)

**Opis:** Użytkownicy mogą tworzyć, edytować i zarządzać wydarzeniami sportowymi.

**Funkcje:**

- ✅ Tworzenie wydarzeń z formularzem (tytuł, opis, data, lokalizacja, kategoria)
- ✅ Edycja i usuwanie wydarzeń
- ✅ Anulowanie wydarzeń
- ✅ Ustawienia prywatności (public/private/invite-only)
- ✅ Tryby dołączania (open/approval/invite)
- ✅ Limity uczestników (min/max)
- ✅ Poziomy zaawansowania (beginner/intermediate/advanced/expert)
- ✅ Typy spotkań (onsite/online/hybrid)
- ✅ Tagi i kategorie
- ✅ Lokalizacja na mapie (PostGIS)

**Plany (Free/Premium/Pro):**

- Free: 5 aktywnych wydarzeń
- Premium: 20 aktywnych wydarzeń
- Pro: Unlimited

**Pliki:**

- Backend: `apps/api/src/graphql/resolvers/mutation/intents.ts`
- Frontend: `apps/web/src/lib/api/intents.tsx`
- UI: `apps/web/src/app/intent/[id]/`

---

### 2. System Członkostwa (Intent Members)

**Opis:** Zarządzanie uczestnikami wydarzeń z różnymi rolami i statusami.

**Funkcje:**

- ✅ Dołączanie do wydarzeń (request/instant)
- ✅ Zapraszanie użytkowników
- ✅ Akceptacja/odrzucanie wniosków
- ✅ Opuszczanie wydarzeń
- ✅ Wyrzucanie członków (kick)
- ✅ Banowanie użytkowników
- ✅ Role: OWNER, ADMIN, MODERATOR, MEMBER
- ✅ Statusy: PENDING, INVITED, APPROVED, REJECTED, BANNED
- ✅ Lista członków z filtrowaniem
- ✅ Statystyki członkostwa

**Pliki:**

- Backend: `apps/api/src/graphql/resolvers/mutation/intent-members.ts`
- Frontend: `apps/web/src/lib/api/intent-members.tsx`
- UI: `apps/web/src/app/intent/[id]/_components/members-tab.tsx`

---

### 3. System Czatu

**Opis:** Real-time komunikacja między użytkownikami.

#### 3.1 Event Chat

- ✅ Czat grupowy dla uczestników wydarzenia
- ✅ Real-time messages (GraphQL Subscriptions)
- ✅ Typing indicators
- ✅ Read receipts
- ✅ Message reactions
- ✅ Edycja i usuwanie wiadomości
- ✅ Oznaczanie jako przeczytane
- ✅ Rate limiting (anty-spam)

#### 3.2 Direct Messages (DM)

- ✅ Prywatne wiadomości 1-on-1
- ✅ Lista konwersacji
- ✅ Nieprzeczytane wiadomości (badge)
- ✅ Wyszukiwanie konwersacji
- ✅ Blokowanie użytkowników

**Pliki:**

- Backend:
  - `apps/api/src/graphql/resolvers/mutation/event-chat.ts`
  - `apps/api/src/graphql/resolvers/mutation/dm.ts`
  - `apps/api/src/graphql/resolvers/subscription/event-chat.ts`
- Frontend:
  - `apps/web/src/lib/api/event-chat.tsx`
  - `apps/web/src/lib/api/dm.tsx`
  - `apps/web/src/components/chat/`

---

### 4. Komentarze i Recenzje

**Opis:** System opinii o wydarzeniach i użytkownikach.

#### 4.1 Komentarze

- ✅ Komentarze do wydarzeń
- ✅ Odpowiedzi (replies) - zagnieżdżone komentarze
- ✅ Edycja i usuwanie
- ✅ Soft delete (możliwość przywrócenia)
- ✅ Licznik komentarzy

#### 4.2 Recenzje (Reviews)

- ✅ Oceny 1-5 gwiazdek
- ✅ Tekst recenzji
- ✅ Tylko dla uczestników
- ✅ Jedna recenzja na użytkownika
- ✅ Średnia ocen

**Pliki:**

- Backend:
  - `apps/api/src/graphql/resolvers/mutation/comments.ts`
  - `apps/api/src/graphql/resolvers/mutation/reviews.ts`
- Frontend:
  - `apps/web/src/lib/api/comments.tsx`
  - `apps/web/src/lib/api/reviews.tsx`
  - `apps/web/src/app/intent/[id]/_components/event-comments.tsx`

---

### 5. Mapa z Clusteringiem

**Opis:** Interaktywna mapa pokazująca wydarzenia z zaawansowanym clusteringiem.

**Funkcje:**

- ✅ Mapbox GL JS + Deck.gl
- ✅ Server-side clustering (PostGIS)
- ✅ Dynamiczne poziomy zoom
- ✅ Popup z listą wydarzeń w regionie
- ✅ Infinity scroll w popup (Virtuoso)
- ✅ Filtrowanie (kategorie, poziomy, verified)
- ✅ Geolokalizacja użytkownika
- ✅ Wyszukiwanie po adresie

**Algorytm:**

1. Użytkownik zmienia viewport mapy
2. Frontend wysyła bounds (bbox) do API
3. Backend wykonuje clustering w PostGIS:
   - ST_ClusterKMeans dla małych zoom
   - ST_SnapToGrid dla dużych zoom
4. Zwraca clustery z liczbą wydarzeń
5. Frontend renderuje clustery na mapie

**Pliki:**

- Backend: `apps/api/src/graphql/resolvers/query/map-clusters.ts`
- Frontend:
  - `apps/web/src/app/[[...slug]]/_components/server-clustered-map.tsx`
  - `apps/web/src/app/[[...slug]]/_components/map-popup/region-popup.tsx`

---

### 6. System Powiadomień

**Opis:** Real-time powiadomienia o wydarzeniach w aplikacji.

**Typy powiadomień:**

- ✅ Nowy członek dołączył
- ✅ Wniosek o dołączenie
- ✅ Zaproszenie do wydarzenia
- ✅ Nowa wiadomość
- ✅ Nowy komentarz
- ✅ Nowa recenzja
- ✅ Przypomnienie o wydarzeniu
- ✅ Wydarzenie anulowane
- ✅ Zmiana roli

**Funkcje:**

- ✅ Real-time (GraphQL Subscriptions)
- ✅ Badge z liczbą nieprzeczytanych
- ✅ Oznaczanie jako przeczytane
- ✅ Usuwanie powiadomień
- ✅ Grupowanie powiadomień
- ✅ Preferencje (mute/unmute)

**Pliki:**

- Backend:
  - `apps/api/src/graphql/resolvers/subscription/notifications.ts`
  - `apps/api/src/workers/reminders/`
- Frontend:
  - `apps/web/src/lib/api/notifications.tsx`
  - `apps/web/src/features/notifications/`

---

### 7. Panel Administracyjny

**Opis:** Zaawansowany panel dla administratorów do zarządzania platformą.

#### 7.1 Zarządzanie Użytkownikami

- ✅ Lista użytkowników z filtrowaniem
- ✅ Szczegóły użytkownika (profile, stats)
- ✅ Zawieszanie kont (suspend)
- ✅ Banowanie użytkowników
- ✅ Usuwanie kont
- ✅ Historia aktywności
- ✅ Diagnostyka (cache, sessions)

#### 7.2 Zarządzanie Wydarzeniami

- ✅ Lista wydarzeń z filtrowaniem
- ✅ Szczegóły wydarzenia
- ✅ Akceptacja/odrzucanie wydarzeń
- ✅ Usuwanie wydarzeń
- ✅ Zarządzanie członkami
- ✅ Moderacja komentarzy

#### 7.3 Moderacja Treści

- ✅ Przegląd komentarzy
- ✅ Usuwanie komentarzy
- ✅ Przegląd recenzji
- ✅ System raportów (reports)

**Pliki:**

- Frontend: `apps/web/src/app/admin/`
  - `users/` - zarządzanie użytkownikami
  - `intents/` - zarządzanie wydarzeniami
  - `comments/` - moderacja komentarzy

---

### 8. Autentykacja i Autoryzacja

**Opis:** System logowania i zarządzania uprawnieniami.

**Funkcje:**

- ✅ JWT authentication (cookies + headers)
- ✅ Dev login (development only)
- ✅ Role-based access control (RBAC)
- ✅ Session management
- ✅ Refresh tokens
- ✅ Logout

**Role:**

- `USER` - zwykły użytkownik
- `ADMIN` - administrator platformy
- `MODERATOR` - moderator treści

**Pliki:**

- Backend:
  - `apps/api/src/plugins/jwt.ts`
  - `apps/api/src/graphql/resolvers/mutation/auth.ts`
- Frontend:
  - `apps/web/src/lib/api/auth.tsx`
  - `apps/web/src/features/auth/`

---

### 9. System Planów (Freemium)

**Opis:** Trzy poziomy subskrypcji z różnymi limitami.

**Plany:**

| Feature                    | Free | Premium | Pro |
| -------------------------- | ---- | ------- | --- |
| Aktywne wydarzenia         | 5    | 20      | ∞   |
| Członkostwo w wydarzeniach | 10   | 50      | ∞   |
| DM na dzień                | 50   | 200     | ∞   |
| Wiadomości event chat      | 100  | 500     | ∞   |
| Weryfikacja                | ❌   | ✅      | ✅  |
| Badge                      | ❌   | ✅      | ✅  |
| Priorytetowe wsparcie      | ❌   | ❌      | ✅  |

**Implementacja:**

- Limity sprawdzane w resolverach
- Enum: `FREE`, `PREMIUM`, `PRO`
- Pole `plan` w tabeli `User`

**Pliki:**

- Backend: `apps/api/src/graphql/resolvers/mutation/intents.ts` (sprawdzanie limitów)
- Schema: `apps/api/prisma/schema.prisma` (enum Plan)

---

## Baza Danych

### PostgreSQL + PostGIS

**Główne tabele:**

#### Users

```sql
- id (UUID)
- name (String)
- email (String, unique)
- imageUrl (String?)
- plan (FREE/PREMIUM/PRO)
- role (USER/ADMIN/MODERATOR)
- verifiedAt (DateTime?)
- suspendedAt (DateTime?)
- suspensionReason (String?)
- createdAt (DateTime)
```

#### Intents (Wydarzenia)

```sql
- id (UUID)
- title (String)
- description (String?)
- startAt (DateTime)
- endAt (DateTime?)
- lat (Float)
- lng (Float)
- geom (Geometry) -- PostGIS point
- address (String?)
- placeId (String?)
- meetingKind (ONSITE/ONLINE/HYBRID)
- visibility (PUBLIC/PRIVATE/INVITE_ONLY)
- joinMode (OPEN/APPROVAL/INVITE)
- mode (SINGLE/RECURRING)
- min (Int?)
- max (Int?)
- isCanceled (Boolean)
- isDeleted (Boolean)
- ownerId (UUID)
- createdAt (DateTime)
```

#### IntentMembers

```sql
- id (UUID)
- intentId (UUID)
- userId (UUID)
- role (OWNER/ADMIN/MODERATOR/MEMBER)
- status (PENDING/INVITED/APPROVED/REJECTED/BANNED)
- joinedAt (DateTime?)
- leftAt (DateTime?)
```

#### Comments

```sql
- id (UUID)
- content (String)
- intentId (UUID)
- authorId (UUID)
- parentId (UUID?) -- dla replies
- deletedAt (DateTime?) -- soft delete
- createdAt (DateTime)
```

#### Reviews

```sql
- id (UUID)
- rating (Int, 1-5)
- content (String?)
- intentId (UUID)
- authorId (UUID)
- deletedAt (DateTime?)
- createdAt (DateTime)
```

#### EventChatMessages

```sql
- id (UUID)
- content (String)
- intentId (UUID)
- authorId (UUID)
- isEdited (Boolean)
- deletedAt (DateTime?)
- createdAt (DateTime)
```

#### DirectMessages

```sql
- id (UUID)
- content (String)
- threadId (UUID)
- senderId (UUID)
- isRead (Boolean)
- readAt (DateTime?)
- deletedAt (DateTime?)
- createdAt (DateTime)
```

#### Notifications

```sql
- id (UUID)
- type (String)
- title (String)
- message (String?)
- userId (UUID)
- relatedIntentId (UUID?)
- relatedUserId (UUID?)
- isRead (Boolean)
- readAt (DateTime?)
- createdAt (DateTime)
```

**Indeksy:**

- PostGIS spatial index na `geom`
- Index na `userId`, `intentId` dla szybkich joinów
- Composite indexes dla często używanych queries

**Migracje:**

- Prisma Migrate
- Lokalizacja: `apps/api/prisma/migrations/`

---

## API & GraphQL

### GraphQL Schema

**Queries:**

```graphql
# Intents
intents(filters, pagination): IntentsResponse
intent(id): Intent
myIntents: [Intent]

# Members
intentMembers(intentId): [IntentMember]
myMemberships: [IntentMember]

# Comments & Reviews
comments(intentId): [Comment]
reviews(intentId): [Review]

# Chat
eventChatMessages(intentId): [EventChatMessage]
dmThreads: [DMThread]
dmMessages(threadId): [DirectMessage]

# Notifications
notifications: [Notification]
unreadNotificationsCount: Int

# Map
mapClusters(bounds, zoom, filters): [MapCluster]
regionIntents(region, filters): [Intent]

# Admin
adminUsers(filters): [User]
adminIntents(filters): [Intent]
adminComments(filters): [Comment]
```

**Mutations:**

```graphql
# Intents
createIntent(input): Intent
updateIntent(id, input): Intent
deleteIntent(id): Boolean
cancelIntent(id): Intent

# Members
requestJoinIntent(intentId): IntentMember
leaveIntent(intentId): Boolean
inviteMember(intentId, userId): IntentMember
approveMembership(id): IntentMember
kickMember(id): Boolean
banMember(intentId, userId): Boolean

# Comments & Reviews
createComment(input): Comment
updateComment(id, content): Comment
deleteComment(id): Boolean
createReview(input): Review

# Chat
sendEventMessage(intentId, content): EventChatMessage
sendDmMessage(threadId, content): DirectMessage
markAsRead(messageId): Boolean

# Admin
adminSuspendUser(userId, reason): User
adminDeleteIntent(id): Boolean
adminDeleteComment(id): Boolean
```

**Subscriptions:**

```graphql
# Real-time updates
eventChatMessages(intentId): EventChatMessage
dmMessages(threadId): DirectMessage
notifications: Notification
typingIndicator(intentId): TypingIndicator
```

**Pliki:**

- Schema: `packages/contracts/graphql/schema.graphql`
- Operations: `packages/contracts/graphql/operations/`
- Resolvers: `apps/api/src/graphql/resolvers/`

---

## Frontend

### Next.js App Router

**Routing:**

```
/                          # Landing page
/[[...slug]]              # Main app (map + list)
  /?view=map              # Map view
  /?view=list             # List view
/intent/[id]              # Event detail
  /intent/[id]/edit       # Edit event
/account                  # User account
  /account/profile        # Profile settings
  /account/notifications  # Notification settings
  /account/memberships    # My memberships
/admin                    # Admin panel
  /admin/users            # User management
  /admin/intents          # Event management
  /admin/comments         # Comment moderation
```

### State Management

**Server State (React Query):**

- Queries: `useQuery` dla GET operations
- Mutations: `useMutation` dla POST/PUT/DELETE
- Infinite Queries: `useInfiniteQuery` dla paginacji
- Subscriptions: Custom hooks z WebSocket

**Local State:**

- React Context dla theme, auth
- useState/useReducer dla component state
- URL params dla filters, pagination

### API Hooks

**Lokalizacja:** `apps/web/src/lib/api/`

**Przykład:**

```typescript
// intents.tsx
export function useGetIntents(variables, options) {
  return useQuery({
    queryKey: ['GetIntents', variables],
    queryFn: () => gqlClient.request(GetIntentsDocument, variables),
    ...options,
  });
}

export function useCreateIntentMutation(options) {
  return useMutation({
    mutationKey: ['CreateIntent'],
    mutationFn: (variables) =>
      gqlClient.request(CreateIntentDocument, variables),
    meta: {
      successMessage: 'Event created successfully',
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['GetIntents']);
    },
    ...options,
  });
}
```

### UI Components

**Design System:**

- Tailwind CSS (utility-first)
- Dark mode support
- Responsive design (mobile-first)
- Accessibility (ARIA labels, keyboard navigation)

**Główne komponenty:**

- `EventCard` - karta wydarzenia
- `MembersList` - lista członków
- `ChatWindow` - okno czatu
- `CommentThread` - wątek komentarzy
- `MapView` - widok mapy
- `Toaster` - toast notifications

**Lokalizacja:** `apps/web/src/components/`

---

## Systemy Pomocnicze

### 1. Toast & Logging System

**Opis:** Zaawansowany system powiadomień i logowania dla developerów.

**Komponenty:**

- `dev-logger.ts` - kolorowe logi w konsoli
- `toast-manager.ts` - toast notifications (Sonner)
- `react-query-config.ts` - auto-logging dla React Query

**Funkcje:**

- ✅ Automatyczne toast dla mutations
- ✅ Automatyczne logi dla query/mutations
- ✅ Error handling z rozpoznawaniem typów
- ✅ Performance monitoring
- ✅ Debug mode z localStorage
- ✅ Globalne komendy: `enableDebug()`, `disableDebug()`

**Użycie:**

```typescript
import { toast, devLogger } from '@/lib/utils';

toast.success('Event created!');
devLogger.mutationSuccess('createEvent', data, 250);
```

**Dokumentacja:** `FINAL_IMPLEMENTATION_SUMMARY.md`

---

### 2. Rate Limiting

**Opis:** Ochrona przed spam i abuse.

**Limity:**

- Event chat: 10 wiadomości/minutę
- DM: 20 wiadomości/minutę
- API calls: 100 requestów/minutę
- Mutations: 30/minutę

**Implementacja:**

- Redis dla przechowywania liczników
- Token bucket algorithm
- Per-user rate limiting

**Pliki:**

- Backend: `apps/api/src/plugins/rate-limit.ts`
- Chat: `apps/api/src/lib/chat-rate-limit.ts`

---

### 3. Caching Strategy

**Levels:**

1. **Browser Cache:**
   - React Query cache (5 min stale time)
   - localStorage dla preferencji

2. **Redis Cache:**
   - User sessions
   - PubSub dla subscriptions
   - Rate limiting counters

3. **Database:**
   - PostgreSQL query cache
   - PostGIS spatial index

**Invalidation:**

- Automatyczna przez React Query
- Manual przez `queryClient.invalidateQueries()`
- TTL w Redis

---

### 4. Error Handling

**Frontend:**

- Error boundaries (React)
- Toast notifications dla user errors
- Sentry integration (optional)
- Fallback UI

**Backend:**

- Try-catch w resolverach
- Structured error responses
- Error logging (Pino)
- HTTP status codes

**Typy błędów:**

- `ValidationError` - błędne dane wejściowe
- `AuthenticationError` - brak autoryzacji
- `ForbiddenError` - brak uprawnień
- `NotFoundError` - zasób nie istnieje
- `RateLimitError` - przekroczony limit

---

### 5. Performance Optimization

**Frontend:**

- Code splitting (Next.js automatic)
- Image optimization (next/image)
- Lazy loading (React.lazy)
- Virtualization (react-virtuoso)
- Memoization (useMemo, useCallback)

**Backend:**

- Database indexes
- Query optimization (Prisma)
- Connection pooling
- Redis caching
- Batch operations

**Monitoring:**

- OpenTelemetry traces
- Prometheus metrics
- Custom performance logs

---

## Deployment & DevOps

### Development Environment

**Docker Compose:**

```yaml
services:
  postgres:
    image: postgis/postgis:15-3.3
    ports: 5432:5432

  redis:
    image: redis:7-alpine
    ports: 6379:6379

  prometheus:
    image: prom/prometheus
    ports: 9090:9090

  grafana:
    image: grafana/grafana
    ports: 3000:3000
```

**Start:**

```bash
# Install dependencies
pnpm install

# Start Docker services
docker-compose -f docker/docker-compose.dev.yml up -d

# Run migrations
cd apps/api && pnpm prisma migrate dev

# Seed database
pnpm prisma db seed

# Start dev servers
pnpm dev  # Starts both API and Web
```

---

### Build & Deploy

**Build:**

```bash
# Build all apps
pnpm build

# Build specific app
pnpm --filter api build
pnpm --filter web build
```

**Environment Variables:**

**API (.env):**

```
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=...
CORS_ORIGIN=http://localhost:3000
```

**Web (.env.local):**

```
NEXT_PUBLIC_API_URL=http://localhost:4000/graphql
NEXT_PUBLIC_WS_URL=ws://localhost:4000/graphql
NEXT_PUBLIC_MAPBOX_TOKEN=...
```

---

### Testing

**Backend:**

```bash
cd apps/api
pnpm test              # Unit tests
pnpm test:watch        # Watch mode
pnpm test:coverage     # Coverage report
```

**Frontend:**

```bash
cd apps/web
pnpm test              # Component tests
pnpm test:e2e          # E2E tests (Playwright)
```

---

### Monitoring & Observability

**Metrics:**

- Request rate (req/s)
- Response time (ms)
- Error rate (%)
- Active users
- Database connections
- Cache hit rate

**Traces:**

- OpenTelemetry integration
- Distributed tracing
- Query performance
- Resolver execution time

**Logs:**

- Structured logging (Pino)
- Log levels: debug, info, warn, error
- Request/response logging
- Error stack traces

---

## Kluczowe Decyzje Architektoniczne

### 1. Monorepo (Turbo)

**Dlaczego:** Shared types, łatwe refactoring, atomic commits

### 2. GraphQL (Mercurius)

**Dlaczego:** Type-safe API, real-time subscriptions, efficient data fetching

### 3. Prisma ORM

**Dlaczego:** Type-safe queries, migrations, excellent DX

### 4. Next.js App Router

**Dlaczego:** SSR/SSG, file-based routing, React Server Components

### 5. React Query

**Dlaczego:** Powerful caching, automatic refetching, optimistic updates

### 6. PostGIS

**Dlaczego:** Advanced geo queries, clustering, spatial indexes

### 7. Redis PubSub

**Dlaczego:** Real-time subscriptions, scalable, fast

### 8. Fastify

**Dlaczego:** High performance, plugin ecosystem, TypeScript support

---

## Roadmap & Future Features

### Planowane funkcje:

- [ ] Mobile app (React Native)
- [ ] Push notifications (FCM)
- [ ] Email notifications (SendGrid)
- [ ] Payment integration (Stripe)
- [ ] Social login (Google, Facebook)
- [ ] Advanced search (Elasticsearch)
- [ ] Machine learning recommendations
- [ ] Video chat integration
- [ ] Calendar sync (Google Calendar)
- [ ] Export events (iCal)

---

## Kontakt & Dokumentacja

**Dokumentacja techniczna:**

- `README.md` - Quick start guide
- `ARCHITECTURE.md` - Detailed architecture
- `FINAL_IMPLEMENTATION_SUMMARY.md` - Toast & Logging system
- `CHAT_IMPLEMENTATION_SUMMARY.md` - Chat system
- `MAP_CLUSTERING_IMPLEMENTATION.md` - Map clustering

**Inne dokumenty:**

- `ADMIN_PANEL_IMPLEMENTATION.md`
- `EVENT_ADMIN_PANEL_SUMMARY.md`
- `REPORT_FEATURE_IMPLEMENTATION.md`

---

## Podsumowanie

**Miglee** to kompleksowa platforma społecznościowa do organizowania wydarzeń sportowych, zbudowana w oparciu o nowoczesny stack technologiczny:

- **Backend:** Fastify + GraphQL + Prisma + PostgreSQL + Redis
- **Frontend:** Next.js 14 + React Query + Tailwind CSS
- **Real-time:** GraphQL Subscriptions + WebSocket
- **Geo:** PostGIS + Mapbox + Deck.gl
- **DevOps:** Docker + Turbo + OpenTelemetry

**Kluczowe cechy:**

- ✅ Real-time communication (chat, notifications)
- ✅ Advanced map with clustering
- ✅ Comprehensive admin panel
- ✅ Freemium model (3 plans)
- ✅ Type-safe full-stack (TypeScript)
- ✅ Scalable architecture
- ✅ Developer-friendly (logging, debugging)

**Status:** Production-ready 🚀
