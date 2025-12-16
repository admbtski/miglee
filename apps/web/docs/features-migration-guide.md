# Features Migration Guide

## 🚀 Jak Używać Nowych Features

### Import Paths - PRZED vs PO

#### Reviews
```typescript
// ❌ STARE (nadal działa, ale deprecated)
import { useGetReviews } from '@/features/events/api/reviews';
import { EventReviews } from '@/features/events/components/event-reviews';

// ✅ NOWE (zalecane)
import { useGetReviews } from '@/features/reviews/api/reviews';
import { EventReviews } from '@/features/reviews/components/event-reviews';

// ✅ LUB przez public API
import { useGetReviews, EventReviews } from '@/features/reviews';
```

#### FAQ
```typescript
// ❌ STARE
import { EventFaq } from '@/features/events/components/event-faq';

// ✅ NOWE
import { EventFaq } from '@/features/faq/components/event-faq';
// LUB
import { EventFaq } from '@/features/faq';
```

#### Checkin
```typescript
// ❌ STARE
import { useCheckin } from '@/features/events/api/checkin';
import { EventQrCode } from '@/features/events/components/event-qr-code';

// ✅ NOWE
import { useCheckin } from '@/features/checkin/api/checkin';
import { EventQrCode } from '@/features/checkin/components/event-qr-code';
// LUB
import { useCheckin, EventQrCode } from '@/features/checkin';
```

#### Search & Filters
```typescript
// ❌ STARE
import { DesktopSearchBar } from '@/features/events/components/desktop-search-bar';
import { useFilterState } from '@/features/events/hooks/use-filter-state';

// ✅ NOWE
import { DesktopSearchBar } from '@/features/search/components/desktop-search-bar';
import { useFilterState } from '@/features/search/hooks/use-filter-state';
// LUB
import { DesktopSearchBar, useFilterState } from '@/features/search';
```

#### Account
```typescript
// ❌ STARE
import { ProfileTab } from '@/app/[locale]/account/profile/_components/profile-tab';
import { useUserPreferences } from '@/features/users/api/user-preferences';

// ✅ NOWE
import { ProfileTab } from '@/features/account/components/profile-tab';
import { useUserPreferences } from '@/features/account/api/user-preferences';
// LUB
import { ProfileTab, useUserPreferences } from '@/features/account';
```

#### Event Creation
```typescript
// ❌ STARE
import { SimpleCreatorForm } from '@/app/[locale]/event/new/_components/simple-creator-form';
import { useEventForm } from '@/features/events/hooks/use-event-form';

// ✅ NOWE
import { SimpleCreatorForm } from '@/features/event-creation/components/simple-creator-form';
import { useEventForm } from '@/features/event-creation/hooks/use-event-form';
// LUB
import { SimpleCreatorForm, useEventForm } from '@/features/event-creation';
```

#### Event Management
```typescript
// ❌ STARE
import { ManagementPageLayout } from '@/app/[locale]/event/[id]/manage/_components/management-page-layout';

// ✅ NOWE
import { ManagementPageLayout } from '@/features/event-management/components/management-page-layout';
// LUB
import { ManagementPageLayout } from '@/features/event-management';
```

#### Subscription
```typescript
// ❌ STARE
import { SubscriptionPlans } from '@/app/[locale]/account/subscription/_components/subscription-plans';
import { useBilling } from '@/features/billing/api/billing';

// ✅ NOWE
import { SubscriptionPlans } from '@/features/subscription/components/subscription-plans';
import { useBilling } from '@/features/subscription'; // re-exports billing
```

#### Reports
```typescript
// ❌ STARE (rozproszone)
import { ReportEventModal } from '@/features/events/components/report-event-modal';
import { ReportCommentModal } from '@/features/comments/components/report-comment-modal';
import { ReportChatModal } from '@/features/chat/components/ReportChatModal';
import { ReportUserModal } from '@/features/users/components/report-user-modal';

// ✅ NOWE (wszystko w jednym miejscu)
import { 
  ReportEventModal,
  ReportCommentModal,
  ReportChatModal,
  ReportUserModal 
} from '@/features/reports';
```

---

## 📋 Checklist Migracji dla Deweloperów

Gdy pracujesz z kodem i widzisz stare importy:

### 1. Sprawdź czy feature istnieje
```bash
ls apps/web/src/features/
```

### 2. Zaktualizuj import
```typescript
// Znajdź w kodzie
import { Component } from '@/features/events/components/...';

// Sprawdź czy jest w nowym feature
// Jeśli tak, zmień na:
import { Component } from '@/features/nowy-feature';
```

### 3. Sprawdź czy działa
```bash
# W terminalu
cd apps/web
pnpm build
```

### 4. Usuń nieużywane importy
```bash
# Użyj ESLint
pnpm lint --fix
```

---

## 🎯 Strategia Stopniowej Migracji

### Faza 1: ✅ UKOŃCZONA
- Utworzenie nowych features
- Kopiowanie plików
- Podstawowe importy zaktualizowane

### Faza 2: W TRAKCIE (Ty możesz to zrobić)
1. **Znajdź wszystkie stare importy:**
```bash
cd apps/web/src
grep -r "from '@/features/events/api/reviews'" .
grep -r "from '@/features/events/api/checkin'" .
grep -r "from '@/features/events/components/event-faq'" .
# etc...
```

2. **Zaktualizuj po kolei:**
   - Zacznij od plików w `app/[locale]/`
   - Potem `features/` (inne features)
   - Na końcu `components/`

3. **Testuj na bieżąco:**
```bash
pnpm dev  # Sprawdź czy aplikacja działa
pnpm build  # Sprawdź czy build przechodzi
```

### Faza 3: Cleanup (Po pełnej migracji)
1. **Usuń zduplikowane pliki:**
```bash
# Z events/components/
rm apps/web/src/features/events/components/event-faq.tsx
rm apps/web/src/features/events/components/add-review-modal.tsx
# etc...

# Z events/api/
rm apps/web/src/features/events/api/reviews.tsx
rm apps/web/src/features/events/api/checkin.ts
```

2. **Usuń re-exports z events:**
```typescript
// W features/events/api/index.ts
// Usuń linię:
export * from '../../reviews/api';
```

3. **Usuń stare foldery z app/:**
```bash
rm -rf apps/web/src/app/[locale]/event/new/_components
rm -rf apps/web/src/app/[locale]/event/[id]/manage/_components
# etc...
```

---

## 🔍 Jak Znaleźć Co Gdzie Jest

### Szukanie komponentu:
```bash
# Przykład: gdzie jest EventReviews?
find apps/web/src/features -name "*review*" -type f
```

### Szukanie API hooka:
```bash
# Przykład: gdzie jest useCheckin?
grep -r "useCheckin" apps/web/src/features/*/api/
```

### Sprawdzenie public API:
```bash
# Sprawdź co exportuje feature
cat apps/web/src/features/reviews/index.ts
```

---

## ⚠️ Częste Problemy

### Problem 1: Circular Dependencies
```
Error: Circular dependency detected
```

**Rozwiązanie:**
- Nie importuj między features bezpośrednio z internal paths
- Używaj tylko public API (`from '@/features/nazwa'`)
- Jeśli potrzebne, przenieś shared types do `types/` w root

### Problem 2: Missing Exports
```
Error: Module has no exported member 'Component'
```

**Rozwiązanie:**
- Sprawdź `index.ts` w feature
- Dodaj export jeśli brakuje:
```typescript
// features/nazwa/index.ts
export { Component } from './components/component';
```

### Problem 3: Type Errors
```
Error: Cannot find module '@/features/old-path'
```

**Rozwiązanie:**
- Zaktualizuj import path
- Sprawdź czy plik istnieje w nowej lokalizacji
- Zrestartuj TypeScript server (CMD+Shift+P → "Restart TS Server")

---

## 📚 Dodatkowe Zasoby

- **Pełna struktura**: `docs/features-structure.md`
- **Podsumowanie migracji**: `docs/features-migration-summary.md`
- **Lista features**: `ls apps/web/src/features/`

---

**Pytania?** Sprawdź dokumentację lub zapytaj na Slacku! 💬

