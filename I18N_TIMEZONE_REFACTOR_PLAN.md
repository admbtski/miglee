# Plan Refaktoryzacji: i18n + Timezone (SEO-Ready, Enterprise Grade)

## Status: 🔴 DO ZAIMPLEMENTOWANIA

Obecna implementacja **NIE SPEŁNIA** wymagań enterprise dla SEO i SSR. Ten dokument opisuje pełną refaktoryzację.

## Problemy z obecną implementacją

❌ Język nie jest w URL - nie SEO-friendly
❌ Brak SSR dla locale - client-side tylko
❌ Brak hreflang tags
❌ Timezone tylko w localStorage - nie powiązany z user profile
❌ Detekcja przeglądarki nadpisuje ustawienia użytkownika
❌ Brak middleware do obsługi locale routing
❌ Brak sitemap z wersjami językowymi

## Nowa Architektura

### 1. Struktura URL i Routing

```
✅ DOCELOWA STRUKTURA:
/en/events
/pl/wydarzenia
/de/veranstaltungen
/en/intent/[id]
/pl/intent/[id]

❌ OBECNA (ZŁA):
/events (język w localStorage)
```

### 2. Struktura Folderów Next.js

```
app/
  [locale]/
    layout.tsx              # SSR locale provider, <html lang={locale}>
    page.tsx                # Homepage
    events/
      page.tsx
    intent/
      [id]/
        page.tsx
        manage/
          page.tsx
    account/
      settings/
        page.tsx
  middleware.ts             # Locale detection i redirects
  sitemap.xml/
    route.ts                # Dynamic sitemap z wszystkimi locale
```

### 3. Flow Użytkownika

#### A. Pierwszy visit (anonymous)

1. User wchodzi na `/`
2. Middleware wykrywa `Accept-Language`
3. Redirect → `/pl/` (lub `/en/`, `/de/`)
4. SSR renderuje stronę w odpowiednim języku
5. Client hydratacja w tym samym języku

#### B. Zmiana języka

1. User klika selector języka
2. `router.push(/de/current-path)`
3. SSR renderuje nową wersję językową
4. **NIE** client-side switch

#### C. Zalogowany user

1. Server odczytuje `user.locale` z profilu
2. Jeśli user wchodzi na `/` → redirect do `/[user.locale]/`
3. Timezone zawsze z `user.timezone` (IANA format)
4. **NIE** z localStorage ani browser

### 4. Dane Użytkownika (Backend Schema)

```prisma
model User {
  id       String  @id
  email    String

  // i18n
  locale   String  @default("en") // 'en' | 'pl' | 'de'

  // Timezone
  timezone String  @default("UTC") // IANA format

  // Wykryte podczas rejestracji, można zmienić w settings
  detectedTimezone String?
  detectedLocale   String?
}
```

### 5. Middleware (app/middleware.ts)

```typescript
import { NextRequest, NextResponse } from 'next/server';

const locales = ['en', 'pl', 'de'];
const defaultLocale = 'en';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Check if pathname already has locale
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) return NextResponse.next();

  // Get locale from:
  // 1. Cookie (if user changed language before)
  // 2. Accept-Language header
  // 3. Default

  const locale = getLocale(request);

  // Redirect to /{locale}/...
  request.nextUrl.pathname = `/${locale}${pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)'],
};
```

### 6. Layout z Locale (app/[locale]/layout.tsx)

```typescript
import { I18nProvider } from '@/lib/i18n/provider-ssr';
import { TimezoneProviderSSR } from '@/lib/i18n/timezone-provider-ssr';
import { getUserTimezone } from '@/lib/api/user';

export function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'pl' }, { locale: 'de' }];
}

export async function generateMetadata({ params }: Props) {
  const t = await getTranslations(params.locale);

  return {
    title: t.meta.title,
    description: t.meta.description,
    alternates: {
      canonical: `/${params.locale}`,
      languages: {
        'en': '/en',
        'pl': '/pl',
        'de': '/de',
        'x-default': '/en',
      },
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  // Get user timezone from session/db (for logged in users)
  const userTimezone = await getUserTimezone(); // or null for anonymous

  return (
    <html lang={params.locale}>
      <body>
        <I18nProvider locale={params.locale}>
          <TimezoneProviderSSR timezone={userTimezone}>
            {children}
          </TimezoneProviderSSR>
        </I18nProvider>
      </body>
    </html>
  );
}
```

### 7. Provider SSR vs CSR

#### I18nProvider (SSR-aware)

```typescript
'use client';

export function I18nProvider({
  locale,
  children
}: {
  locale: string;
  children: ReactNode;
}) {
  // locale comes from SSR params - no localStorage!
  // No useEffect to change language
  // No browser detection

  const t = translations[locale];

  return (
    <I18nContext.Provider value={{ locale, t }}>
      {children}
    </I18nContext.Provider>
  );
}
```

#### TimezoneProviderSSR

```typescript
'use client';

export function TimezoneProviderSSR({
  timezone, // from user.timezone or null
  children,
}: {
  timezone: string | null;
  children: ReactNode;
}) {
  // Priority:
  // 1. User.timezone (if logged in)
  // 2. Browser detection (anonymous users only, only once)
  // 3. UTC fallback

  const [tz, setTz] = useState(
    timezone ||
    Intl.DateTimeFormat().resolvedOptions().timeZone ||
    'UTC'
  );

  // Save to DB when user changes (not localStorage!)
  const updateTimezone = async (newTz: string) => {
    setTz(newTz);
    await updateUserTimezone(newTz); // API call
  };

  return (
    <TimezoneContext.Provider value={{ timezone: tz, updateTimezone }}>
      {children}
    </TimezoneContext.Provider>
  );
}
```

### 8. Language Switcher Component

```typescript
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useI18n } from '@/lib/i18n';

export function LanguageSwitcher() {
  const pathname = usePathname();
  const { locale } = useI18n();

  // Remove current locale from pathname
  const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/';

  return (
    <div>
      <Link href={`/en${pathWithoutLocale}`}>English</Link>
      <Link href={`/pl${pathWithoutLocale}`}>Polski</Link>
      <Link href={`/de${pathWithoutLocale}`}>Deutsch</Link>
    </div>
  );
}
```

### 9. Date/Time Utilities (UTC ↔ User Timezone)

```typescript
// lib/i18n/timezone-utils.ts

/**
 * Convert user local time to UTC for saving to DB
 */
export function localToUTC(localDate: Date, userTimezone: string): Date {
  // Implementation using date-fns-tz or similar
}

/**
 * Convert UTC from DB to user's timezone
 */
export function utcToLocal(utcDate: Date | string, userTimezone: string): Date {
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  // Implementation
}

/**
 * Format date in user's timezone and locale
 */
export function formatInTimezone(
  date: Date | string,
  timezone: string,
  locale: string,
  options?: Intl.DateTimeFormatOptions
): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone: timezone,
    ...options,
  }).format(typeof date === 'string' ? new Date(date) : date);
}
```

### 10. Sitemap (app/sitemap.xml/route.ts)

```typescript
export async function GET() {
  const locales = ['en', 'pl', 'de'];
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;

  const staticPages = ['', '/events', '/about'];
  const dynamicIntents = await getIntentIds(); // from DB

  const urls = [];

  // Static pages - all locales
  for (const locale of locales) {
    for (const page of staticPages) {
      urls.push({
        url: `${baseUrl}/${locale}${page}`,
        lastModified: new Date(),
        alternates: {
          languages: Object.fromEntries(
            locales.map((l) => [l, `${baseUrl}/${l}${page}`])
          ),
        },
      });
    }
  }

  // Dynamic pages - all locales
  for (const locale of locales) {
    for (const intentId of dynamicIntents) {
      urls.push({
        url: `${baseUrl}/${locale}/intent/${intentId}`,
        lastModified: new Date(),
      });
    }
  }

  return new Response(generateSitemapXML(urls), {
    headers: { 'Content-Type': 'application/xml' },
  });
}
```

### 11. Translations Structure (no change needed)

Struktura tłumaczeń pozostaje bez zmian - tylko sposób ich dostarczania:

```typescript
// lib/i18n/locales/en.ts - OK
// lib/i18n/locales/pl.ts - OK
// lib/i18n/locales/de.ts - OK
```

### 12. Settings Page Updates

```typescript
'use client';

import { useI18n, useTimezone } from '@/lib/i18n';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();
  const { locale, t } = useI18n();
  const { timezone, updateTimezone } = useTimezone();

  const handleLanguageChange = (newLocale: string) => {
    // Navigate to new locale URL
    router.push(`/${newLocale}/account/settings`);
  };

  const handleTimezoneChange = async (newTimezone: string) => {
    // This saves to user.timezone in DB
    await updateTimezone(newTimezone);
  };

  // ... rest of component
}
```

## Migration Steps (Priority Order)

### Phase 1: Infrastructure (Critical - SEO Impact)

1. ✅ Create middleware for locale routing
2. ✅ Restructure folders to `[locale]` pattern
3. ✅ Update all imports and paths
4. ✅ Add hreflang to metadata
5. ✅ Create sitemap with all locales

### Phase 2: Backend Integration

6. ✅ Add `locale` and `timezone` to User model
7. ✅ Create API endpoints to update user preferences
8. ✅ Migration script for existing users

### Phase 3: Provider Refactor

9. ✅ Create SSR-aware I18nProvider
10. ✅ Create SSR-aware TimezoneProvider
11. ✅ Remove localStorage dependencies
12. ✅ Update all components to use new providers

### Phase 4: Components & Utils

13. ✅ Update LanguageSwitcher
14. ✅ Create timezone conversion utilities
15. ✅ Update DateTime component
16. ✅ Update all date displays across app

### Phase 5: Testing & QA

17. ✅ Test SSR/CSR hydration
18. ✅ Test SEO (Google Search Console)
19. ✅ Test all language versions
20. ✅ Test timezone conversions
21. ✅ Performance testing

## Checklist Before Launch

- [ ] All URLs have `/{locale}/` prefix
- [ ] SSR generates correct language content
- [ ] No hydration mismatches
- [ ] Hreflang tags present on all pages
- [ ] Sitemap includes all locale versions
- [ ] User.timezone is source of truth (not localStorage)
- [ ] All dates stored as UTC in DB
- [ ] Date conversions work correctly
- [ ] Language switcher navigates to correct URLs
- [ ] Middleware handles all edge cases
- [ ] Performance metrics acceptable

## Dependencies to Install

```bash
pnpm add date-fns-tz
```

## Estimated Timeline

- Phase 1: 2-3 days
- Phase 2: 1-2 days
- Phase 3: 2-3 days
- Phase 4: 1-2 days
- Phase 5: 2-3 days

**Total: ~8-13 days** of development + testing

## Notes

⚠️ This is a **breaking change** - all existing URLs will redirect
⚠️ Requires database migration
⚠️ Requires coordinated backend + frontend deployment
⚠️ Should be deployed during low-traffic period

## Questions to Answer Before Starting

1. Do we have backend API ready for user.locale and user.timezone?
2. What's the migration strategy for existing users?
3. Can we handle the temporary SEO impact during migration?
4. Do we need to maintain old URLs with redirects?
5. What's the rollback plan if issues arise?
