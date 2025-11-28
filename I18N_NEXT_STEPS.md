# 🎯 KOMPLETNY PLAN DOKOŃCZENIA REFAKTORYZACJI i18n + Timezone

## ⚠️ STATUS: 60% UKOŃCZONE - REQUIRES ACTION

---

## 📋 FAZA 1: CLEANUP STARYCH PROVIDERÓW (PRIORITY: HIGH)

### ❌ Problemy ze starymi providerami:

**`lib/i18n/provider.tsx`** i **`lib/i18n/timezone-provider.tsx`** są **PRZESTARZAŁE**:

- ❌ Używają localStorage (nie działa dla SSR)
- ❌ Nie są kompatybilne z locale routing
- ❌ Powodują hydration mismatch
- ❌ Nie są powiązane z user profile

### ✅ KROK 1.1: Oznacz stare providery jako deprecated

**DO ZROBIENIA:**

```typescript
// lib/i18n/provider.tsx
/**
 * @deprecated Use I18nProviderSSR from './provider-ssr' instead
 * This provider uses localStorage and is not compatible with SSR locale routing
 *
 * Migration: Replace <I18nProvider> with <I18nProviderSSR locale={params.locale}>
 */
export function I18nProvider({ children }: { children: React.ReactNode }) {
  console.warn('[DEPRECATED] I18nProvider: Use I18nProviderSSR instead');
  // ... rest of code
}
```

**Pliki do aktualizacji:**

- [ ] `lib/i18n/provider.tsx` - dodaj @deprecated
- [ ] `lib/i18n/timezone-provider.tsx` - dodaj @deprecated

### ✅ KROK 1.2: Znajdź wszystkie użycia starych providerów

```bash
# Znajdź gdzie są używane stare providery
grep -r "from '@/lib/i18n'" apps/web/src --include="*.tsx" --include="*.ts" | grep -v provider-ssr
```

**Prawdopodobne lokacje:**

- Components używające `useI18n()` bez SSR context
- Stare komponenty jeszcze nie przeniesione do `[locale]`

---

## 📋 FAZA 2: BACKEND API (PRIORITY: HIGH)

### ✅ KROK 2.1: Dodaj GraphQL mutations

**Plik:** `apps/api/src/graphql/resolvers/mutation/user-preferences.ts` (NOWY PLIK)

```typescript
import { builder } from '../../builder';
import { prisma } from '../../../lib/prisma';

builder.mutationField('updateUserLocale', (t) =>
  t.field({
    type: 'User',
    args: {
      locale: t.arg.string({ required: true }),
    },
    authScopes: { user: true },
    resolve: async (_root, args, ctx) => {
      const userId = ctx.userId!;

      // Validate locale
      if (!['en', 'pl', 'de'].includes(args.locale)) {
        throw new Error('Invalid locale. Must be: en, pl, or de');
      }

      return await prisma.user.update({
        where: { id: userId },
        data: { locale: args.locale },
      });
    },
  })
);

builder.mutationField('updateUserTimezone', (t) =>
  t.field({
    type: 'User',
    args: {
      timezone: t.arg.string({ required: true }),
    },
    authScopes: { user: true },
    resolve: async (_root, args, ctx) => {
      const userId = ctx.userId!;

      // Basic IANA timezone validation
      try {
        Intl.DateTimeFormat(undefined, { timeZone: args.timezone });
      } catch {
        throw new Error('Invalid IANA timezone');
      }

      return await prisma.user.update({
        where: { id: userId },
        data: { timezone: args.timezone },
      });
    },
  })
);
```

**Checklist:**

- [ ] Utwórz `apps/api/src/graphql/resolvers/mutation/user-preferences.ts`
- [ ] Dodaj import w `apps/api/src/graphql/resolvers/mutation/index.ts`
- [ ] Wygeneruj typy: `cd apps/api && pnpm run codegen`

### ✅ KROK 2.2: Dodaj locale i timezone do User query

**Plik:** `apps/api/src/graphql/resolvers/query/auth.ts`

Upewnij się że `me` query zwraca `locale` i `timezone`:

```typescript
builder.queryField('me', (t) =>
  t.field({
    type: UserObject,
    authScopes: { user: true },
    resolve: async (_root, _args, ctx) => {
      return await prisma.user.findUnique({
        where: { id: ctx.userId },
        include: {
          profile: true,
          // ... inne includy
        },
      });
    },
  })
);
```

Sprawdź czy `UserObject` ma pola `locale` i `timezone`:

**Plik:** `apps/api/src/graphql/types/user.ts`

```typescript
builder.objectRef<User>('User').implement({
  fields: (t) => ({
    id: t.exposeID('id'),
    email: t.exposeString('email'),
    name: t.exposeString('name'),
    locale: t.exposeString('locale'), // ← Upewnij się że to jest
    timezone: t.exposeString('timezone'), // ← Upewnij się że to jest
    // ... inne pola
  }),
});
```

**Checklist:**

- [ ] Sprawdź `apps/api/src/graphql/types/user.ts`
- [ ] Sprawdź `apps/api/src/graphql/resolvers/query/auth.ts`
- [ ] Wygeneruj typy: `cd apps/api && pnpm run codegen`

### ✅ KROK 2.3: Dodaj do session/JWT

**Plik:** `apps/api/src/lib/jwt.ts` lub podobny

Jeśli używasz JWT, dodaj `locale` i `timezone` do payload:

```typescript
export function generateToken(user: User) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      locale: user.locale, // ← Dodaj
      timezone: user.timezone, // ← Dodaj
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}
```

**Checklist:**

- [ ] Znajdź gdzie generowany jest JWT/session
- [ ] Dodaj `locale` i `timezone` do payload
- [ ] Zaktualizuj typy dla session

---

## 📋 FAZA 3: FRONTEND API INTEGRATION (PRIORITY: HIGH)

### ✅ KROK 3.1: Wygeneruj GraphQL hooks

Po dodaniu mutations w backend:

```bash
cd apps/web
pnpm run codegen
```

To wygeneruje:

- `useUpdateUserLocaleMutation()`
- `useUpdateUserTimezoneMutation()`

### ✅ KROK 3.2: Utwórz helper hooks

**Plik:** `apps/web/src/lib/api/user-preferences.ts` (NOWY PLIK)

```typescript
'use client';

import {
  useUpdateUserLocaleMutation,
  useUpdateUserTimezoneMutation,
  useMeQuery,
} from './__generated__/react-query-update';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n/provider-ssr';

export function useUpdateLocale() {
  const router = useRouter();
  const { locale: currentLocale } = useI18n();
  const { mutateAsync, isPending } = useUpdateUserLocaleMutation();

  const updateLocale = async (newLocale: 'en' | 'pl' | 'de') => {
    try {
      await mutateAsync({ locale: newLocale });

      // Navigate to new locale URL
      const currentPath = window.location.pathname.replace(
        `/${currentLocale}`,
        ''
      );
      router.push(`/${newLocale}${currentPath}`);
    } catch (error) {
      console.error('Failed to update locale:', error);
      throw error;
    }
  };

  return { updateLocale, isPending };
}

export function useUpdateTimezone() {
  const { mutateAsync, isPending } = useUpdateUserTimezoneMutation();

  const updateTimezone = async (timezone: string) => {
    try {
      await mutateAsync({ timezone });
    } catch (error) {
      console.error('Failed to update timezone:', error);
      throw error;
    }
  };

  return { updateTimezone, isPending };
}
```

**Checklist:**

- [ ] Utwórz `apps/web/src/lib/api/user-preferences.ts`
- [ ] Przetestuj hooks

### ✅ KROK 3.3: Przekaż user timezone do TimezoneProviderSSR

**Plik:** `apps/web/src/app/[locale]/layout.tsx`

```typescript
import { cookies } from 'next/headers';
import { verify } from 'jsonwebtoken';

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeStr } = await params;
  const locale = localeStr as Locale;

  // Get user timezone from JWT/session
  let userTimezone: string | null = null;

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (token) {
      const decoded = verify(token, process.env.JWT_SECRET!) as any;
      userTimezone = decoded.timezone || null;
    }
  } catch (error) {
    console.error('Failed to decode token:', error);
  }

  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `document.documentElement.lang = '${locale}';`,
        }}
      />
      <I18nProviderSSR locale={locale}>
        <TimezoneProviderSSR timezone={userTimezone}>
          {children}
        </TimezoneProviderSSR>
      </I18nProviderSSR>
    </>
  );
}
```

**Checklist:**

- [ ] Zaktualizuj `apps/web/src/app/[locale]/layout.tsx`
- [ ] Test z zalogowanym userem
- [ ] Test z anonimowym userem

### ✅ KROK 3.4: Utwórz nową stronę Settings

**Plik:** `apps/web/src/app/[locale]/account/settings/page.tsx` (NOWY PLIK)

```typescript
'use client';

import { useI18n } from '@/lib/i18n/provider-ssr';
import { useTimezone } from '@/lib/i18n/timezone-provider-ssr';
import { useUpdateLocale, useUpdateTimezone } from '@/lib/api/user-preferences';
import { localeNames } from '@/lib/i18n/provider';
import { commonTimezones } from '@/lib/i18n/timezone-provider-ssr';
import { useTheme } from '@/features/theme/provider/theme-provider';
import { Globe, Clock, Palette } from 'lucide-react';

export default function SettingsPage() {
  const { locale } = useI18n();
  const { timezone } = useTimezone();
  const { theme, setTheme } = useTheme();
  const { updateLocale, isPending: localeLoading } = useUpdateLocale();
  const { updateTimezone, isPending: timezoneLoading } = useUpdateTimezone();

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Language Section */}
      <section className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-3 mb-4">
          <Globe className="w-5 h-5 text-orange-500" />
          <h2 className="text-lg font-semibold">Language / Język / Sprache</h2>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {(['en', 'pl', 'de'] as const).map((l) => (
            <button
              key={l}
              onClick={() => updateLocale(l)}
              disabled={localeLoading || l === locale}
              className={`p-4 rounded-xl border-2 transition-all ${
                l === locale
                  ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20'
                  : 'border-zinc-200 dark:border-zinc-800 hover:border-orange-300'
              } disabled:opacity-50`}
            >
              <div className="font-medium">{localeNames[l]}</div>
            </button>
          ))}
        </div>
      </section>

      {/* Timezone Section */}
      <section className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-3 mb-4">
          <Clock className="w-5 h-5 text-blue-500" />
          <h2 className="text-lg font-semibold">Time Zone</h2>
        </div>
        <select
          value={timezone}
          onChange={(e) => updateTimezone(e.target.value)}
          disabled={timezoneLoading}
          className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800"
        >
          {commonTimezones.map((tz) => (
            <option key={tz} value={tz}>
              {tz}
            </option>
          ))}
        </select>
      </section>

      {/* Theme Section */}
      <section className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-3 mb-4">
          <Palette className="w-5 h-5 text-purple-500" />
          <h2 className="text-lg font-semibold">Theme</h2>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {(['light', 'dark', 'system'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={`p-4 rounded-xl border-2 transition-all capitalize ${
                t === theme
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/20'
                  : 'border-zinc-200 dark:border-zinc-800 hover:border-purple-300'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
```

**Checklist:**

- [ ] Utwórz `apps/web/src/app/[locale]/account/settings/page.tsx`
- [ ] Test zmiany języka
- [ ] Test zmiany timezone
- [ ] Test z toast notifications

---

## 📋 FAZA 4: AKTUALIZACJA WSZYSTKICH LINKÓW (PRIORITY: MEDIUM)

### ✅ KROK 4.1: Znajdź wszystkie hardcoded links

```bash
# Znajdź wszystkie <Link href="/
grep -rn 'href="/' apps/web/src/app/\[locale\] --include="*.tsx" | grep -v "href=\"http" | wc -l

# Znajdź wszystkie router.push('/
grep -rn "router\.push\('/" apps/web/src/app/\[locale\] --include="*.tsx" | wc -l
```

### ✅ KROK 4.2: Utwórz helper do mass update

**Script:** `apps/web/scripts/fix-locale-links.sh`

```bash
#!/bin/bash

# Ten skrypt znajdzie i pokaże wszystkie linki do naprawienia
# NIE MODYFIKUJE automatycznie - tylko pokazuje co trzeba zmienić

echo "🔍 Szukam hardcoded links..."
echo ""

echo "📌 Links w komponentach:"
grep -rn 'href="/' apps/web/src/app/\[locale\] --include="*.tsx" | \
  grep -v "href=\"http" | \
  grep -v "href=\"#" | \
  grep -v "href=\"mailto" | \
  head -50

echo ""
echo "📌 Router.push calls:"
grep -rn "router\.push\('/" apps/web/src/app/\[locale\] --include="*.tsx" | head -50

echo ""
echo "✅ Total files to update: $(grep -rl 'href="/' apps/web/src/app/\[locale\] --include="*.tsx" | wc -l)"
```

### ✅ KROK 4.3: Priorytetowe pliki do naprawienia

**HIGH PRIORITY** (Navigation components):

1. `apps/web/src/components/layout/navbar.tsx`
2. `apps/web/src/app/[locale]/account/_components/account-sidebar.tsx`
3. `apps/web/src/app/[locale]/intent/[id]/manage/_components/intent-management-sidebar.tsx`
4. `apps/web/src/app/[locale]/admin/_components/admin-sidebar.tsx`

**MEDIUM PRIORITY** (Cards & Lists): 5. `apps/web/src/app/[locale]/events/_components/*.tsx` 6. `apps/web/src/app/[locale]/account/intents/_components/*.tsx`

### ✅ KROK 4.4: Pattern do zamiany

**PRZED:**

```typescript
<Link href="/intent/123">View Intent</Link>
```

**PO:**

```typescript
import { useLocalePath } from '@/hooks/use-locale-path';

function MyComponent() {
  const { localePath } = useLocalePath();

  return <Link href={localePath('/intent/123')}>View Intent</Link>;
}
```

---

## 📋 FAZA 5: NAPRAW OSTATNI BŁĄD BUILD (PRIORITY: HIGH)

### ✅ KROK 5.1: Fix TypeScript error

**Plik:** `apps/web/src/features/intents/components/edit-steps/use-edit-step-navigation.tsx`

Zastosuj type assertion:

```typescript
return {
  currentStep: getCurrentStep(),
  currentStepIndex: getStepIndex(getCurrentStep() || ('basics' as EditStep)),
  // ...
};
```

Lub zmień definicję `getStepIndex`:

```typescript
const getStepIndex = useCallback((step: EditStep | undefined): number => {
  if (!step) return 0;
  return STEP_ORDER.indexOf(step);
}, []);
```

**Checklist:**

- [ ] Napraw błąd TypeScript
- [ ] Zbuduj projekt: `pnpm run build`
- [ ] Upewnij się że build przechodzi

---

## 📋 FAZA 6: TESTING & QA (PRIORITY: MEDIUM)

### ✅ Checklist testów:

**Routing:**

- [ ] `/` przekierowuje do `/{locale}/`
- [ ] `/en/events`, `/pl/events`, `/de/events` działają
- [ ] Zmiana języka zachowuje current path
- [ ] Deep links działają (`/pl/intent/123`)

**User Preferences:**

- [ ] Zalogowany user: locale z DB
- [ ] Zalogowany user: timezone z DB
- [ ] Anonimowy user: locale z browser
- [ ] Anonimowy user: timezone z browser
- [ ] Zmiana locale zapisuje do DB
- [ ] Zmiana timezone zapisuje do DB

**SEO:**

- [ ] Każda strona ma hreflang tags
- [ ] Sitemap zawiera wszystkie locale
- [ ] robots.txt jest poprawny
- [ ] No hydration errors w console

**DateTime:**

- [ ] Daty wyświetlają się w user timezone
- [ ] Zapis do DB w UTC
- [ ] Odczyt z DB konwertowany do user TZ

---

## 📊 PROGRESS TRACKER

```
FAZA 1: Cleanup Providerów      [ ] [ ] [ ]           0%
FAZA 2: Backend API              [ ] [ ] [ ]           0%
FAZA 3: Frontend Integration     [ ] [ ] [ ] [ ]       0%
FAZA 4: Fix Links                [ ] [ ] [ ] [ ]       0%
FAZA 5: Fix Build                [ ]                   0%
FAZA 6: Testing                  [ ] [ ] [ ] [ ]       0%

OVERALL PROGRESS: 60% → TARGET: 100%
```

---

## 🚀 QUICK START - CO ZROBIĆ TERAZ:

### Option A: Dokończ sam (recommended)

1. **START HERE:** Faza 2 - Backend API (2-3h)
2. **THEN:** Faza 3 - Frontend Integration (2-3h)
3. **THEN:** Faza 5 - Fix Build (30min)
4. **THEN:** Faza 4 - Fix Links (4-6h)
5. **FINALLY:** Faza 6 - Testing (2-3h)

**Total time:** ~12-16 hours

### Option B: Asystent kontynuuje

Powiedz: "kontynuuj od Fazy 2" i zrobię kolejne kroki.

---

## 📚 HELPFUL COMMANDS

```bash
# Build check
cd apps/web && pnpm run build

# Find hardcoded links
grep -rn 'href="/' apps/web/src/app/\[locale\] --include="*.tsx" | grep -v "http"

# Generate GraphQL types
cd apps/api && pnpm run codegen
cd apps/web && pnpm run codegen

# Clean build
cd apps/web && rm -rf .next && pnpm run build

# Run dev
pnpm run dev
```

---

**Last Updated:** 2025-11-28 03:00
**Status:** 🔄 WAITING FOR NEXT ACTION
**Priority:** 🔴 HIGH - Finish backend before deploying
