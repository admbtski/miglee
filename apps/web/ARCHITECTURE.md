# Web App Architecture Guide

## 🏗️ 3-Layer Architecture

### Layer A: `src/app/**` - Routing + Composition

**Purpose**: Next.js routing layer - composes features into pages

**Allowed**:
- `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`
- Route parameters (`params`, `searchParams`)
- Metadata and redirects
- Composing components from features
- Data prefetching for SSR/SSG

**Forbidden**:
- ❌ Domain hooks (use feature hooks instead)
- ❌ Data mappers (belongs in features)
- ❌ Business logic
- ❌ Validation logic
- ❌ Direct API calls (use feature API hooks)

**Example**:

```typescript
// ✅ Good: app/[locale]/events/page.tsx
import { EventsPage } from '@/features/events';
import { buildGetCategoriesOptions } from '@/features/categories';

export default async function Page() {
  const client = getQueryClient();
  await client.prefetchQuery(buildGetCategoriesOptions());
  
  return (
    <HydrationBoundary state={dehydrate(client)}>
      <EventsPage />
    </HydrationBoundary>
  );
}
```

```typescript
// ❌ Bad: Domain logic in page
export default function Page() {
  const events = useGetEvents(); // ❌ API call in page
  const filtered = events.filter(...); // ❌ Business logic
  return <div>...</div>;
}
```

---

### Layer B: `src/features/**` - Domain + Use Cases + UI

**Purpose**: The actual application - domain-driven feature modules

Each feature is a self-contained domain module with:

```
features/<domain>/
  ├── api/              # React Query hooks (useQuery, useMutation)
  ├── components/       # Feature-specific UI components
  ├── hooks/            # Domain hooks (NOT API - use api/ for that)
  ├── types/            # TypeScript types
  ├── utils/            # Pure utility functions
  ├── constants/        # Feature constants
  └── index.ts          # Public API (REQUIRED)
```

#### Feature Structure Rules

**1. Public API via `index.ts`**

Every feature MUST export its public interface through `index.ts`:

```typescript
// features/events/index.ts
export * from './api';           // React Query hooks
export * from './components';    // Public components
export * from './hooks';         // Public hooks
export * from './types';         // Public types
export * from './utils';         // Public utilities
export * from './constants';     // Public constants
```

**2. Import Rules**

```typescript
// ✅ Good: Import from feature root
import { EventCard, useGetEvents } from '@/features/events';

// ❌ Bad: Import from deep paths
import { EventCard } from '@/features/events/components/event-card';
import { useGetEvents } from '@/features/events/api/use-get-events';
```

**3. API Folder Convention**

`api/` contains **only** React Query hooks:

```typescript
// features/events/api/use-get-events.ts
export function useGetEvents() {
  return useQuery({
    queryKey: ['events'],
    queryFn: () => gqlClient.request(GetEventsDocument),
  });
}
```

If you need pure fetchers (no React), put them in:
- `lib/api/` (global fetchers)
- `features/<domain>/data/` (feature-specific, optional)

**4. Hooks Folder Convention**

`hooks/` for domain hooks that are **NOT** API calls:

```typescript
// features/events/hooks/use-event-permissions.ts
export function useEventPermissions(eventId: string) {
  const { data: event } = useGetEvent(eventId);
  const { data: me } = useMe();
  
  return {
    canEdit: event?.creatorId === me?.id,
    canDelete: event?.creatorId === me?.id,
    // ... business logic
  };
}
```

**5. Submodules for Complex Features**

For large features with multiple flows, use `modules/`:

```
features/events/
  ├── api/
  ├── components/
  ├── hooks/
  ├── types/
  ├── utils/
  ├── constants/
  ├── modules/
  │   ├── creation/      # Event creation flow
  │   │   ├── components/
  │   │   ├── hooks/
  │   │   └── types/
  │   ├── management/    # Event management flow
  │   │   ├── components/
  │   │   └── hooks/
  │   └── details/       # Event details view
  │       └── components/
  └── index.ts
```

Export from submodules through parent `index.ts`:

```typescript
// features/events/index.ts
export * from './api';
export * from './components';
export * from './modules/creation';
export * from './modules/management';
```

---

### Layer C: `src/components` + `src/hooks` + `src/lib` - Shared

**Purpose**: Generic, reusable, domain-agnostic utilities

#### `src/components/` - Generic UI Components

**Only** components with **zero domain knowledge**:

```
components/
  ├── ui/              # Generic UI primitives
  │   ├── button.tsx
  │   ├── input.tsx
  │   ├── modal.tsx
  │   └── avatar.tsx
  ├── layout/          # Layout components
  │   ├── navbar.tsx
  │   ├── footer.tsx
  │   └── sidebar.tsx
  └── forms/           # Generic form components
      ├── text-field.tsx
      └── select.tsx
```

**Rule**: If it knows about "events", "users", "comments" → move to `features/`

```typescript
// ✅ Good: Generic
export function Button({ children, onClick }) {
  return <button onClick={onClick}>{children}</button>;
}

// ❌ Bad: Domain-specific (move to features/events)
export function EventButton({ eventId }) {
  const event = useGetEvent(eventId); // ❌ Domain knowledge
  return <button>{event.title}</button>;
}
```

#### `src/hooks/` - Generic Hooks

**Only** cross-cutting, reusable hooks:

```
hooks/
  ├── use-debounced-value.tsx
  ├── use-outside-click.tsx
  ├── use-throttled.tsx
  ├── use-cooldown.tsx
  └── use-locale-path.ts
```

**Rule**: If it uses domain API hooks → move to `features/<domain>/hooks/`

#### `src/lib/` - Infrastructure

Global infrastructure and configuration:

```
lib/
  ├── api/              # GraphQL client, API config
  ├── config/           # Query client, app config
  ├── i18n/             # Internationalization
  ├── media/            # Media upload utilities
  └── utils/            # Global utilities (cn, date, etc.)
```

---

## 🎯 Key Architectural Decisions

### 1. Feature Boundaries

**One domain = One feature folder**

```
✅ Good:
features/events/
  └── modules/
      ├── creation/
      ├── management/
      └── details/

❌ Bad:
features/events/
features/event-creation/
features/event-management/
```

**Rationale**: Prevents duplication, maintains clear domain boundaries

### 2. Import Discipline

**Always import through feature `index.ts`**:

```typescript
// ✅ Enforced
import { EventCard } from '@/features/events';

// ❌ Forbidden
import { EventCard } from '@/features/events/components/event-card';
```

**Enforcement**: Use ESLint rules or path aliases to enforce this

### 3. API vs Hooks Separation

```
api/          → React Query hooks (useQuery, useMutation)
hooks/        → Domain logic hooks (composition, state, business rules)
data/         → Pure fetchers (optional, no React)
```

### 4. Cross-Feature Dependencies

Features can import from other features, but **only** through public API:

```typescript
// features/comments/components/comment-list.tsx
import { Avatar } from '@/features/users';  // ✅ Public API
import { useMe } from '@/features/auth';     // ✅ Public API
```

**Rule**: Never import from another feature's internals

---

## 📋 Migration Checklist

### Phase 1: Feature Public APIs
- [x] Audit all `features/*/index.ts` files
- [x] Ensure all public components/hooks are exported
- [x] Document what should be public vs private

### Phase 2: Merge Event Features
- [x] Create `features/events/modules/creation/`
- [x] Move `event-creation` → `events/modules/creation/`
- [x] Create `features/events/modules/management/`
- [x] Move `event-management` → `events/modules/management/`
- [x] Update all imports
- [x] Delete old feature folders

### Phase 3: Resolve Conflicts
- [x] Resolve `components/feedback` vs `features/feedback`
- [x] Move domain-specific components to features
- [x] Keep only generic components in `src/components/`

### Phase 4: Hook Cleanup
- [x] Audit `src/hooks/` - ensure all are generic
- [x] Move domain hooks to appropriate features
- [x] Update imports

### Phase 5: Import Enforcement
- [ ] Find all direct imports to feature internals
- [ ] Update to use feature root imports
- [ ] Add ESLint rule to prevent future violations

### Phase 6: Documentation
- [x] Create ARCHITECTURE.md
- [ ] Add inline comments to key files
- [ ] Create migration guide for team

---

## 🚀 Best Practices

### 1. Feature Naming

```
✅ Good:
features/events/
features/auth/
features/comments/

❌ Bad:
features/event-stuff/
features/authentication-module/
```

### 2. Component Organization

```
features/events/components/
  ├── event-card.tsx           # Simple component
  ├── event-list/              # Complex component with subcomponents
  │   ├── event-list.tsx
  │   ├── event-list-item.tsx
  │   └── index.ts
  └── index.ts
```

### 3. Type Exports

Export types that other features need:

```typescript
// features/events/types/event.ts
export interface Event {
  id: string;
  title: string;
  // ...
}

// features/events/index.ts
export type { Event } from './types';
```

### 4. Constant Organization

```typescript
// features/events/constants/index.ts
export const EVENT_STATUS = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  CANCELLED: 'CANCELLED',
} as const;

export const MAX_EVENT_CAPACITY = 1000;
```

---

## 🔍 Code Review Checklist

- [ ] Does `app/**` only compose features?
- [ ] Are all feature imports from `@/features/<name>`?
- [ ] Are `src/components/**` truly generic?
- [ ] Are `src/hooks/**` domain-agnostic?
- [ ] Does each feature have a proper `index.ts`?
- [ ] Are API hooks in `api/` and domain hooks in `hooks/`?
- [ ] No business logic in page files?
- [ ] No direct imports to feature internals?

---

## 📚 Examples

### Example 1: Events Page

```typescript
// app/[locale]/events/page.tsx
import { EventsPage } from '@/features/events';
import { buildGetCategoriesOptions } from '@/features/categories';

export default async function Page() {
  const client = getQueryClient();
  await client.prefetchQuery(buildGetCategoriesOptions());
  
  return (
    <HydrationBoundary state={dehydrate(client)}>
      <EventsPage />
    </HydrationBoundary>
  );
}
```

### Example 2: Event Creation Feature

```typescript
// features/events/modules/creation/components/event-creation-form.tsx
import { useEventForm } from '../hooks/use-event-form';
import { useCreateEvent } from '@/features/events/api';
import { Button } from '@/components/ui';

export function EventCreationForm() {
  const form = useEventForm();
  const createEvent = useCreateEvent();
  
  return <form>...</form>;
}
```

### Example 3: Cross-Feature Usage

```typescript
// features/comments/components/comment-item.tsx
import { Avatar } from '@/features/users';      // ✅ From feature
import { useMe } from '@/features/auth';        // ✅ From feature
import { Button } from '@/components/ui';       // ✅ From shared

export function CommentItem({ comment }) {
  const { data: me } = useMe();
  const canDelete = comment.authorId === me?.id;
  
  return (
    <div>
      <Avatar userId={comment.authorId} />
      <p>{comment.content}</p>
      {canDelete && <Button>Delete</Button>}
    </div>
  );
}
```

---

## 🎓 Learning Resources

### Recommended Reading
- [Feature-Sliced Design](https://feature-sliced.design/)
- [Screaming Architecture](https://blog.cleancoder.com/uncle-bob/2011/09/30/Screaming-Architecture.html)
- [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)

### Internal Resources
- See `features/events/` for reference implementation
- See `features/auth/` for simple feature example
- See `features/chat/` for complex feature with submodules

---

## ❓ FAQ

**Q: Should I create a new feature or add to existing?**
A: If it's a new domain concept, create a new feature. If it's a flow within existing domain, add to existing feature (possibly as a module).

**Q: Can features import from each other?**
A: Yes, but only through the public API (`index.ts`). Never import internals.

**Q: Where do I put shared types?**
A: If used by multiple features: `lib/types/`. If domain-specific: `features/<domain>/types/`.

**Q: What about utility functions?**
A: Generic utils → `lib/utils/`. Domain utils → `features/<domain>/utils/`.

**Q: How do I handle feature flags?**
A: In feature's `constants/` or `config/` folder, exported through `index.ts`.

---

*Last updated: December 2024*

