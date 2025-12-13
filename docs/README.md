# Miglee

**Miglee** to platforma do organizowania i odkrywania wydarzeń społecznościowych. Aplikacja umożliwia użytkownikom tworzenie, zarządzanie i dołączanie do wydarzeń w okolicy lub online.

---

## Spis treści

- [O projekcie](#o-projekcie)
- [Główne funkcje](#główne-funkcje)
- [Stack technologiczny](#stack-technologiczny)
- [Architektura](#architektura)
- [Struktura projektu](#struktura-projektu)
- [Uruchomienie](#uruchomienie)
- [Komendy](#komendy)
- [Baza danych](#baza-danych)
- [API](#api)
- [Frontend](#frontend)
- [Funkcje Premium](#funkcje-premium)
- [Dokumentacja](#dokumentacja)

---

## O projekcie

Miglee to full-stack aplikacja zbudowana jako **monorepo** z wykorzystaniem nowoczesnych technologii webowych. Projekt składa się z:

- **Frontend**: Next.js 15 z App Router
- **Backend**: Fastify + GraphQL (Mercurius)
- **Baza danych**: PostgreSQL z PostGIS (geolokalizacja)
- **Cache/Pub-Sub**: Redis + BullMQ (kolejki)
- **Płatności**: Stripe
- **Email**: Resend
- **Monitoring**: OpenTelemetry

### Cel aplikacji

Miglee łączy ludzi poprzez lokalne wydarzenia. Użytkownicy mogą:

- Przeglądać wydarzenia na mapie lub liście
- Tworzyć i zarządzać własnymi wydarzeniami
- Dołączać do wydarzeń i komunikować się z uczestnikami
- Oceniać i komentować wydarzenia
- Zapisywać ulubione wydarzenia

---

## Główne funkcje

### 🎉 Wydarzenia (Events)

- Tworzenie wydarzeń z bogatym edytorem (tytuł, opis, lokalizacja, daty)
- Kategorie i tagi
- Tryby dołączania: otwarty, z prośbą o dołączenie, tylko zaproszenia
- Limit uczestników (min/max) z listą oczekujących (waitlist)
- Status publikacji: Draft, Published, Scheduled
- Widoczność: publiczne lub ukryte
- Wydarzenia onsite, online lub hybrydowe

### 📍 Geolokalizacja

- Wyszukiwanie wydarzeń na mapie (MapLibre GL)
- Filtrowanie po mieście i promieniu
- Google Places API dla autouzupełniania adresów

### 👥 Członkostwo i role

- Role: Owner, Moderator, Participant
- Statusy: Joined, Pending, Invited, Rejected, Banned, Left, Kicked, Waitlist
- Historia zmian członkostwa (audit log)

### ✅ Check-in & Obecność

**System potwierdzania obecności na wydarzeniach z 4 metodami check-in:**

#### Metody Check-in

1. **Manual (SELF_MANUAL)** - Użytkownik sam klika "Jestem na wydarzeniu"
2. **Moderator Panel (MODERATOR_PANEL)** - Organizator odhacza z listy
3. **Event QR (EVENT_QR)** - Wspólny kod QR dla całego wydarzenia
4. **User QR (USER_QR)** - Indywidualny kod QR każdego uczestnika

#### Funkcje

- ✅ Wielokrotne metody check-in jednocześnie
- ✅ Blokady check-in (globalne lub per metoda)
- ✅ Odrzucanie check-in z powodem
- ✅ Rotacja tokenów QR (bezpieczeństwo)
- ✅ Kompletny audit trail (EventCheckinLog)
- ✅ Panel organizatora z listą uczestników
- ✅ Skaner QR z kamerą (WebRTC)
- ✅ Eksport listy obecności (PDF/PNG)
- ✅ Powiadomienia o check-in
- ✅ Statystyki obecności

#### API

- 12 GraphQL mutations (user + moderator + config)
- 1 GraphQL query (paginowane logi)
- 12 React Query hooks z cache invalidation
- Idempotentne operacje
- 256-bit secure tokens (nanoid)

#### UI Komponenty

- `UserCheckinSection` - przycisk check-in dla użytkownika
- `EventQRCode` - QR wydarzenia (pełny ekran, download)
- `UserQRCode` - osobisty QR uczestnika
- `QRScannerModal` - skaner z kamerą
- Checkin management page - pełny panel organizatora

**Zobacz:** `apps/api/CHECKIN_IMPLEMENTATION.md` dla szczegółów technicznych

### 💬 Komunikacja

- Chat wydarzeniowy (Event Chat)
- Wiadomości prywatne (DM - Direct Messages)
- Powiadomienia w czasie rzeczywistym (WebSocket)
- System komentarzy do wydarzeń

### ⭐ Opinie i recenzje

- Recenzje wydarzeń (ocena + komentarz)
- Feedback od uczestników (ankiety)

### 📅 Agenda

- Program wydarzenia z slotami czasowymi
- Prowadzący (hosty) - użytkownicy systemu lub ręcznie wprowadzeni
- Drag & drop do zmiany kolejności

### 🔔 Powiadomienia

- Push notifications
- Email notifications
- In-app notifications
- Preferencje powiadomień per użytkownik

### 🛡️ Moderacja

- Zgłaszanie treści (raporty)
- Blokowanie użytkowników
- Panel administracyjny
- Ukrywanie/usuwanie komentarzy i recenzji

### 💎 Funkcje Premium (Plus/Pro)

- Boosting wydarzeń (większa widoczność)
- Personalizacja wyglądu kart wydarzeń
- Rozszerzona analityka
- Linki zaproszeniowe
- FAQ wydarzeń

---

## Stack technologiczny

### Frontend (`apps/web/`)

| Technologia         | Wersja | Użycie                             |
| ------------------- | ------ | ---------------------------------- |
| **Next.js**         | 15.x   | Framework (App Router + Turbopack) |
| **React**           | 19.x   | UI Library                         |
| **TypeScript**      | 5.x    | Type safety                        |
| **Tailwind CSS**    | 4.x    | Styling                            |
| **TanStack Query**  | 5.x    | Data fetching & caching            |
| **GraphQL Request** | 7.x    | GraphQL client                     |
| **Framer Motion**   | 12.x   | Animacje                           |
| **React Hook Form** | 7.x    | Formularze                         |
| **Zod**             | 3.x    | Walidacja schematów                |
| **MapLibre GL**     | 5.x    | Mapy                               |
| **date-fns**        | 4.x    | Obsługa dat                        |
| **Sonner**          | 2.x    | Toast notifications                |
| **Lucide React**    | -      | Ikony                              |

### Backend (`apps/api/`)

| Technologia       | Wersja | Użycie                        |
| ----------------- | ------ | ----------------------------- |
| **Fastify**       | 5.x    | HTTP server                   |
| **Mercurius**     | 16.x   | GraphQL server                |
| **Prisma**        | 6.x    | ORM                           |
| **PostgreSQL**    | 16.x   | Baza danych                   |
| **PostGIS**       | -      | Rozszerzenie geolokalizacyjne |
| **Redis**         | -      | Cache + Pub/Sub               |
| **BullMQ**        | 5.x    | Job queues                    |
| **Sharp**         | -      | Przetwarzanie obrazów         |
| **Stripe**        | 20.x   | Płatności                     |
| **Resend**        | 6.x    | Email                         |
| **OpenTelemetry** | -      | Monitoring & Tracing          |

### Infrastruktura

| Narzędzie           | Użycie                 |
| ------------------- | ---------------------- |
| **pnpm**            | Package manager        |
| **Turborepo**       | Monorepo build system  |
| **Docker Compose**  | Lokalne środowisko dev |
| **GraphQL Codegen** | Generowanie typów      |

---

## Architektura

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│                       (Next.js 15)                               │
├─────────────────────────────────────────────────────────────────┤
│  Browser                                                         │
│  ├── SSR (Server Components)                                    │
│  ├── CSR (Client Components + TanStack Query)                   │
│  └── WebSocket (Real-time subscriptions)                        │
└────────────────────────┬────────────────────────────────────────┘
                         │ GraphQL (HTTP + WS)
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                          BACKEND                                 │
│                   (Fastify + Mercurius)                         │
├─────────────────────────────────────────────────────────────────┤
│  API Server                                                      │
│  ├── GraphQL Resolvers (Query, Mutation, Subscription)          │
│  ├── Authentication (JWT + Cookies)                             │
│  ├── Rate Limiting                                              │
│  ├── File Upload (S3 / Local)                                   │
│  └── Webhooks (Stripe)                                          │
├─────────────────────────────────────────────────────────────────┤
│  Workers (BullMQ)                                                │
│  ├── Reminders Worker                                           │
│  └── Feedback Worker                                            │
└────────────────────────┬────────────────────────────────────────┘
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  PostgreSQL  │ │    Redis     │ │   S3/Local   │
│   + PostGIS  │ │ Cache+PubSub │ │    Storage   │
└──────────────┘ └──────────────┘ └──────────────┘
```

### Architektura Frontend

Frontend wykorzystuje **feature-based architecture**:

```
apps/web/src/
├── app/                    # Next.js App Router (routing)
│   └── [locale]/           # i18n routes
├── features/               # Moduły domenowe
│   ├── events/             # Wydarzenia
│   ├── users/              # Użytkownicy
│   ├── chat/               # Messaging
│   ├── notifications/      # Powiadomienia
│   └── ...
├── components/             # Shared UI components
│   ├── ui/                 # Design system
│   ├── layout/             # Layouty
│   └── forms/              # Formularze
├── hooks/                  # Global hooks
└── lib/                    # Utilities
```

---

## Struktura projektu

```
miglee/
├── apps/
│   ├── api/                    # Backend (Fastify + GraphQL)
│   │   ├── prisma/             # Schema + migracje
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   ├── src/
│   │   │   ├── graphql/        # Resolvers
│   │   │   ├── lib/            # Utilities
│   │   │   ├── plugins/        # Fastify plugins
│   │   │   └── workers/        # Background jobs
│   │   └── package.json
│   │
│   └── web/                    # Frontend (Next.js)
│       ├── src/
│       │   ├── app/            # App Router
│       │   ├── features/       # Feature modules
│       │   ├── components/     # Shared components
│       │   ├── hooks/          # Global hooks
│       │   └── lib/            # Utilities
│       └── package.json
│
├── packages/
│   ├── config/                 # Shared TypeScript config
│   └── contracts/              # GraphQL schemas & fragments
│       └── graphql/
│           ├── schema.graphql
│           ├── fragments/
│           └── operations/
│
├── docker/                     # Docker Compose configs
├── docs/                       # Dokumentacja
├── package.json                # Root package.json
├── pnpm-workspace.yaml         # Workspace config
└── turbo.json                  # Turborepo config
```

---

## Uruchomienie

### Wymagania

- **Node.js** ≥ 22.18.0
- **pnpm** ≥ 10.14.0
- **Docker** (dla PostgreSQL + Redis)

### Instalacja

```bash
# Klonowanie repozytorium
git clone <repo-url>
cd miglee

# Instalacja zależności
pnpm install

# Uruchomienie baz danych (Docker)
pnpm db:up

# Migracja bazy danych
cd apps/api
pnpm prisma:migrate

# Seed danych testowych
pnpm prisma:seed

# Generowanie typów GraphQL
cd ../..
pnpm gql:gen

# Uruchomienie dev server
pnpm dev
```

### Zmienne środowiskowe

Utwórz pliki `.env` w `apps/api/` i `apps/web/`:

**apps/api/.env:**

```env
DATABASE_URL="postgresql://user:password@localhost:5432/miglee?schema=public"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-secret-key"
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
RESEND_API_KEY="re_..."
S3_BUCKET="miglee-uploads"
S3_REGION="eu-central-1"
```

**apps/web/.env:**

```env
NEXT_PUBLIC_API_URL="http://localhost:4000/graphql"
NEXT_PUBLIC_WS_URL="ws://localhost:4000/graphql"
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="AIza..."
```

---

## Komendy

### Root (monorepo)

| Komenda          | Opis                                           |
| ---------------- | ---------------------------------------------- |
| `pnpm dev`       | Uruchomienie wszystkich aplikacji w trybie dev |
| `pnpm build`     | Build wszystkich aplikacji                     |
| `pnpm gql:gen`   | Generowanie typów GraphQL                      |
| `pnpm db:up`     | Uruchomienie Docker (PostgreSQL + Redis)       |
| `pnpm db:down`   | Zatrzymanie Docker                             |
| `pnpm typecheck` | Sprawdzenie typów TypeScript                   |
| `pnpm lint`      | Linting                                        |

### API (`apps/api/`)

| Komenda                     | Opis                      |
| --------------------------- | ------------------------- |
| `pnpm dev`                  | Dev server (port 4000)    |
| `pnpm prisma:migrate`       | Migracja bazy danych      |
| `pnpm prisma:seed`          | Seed danych testowych     |
| `pnpm prisma:studio`        | Prisma Studio (GUI)       |
| `pnpm prisma:generate`      | Generowanie Prisma Client |
| `pnpm worker:reminders:dev` | Worker przypomnień (dev)  |
| `pnpm worker:feedback:dev`  | Worker feedbacku (dev)    |

### Web (`apps/web/`)

| Komenda        | Opis                               |
| -------------- | ---------------------------------- |
| `pnpm dev`     | Dev server z Turbopack (port 3000) |
| `pnpm build`   | Production build                   |
| `pnpm start`   | Uruchomienie production server     |
| `pnpm gql:gen` | Generowanie typów GraphQL          |

---

## Baza danych

### Główne modele

| Model                    | Opis                                              |
| ------------------------ | ------------------------------------------------- |
| `User`                   | Użytkownik z profilem, preferencjami, subskrypcją |
| `Event`                  | Wydarzenie z lokalizacją, datami, członkami       |
| `EventMember`            | Członkostwo użytkownika w wydarzeniu              |
| `Category`               | Kategoria wydarzenia (wielojęzyczna)              |
| `Tag`                    | Tag wydarzenia                                    |
| `Comment`                | Komentarz do wydarzenia                           |
| `Review`                 | Recenzja wydarzenia                               |
| `Notification`           | Powiadomienie                                     |
| `DmThread` / `DmMessage` | Wiadomości prywatne                               |
| `EventChatMessage`       | Chat wydarzenia                                   |
| `EventAgendaItem`        | Slot w agendzie wydarzenia                        |
| `EventFaq`               | FAQ wydarzenia                                    |
| `UserSubscription`       | Subskrypcja premium                               |

### Enumy statusów

```prisma
enum EventMemberStatus {
  JOINED      // Dołączył
  PENDING     // Oczekuje na akceptację
  INVITED     // Zaproszony
  REJECTED    // Odrzucony
  BANNED      // Zbanowany
  LEFT        // Opuścił
  KICKED      // Wyrzucony
  WAITLIST    // Na liście oczekujących
}

enum PublicationStatus {
  DRAFT       // Szkic
  PUBLISHED   // Opublikowany
  SCHEDULED   // Zaplanowany
}

enum JoinMode {
  OPEN        // Otwarty
  REQUEST     // Wymaga akceptacji
  INVITE_ONLY // Tylko zaproszenia
}
```

---

## API

### GraphQL Schema

API udostępnia GraphQL endpoint na `POST /graphql` z obsługą:

- **Queries**: Pobieranie danych
- **Mutations**: Modyfikacja danych
- **Subscriptions**: Real-time updates (WebSocket)

### Przykładowe operacje

```graphql
# Pobierz wydarzenia
query Events($filters: EventFilters!) {
  events(filters: $filters) {
    items {
      id
      title
      startAt
      endAt
      joinedCount
      owner {
        name
        avatarKey
      }
    }
    pageInfo {
      total
      hasNextPage
    }
  }
}

# Dołącz do wydarzenia
mutation JoinEvent($eventId: ID!) {
  joinEvent(eventId: $eventId) {
    id
    status
  }
}

# Subskrybuj wiadomości
subscription OnNewMessage($threadId: ID!) {
  dmMessageAdded(threadId: $threadId) {
    id
    content
    sender {
      name
    }
  }
}
```

---

## Frontend

### Internationalization (i18n)

Aplikacja obsługuje 3 języki:

- 🇬🇧 Angielski (en)
- 🇵🇱 Polski (pl)
- 🇩🇪 Niemiecki (de)

Routing: `/[locale]/...` np. `/pl/events`, `/en/account`

### Design System

Zobacz [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) dla szczegółów:

- Kolory (Indigo primary, Zinc neutral)
- Typografia
- Spacing
- Komponenty (Button, Card, Input, etc.)
- Animacje
- Dostępność (a11y)

### Key Components

| Komponent           | Opis                       |
| ------------------- | -------------------------- |
| `EventCard`         | Karta wydarzenia na liście |
| `EventDetailClient` | Szczegóły wydarzenia       |
| `EventForm`         | Formularz tworzenia/edycji |
| `EventAgenda`       | Wyświetlanie agendy        |
| `Navbar`            | Nawigacja główna           |
| `Modal`             | Modal dialog               |
| `Avatar`            | Avatar użytkownika         |

---

## Funkcje Premium

### Plany

| Plan     | Cena         | Funkcje                                  |
| -------- | ------------ | ---------------------------------------- |
| **Free** | 0 PLN        | Podstawowe funkcje                       |
| **Plus** | 29 PLN/mies. | Boosting, personalizacja, FAQ, analytics |
| **Pro**  | 79 PLN/mies. | Wszystko z Plus + advanced features      |

### Sponsoring wydarzeń

Właściciele wydarzeń mogą wykupić boost dla większej widoczności:

- Wydarzenie pojawia się wyżej w wynikach
- Specjalne oznaczenie na karcie
- Dostęp do rozszerzonej analityki

---

## Dokumentacja

| Dokument                                     | Opis                          |
| -------------------------------------------- | ----------------------------- |
| [README.md](./README.md)                     | Ten dokument                  |
| [WEB_ARCHITECTURE.md](./WEB_ARCHITECTURE.md) | Architektura frontendu        |
| [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)       | Design system i UI guidelines |

---

## Licencja

Projekt prywatny. Wszystkie prawa zastrzeżone.

---

_Ostatnia aktualizacja: Grudzień 2024_
