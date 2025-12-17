# Architecture Migration Guide

This guide helps you migrate existing code to follow the new 3-layer architecture.

## Current Status

✅ **Completed:**
- Feature public APIs (`index.ts`) are documented
- Event features merged into `features/events/modules/`
- `components/feedback` moved to `components/ui`
- Generic hooks verified in `src/hooks`

⚠️ **In Progress:**
- **229 direct imports** into feature internals need to be fixed

## Import Violations by Feature

```
 113 events       - Largest offender
  38 chat
  17 admin
   9 users
   9 search
   9 reports
   8 maps
   5 tags
   4 public-profile
   3 comments
   3 categories
   3 account-settings
   2 theme
   2 auth
   2 agenda
   1 profile-settings
   1 faq
```

## How to Fix Import Violations

### Step 1: Identify the Problem

Run the check script:

```bash
cd apps/web
./scripts/check-feature-imports.sh
```

### Step 2: Fix Imports in Your File

**Before (❌ Wrong):**

```typescript
// app/[locale]/events/page.tsx
import { EventCard } from '@/features/events/components/event-card';
import { useGetEvents } from '@/features/events/api/use-get-events';
import { EventsGridSimple } from '@/features/events/components/events-list/events-grid-simple';
```

**After (✅ Correct):**

```typescript
// app/[locale]/events/page.tsx
import { EventCard, useGetEvents, EventsGridSimple } from '@/features/events';
```

### Step 3: Ensure Feature Exports What You Need

If you get an error after changing the import, the feature might not be exporting that item. Check the feature's `index.ts`:

```typescript
// features/events/index.ts
export * from './api';           // ✅ Exports all API hooks
export * from './components';    // ✅ Exports all components
```

If the component/hook isn't exported, check the subfolder's `index.ts`:

```typescript
// features/events/components/index.ts
export { EventCard } from './event-card';
export { EventsGridSimple } from './events-list/events-grid-simple';
```

Add the export if it's missing.

## Priority Fix Order

Fix in this order for maximum impact:

### 1. Events Feature (113 violations)

Most violations are in `app/[locale]/event/` and `app/[locale]/events/`.

**Common patterns to fix:**

```typescript
// ❌ Before
import { useEventsListingInfiniteQuery } from '@/features/events/api/events';
import { EventsGridSimple } from '@/features/events/components/events-list/events-grid-simple';
import { TopDrawer } from '@/features/events/components/top-drawer';
import type { TopDrawerFocusSection } from '@/features/events/components/top-drawer';

// ✅ After
import { 
  useEventsListingInfiniteQuery,
  EventsGridSimple,
  TopDrawer,
  type TopDrawerFocusSection 
} from '@/features/events';
```

### 2. Chat Feature (38 violations)

Most violations in `app/[locale]/event/[id]/manage/chat/`.

### 3. Admin Feature (17 violations)

Most violations in `app/[locale]/admin/`.

### 4. Other Features (< 10 violations each)

Fix these incrementally as you work on related code.

## Automated Fix Script

For simple cases, you can use this sed command:

```bash
# Example: Fix events feature imports in app/
find src/app -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' \
  -e "s|@/features/events/api/[^'\"]*|@/features/events|g" \
  -e "s|@/features/events/components/[^'\"]*|@/features/events|g" \
  -e "s|@/features/events/hooks/[^'\"]*|@/features/events|g" \
  {} \;
```

⚠️ **Warning:** This is a blunt tool. Review changes carefully and ensure:
1. The feature's `index.ts` exports what you need
2. No duplicate imports are created
3. Type imports are preserved

## ESLint Rule (Future)

To prevent future violations, add this ESLint rule:

```javascript
// .eslintrc.js
module.exports = {
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['@/features/*/api/*', '@/features/*/components/*', '@/features/*/hooks/*'],
            message: 'Import from feature root instead: @/features/<feature>',
          },
        ],
      },
    ],
  },
};
```

## Testing After Migration

After fixing imports:

1. **Build check:**
   ```bash
   pnpm build
   ```

2. **Type check:**
   ```bash
   pnpm type-check
   ```

3. **Run dev server:**
   ```bash
   pnpm dev
   ```

4. **Test key pages:**
   - Events listing: `/events`
   - Event detail: `/event/[id]`
   - Event management: `/event/[id]/manage`
   - Account pages: `/account/*`
   - Admin pages: `/admin/*`

## Common Issues

### Issue: "Module not found"

**Cause:** Feature doesn't export the item you're importing.

**Fix:** Add export to feature's `index.ts` or subfolder's `index.ts`.

### Issue: "Type is not exported"

**Cause:** Type isn't re-exported from feature root.

**Fix:** Add type export:

```typescript
// features/events/index.ts
export type { Event, EventStatus } from './types';
```

### Issue: Circular dependency warning

**Cause:** Feature A imports from Feature B, which imports from Feature A.

**Fix:** 
1. Move shared types to `lib/types/`
2. Create a third feature for shared logic
3. Refactor to remove circular dependency

## Incremental Migration Strategy

You don't have to fix everything at once. Here's a pragmatic approach:

### Week 1: Setup & High-Impact
- ✅ Add check script (done)
- ✅ Document architecture (done)
- Fix events feature (113 violations) - highest impact

### Week 2: Medium Features
- Fix chat feature (38 violations)
- Fix admin feature (17 violations)

### Week 3: Small Features
- Fix remaining features (< 10 violations each)

### Week 4: Enforcement
- Add ESLint rule
- Update team documentation
- Code review checklist

## Need Help?

1. Check `ARCHITECTURE.md` for architectural guidelines
2. Run `./scripts/check-feature-imports.sh` to see current status
3. Look at `features/events/` as a reference implementation
4. Ask in team chat if stuck

## Progress Tracking

Track your progress:

```bash
# Before starting
./scripts/check-feature-imports.sh > before.txt

# After fixing
./scripts/check-feature-imports.sh > after.txt

# Compare
diff before.txt after.txt
```

---

*Last updated: December 2024*

