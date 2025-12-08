# Architecture TODOs & Recommendations

> Generated: 2024-12-07
> Status: Initial audit complete

## Current State Summary

The project uses **Next.js App Router** with a hybrid structure:

- `app/[locale]/` - routing with i18n
- `features/` - partial feature-based organization
- `lib/api/` - centralized API hooks (40+ files)
- `components/` - shared UI components
- `hooks/` - global hooks

## Priority Issues

### 🔴 High Priority

#### 1. Consolidate `lib/api/` into `features/`

**Problem:** All 40+ API hook files are in `lib/api/`, making it hard to find domain-specific code.

**Current:**

```
lib/api/
├── intents.tsx
├── intent-members.tsx
├── intent-permissions.tsx
├── join-form.ts
├── comments.tsx
├── reviews.tsx
├── ...
```

**Recommended:**

```
features/
├── intents/
│   └── api/
│       ├── intents.tsx
│       ├── members.tsx
│       ├── permissions.tsx
│       ├── join-form.ts
│       ├── comments.tsx
│       └── reviews.tsx
├── users/
│   └── api/
│       ├── profile.tsx
│       ├── preferences.ts
│       └── blocks.tsx
├── chat/
│   └── api/
│       ├── event-chat.tsx
│       ├── dm.tsx
│       └── subscriptions.tsx
```

**Migration strategy:**

1. Create barrel exports in `lib/api/index.ts` that re-export from features
2. Gradually move files to features
3. Update imports via search-replace
4. Remove old files after verification

#### 2. Move Route-Specific Hooks to Features

**Problem:** Hooks in `app/[locale]/events/_hooks/` should be in `features/events/hooks/`

**Files to move:**

- `app/[locale]/events/_hooks/*.tsx` → `features/events/hooks/`
- `app/[locale]/account/chats/_hooks/*.tsx` → `features/chat/hooks/`
- `app/[locale]/account/intents/_hooks/*.tsx` → `features/intents/hooks/`

#### 3. Duplicate GraphQL Client

**Status: ✅ FIXED**

- Removed duplicate `lib/api/client.tsx`
- Kept `lib/api/client.ts` with merged options

### 🟡 Medium Priority

#### 4. Inconsistent Feature Structure

**Problem:** Some features have full structure, others are minimal.

**Current state:**

```
features/
├── auth/components/        ✅ Good
├── favourites/components/  ⚠️ Missing hooks/api
├── intents/
│   ├── components/         ✅ Good
│   └── hooks/              ✅ Good
├── maps/
│   ├── components/         ✅ Good
│   ├── hooks/              ✅ Good
│   └── utils/              ✅ Good
├── notifications/components/ ⚠️ Missing hooks/api
└── theme/provider/         ⚠️ Unusual structure
```

**Recommended structure per feature:**

```
features/<feature>/
├── api/           # React Query hooks
├── components/    # Feature-specific components
├── hooks/         # Feature-specific hooks
├── utils/         # Feature-specific utilities
└── types/         # Feature-specific types
```

#### 5. Intent-Specific Utils in Global `lib/utils/`

**Files to move:**

- `lib/utils/intents.ts` → `features/intents/utils/`
- `lib/utils/intent-join-state.ts` → `features/intents/utils/`
- `lib/utils/event-status.ts` → `features/intents/utils/`

#### 6. Missing Features Directories

Create these feature directories:

- `features/users/` - user profile, preferences, blocks
- `features/chat/` - DM, event chat, subscriptions
- `features/admin/` - admin-specific functionality
- `features/billing/` - plans, subscriptions, checkout
- `features/events/` - events list, filters, search

### 🟢 Low Priority

#### 7. Hooks Organization

**Current:**

```
hooks/
├── use-cooldown.tsx
├── use-debounced-value.tsx
├── use-intent-permissions.ts  ← Should be in features/intents/hooks/
├── use-locale-path.ts
├── use-outside-click.tsx
├── use-plan-access.ts         ← Should be in features/billing/hooks/
└── use-throttled.tsx
```

**Move domain-specific hooks to features:**

- `use-intent-permissions.ts` → `features/intents/hooks/`
- `use-plan-access.ts` → `features/billing/hooks/`

#### 8. Components Organization

The `components/` directory is well-organized:

- `ui/` - design system ✅
- `layout/` - layout components ✅
- `forms/` - form components ✅
- `feedback/` - feedback/state components ✅
- `chat/` - should move to `features/chat/components/`

#### 9. Types Organization

**Current:**

```
types/
├── event-details.ts  ← Should be in features/intents/types/
├── intent.ts         ← Should be in features/intents/types/
└── types.ts          ← Review for global vs feature-specific
```

## Recommended File Moves

### Phase 1: Create Feature Structure (Safe)

```bash
# Create missing feature directories
mkdir -p features/users/{api,components,hooks,types}
mkdir -p features/chat/{api,components,hooks,types}
mkdir -p features/events/{api,components,hooks,types}
mkdir -p features/billing/{api,components,hooks,types}
mkdir -p features/admin/{api,components,hooks,types}
```

### Phase 2: Move API Hooks (Medium Risk)

| From                             | To                                     |
| -------------------------------- | -------------------------------------- |
| `lib/api/intents.tsx`            | `features/intents/api/intents.tsx`     |
| `lib/api/intent-members.tsx`     | `features/intents/api/members.tsx`     |
| `lib/api/intent-permissions.tsx` | `features/intents/api/permissions.tsx` |
| `lib/api/join-form.ts`           | `features/intents/api/join-form.ts`    |
| `lib/api/comments.tsx`           | `features/intents/api/comments.tsx`    |
| `lib/api/reviews.tsx`            | `features/intents/api/reviews.tsx`     |
| `lib/api/user-profile.tsx`       | `features/users/api/profile.tsx`       |
| `lib/api/user-preferences.ts`    | `features/users/api/preferences.ts`    |
| `lib/api/user-blocks.tsx`        | `features/users/api/blocks.tsx`        |
| `lib/api/event-chat.tsx`         | `features/chat/api/event-chat.tsx`     |
| `lib/api/dm.tsx`                 | `features/chat/api/dm.tsx`             |
| `lib/api/billing.tsx`            | `features/billing/api/billing.tsx`     |

### Phase 3: Move Route Hooks (Medium Risk)

| From                                    | To                        |
| --------------------------------------- | ------------------------- |
| `app/[locale]/events/_hooks/*`          | `features/events/hooks/`  |
| `app/[locale]/account/chats/_hooks/*`   | `features/chat/hooks/`    |
| `app/[locale]/account/intents/_hooks/*` | `features/intents/hooks/` |

### Phase 4: Move Chat Components (Low Risk)

| From                | To                          |
| ------------------- | --------------------------- |
| `components/chat/*` | `features/chat/components/` |

## Import Path Strategy

After moving files, update `tsconfig.json` paths:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/features/*": ["./src/features/*"],
      "@/components/*": ["./src/components/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/lib/*": ["./src/lib/*"]
    }
  }
}
```

## Barrel Exports Strategy

Create index files for clean imports:

```typescript
// features/intents/api/index.ts
export * from './intents';
export * from './members';
export * from './permissions';
export * from './join-form';
export * from './comments';
export * from './reviews';

// Then import as:
import { useIntentsQuery, useIntentMembersQuery } from '@/features/intents/api';
```

## Files to Review for Deletion

These files may be unused (verify before deleting):

1. `lib/api/client.tsx` - ✅ DELETED (was duplicate)
2. Review `lib/utils/index.ts` for unused exports
3. Check for unused components in `components/ui/`

## Notes

- **Do NOT convert between App Router and Pages Router**
- **Prefer incremental refactors over big rewrites**
- **Always update imports after moving files**
- **Test after each phase of changes**

## Completed Changes

- [x] Removed duplicate `lib/api/client.tsx`
- [x] Merged `mode: 'cors'` option into `lib/api/client.ts`
- [x] Created this documentation
- [x] Created feature directories: `features/users/`, `features/chat/`, `features/events/`, `features/billing/`, `features/admin/`
- [x] Moved `app/[locale]/events/_hooks/*` → `features/events/hooks/`
- [x] Moved `app/[locale]/events/_types/*` → `features/events/types/`
- [x] Moved `app/[locale]/events/_constants/*` → `features/events/constants/`
- [x] Moved `hooks/use-intent-permissions.ts` → `features/intents/hooks/`
- [x] Moved `hooks/use-plan-access.ts` → `features/billing/hooks/`
- [x] Moved `components/chat/*` → `features/chat/components/`
- [x] Created re-export stubs in old locations for backward compatibility

## Migration Strategy Used

All moves were done with **backward compatibility**:

1. Copy files to new location
2. Update imports in copied files
3. Replace original files with re-exports pointing to new location
4. Mark old exports as `@deprecated`

This allows gradual migration without breaking existing code.

- [x] Moved `app/[locale]/account/chats/_hooks/*` → `features/chat/hooks/`
- [x] Moved `app/[locale]/account/chats/_types/*` → `features/chat/types/`
- [x] Moved `app/[locale]/account/intents/_hooks/*` → `features/intents/hooks/`
- [x] Moved `lib/utils/intents.ts` → `features/intents/utils/`
- [x] Moved `lib/utils/intent-join-state.ts` → `features/intents/utils/`
- [x] Moved `lib/utils/event-status.ts` → `features/intents/utils/`
- [x] Created barrel exports for all feature directories
- [x] Updated all imports to use new paths (no deprecated re-exports)
- [x] Deleted old directories: `components/chat/`, `app/[locale]/events/_hooks/`, `app/[locale]/events/_types/`, `app/[locale]/events/_constants/`, `app/[locale]/account/chats/_hooks/`, `app/[locale]/account/chats/_types/`, `app/[locale]/account/intents/_hooks/`
- [x] Fixed broken import in `admin/intents/_components/tabs/invite-links-tab.tsx`

## Current State

The project now has a clean feature-based structure:

```
features/
├── auth/components/           # Authentication UI
├── billing/hooks/             # Plan access hooks
├── chat/
│   ├── components/            # Chat UI components
│   ├── hooks/                 # Chat hooks
│   └── types/                 # Chat type definitions
├── events/
│   ├── constants/             # Events page constants
│   ├── hooks/                 # Events search hooks
│   └── types/                 # Events type definitions
├── favourites/components/     # Favourites UI
├── intents/
│   ├── components/            # Intent form components
│   ├── hooks/                 # Intent hooks
│   └── utils/                 # Intent utilities
├── maps/
│   ├── components/            # Map components
│   ├── hooks/                 # Map hooks
│   └── utils/                 # Map utilities
├── notifications/components/  # Notification UI
└── theme/provider/            # Theme provider
```

## Next Steps (Priority Order)

### 1. Move API Hooks to Features (High Impact, Medium Effort)

There are 39 files in `lib/api/`. Recommended grouping:

**Intents domain** → `features/intents/api/`:

- `intents.tsx`
- `intent-members.tsx`
- `intent-permissions.tsx`
- `join-form.ts`
- `comments.tsx`
- `reviews.tsx`
- `invite-links.ts`

**Users domain** → `features/users/api/`:

- `user-profile.tsx`
- `user-preferences.ts`
- `user-blocks.tsx`
- `user-events.tsx`
- `user-reviews.tsx`
- `user-delete-account.ts`
- `user-restore-account.ts`

**Chat domain** → `features/chat/api/`:

- `event-chat.tsx`
- `event-chat-subscriptions.tsx`
- `dm.tsx`
- `dm-subscriptions.tsx`
- `message-actions.tsx`
- `reactions.tsx`
- `reactions-subscriptions.tsx`

**Billing domain** → `features/billing/api/`:

- `billing.tsx`

**Notifications domain** → `features/notifications/api/`:

- `notifications.tsx`
- `preferences-and-mutes.tsx`

**Admin domain** → `features/admin/api/`:

- `admin-intents.tsx`
- `admin-users.tsx`
- `admin-comments.tsx`
- `admin-intent-members.tsx`

**Keep in lib/api/** (shared/core):

- `client.ts` - GraphQL client
- `codegen.ts` - codegen config
- `auth.tsx` - authentication
- `categories.tsx` - shared categories
- `tags.tsx` - shared tags
- `favourites.ts` - cross-domain
- `feedback.ts` - cross-domain
- `map-clusters.tsx` - maps feature
- `reports.tsx` - cross-domain
- `users.tsx` - admin users list

### 2. Global Types Review (Low Priority)

Current `types/` directory contains:

- `event-details.ts` - could move to `features/intents/types/`
- `intent.ts` - could move to `features/intents/types/`
- `types.ts` - shared types (CategoryOption, TagOption) - keep global

### 3. Global Hooks Review (Low Priority)

Current `hooks/` directory (5 files) - all are truly global utilities:

- `use-cooldown.tsx`
- `use-debounced-value.tsx`
- `use-locale-path.ts`
- `use-outside-click.tsx`
- `use-throttled.tsx`

These are fine to keep as global hooks.

### 4. Consider Feature Index Files

Create `features/index.ts` barrel exports for cleaner imports:

```typescript
// features/intents/index.ts
export * from './api';
export * from './hooks';
export * from './utils';
export * from './components';
```

## Migration Strategy for API Hooks

1. **Create feature api directories**
2. **Copy files to new locations**
3. **Update imports in feature files first**
4. **Update imports in app/ routes**
5. **Delete old files from lib/api/**
6. **Run TypeScript check after each batch**

Estimated effort: ~2-3 hours for full migration
