# Account Pages Refactoring Summary

## Overview

All pages under `/account/*` have been refactored to use the centralized `useAccount()` hook instead of directly calling `useMeQuery()`. This ensures consistent user data access and reduces redundant API calls.

## Changes Made

### 1. Updated Files

All account pages now use `useAccount()` from `@/features/account`:

#### `/account/view/page.tsx`

- **Before:** `const { data, isLoading } = useMeQuery(); const username = data?.me?.name;`
- **After:** `const { user, isLoading } = useAccount(); const username = user?.name;`

#### `/account/profile/page.tsx`

- **Before:** `const { data: authData, isLoading: isLoadingAuth } = useMeQuery({ staleTime: 5 * 60 * 1000 }); const userId = authData?.me?.id;`
- **After:** `const { user: currentUser, isLoading: isLoadingAuth } = useAccount(); const userId = currentUser?.id;`
- **Note:** Renamed `user` to `currentUser` to avoid conflict with `profileData?.user`

#### `/account/notifications/page.tsx`

- **Before:** `const { data: authData, isLoading: isLoadingAuth } = useMeQuery({ staleTime: 5 * 60 * 1000 }); const recipientId = authData?.me?.id;`
- **After:** `const { user, isLoading: isLoadingAuth } = useAccount(); const recipientId = user?.id;`

#### `/account/events/page.tsx`

- **Before:** `const { data: authData, isLoading: isLoadingAuth } = useMeQuery({ staleTime: 5 * 60 * 1000 }); const currentUserId = authData?.me?.id;`
- **After:** `const { user, isLoading: isLoadingAuth } = useAccount(); const currentUserId = user?.id;`

#### `/account/chats/page.tsx`

- **Before:** `const { data: meData, isLoading: isLoadingAuth } = useMeQuery(); const currentUserId = meData?.me?.id;`
- **After:** `const { user, isLoading: isLoadingAuth } = useAccount(); const currentUserId = user?.id;`

### 2. Import Changes

All files had their imports updated:

**Removed:**

```typescript
import { useMeQuery } from '@/features/auth';
```

**Added:**

```typescript
import { useAccount } from '@/features/account';
```

Or combined with existing imports:

```typescript
import { useAccount, AccountPageHeader } from '@/features/account';
```

## Benefits

### 1. **Single Source of Truth**

- User data is fetched once by `AccountProvider` and shared across all account pages
- No redundant API calls to `/me` endpoint

### 2. **Consistent Loading States**

- All pages use the same loading state from the provider
- Better UX with faster page transitions (cached data)

### 3. **Simplified Code**

- No need to configure `staleTime` in each component
- Cleaner, more readable code

### 4. **Better Performance**

- Reduced network requests
- Faster page navigation within `/account/*` section

### 5. **Easier Maintenance**

- If user data structure changes, only `AccountProvider` needs updating
- Centralized error handling and retry logic

## Architecture Alignment

This refactoring aligns with the 3-layer architecture:

- **Layer A (`app/[locale]/account/*`):** Pages only compose UI, no direct API calls
- **Layer B (`features/account`):** Provides `AccountProvider` and `useAccount()` hook
- **Layer C (`features/auth`):** `useMeQuery()` is still available but used internally by providers

## Testing Checklist

- [x] TypeScript compilation passes
- [ ] All account pages render correctly
- [ ] User data displays properly on each page
- [ ] Loading states work as expected
- [ ] No duplicate network requests to `/me` endpoint
- [ ] Navigation between account pages is fast (uses cached data)

## Related Files

- `/apps/web/src/features/account/components/account-provider.tsx` - Provider component
- `/apps/web/src/features/account/components/account-guard.tsx` - Authentication guard
- `/apps/web/src/app/[locale]/account/layout.tsx` - Layout wrapping all account pages
- `/apps/web/ACCOUNT-GUARD-SUMMARY.md` - Initial implementation summary

## Next Steps

1. Test all account pages in development environment
2. Verify no duplicate API calls in browser DevTools
3. Test loading states and error handling
4. Consider extending this pattern to other sections (e.g., `/event/[id]/manage/*`)
