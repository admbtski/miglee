# Event Edit System

System edycji wydarzeń w sekcji zarządzania `/intent/[id]/manage/edit/`.

## Struktura

```
/intent/[id]/manage/edit/
├── layout.tsx                 # Layout z providerami (IntentEditProvider, CategorySelectionProvider, TagSelectionProvider)
├── page.tsx                   # Przekierowanie do pierwszego kroku (basics)
├── basics/
│   └── page.tsx              # Krok 1: Podstawowe informacje (tytuł, kategorie, tagi, opis, tryb)
├── capacity/
│   └── page.tsx              # Krok 2: Pojemność (min/max uczestników)
├── when/
│   └── page.tsx              # Krok 3: Harmonogram (data i czas rozpoczęcia/zakończenia)
├── where/
│   └── page.tsx              # Krok 4: Lokalizacja (miejsce, rodzaj spotkania, link online)
└── settings/
    └── page.tsx              # Krok 5: Prywatność i dostęp (widoczność, tryb dołączania, poziomy)
```

## Filozofia

Każdy panel edycji jest **niezależny** - możesz wejść na dowolną stronę, dokonać zmian i zapisać tylko te zmiany. Nie ma wielokrokowego formularza ani kroku "Review".

## Komponenty wspólne

### Layout i UI

- **`ManagementPageLayout`**: Wspólny layout dla wszystkich stron zarządzania z nagłówkiem i akcjami
- **`SaveButton`**: Przycisk "Save Changes" z animacją ładowania
- **`IntentEditProvider`**: Provider dostarczający stan formularza i dane wydarzenia
- **`useSaveIntentStep`**: Hook z funkcjami zapisywania dla każdego kroku

### Komponenty kroków

Każdy krok używa odpowiedniego komponentu z `/features/intents/components/`:

1. **Basics**: `BasicsStep` - tytuł, kategorie, tagi, opis, tryb (1:1 / grupa)
2. **Capacity**: `CapacityStep` - min/max uczestników
3. **Schedule**: `TimeStep` - data i czas rozpoczęcia/zakończenia, okna dołączania
4. **Location**: `PlaceStep` - lokalizacja, rodzaj spotkania (onsite/online/hybrid), link online
5. **Privacy**: `PrivacyStep` - widoczność, tryb dołączania, poziomy zaawansowania

## Przepływ danych

1. **Layout** (`layout.tsx`):
   - Opakowuje wszystkie strony w providery
   - `IntentEditProvider` pobiera dane wydarzenia i inicjalizuje formularz
   - `CategorySelectionProvider` i `TagSelectionProvider` zarządzają wybranymi kategoriami i tagami

2. **Strony kroków** (np. `basics/page.tsx`):
   - Używają `useIntentEdit()` aby uzyskać dostęp do formularza
   - Używają `useSaveIntentStep()` aby uzyskać funkcję zapisywania
   - Renderują komponent kroku wewnątrz `ManagementPageLayout`
   - Przycisk "Save Changes" w nagłówku zapisuje tylko zmiany z tego kroku

3. **Zapisywanie**:
   - Każdy krok ma dedykowaną funkcję zapisywania (np. `saveBasics`, `saveCapacity`)
   - Funkcja waliduje tylko pola związane z danym krokiem
   - Wywołuje `useUpdateIntentMutation` z tylko tymi polami
   - Pokazuje toast z informacją o sukcesie/błędzie

## Nawigacja

Nawigacja między krokami jest obsługiwana przez:

- **Sidebar**: `IntentManagementSidebar` - wyświetla wszystkie kroki jako zakładki
  - Basics
  - Capacity
  - Schedule
  - Location
  - Privacy
- **Mobile Sidebar**: `IntentManagementMobileSidebar` - wersja mobilna
- **URL**: Każdy krok ma dedykowany URL (np. `/intent/[id]/manage/edit/basics`)

## Walidacja

Walidacja jest wykonywana przez:

- **React Hook Form**: Walidacja na poziomie pól formularza
- **Zod Schema**: `IntentSchema` w `use-intent-form.tsx`
- **Walidacja przed zapisem**: Każda funkcja `save*` waliduje tylko swoje pola przed wysłaniem

## Stan formularza

Stan formularza jest zarządzany przez:

- **`useIntentForm`**: Hook tworzący instancję React Hook Form z walidacją Zod
- **`IntentEditProvider`**: Provider dostarczający formularz i dane do wszystkich kroków
- **`useCategorySelection`** i **`useTagSelection`**: Providery dla kategorii i tagów

## Design

Wszystkie strony edycji używają wspólnego designu:

- **Nagłówek**: Tytuł i opis strony
- **Akcje**: Przycisk "Save Changes" w prawym górnym rogu
- **Treść**: Formularz z polami do edycji
- **Spójność**: Ten sam design co reszta panelu zarządzania

## Różnice z `/creator/`

- **`/creator/`**: Wielokrokowy formularz w jednym komponencie (`IntentCreatorForm`) z nawigacją Next/Previous
- **`/manage/edit/`**: Każdy krok to osobna strona z dedykowanym URL i przyciskiem Save
- **Wspólne komponenty**: Oba używają tych samych komponentów kroków (`BasicsStep`, `CapacityStep`, etc.)
- **Filozofia**: `/creator/` to kreator krok po kroku, `/manage/edit/` to niezależne panele edycji

## Przykład użycia

```tsx
// Strona edycji podstawowych informacji
export default function BasicsStepPage() {
  const { form } = useIntentEdit();
  const { saveBasics, isSaving } = useSaveIntentStep();

  return (
    <ManagementPageLayout
      title="Event Basics"
      description="Set up the fundamental details of your event"
      actions={<SaveButton onClick={saveBasics} isSaving={isSaving} />}
    >
      <BasicsStep form={form} />
    </ManagementPageLayout>
  );
}
```

## Przyszłe ulepszenia

- [ ] Dodać auto-save (zapisywanie co X sekund)
- [ ] Dodać wskaźnik niezapisanych zmian
- [ ] Dodać możliwość cofnięcia zmian
- [ ] Dodać historię zmian
- [ ] Dodać panel "Cover Image" do zarządzania zdjęciem okładki
