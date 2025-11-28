# i18n + Timezone Refactoring - Migration Guide

## ✅ COMPLETED (Phase 1-5)

### 1. Backend (Database & Schema) ✅

- ✅ Updated Prisma schema: `User.locale` (default: 'en') and `User.timezone` (default: 'UTC')
- ✅ Created and applied migration: `20251128024846_update_user_locale_timezone_defaults`
- ✅ Migrated existing users: NULL → 'en', copied `tz` → `timezone`

### 2. Middleware & Routing ✅

- ✅ Created `/apps/web/src/middleware.ts` for locale detection and routing
- ✅ Detects locale from: Cookie → Accept-Language → Default (en)
- ✅ Redirects `/` → `/{locale}/`
- ✅ Sets `NEXT_LOCALE` cookie for persistence

### 3. Folder Structure ✅

- ✅ Created `app/[locale]/` directory structure
- ✅ Moved all routes into `[locale]`: `account`, `admin`, `feedback`, `i`, `intent`, `u`
- ✅ Renamed `[[...slug]]` → `events` for clarity
- ✅ Created `app/[locale]/layout.tsx` with SSR locale provider
- ✅ Updated `app/layout.tsx` to remove i18n providers (now in [locale]/layout.tsx)

### 4. SSR Providers ✅

- ✅ Created `lib/i18n/provider-ssr.tsx` (SSR-aware I18nProvider)
- ✅ Created `lib/i18n/timezone-provider-ssr.tsx` (SSR-aware TimezoneProvider)
- ✅ Locale comes from URL params (SSR), not localStorage
- ✅ Timezone priority: user.timezone → browser detection → UTC

### 5. SEO & Metadata ✅

- ✅ Added hreflang tags in `[locale]/layout.tsx` metadata
- ✅ Created `/app/sitemap.ts` with all language versions
- ✅ Created `/app/robots.ts` for search engine crawling
- ✅ Localized titles and descriptions (en, pl, de)

### 6. Utilities & Helpers ✅

- ✅ Created `lib/i18n/timezone-utils.ts` for UTC ↔ User TZ conversion
- ✅ Installed `date-fns-tz` for timezone handling
- ✅ Created `hooks/use-locale-path.ts` for locale-aware navigation
- ✅ Created `components/layout/language-switcher.tsx` for UI

## 🔄 IN PROGRESS (Phase 6)

### 7. Update Components to Use Locale Paths

Many components still use hardcoded paths without locale. These need to be updated:

#### High Priority (Navigation & Core):

- [ ] Update all `<Link href="...">` to use `localePath()`
- [ ] Update `router.push()` calls to include locale
- [ ] Update API calls that return URLs

#### Files to Update:

```
apps/web/src/
  ├── components/layout/
  │   ├── navbar.tsx (if exists)
  │   └── footer.tsx (if exists)
  ├── app/[locale]/
  │   ├── account/_components/*.tsx
  │   ├── admin/_components/*.tsx
  │   ├── intent/[id]/_components/*.tsx
  │   └── events/_components/*.tsx
```

## 📋 REMAINING WORK

### Phase 7: Backend API Integration

- [ ] Create GraphQL mutation: `updateUserLocale(locale: String!)`
- [ ] Create GraphQL mutation: `updateUserTimezone(timezone: String!)`
- [ ] Update settings page to call these mutations
- [ ] Update session/auth to include `user.locale` and `user.timezone`
- [ ] Pass `userTimezone` to `TimezoneProviderSSR` from session

### Phase 8: Update DateTime Components

- [ ] Update all date/time displays to use `useTimezone()` hook
- [ ] Replace direct `new Date()` formatting with timezone-aware formatting
- [ ] Update form inputs that accept dates (use `localToUTC()` before saving)
- [ ] Update countdown timers to use user timezone

### Phase 9: Update Settings Page

- [ ] Remove localStorage code from settings
- [ ] Use GraphQL mutations to save preferences
- [ ] Add visual feedback for successful saves
- [ ] Show current timezone with offset

### Phase 10: Testing & QA

- [ ] Test all routes in 3 languages (en, pl, de)
- [ ] Test language switching preserves current path
- [ ] Test timezone changes reflect immediately
- [ ] Test SSR/CSR hydration (no flicker)
- [ ] Test anonymous vs logged-in user behavior
- [ ] Test browser back/forward with locale
- [ ] Test direct URL access (e.g., `/pl/intent/123`)
- [ ] Test SEO: hreflang tags, sitemap, robots.txt
- [ ] Test Google Search Console indexing

## 🚀 How to Use New System

### For Developers

#### 1. Creating Locale-Aware Links:

```tsx
import Link from 'next/link';
import { useLocalePath } from '@/hooks/use-locale-path';

function MyComponent() {
  const { localePath } = useLocalePath();

  return <Link href={localePath('/intent/123')}>View Intent</Link>;
}
```

#### 2. Programmatic Navigation:

```tsx
import { useRouter } from 'next/navigation';
import { useLocalePath } from '@/hooks/use-locale-path';

function MyComponent() {
  const router = useRouter();
  const { localePath } = useLocalePath();

  const handleClick = () => {
    router.push(localePath('/account/settings'));
  };
}
```

#### 3. Formatting Dates in User Timezone:

```tsx
import { useTimezone } from '@/lib/i18n/timezone-provider-ssr';

function EventDate({ startAt }: { startAt: string }) {
  const { formatDateTime, timezone } = useTimezone();

  return (
    <div>
      <p>{formatDateTime(startAt)}</p>
      <small>Your timezone: {timezone}</small>
    </div>
  );
}
```

#### 4. Saving Dates to Database:

```tsx
import { localToUTC } from '@/lib/i18n/timezone-utils';
import { useTimezone } from '@/lib/i18n/timezone-provider-ssr';

function CreateEventForm() {
  const { timezone } = useTimezone();

  const handleSubmit = (localDate: Date) => {
    // Convert to UTC before sending to API
    const utcDate = localToUTC(localDate, timezone);

    // Send to API
    createIntent({ startAt: utcDate.toISOString() });
  };
}
```

#### 5. Using Translations:

```tsx
import { useTranslations } from '@/lib/i18n/provider-ssr';

function MyComponent() {
  const t = useTranslations();

  return <h1>{t.settings.title}</h1>;
}
```

## ⚠️ Breaking Changes

### 1. All URLs Now Include Locale

- **Old**: `/intent/123`
- **New**: `/en/intent/123`, `/pl/intent/123`, `/de/intent/123`

### 2. Database Schema Changes

- `User.locale`: Changed from nullable to NOT NULL (default: 'en')
- `User.tz`: Renamed to `User.timezone` (default: 'UTC')

### 3. Provider Changes

- Old `I18nProvider` and `TimezoneProvider` are now CLIENT-SIDE ONLY
- Use `I18nProviderSSR` and `TimezoneProviderSSR` for SSR
- These are automatically provided in `[locale]/layout.tsx`

### 4. No More localStorage for i18n/timezone (for logged-in users)

- Locale and timezone are stored in user profile
- Changes sync across devices
- Anonymous users still use browser detection

## 📊 Current Status

```
✅ Backend Schema              [████████████████████] 100%
✅ Middleware & Routing        [████████████████████] 100%
✅ Folder Structure            [████████████████████] 100%
✅ SSR Providers               [████████████████████] 100%
✅ SEO & Metadata              [████████████████████] 100%
✅ Utilities                   [████████████████████] 100%
🔄 Component Updates           [████░░░░░░░░░░░░░░░░] 20%
⏳ Backend API Integration     [░░░░░░░░░░░░░░░░░░░░] 0%
⏳ DateTime Components         [░░░░░░░░░░░░░░░░░░░░] 0%
⏳ Settings Page               [░░░░░░░░░░░░░░░░░░░░] 0%
⏳ Testing & QA                [░░░░░░░░░░░░░░░░░░░░] 0%
```

**Overall Progress: 60%**

## 🐛 Known Issues

1. **Components still use old routing**: Most `<Link>` components don't include locale
2. **Settings page doesn't save to DB**: Still uses localStorage
3. **User timezone not passed to provider**: `TimezoneProviderSSR` receives `null`
4. **Some date displays might be wrong**: Not all components use timezone utils

## 📝 Next Steps (Immediate)

1. **Search and replace `<Link href="/` with locale-aware links**

   ```bash
   # Find all hardcoded links
   grep -r "href=\"/" apps/web/src/app/[locale]/ | grep -v "href=\"http"
   ```

2. **Update navigation components**
   - Account sidebar
   - Intent management sidebar
   - Admin navigation

3. **Create backend mutations**
   - `updateUserLocale`
   - `updateUserTimezone`

4. **Test basic navigation**
   - Can user switch languages?
   - Are all pages accessible in all locales?
   - Does middleware work correctly?

## 🎯 Success Criteria

- [ ] All routes accessible in 3 languages
- [ ] Google can index all language versions
- [ ] No hydration errors
- [ ] Timezone displays correctly for all users
- [ ] Settings persist across devices
- [ ] No performance degradation
- [ ] All tests passing

## 📚 Resources

- [Next.js i18n Routing](https://nextjs.org/docs/app/building-your-application/routing/internationalization)
- [Hreflang Best Practices](https://developers.google.com/search/docs/specialty/international/localized-versions)
- [IANA Timezone Database](https://www.iana.org/time-zones)
- [date-fns-tz Documentation](https://date-fns.org/v2.29.3/docs/Time-Zones)

---

**Last Updated**: 2025-11-28
**Status**: 🔄 IN PROGRESS
**Next Milestone**: Component Updates Complete
