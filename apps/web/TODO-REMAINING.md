# Pozostałe Zadania do Wykonania

## ✅ Ukończone

- [x] Utworzono dokumentację architektury (ARCHITECTURE.md)
- [x] Utworzono przewodnik migracji (MIGRATION-GUIDE.md) 
- [x] Scalono event-creation i event-management do events/modules/
- [x] Naprawiono 229 → 0 naruszeń importów bezpośrednich do wnętrz feature'ów
- [x] Przeniesiono components/feedback do components/ui/
- [x] Dodano regułę ESLint dla wymuszenia granic feature'ów
- [x] Utworzono skrypt check-feature-imports.sh

## ⚠️ Wymagane Poprawki (Błędy Kompilacji TypeScript)

### 1. Komponenty Event Management (PRIORYTET 1)

Komponenty z modules/management muszą być wyeksportowane przez events/index.ts:

```bash
# Błędy:
src/app/[locale]/event/[id]/manage/layout.tsx - EventManagementGuard, EventManagementNavbar, EventManagementProvider, EventManagementSidebar
src/app/[locale]/event/[id]/manage/appearance/page.tsx - ManagementPageLayout
src/app/[locale]/event/[id]/manage/boost/page.tsx - ManagementPageLayout
src/app/[locale]/event/[id]/manage/local-push/page.tsx - ManagementPageLayout
```

**Rozwiązanie:**
Dodać do `src/features/events/index.ts`:
```typescript
// Re-export management components from modules
export {
  EventManagementDashboard,
  EventManagementGuard,
  EventManagementMobileSidebar,
  EventManagementNavbar,
  EventManagementProvider,
  EventManagementSidebar,
  ManagementPageLayout,
  PlanUpgradeBanner,
  type SponsorshipPlan,
} from './modules/management';
```

### 2. Hooki z Search Feature (PRIORYTET 1)

Wiele hooków używanych w events pochodzi z search feature i musi być importowane bezpośrednio:

```bash
# Pliki do naprawy:
src/app/[locale]/events/events-page-client.tsx
src/app/[locale]/account/events/page.tsx
src/features/events/components/top-drawer.tsx
```

**Przykład naprawy:**
```typescript
// ❌ Przed
import { useActiveFiltersCount, useCommittedFilters, useSearchMeta } from '@/features/events';

// ✅ Po
import { useActiveFiltersCount, useCommittedFilters, useSearchMeta } from '@/features/search';
```

### 3. EventCountdownPill vs EventCountdownTimer

Kilka plików importuje nieistniejący `EventCountdownPill`:

```bash
src/features/events/components/event-card/event-card.tsx
src/features/events/components/map-popup/popup-item.tsx
```

**Rozwiązanie:**
Zmienić import na istniejący komponent lub sprawdzić czy powinien być `EventCountdownTimer`.

### 4. Chat Feature - PickedUser

```bash
src/app/[locale]/account/chats/page.tsx - brak eksportu PickedUser
```

**Rozwiązanie:**
Dodać export do `src/features/chat/index.ts`:
```typescript
export type { PickedUser } from './types';
```

### 5. Search Feature - StickyMobileSearchBar

```bash
src/app/[locale]/events/events-page-client.tsx - używa StickyMobileSearchBar zamiast MobileSearchBar
```

**Rozwiązanie:**
Albo zmienić nazwę komponentu, albo zaktualizować import.

### 6. Reviews Feature - useGetMyReview

```bash
src/app/[locale]/feedback/[eventId]/_components/feedback-page-client.tsx
src/features/reviews/components/event-reviews.tsx
```

**Rozwiązanie:**
Zmienić na `useGetReview` lub dodać alias do reviews/api/index.ts.

### 7. Ścieżki Względne w Modulach

Sprawdzić wszystkie importy w:
- `src/features/events/modules/creation/`
- `src/features/events/modules/management/`

Upewnić się że używają poprawnych ścieżek względnych.

## 📋 Kompletna Lista Poleceń do Wykonania

### Krok 1: Napraw Events Management Exports

```bash
cd /Users/abartski/dev-vibe/miglee/apps/web
```

Edytuj `src/features/events/index.ts` i dodaj:
```typescript
// Submodules - export everything from creation and management
export * from './modules/creation';
export * from './modules/management';
```

### Krok 2: Napraw Importy z Search

Dla każdego pliku używającego hooków search, zmień:
```typescript
// W src/app/[locale]/events/events-page-client.tsx
import { 
  useActiveFiltersCount,
  useCommittedFilters,
  useCommittedSort,
  useSearchMeta,
  type SearchMeta,
  useEventsListingInfiniteQueryVariables,
  useFilterState,
  useFilterValidation,
} from '@/features/search';
```

### Krok 3: Napraw Chat Types

Dodaj do `src/features/chat/index.ts`:
```typescript
export type { PickedUser } from './types';
```

### Krok 4: Sprawdź EventCountdownPill

```bash
grep -r "EventCountdownPill" src/features/events/components/
```

Zamień na właściwy komponent lub usuń.

### Krok 5: Sprawdź Build

```bash
pnpm typecheck
```

### Krok 6: Jeśli Build Przejdzie, Test Dev Server

```bash
pnpm dev
```

## 🔍 Pomocne Komendy

### Sprawdź wszystkie błędy TypeScript
```bash
pnpm typecheck 2>&1 | grep "error TS"
```

### Sprawdź naruszenia importów
```bash
./scripts/check-feature-imports.sh
```

### Znajdź wszystkie importy z danego feature
```bash
grep -r "from '@/features/events'" src/app | grep -v node_modules
```

### Znajdź wszystkie użycia danego hooka
```bash
grep -r "useActiveFiltersCount" src/
```

## 📝 Notatki

1. **Events Feature** jest teraz skonsolidowany - nie ma już oddzielnych event-creation i event-management
2. **Search Feature** zawiera wszystkie hooki związane z filtrowaniem i wyszukiwaniem
3. **Importy** powinny ZAWSZE być z root feature'a: `@/features/<nazwa>`
4. **ESLint** ostrzega teraz o bezpośrednich importach do wnętrz feature'ów

## 🎯 Po Naprawie Błędów Kompilacji

1. Uruchom `pnpm typecheck` - powinno być 0 błędów
2. Uruchom `pnpm build` - powinno się zbudować
3. Uruchom `pnpm dev` - sprawdź czy aplikacja działa
4. Przetestuj kluczowe strony:
   - `/events` - lista eventów
   - `/event/[id]` - szczegóły eventu
   - `/event/[id]/manage` - zarządzanie eventem
   - `/account/settings` - ustawienia konta

## 📚 Dokumentacja

- `ARCHITECTURE.md` - Pełny przewodnik architektury
- `MIGRATION-GUIDE.md` - Jak naprawiać naruszenia importów
- `REFACTORING-SUMMARY.md` - Co zostało zrobione
- `scripts/README.md` - Dokumentacja skryptów

---

**Status:** Główna refaktoryzacja ukończona ✅  
**Pozostałe:** Naprawienie błędów kompilacji TypeScript (~20 błędów)  
**Czas:** ~1-2 godziny pracy

**Priorytet:** Naprawić błędy kompilacji żeby aplikacja się budowała i działała.

