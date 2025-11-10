# Categories Management - Implementation Summary

## Overview

Kompletny system zarządzania kategoriami wydarzeń z pełną walidacją, wielojęzycznością i kontrolą użycia.

## Backend Implementation

### GraphQL Schema Extensions

#### Queries

```graphql
checkCategorySlugAvailable(slug: String!): Boolean!
getCategoryUsageCount(slug: String!): Int!
```

#### Existing Operations

- `categories(query: String, limit: Int): [Category!]!`
- `category(id: ID, slug: String): Category`
- `createCategory(input: CreateCategoryInput!): Category!`
- `updateCategory(id: ID!, input: UpdateCategoryInput!): Category!`
- `deleteCategory(id: ID!): Boolean!`

### Backend Resolvers

**Location:** `/apps/api/src/graphql/resolvers/query/categories.ts`

#### New Queries:

1. **`checkCategorySlugAvailableQuery`**
   - Sprawdza czy slug jest dostępny (nie zajęty)
   - Zwraca `true` jeśli slug jest wolny
   - Automatyczna normalizacja (lowercase, trim)

2. **`getCategoryUsageCountQuery`**
   - Liczy ile wydarzeń używa danej kategorii
   - Sprawdza pole `categorySlugs` w tabeli `Intent`
   - Używane do blokowania usuwania używanych kategorii

#### Existing Mutations:

- **`createCategoryMutation`** - tworzy kategorię z walidacją slug i names
- **`updateCategoryMutation`** - aktualizuje kategorię (slug + names)
- **`deleteCategoryMutation`** - usuwa kategorię (soft-fail jeśli nie istnieje)

### Business Rules (Backend)

1. **Slug normalization:** lowercase, trim, spaces→hyphens, tylko `[a-z0-9-]`
2. **Unique constraint:** slug musi być unikalny (P2002 error)
3. **Names validation:** musi być obiektem JSON, nie może być null
4. **Delete safety:** zwraca `false` jeśli kategoria nie istnieje (idempotent)

## Frontend Implementation

### API Hooks

**Location:** `/apps/web/src/lib/api/categories.tsx`

#### Queries:

- `useGetCategoriesQuery(variables?, options?)` - lista kategorii z filtrowaniem
- `useGetCategoryQuery(variables, options?)` - pojedyncza kategoria
- `useCheckCategorySlugAvailableQuery(variables, options?)` - sprawdzanie dostępności slug
- `useGetCategoryUsageCountQuery(variables, options?)` - liczba użyć kategorii

#### Mutations:

- `useCreateCategoryMutation(options?)` - tworzenie kategorii
- `useUpdateCategoryMutation(options?)` - aktualizacja kategorii
- `useDeleteCategoryMutation(options?)` - usuwanie kategorii

**Cache invalidation:** Wszystkie mutacje automatycznie odświeżają listy kategorii.

### Utility Functions

**Location:** `/apps/web/src/lib/utils/slug.ts`

1. **`generateSlug(text: string): string`**
   - Transliteracja polskich znaków (ą→a, ć→c, etc.)
   - Konwersja do kebab-case
   - Usuwanie znaków specjalnych
   - Collapse whitespace

2. **`isValidSlug(slug: string): boolean`**
   - Walidacja formatu slug
   - Regex: `/^[a-z0-9]+(-[a-z0-9]+)*$/`

### UI Components

#### 1. AddCategoryModal

**Location:** `/apps/web/src/app/admin/categories/_components/add-category-modal.tsx`

**Features:**

- ✅ Auto-generowanie slug z nazwy polskiej (transliteracja)
- ✅ Możliwość ręcznej edycji slug
- ✅ Real-time sprawdzanie dostępności slug (debounced)
- ✅ Wielojęzyczne zakładki (PL/EN/DE)
- ✅ Walidacja:
  - PL wymagane (2-50 znaków)
  - EN/DE opcjonalne (max 50 znaków)
  - Slug wymagany, unikalny, prawidłowy format
- ✅ Przycisk "Uzupełnij z PL" - kopiuje nazwę PL do pustych zakładek
- ✅ Podgląd JSON (readonly)
- ✅ Wskaźnik tłumaczeń (X/3)
- ✅ Visual feedback: ✓ dla dostępnego slug, ⚠ dla zajętego
- ✅ Loading states i error handling

#### 2. EditCategoryModal

**Location:** `/apps/web/src/app/admin/categories/_components/edit-category-modal.tsx`

**Features:**

- ✅ Wszystkie funkcje z AddCategoryModal
- ✅ **Blokada slug** jeśli kategoria jest używana
  - Sprawdza `getCategoryUsageCount`
  - Pokazuje warning z liczbą wydarzeń
  - Pole slug disabled + ikona 🔒
- ✅ Slug edytowalny tylko jeśli kategoria nieużywana
- ✅ Real-time sprawdzanie dostępności (tylko dla zmienionych slug)
- ✅ Resetowanie formularza przy zmianie kategorii

#### 3. DeleteCategoryModal

**Location:** `/apps/web/src/app/admin/categories/_components/delete-category-modal.tsx`

**Features:**

- ✅ **Blokada usuwania** jeśli kategoria jest używana
  - Sprawdza `getCategoryUsageCount` przed usunięciem
  - Pokazuje szczegółowy komunikat z liczbą wydarzeń
  - Link do listy wydarzeń z filtrem `categorySlugs`
- ✅ Confirm modal dla nieużywanych kategorii
- ✅ Komunikat: "Operacja nieodwracalna"
- ✅ Podgląd slug i nazwy przed usunięciem
- ✅ Loading states podczas sprawdzania użycia

#### 4. Main Page

**Location:** `/apps/web/src/app/admin/categories/page.tsx`

**Features:**

- ✅ Lista kategorii w tabeli
- ✅ Kolumny:
  - Slug
  - Nazwa (PL)
  - Wskaźnik tłumaczeń (X/3) z tooltipem pokazującym brakujące języki
  - Data utworzenia
  - Akcje (Edytuj/Usuń)
- ✅ Wyszukiwarka (po slug i nazwach w dowolnym języku)
- ✅ Przycisk "Dodaj kategorię"
- ✅ Kolorowe wskaźniki tłumaczeń:
  - 🟢 3/3 - zielony
  - 🟠 2/3 - pomarańczowy
  - 🔴 1/3 - czerwony
- ✅ Loading states i empty states

## Business Rules (Frontend)

### 1. Slug Management

- **Auto-generowanie:** Z nazwy PL przy pierwszym wpisaniu
- **Ręczna edycja:** Możliwa, ale blokuje auto-generowanie
- **Walidacja:** Format kebab-case, unikalność (sprawdzana on blur)
- **Blokada:** Slug niezmienialny jeśli kategoria używana

### 2. Names (Wielojęzyczność)

- **PL wymagane:** 2-50 znaków
- **EN/DE opcjonalne:** max 50 znaków
- **Trim + collapse whitespace:** Automatyczne czyszczenie
- **Bez HTML/emoji:** Podstawowa walidacja tekstu

### 3. Usuwanie

- **Sprawdzanie użycia:** Przed każdym usunięciem
- **Blokada:** Jeśli `usageCount > 0`
- **Komunikat:** Szczegółowa informacja + link do wydarzeń
- **Confirm:** Dla nieużywanych kategorii

### 4. UX Details

- **Keyboard support:** Enter zapisuje, ESC zamyka
- **Visual feedback:** Checkmarki, ikony, kolory
- **Toasty:** Po wszystkich akcjach (sukces/błąd)
- **Optimistic updates:** Natychmiastowa aktualizacja listy
- **Loading states:** Podczas wszystkich operacji async

## API Flow Examples

### Creating Category

```typescript
// 1. User types "Sport i Rekreacja" in PL field
// 2. Auto-generated slug: "sport-i-rekreacja"
// 3. On blur: checkCategorySlugAvailable("sport-i-rekreacja") → true ✓
// 4. User clicks "Utwórz"
// 5. createCategory({ slug: "sport-i-rekreacja", names: { pl: "Sport i Rekreacja" } })
// 6. Success → toast + list refresh
```

### Editing Used Category

```typescript
// 1. User clicks "Edytuj" on category with slug "sport"
// 2. Modal opens, getCategoryUsageCount("sport") → 15
// 3. Slug field disabled with 🔒 icon
// 4. Warning: "Kategoria jest używana przez 15 wydarzeń"
// 5. User can only edit names (PL/EN/DE)
// 6. updateCategory(id, { names: {...} }) // slug not included
```

### Deleting Used Category

```typescript
// 1. User clicks "Usuń" on category
// 2. Modal opens, getCategoryUsageCount(slug) → 8
// 3. Red warning: "Nie można usunąć kategorii"
// 4. "Kategoria używana przez 8 wydarzeń"
// 5. Link: "Pokaż wydarzenia z tą kategorią" → /admin/intents?categorySlugs=sport
// 6. Only "Zamknij" button (no delete)
```

## Testing Checklist

### Backend

- [x] `checkCategorySlugAvailable` zwraca true/false poprawnie
- [x] `getCategoryUsageCount` liczy wydarzenia z categorySlugs
- [x] createCategory normalizuje slug
- [x] updateCategory waliduje slug i names
- [x] deleteCategory jest idempotentny

### Frontend

- [x] Auto-generowanie slug z polskich znaków
- [x] Real-time sprawdzanie dostępności slug
- [x] Wielojęzyczne zakładki (PL/EN/DE)
- [x] Walidacja wszystkich pól
- [x] Blokada slug przy edycji używanej kategorii
- [x] Blokada usuwania używanej kategorii
- [x] Link do wydarzeń z filtrem
- [x] Wskaźnik tłumaczeń w tabeli
- [x] Wyszukiwarka po slug i nazwach
- [x] Loading states i error handling
- [x] Keyboard support (Enter/ESC)

## Files Modified/Created

### Backend

- ✅ `/packages/contracts/graphql/schema.graphql` - dodano queries
- ✅ `/packages/contracts/graphql/operations/categories.graphql` - nowy plik
- ✅ `/apps/api/src/graphql/resolvers/query/categories.ts` - dodano queries
- ✅ `/apps/api/src/graphql/resolvers/query/index.ts` - zarejestrowano queries

### Frontend

- ✅ `/apps/web/src/lib/api/categories.tsx` - dodano hooks
- ✅ `/apps/web/src/lib/utils/slug.ts` - nowy plik
- ✅ `/apps/web/src/app/admin/categories/page.tsx` - przepisano całkowicie
- ✅ `/apps/web/src/app/admin/categories/_components/add-category-modal.tsx` - nowy
- ✅ `/apps/web/src/app/admin/categories/_components/edit-category-modal.tsx` - nowy
- ✅ `/apps/web/src/app/admin/categories/_components/delete-category-modal.tsx` - nowy

## Future Enhancements (Optional)

1. **Bulk operations:** Zmiana nazw wielu kategorii naraz
2. **Category icons:** Dodanie ikon do kategorii
3. **Category colors:** Kolory dla lepszej wizualizacji
4. **Import/Export:** CSV import/export kategorii
5. **Audit log:** Historia zmian kategorii
6. **Merge categories:** Łączenie duplikatów
7. **Category hierarchy:** Podkategorie (parent/child)
8. **Usage details:** Lista konkretnych wydarzeń używających kategorii

## Summary

✅ **Backend:** Kompletne API z walidacją i sprawdzaniem użycia  
✅ **Frontend:** Pełne UI z wielojęzycznością i blokowaniem destrukcyjnych operacji  
✅ **Business Logic:** Wszystkie wymagane reguły zaimplementowane  
✅ **UX:** Intuicyjny interfejs z visual feedback i keyboard support  
✅ **Error Handling:** Szczegółowe komunikaty i graceful degradation

System jest w pełni funkcjonalny i gotowy do użycia! 🎉
