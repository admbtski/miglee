# Project Structure

This document describes the organization of the web application codebase.

## Overview

The project follows a **feature-based architecture** combined with **atomic design principles** for better maintainability and scalability.

## Directory Structure

```
src/
├── app/                          # Next.js App Router
│   ├── [[...slug]]/             # Dynamic routes (main intents page)
│   │   ├── _components/         # Page-specific components
│   │   ├── _hooks/              # Page-specific hooks
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── account/                 # Account management pages
│   │   ├── _components/         # Shared account components
│   │   ├── intents/            # User's intents management
│   │   ├── plans-and-bills/    # Billing management
│   │   ├── profile/            # User profile
│   │   └── settings/           # User settings
│   ├── api/                     # API routes
│   ├── scripts/                 # Client-side scripts
│   ├── layout.tsx              # Root layout
│   └── global-error.tsx        # Global error boundary
│
├── features/                     # Feature-based modules
│   ├── intents/                 # Intent management feature
│   │   ├── components/          # Intent-specific components
│   │   │   ├── create-edit-intent-modal.tsx
│   │   │   ├── event-details-modal.tsx
│   │   │   ├── basics-step.tsx
│   │   │   ├── capacity-step.tsx
│   │   │   ├── time-step.tsx
│   │   │   ├── place-step.tsx
│   │   │   ├── review-step.tsx
│   │   │   └── ...
│   │   ├── hooks/               # Intent-specific hooks
│   │   │   ├── use-categories.tsx
│   │   │   └── use-tags.tsx
│   │   ├── types/               # Intent-specific types
│   │   └── utils/               # Intent-specific utilities
│   │
│   ├── auth/                    # Authentication feature
│   │   ├── components/
│   │   │   ├── auth-modal.tsx
│   │   │   ├── sign-in-panel.tsx
│   │   │   └── sign-up-panel.tsx
│   │   └── hooks/
│   │
│   ├── admin/                   # Admin feature
│   │   ├── components/
│   │   │   ├── admin-panel-launcher.tsx
│   │   │   ├── admin-user-modal.tsx
│   │   │   └── admin-users-table.tsx
│   │   └── hooks/
│   │
│   ├── notifications/           # Notifications feature
│   │   ├── components/
│   │   │   └── notifications-bell.tsx
│   │   └── hooks/
│   │
│   ├── maps/                    # Maps & location feature
│   │   ├── components/
│   │   │   └── map-preview.tsx
│   │   ├── hooks/
│   │   │   └── use-places-autocomplete.tsx
│   │   └── utils/
│   │       ├── geocode.ts
│   │       ├── googleMaps.ts
│   │       └── places.ts
│   │
│   └── account/                 # Account management feature
│       ├── components/
│       └── hooks/
│
├── components/                   # Shared/reusable components
│   ├── ui/                      # Base UI components (atoms)
│   │   ├── capacity-progress-bar.tsx
│   │   ├── cooldown-ring.tsx
│   │   ├── quota-bar.tsx
│   │   ├── role-badge.tsx
│   │   ├── simple-progress-bar.tsx
│   │   ├── status-badge.tsx
│   │   ├── verified-pill.tsx
│   │   ├── click-burst.tsx
│   │   ├── click-particle.tsx
│   │   ├── category-tag-pill.tsx
│   │   ├── segment-control.tsx
│   │   ├── theme-switch.tsx
│   │   └── theme-switch-connect.tsx
│   │
│   ├── layout/                  # Layout components
│   │   ├── navbar.tsx
│   │   ├── nav-drawer.tsx
│   │   ├── user-menu.tsx
│   │   ├── user-menu-controlled.tsx
│   │   └── footer.tsx
│   │
│   ├── forms/                   # Form-related components
│   │   ├── category-combobox.tsx
│   │   ├── location-combobox.tsx
│   │   └── tag-multicombo.tsx
│   │
│   └── feedback/                # Feedback components (modals, errors)
│       ├── modal.tsx
│       ├── notice-modal.tsx
│       └── error-boundary.tsx
│
├── hooks/                       # Shared hooks
│   ├── use-cooldown.tsx
│   ├── use-debounced-value.tsx
│   └── use-outside-click.tsx
│
├── lib/                         # Core utilities and configurations
│   ├── api/                     # API clients & GraphQL
│   │   ├── __generated__/       # Generated GraphQL types
│   │   ├── client.ts            # GraphQL client
│   │   ├── wsClient.ts          # WebSocket client
│   │   ├── codegen.ts           # GraphQL codegen config
│   │   ├── auth.tsx             # Auth queries/mutations
│   │   ├── categories.tsx       # Categories queries
│   │   ├── intents.tsx          # Intents queries/mutations
│   │   ├── intent-members.tsx   # Intent members queries
│   │   ├── notifications.tsx    # Notifications queries
│   │   ├── tags.tsx             # Tags queries
│   │   └── users.tsx            # Users queries
│   │
│   ├── config/                  # App configuration
│   │   ├── query-client.ts      # React Query client
│   │   ├── query-client-provider.tsx
│   │   ├── otel-init.tsx        # OpenTelemetry initialization
│   │   ├── otel.client.ts       # OpenTelemetry client config
│   │   ├── web-vitals.tsx       # Web Vitals monitoring
│   │   └── language.ts          # Language configuration
│   │
│   └── utils/                   # Utility functions
│
├── types/                       # Shared TypeScript types
│   └── types.ts                 # Common type definitions
│
├── providers/                   # React context providers
│   └── theme/
│       └── theme-provider.tsx
│
└── styles/                      # Global styles
    └── globals.css
```

## Architecture Principles

### 1. Feature-Based Organization

Features are self-contained modules that encapsulate:

- **Components**: UI components specific to the feature
- **Hooks**: Custom hooks for feature logic
- **Types**: TypeScript types for the feature
- **Utils**: Utility functions for the feature

**Benefits:**

- Better code organization
- Easier to locate related code
- Facilitates team collaboration
- Simplifies feature removal/refactoring

### 2. Atomic Design for Shared Components

Shared components are organized by their role:

- **UI (Atoms)**: Basic building blocks (buttons, badges, progress bars)
- **Layout**: Page structure components (navbar, footer)
- **Forms**: Form-related components (inputs, comboboxes)
- **Feedback**: User feedback components (modals, errors)

### 3. Separation of Concerns

- **App Router** (`app/`): Next.js routing and page components
- **Features** (`features/`): Business logic modules
- **Components** (`components/`): Reusable UI components
- **Lib** (`lib/`): Core utilities, API clients, configuration
- **Hooks** (`hooks/`): Shared React hooks
- **Types** (`types/`): Shared TypeScript definitions

## Import Conventions

### Absolute Imports

Always use absolute imports with the `@/` alias:

```typescript
// ✅ Good
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/api/auth';
import { IntentModal } from '@/features/intents/components/intent-modal';

// ❌ Bad
import { Button } from '../../../components/ui/button';
import { useAuth } from '../../lib/api/auth';
```

### Import Order

1. External dependencies
2. Internal absolute imports (grouped by type)
3. Relative imports (only for co-located files)

```typescript
// External
import { useState } from 'react';
import { motion } from 'framer-motion';

// Internal - Features
import { IntentModal } from '@/features/intents/components/intent-modal';

// Internal - Components
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/feedback/modal';

// Internal - Lib
import { useAuth } from '@/lib/api/auth';

// Internal - Types
import { User } from '@/types/types';

// Relative (co-located)
import { helper } from './helper';
```

## File Naming Conventions

- **Components**: `kebab-case.tsx` (e.g., `intent-modal.tsx`)
- **Hooks**: `use-*.tsx` (e.g., `use-categories.tsx`)
- **Utils**: `camelCase.ts` (e.g., `formatDate.ts`)
- **Types**: `types.ts` or `*.types.ts`
- **Constants**: `UPPER_SNAKE_CASE` or `camelCase.ts`

## Adding New Features

When adding a new feature:

1. Create a new directory under `features/`
2. Add subdirectories: `components/`, `hooks/`, `types/`, `utils/`
3. Keep feature-specific code within the feature directory
4. Extract reusable components to `components/`
5. Extract shared hooks to `hooks/`

Example:

```
features/
└── messaging/
    ├── components/
    │   ├── chat-window.tsx
    │   ├── message-list.tsx
    │   └── message-input.tsx
    ├── hooks/
    │   └── use-messages.tsx
    ├── types/
    │   └── message.types.ts
    └── utils/
        └── message-formatter.ts
```

## Migration Notes

This structure was reorganized from a flat component structure to improve:

- **Discoverability**: Easier to find related code
- **Maintainability**: Clear separation of concerns
- **Scalability**: Better suited for team growth
- **Testing**: Easier to test isolated features

All functionality remains unchanged - only the organization has been improved.

## GraphQL Code Generation

GraphQL types are generated using `@graphql-codegen/cli`:

```bash
pnpm gql:gen
```

Generated files are located in `lib/api/__generated__/`.

## Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm typecheck` - Run TypeScript type checking
- `pnpm lint` - Run ESLint
- `pnpm gql:gen` - Generate GraphQL types
