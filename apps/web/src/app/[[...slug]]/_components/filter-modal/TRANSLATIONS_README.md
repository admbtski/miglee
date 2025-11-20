# Filter Modal Translations

System tłumaczeń dla Filter Modal wspiera wiele języków.

## Aktualnie wspierane języki

- **Polski (pl)** - domyślny
- **Angielski (en)**

## Jak używać

### 1. Domyślne użycie (Polski)

```tsx
<FilterModalRefactoredComponent
  // ... inne props
  onApply={handleApply}
  onClose={handleClose}
/>
```

### 2. Zmiana języka na angielski

```tsx
<FilterModalRefactoredComponent
  // ... inne props
  locale="en"
  onApply={handleApply}
  onClose={handleClose}
/>
```

## Struktura tłumaczeń

Plik `translations.ts` zawiera kompletne tłumaczenia dla:

### Header

- Tytuł modala
- Przycisk "Clear All"
- Podpowiedzi

### Sekcje filtrów

1. **Search & Categories**
   - Tytuł i opis
   - Placeholdery
   - Etykiety dla tagów i kategorii

2. **Location & Distance**
   - Tytuł i opis
   - Etykiety dla lokalizacji i odległości

3. **Date Range**
   - Tytuł i opis
   - Presety dat (Now +1h, Tonight, Tomorrow, Weekend, Next 7 days)
   - Etykiety dla pól dat
   - Komunikaty błędów

4. **Event Settings**
   - Status (Any, Available, Ongoing, Full, Locked, Past)
   - Tryb spotkania (Onsite, Online, Hybrid)
   - Poziom (Beginner, Intermediate, Advanced)
   - Tryb dołączania (Open, Request, Invite Only)
   - Organizator (Verified only)

### Footer

- Przyciski (Cancel, Show results)
- Liczniki wyników
- Komunikaty

### Pro Tip

- Wskazówka z skrótem klawiszowym

## Dodawanie nowego języka

1. Otwórz `translations.ts`
2. Dodaj nowy język do typu:

```typescript
export const translations: Record<'pl' | 'en' | 'de', FilterModalTranslations> =
  {
    // ...
  };
```

3. Dodaj tłumaczenia:

```typescript
de: {
  title: 'Suchfilter',
  clearAll: 'Alle löschen',
  // ... reszta tłumaczeń
}
```

4. Zaktualizuj funkcję `getFilterModalTranslations`:

```typescript
export function getFilterModalTranslations(
  locale: 'pl' | 'en' | 'de' = 'pl'
): FilterModalTranslations {
  return translations[locale] || translations.pl;
}
```

## Przykład użycia z dynamicznym locale

```tsx
import { useRouter } from 'next/navigation';

function MyComponent() {
  const router = useRouter();
  const locale = router.locale || 'pl'; // lub z innego źródła

  return (
    <FilterModalRefactoredComponent
      locale={locale as 'pl' | 'en'}
      // ... inne props
    />
  );
}
```

## Testowanie tłumaczeń

Aby przetestować tłumaczenia w różnych językach:

1. Zmień prop `locale` na `"en"` w komponencie
2. Sprawdź wszystkie sekcje modala
3. Upewnij się, że wszystkie etykiety są przetłumaczone
4. Sprawdź długość tekstów w różnych językach (może wymagać dostosowania layoutu)

## Uwagi

- Domyślny język to **polski (pl)**
- Jeśli podany język nie istnieje, system automatycznie użyje polskiego
- Wszystkie tłumaczenia są typowane TypeScript dla bezpieczeństwa
- Tłumaczenia są ładowane synchronicznie (brak dodatkowych requestów)
