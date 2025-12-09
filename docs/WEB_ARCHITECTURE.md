# Miglee Web Architecture

Dokumentacja architektury aplikacji webowej Miglee.

## Spis treści

- [Przegląd](#przegląd)
- [Stack technologiczny](#stack-technologiczny)
- [Struktura katalogów](#struktura-katalogów)
- [App Router (Next.js 14+)](#app-router-nextjs-14)
- [Feature-Based Architecture](#feature-based-architecture)
- [Shared Components](#shared-components)
- [Hooks](#hooks)
- [Lib](#lib)
- [Konwencje nazewnictwa](#konwencje-nazewnictwa)
- [Import Aliases](#import-aliases)
- [Data Flow](#data-flow)

---

## Przegląd

Aplikacja Miglee Web jest zbudowana w oparciu o **Next.js App Router** z **feature-based architecture**. Każda domena biznesowa (events, users, chat, etc.) ma swój własny moduł w `features/`, a routing jest obsługiwany przez App Router z wsparciem dla **internationalization (i18n)**.

### Kluczowe zasady

1. **Feature-first** - kod organizowany wg domen biznesowych
2. **Colocation** - powiązane pliki trzymane blisko siebie
3. **Separation of concerns** - routing oddzielony od logiki biznesowej
4. **Type safety** - TypeScript wszędzie
5. **Server Components by default** - Client Components tylko gdy potrzebne

---

## Stack technologiczny

| Technologia        | Użycie                  |
| ------------------ | ----------------------- |
| **Next.js 14+**    | Framework (App Router)  |
| **React 18+**      | UI Library              |
| **TypeScript**     | Type safety             |
| **Tailwind CSS**   | Styling                 |
| **GraphQL**        | API (z codegen)         |
| **TanStack Query** | Data fetching & caching |
| **Framer Motion**  | Animacje                |
| **Zod**            | Schema validation       |
| **date-fns**       | Date utilities          |

---

## Struktura katalogów

```
apps/web/src/
├── app/                    # Next.js App Router
│   ├── [locale]/           # Internationalized routes
│   │   ├── account/        # User account pages
│   │   ├── admin/          # Admin panel
│   │   ├── event/          # Event pages
│   │   ├── events/         # Events listing
│   │   ├── feedback/       # Feedback forms
│   │   ├── i/              # Invite links
│   │   ├── restore-account/# Account recovery
│   │   ├── u/              # Public user profiles
│   │   ├── layout.tsx      # Locale layout
│   │   └── page.tsx        # Homepage
│   ├── api/                # API routes
│   ├── layout.tsx          # Root layout
│   └── global-error.tsx    # Error boundary
│
├── components/             # Shared UI components
│   ├── ui/                 # Design system primitives
│   ├── layout/             # Layout components
│   ├── forms/              # Form components
│   ├── feedback/           # Feedback components (modals, states)
│   └── cookie-consent/     # Cookie management
│
├── features/               # Feature modules (domain-driven)
│   ├── auth/               # Authentication
│   ├── billing/            # Payments & subscriptions
│   ├── categories/         # Event categories
│   ├── chat/               # Messaging system
│   ├── events/             # Events (główna domena)
│   ├── favourites/         # Saved events
│   ├── feedback/           # Event feedback
│   ├── maps/               # Google Maps integration
│   ├── notifications/      # Push notifications
│   ├── reports/            # Content reporting
│   ├── tags/               # Event tags
│   ├── theme/              # Theme switching
│   └── users/              # User profiles
│
├── hooks/                  # Global custom hooks
├── lib/                    # Shared utilities & config
│   ├── api/                # GraphQL client & generated types
│   ├── config/             # App configuration
│   ├── constants/          # Global constants
│   ├── i18n/               # Internationalization
│   ├── media/              # Media upload utilities
│   └── utils/              # Helper functions
│
├── styles/                 # Global styles
│   └── globals.css         # Tailwind + custom CSS
│
└── middleware.ts           # Next.js middleware (i18n, auth)
```

---

## App Router (Next.js 14+)

### Route Structure

```
app/[locale]/
├── layout.tsx              # Locale wrapper + providers
├── page.tsx                # Homepage
│
├── account/                # /[locale]/account/*
│   ├── layout.tsx          # Account layout (sidebar)
│   ├── _components/        # Private components
│   ├── profile/
│   ├── settings/
│   ├── events/
│   ├── chats/
│   ├── notifications/
│   └── ...
│
├── event/
│   ├── [id]/               # /[locale]/event/:id
│   │   ├── page.tsx        # Event detail
│   │   ├── layout.tsx      # Event layout
│   │   └── manage/         # /[locale]/event/:id/manage/*
│   │       ├── _components/
│   │       ├── edit/
│   │       ├── members/
│   │       ├── analytics/
│   │       └── ...
│   └── new/                # /[locale]/event/new
│
├── events/                 # /[locale]/events
│   └── page.tsx            # Events listing
│
├── u/
│   └── [name]/             # /[locale]/u/:username
│       └── page.tsx        # Public profile
│
└── admin/                  # /[locale]/admin/*
    ├── layout.tsx          # Admin layout
    ├── users/
    ├── events/
    └── ...
```

### Konwencje plików

| Plik            | Cel                            |
| --------------- | ------------------------------ |
| `page.tsx`      | Route component (publiczny)    |
| `layout.tsx`    | Shared layout dla segmentu     |
| `loading.tsx`   | Loading UI (Suspense fallback) |
| `error.tsx`     | Error boundary                 |
| `not-found.tsx` | 404 page                       |
| `_components/`  | Private components dla route   |

### Private Folders (`_components/`)

Używamy konwencji `_components/` dla komponentów prywatnych danego route:

```
account/
├── _components/
│   ├── account-sidebar.tsx     # Tylko dla /account/*
│   ├── account-navbar.tsx
│   └── index.ts                # Barrel export
├── layout.tsx
└── page.tsx
```

---

## Feature-Based Architecture

Każda **feature** (domena biznesowa) ma spójną strukturę:

```
features/<feature>/
├── api/                    # GraphQL queries & mutations
│   ├── <feature>.tsx       # Główne API hooks
│   └── index.ts            # Barrel export
│
├── components/             # Feature-specific components
│   ├── <component>.tsx
│   └── index.ts
│
├── hooks/                  # Feature-specific hooks
│   ├── use-<hook>.tsx
│   └── index.ts
│
├── types/                  # TypeScript types
│   ├── <type>.ts
│   └── index.ts
│
├── utils/                  # Feature utilities
│   ├── <util>.ts
│   └── index.ts
│
├── constants/              # Feature constants
│   └── index.ts
│
└── index.ts                # Public API (barrel export)
```

### Przykład: `features/events/`

```
features/events/
├── api/
│   ├── events.tsx          # useEventsQuery, useEventQuery, useCreateEvent
│   ├── event-members.tsx   # useMembersQuery, useJoinEvent
│   ├── comments.tsx        # useCommentsQuery, useAddComment
│   ├── reviews.tsx         # useReviewsQuery
│   └── index.ts
│
├── components/
│   ├── event-card/
│   │   ├── event-card.tsx
│   │   ├── event-card-skeleton.tsx
│   │   └── index.ts
│   ├── event-detail/
│   ├── event-form/
│   ├── events-list/
│   └── index.ts
│
├── hooks/
│   ├── use-event-form.tsx
│   ├── use-event-permissions.ts
│   ├── use-filter-state.tsx
│   └── index.ts
│
├── types/
│   ├── event.ts
│   ├── event-form.ts
│   └── index.ts
│
├── utils/
│   ├── date-format.ts
│   ├── event-status.ts
│   └── index.ts
│
└── index.ts                # Export publiczne API
```

### Barrel Exports

Każdy folder ma `index.ts` eksportujący publiczne API:

```typescript
// features/events/index.ts
export * from './api';
export * from './components';
export * from './hooks';
export * from './types';
export * from './utils';
```

---

## Shared Components

### `components/ui/` - Design System

Atomowe komponenty UI, reużywalne w całej aplikacji:

```
components/ui/
├── avatar.tsx
├── badge.tsx
├── button.tsx
├── checkbox.tsx
├── input.tsx
├── label.tsx
├── select.tsx
├── textarea.tsx
├── modal.tsx              # W feedback/
├── segment-control.tsx
├── share-modal.tsx
└── ...
```

### `components/layout/` - Layout Components

```
components/layout/
├── navbar.tsx
├── footer.tsx
├── sidebar-layout.tsx
├── nav-drawer.tsx
├── user-menu.tsx
└── ...
```

### `components/forms/` - Form Components

```
components/forms/
├── text-field.tsx
├── category-combobox.tsx
├── location-combobox.tsx
├── tag-multicombo.tsx
├── timezone-dropdown.tsx
└── ...
```

### `components/feedback/` - Feedback Components

```
components/feedback/
├── modal.tsx
├── notice-modal.tsx
├── empty-state.tsx
├── error-state.tsx
├── loading-skeleton.tsx
└── error-boundary.tsx
```

---

## Hooks

### Global Hooks (`hooks/`)

```
hooks/
├── use-cooldown.tsx        # Cooldown timer
├── use-debounced-value.tsx # Debounce
├── use-locale-path.ts      # i18n path helper
├── use-outside-click.tsx   # Click outside detection
├── use-throttled.tsx       # Throttle
└── index.ts
```

### Feature Hooks

Feature-specific hooks żyją w `features/<feature>/hooks/`:

```typescript
// features/events/hooks/use-event-form.tsx
export function useEventForm(initialData?: EventFormData) {
  // ...
}
```

---

## Lib

### `lib/api/` - GraphQL

```
lib/api/
├── __generated__/          # Auto-generated types (codegen)
│   ├── graphql.ts
│   └── react-query-update.ts
├── client.ts               # GraphQL client setup
├── ws-client.ts            # WebSocket client (subscriptions)
└── codegen.ts              # Codegen config
```

### `lib/config/` - Configuration

```
lib/config/
├── query-client.ts         # TanStack Query client
├── query-client-provider.tsx
├── language.ts             # Language config
└── web-vitals.tsx          # Performance monitoring
```

### `lib/i18n/` - Internationalization

```
lib/i18n/
├── provider-ssr.tsx        # I18n provider
├── timezone-provider.tsx   # Timezone context
├── translations.ts         # Translation helpers
├── notification-translations.ts
└── locales/
    ├── en.ts
    ├── pl.ts
    └── de.ts
```

### `lib/utils/` - Utilities

```
lib/utils/
├── cn.ts                   # className merger (clsx + tailwind-merge)
├── date.ts                 # Date utilities
├── slug.ts                 # URL slug helpers
├── toast-manager.ts        # Toast notifications
└── ...
```

---

## Konwencje nazewnictwa

### Pliki

| Typ       | Konwencja        | Przykład             |
| --------- | ---------------- | -------------------- |
| Component | `kebab-case.tsx` | `event-card.tsx`     |
| Hook      | `use-*.tsx`      | `use-event-form.tsx` |
| Type      | `kebab-case.ts`  | `event-form.ts`      |
| Utility   | `kebab-case.ts`  | `date-format.ts`     |
| API       | `kebab-case.tsx` | `events.tsx`         |
| Page      | `page.tsx`       | `page.tsx`           |
| Layout    | `layout.tsx`     | `layout.tsx`         |

### Komponenty

```typescript
// PascalCase dla komponentów
export function EventCard() {}

// Exporty nazwane (nie default)
export { EventCard };
```

### Hooks

```typescript
// camelCase z prefixem "use"
export function useEventForm() {}
```

### Types

```typescript
// PascalCase dla typów
export type EventFormData = {};
export interface EventProps {}
```

---

## Import Aliases

Skonfigurowane w `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Użycie

```typescript
// ✅ Poprawnie
import { EventCard } from '@/features/events';
import { Button } from '@/components/ui';
import { useLocalePath } from '@/hooks';
import { cn } from '@/lib/utils';

// ❌ Niepoprawnie (relative imports dla external modules)
import { EventCard } from '../../../features/events';
```

---

## Data Flow

### GraphQL + TanStack Query

```
┌─────────────────┐
│   Component     │
└────────┬────────┘
         │ useQuery / useMutation
         ▼
┌─────────────────┐
│ TanStack Query  │  ◄── Cache, Deduplication, Refetch
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ GraphQL Client  │  ◄── Urql / graphql-request
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   API Server    │
└─────────────────┘
```

### Przykład użycia

```typescript
// features/events/api/events.tsx
import { graphql } from '@/lib/api/__generated__';
import { useQuery, useMutation } from '@tanstack/react-query';

const EventsQuery = graphql(`
  query Events($filters: EventFilters) {
    events(filters: $filters) {
      items {
        id
        title
        ...
      }
    }
  }
`);

export function useEventsQuery(filters: EventFilters) {
  return useQuery({
    queryKey: ['events', filters],
    queryFn: () => client.request(EventsQuery, { filters }),
  });
}
```

### Real-time (WebSocket)

```typescript
// features/chat/api/dm-subscriptions.tsx
import { useSubscription } from '@/lib/api/ws-client';

export function useDmMessages(threadId: string) {
  return useSubscription({
    query: DmMessagesSubscription,
    variables: { threadId },
  });
}
```

---

## Best Practices

### 1. Server vs Client Components

```typescript
// Server Component (default) - no 'use client'
export default async function EventPage({ params }: Props) {
  const event = await getEvent(params.id);
  return <EventDetail event={event} />;
}

// Client Component - explicit 'use client'
'use client';
export function EventActions({ eventId }: Props) {
  const [liked, setLiked] = useState(false);
  // ...
}
```

### 2. Data Fetching Patterns

```typescript
// Server Component - bezpośredni fetch
export default async function Page() {
  const data = await fetchData();
  return <Component data={data} />;
}

// Client Component - TanStack Query
'use client';
export function Component() {
  const { data, isLoading } = useEventsQuery();
  // ...
}
```

### 3. Error Handling

```typescript
// error.tsx dla route-level errors
'use client';
export default function Error({ error, reset }: Props) {
  return <ErrorState onRetry={reset} />;
}

// Try-catch dla mutations
const { mutate } = useMutation({
  onError: (error) => {
    toast.error(error.message);
  },
});
```

---

## Diagram architektury

```
┌──────────────────────────────────────────────────────────────┐
│                        NEXT.JS APP                            │
├──────────────────────────────────────────────────────────────┤
│  app/[locale]/                                                │
│  ├── Routes (pages, layouts)                                  │
│  └── Uses components from features/ and components/           │
├──────────────────────────────────────────────────────────────┤
│  features/                                                    │
│  ├── events/    (api, components, hooks, types, utils)       │
│  ├── users/     (api, components, hooks, types)              │
│  ├── chat/      (api, components, hooks, types)              │
│  └── ...                                                      │
├──────────────────────────────────────────────────────────────┤
│  components/                                                  │
│  ├── ui/        (Button, Input, Modal, etc.)                 │
│  ├── layout/    (Navbar, Footer, Sidebar)                    │
│  ├── forms/     (TextField, Combobox)                        │
│  └── feedback/  (EmptyState, ErrorState, Loading)            │
├──────────────────────────────────────────────────────────────┤
│  lib/                                                         │
│  ├── api/       (GraphQL client, generated types)            │
│  ├── i18n/      (Translations, timezone)                     │
│  └── utils/     (Helpers, constants)                         │
├──────────────────────────────────────────────────────────────┤
│  hooks/                                                       │
│  └── Global hooks (useLocalePath, useDebounce, etc.)         │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                      GRAPHQL API                              │
│                    (apps/api/)                                │
└──────────────────────────────────────────────────────────────┘
```

---

_Ostatnia aktualizacja: Grudzień 2024_
