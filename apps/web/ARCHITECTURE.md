# Architecture Overview

## Architectural Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Next.js App Router                       │
│                          (app/ directory)                        │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   [[...slug]]│  │   account/   │  │     api/     │          │
│  │  (main page) │  │  (user area) │  │   (routes)   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ imports
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Feature Modules                             │
│                     (features/ directory)                        │
│                                                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ intents/ │  │  auth/   │  │  admin/  │  │   maps/  │       │
│  │          │  │          │  │          │  │          │       │
│  │ • comps  │  │ • comps  │  │ • comps  │  │ • comps  │       │
│  │ • hooks  │  │ • hooks  │  │ • hooks  │  │ • hooks  │       │
│  │ • types  │  └──────────┘  └──────────┘  │ • utils  │       │
│  │ • utils  │                               └──────────┘       │
│  └──────────┘  ┌──────────┐  ┌──────────┐                     │
│                 │notificat.│  │ account/ │                     │
│                 │          │  │          │                     │
│                 │ • comps  │  │ • comps  │                     │
│                 │ • hooks  │  │ • hooks  │                     │
│                 └──────────┘  └──────────┘                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ uses
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Shared Components                             │
│                   (components/ directory)                        │
│                                                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │   ui/    │  │ layout/  │  │  forms/  │  │ feedback/│       │
│  │  (atoms) │  │          │  │          │  │          │       │
│  │          │  │ • navbar │  │ • combo  │  │ • modal  │       │
│  │ • badges │  │ • footer │  │   boxes  │  │ • errors │       │
│  │ • pills  │  │ • menus  │  └──────────┘  └──────────┘       │
│  │ • bars   │  └──────────┘                                     │
│  └──────────┘                                                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ uses
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Core Infrastructure                            │
│                                                                   │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │   lib/api/       │  │   lib/config/    │  │   hooks/     │ │
│  │                  │  │                  │  │              │ │
│  │ • GraphQL client │  │ • React Query    │  │ • shared     │ │
│  │ • Queries        │  │ • OpenTelemetry  │  │   hooks      │ │
│  │ • Mutations      │  │ • Web Vitals     │  │              │ │
│  │ • Subscriptions  │  │ • Language       │  │              │ │
│  └──────────────────┘  └──────────────────┘  └──────────────┘ │
│                                                                   │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │   types/         │  │   providers/     │                    │
│  │                  │  │                  │                    │
│  │ • Shared types   │  │ • Theme          │                    │
│  └──────────────────┘  └──────────────────┘                    │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

```
User Interaction
      │
      ▼
┌──────────────┐
│ Page/Route   │  (app/)
└──────────────┘
      │
      ▼
┌──────────────┐
│ Feature      │  (features/)
│ Component    │
└──────────────┘
      │
      ├──────────────┐
      │              │
      ▼              ▼
┌──────────┐   ┌──────────┐
│ Shared   │   │ Feature  │
│ UI Comp  │   │ Hook     │
└──────────┘   └──────────┘
                     │
                     ▼
               ┌──────────┐
               │ API Hook │  (lib/api/)
               └──────────┘
                     │
                     ▼
               ┌──────────┐
               │ GraphQL  │
               │ Client   │
               └──────────┘
                     │
                     ▼
               Backend API
```

## Dependency Rules

### ✅ Allowed Dependencies

```
app/          → features/, components/, lib/, hooks/, types/
features/     → components/, lib/, hooks/, types/
components/   → hooks/, types/, lib/utils/
hooks/        → lib/, types/
lib/          → types/
```

### ❌ Forbidden Dependencies

```
lib/          ✗→ features/     (core should not depend on features)
lib/          ✗→ components/   (core should not depend on UI)
components/   ✗→ features/     (shared components should not depend on features)
hooks/        ✗→ features/     (shared hooks should not depend on features)
features/X/   ✗→ features/Y/   (features should not depend on each other)
```

## Feature Module Structure

Each feature follows this internal structure:

```
features/[feature-name]/
├── components/           # Feature-specific UI components
│   ├── [feature]-modal.tsx
│   ├── [feature]-card.tsx
│   └── ...
├── hooks/               # Feature-specific hooks
│   ├── use-[feature].tsx
│   └── ...
├── types/               # Feature-specific types
│   └── [feature].types.ts
└── utils/               # Feature-specific utilities
    └── [feature]-helpers.ts
```

## Component Hierarchy

```
┌─────────────────────────────────────────┐
│           Page Components                │  (app/)
│  • Server Components                     │
│  • Route handlers                        │
│  • Layouts                               │
└─────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│        Feature Components                │  (features/)
│  • Business logic components             │
│  • Feature-specific UI                   │
│  • Complex interactions                  │
└─────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│         Layout Components                │  (components/layout/)
│  • Navbar, Footer                        │
│  • Navigation menus                      │
│  • Page structure                        │
└─────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│          Form Components                 │  (components/forms/)
│  • Inputs, Comboboxes                    │
│  • Form controls                         │
└─────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│          UI Components (Atoms)           │  (components/ui/)
│  • Badges, Pills, Buttons                │
│  • Progress bars                         │
│  • Basic building blocks                 │
└─────────────────────────────────────────┘
```

## State Management

```
┌──────────────────────────────────────────┐
│          React Query                      │
│  • Server state management                │
│  • Caching, prefetching                   │
│  • Configured in lib/config/              │
└──────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────┐
│          GraphQL Client                   │
│  • API communication                      │
│  • Type-safe queries                      │
│  • Configured in lib/api/                 │
└──────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────┐
│          React Context                    │
│  • Theme (providers/theme/)               │
│  • Feature-specific contexts              │
└──────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────┐
│          Component State                  │
│  • useState, useReducer                   │
│  • Local component state                  │
└──────────────────────────────────────────┘
```

## API Layer

```
┌─────────────────────────────────────────┐
│         GraphQL Operations               │
│  (packages/contracts/graphql/)           │
│  • Queries, Mutations, Subscriptions     │
│  • Fragments                             │
└─────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│         Code Generation                  │
│  (lib/api/codegen.ts)                    │
│  • TypeScript types                      │
│  • Typed Document Nodes                  │
└─────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│         API Hooks                        │
│  (lib/api/*.tsx)                         │
│  • useQuery, useMutation                 │
│  • Type-safe hooks                       │
└─────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│         GraphQL Client                   │
│  (lib/api/client.ts, wsClient.ts)        │
│  • HTTP client                           │
│  • WebSocket client                      │
└─────────────────────────────────────────┘
```

## Monitoring & Observability

```
┌─────────────────────────────────────────┐
│         OpenTelemetry                    │
│  (lib/config/otel-init.tsx)              │
│  • Tracing                               │
│  • Metrics                               │
└─────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│         Web Vitals                       │
│  (lib/config/web-vitals.tsx)             │
│  • Performance metrics                   │
│  • User experience tracking              │
└─────────────────────────────────────────┘
```

## Key Principles

### 1. **Separation of Concerns**

- Each layer has a clear responsibility
- Features are self-contained
- Shared code is truly reusable

### 2. **Dependency Inversion**

- High-level modules don't depend on low-level modules
- Both depend on abstractions (types, interfaces)

### 3. **Single Responsibility**

- Each module/component has one reason to change
- Clear boundaries between features

### 4. **DRY (Don't Repeat Yourself)**

- Shared components in `components/`
- Shared hooks in `hooks/`
- Shared utilities in `lib/`

### 5. **KISS (Keep It Simple, Stupid)**

- Clear folder structure
- Intuitive naming
- Easy to navigate

## Testing Strategy (Future)

```
Unit Tests
├── Components (components/)
├── Hooks (hooks/)
└── Utils (lib/utils/)

Integration Tests
├── Features (features/)
└── API Hooks (lib/api/)

E2E Tests
└── User Flows (app/)
```

## Performance Considerations

1. **Code Splitting**: Features can be lazy-loaded
2. **Tree Shaking**: Unused code is eliminated
3. **Bundle Size**: Feature-based organization helps identify large modules
4. **Caching**: React Query handles server state caching

## Scalability

This architecture supports:

- **Team Growth**: Multiple teams can work on different features
- **Feature Growth**: Easy to add new features without affecting existing ones
- **Complexity Growth**: Clear boundaries prevent spaghetti code
- **Maintenance**: Easy to locate and update code

---

This architecture provides a solid foundation for a scalable, maintainable Next.js application following modern best practices.
