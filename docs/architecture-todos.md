# Architecture TODOs

## ✅ Completed

### Phase 1-6: Full Migration Complete

- [x] All API hooks moved from `lib/api/` to `features/*/api/`
- [x] All types moved to `features/*/types/`
- [x] All hooks moved to `features/*/hooks/`
- [x] All components moved to `features/*/components/`
- [x] All utils moved to `features/*/utils/`
- [x] Barrel exports created for all features
- [x] Cleanup: removed unused imports, fixed export conflicts

### Migration Statistics

- **Files in features/**: 219 files
- **Files remaining in lib/api/**: 4 (core only)
- **TypeScript errors fixed during cleanup**: 7

---

## 📋 Remaining Tasks (Pre-existing Issues)

### TypeScript Errors (Not from refactoring)

These errors existed before the refactoring:

```
1. src/app/[locale]/admin/users/_components/tabs/profile-tab.tsx
   - Property 'disciplines' does not exist on type

2. src/app/[locale]/i/[code]/_components/invite-link-page.tsx
   - Type 'number | null | undefined' is not assignable to type 'number'

3. src/features/notifications/components/*.tsx
   - Multiple 'possibly undefined' checks needed

4. src/lib/i18n/notification-translations.ts
   - Multiple 'possibly undefined' checks needed
```

### Optional Future Improvements

1. Move remaining admin sub-components:
   - `app/[locale]/admin/users/_components/*`
   - `app/[locale]/admin/events/_components/*`
   - `app/[locale]/admin/reports/_components/*`
   - `app/[locale]/admin/categories/_components/*`
   - `app/[locale]/admin/tags/_components/*`

2. Consider consolidating similar patterns across features

---

## 📁 Final Structure

```
features/                         (219 files)
├── admin/
│   ├── api/                     ✅ admin-*.tsx
│   └── components/              ✅ admin-header, admin-sidebar, kpi-card
├── auth/
│   └── components/
├── billing/
│   ├── api/                     ✅ billing.tsx
│   └── hooks/                   ✅ use-plan-access.ts
├── categories/
│   └── api/                     ✅ categories.tsx
├── chat/
│   ├── api/                     ✅ dm, event-chat, reactions, message-actions
│   ├── components/              ✅ All chat components
│   ├── hooks/                   ✅ use-channel-chat, use-dm-chat
│   └── types/                   ✅ ChatKind, Conversation, Message
├── events/
│   ├── components/              ✅ event-card, events-list, map-popup, filters
│   ├── constants/               ✅ DEFAULT_DISTANCE_KM, VALID_SORT_KEYS
│   ├── hooks/                   ✅ use-committed-filters, use-filter-state
│   └── types/                   ✅ LocationMode, MapCenter, CommittedFilters
├── favourites/
│   ├── api/                     ✅ favourites.ts
│   └── components/
├── feedback/
│   └── api/                     ✅ feedback.ts
├── events/
│   ├── api/                     ✅ events, event-members, comments, reviews
│   ├── components/              ✅ All event detail + my events components
│   ├── hooks/                   ✅ use-event-permissions, use-events-modals
│   ├── types/                   ✅ EventListItem, EventDetailsData
│   └── utils/                   ✅ events.ts, event-join-state.ts
├── maps/
│   ├── api/                     ✅ map-clusters.tsx
│   ├── components/
│   ├── hooks/
│   └── utils/
├── notifications/
│   ├── api/                     ✅ notifications.tsx, preferences-and-mutes.tsx
│   └── components/
├── reports/
│   └── api/                     ✅ reports.tsx
├── tags/
│   └── api/                     ✅ tags.tsx
├── theme/
│   └── provider/
└── users/
    ├── api/                     ✅ users.tsx, user-*.tsx
    └── components/              ✅ profile-header, public-profile-client

lib/                             (4 core files)
├── api/
│   ├── __generated__/           (codegen output)
│   ├── client.ts                (core GraphQL client)
│   ├── ws-client.ts             (core WebSocket client)
│   ├── codegen.ts               (code generation config)
│   └── auth.tsx                 (global auth)
├── config/
├── i18n/
├── media/
└── utils/

hooks/                           (global hooks only)
├── use-cooldown.tsx
├── use-debounced-value.tsx
├── use-locale-path.ts
├── use-outside-click.tsx
└── use-throttled.tsx

types/                           (global types only)
└── types.ts
```

---

## 🔧 Import Conventions

```typescript
// Feature API
import { useEventsInfiniteQuery } from '@/features/events/api/events';
import { useMeQuery } from '@/lib/api/auth';

// Feature Components
import { EventCard } from '@/features/events/components/event-card';
import { ProfileHeader } from '@/features/users/components/profile-header';
import { ChatThread } from '@/features/chat/components/chat-thread';

// Feature Hooks
import { useCommittedFilters } from '@/features/events/hooks';
import { usePlanAccess } from '@/features/billing/hooks';

// Feature Types
import type { EventListItem } from '@/features/events/types';
import type { SortKey } from '@/features/events/types';

// Global
import { gqlClient } from '@/lib/api/client';
import { useDebounced } from '@/hooks/use-debounced-value';
```
