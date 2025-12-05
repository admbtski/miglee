# Event Edit System

System edycji wydarzeń w sekcji zarządzania `/intent/[id]/manage/edit/`.

## Struktura

```
/intent/[id]/manage/edit/
├── layout.tsx                 # Layout z providerami (IntentEditProvider, CategorySelectionProvider, TagSelectionProvider)
├── page.tsx                   # Przekierowanie do pierwszego kroku (basics)
├── basics/
│   └── page.tsx              # Krok 1: Podstawowe informacje (tytuł, kategorie, tagi, opis)
├── cover/
│   └── page.tsx              # Krok 2: Zdjęcie okładki
├── when/
│   └── page.tsx              # Krok 3: Harmonogram (data i czas rozpoczęcia/zakończenia, okna zapisów)
├── where/
│   └── page.tsx              # Krok 4: Lokalizacja (miejsce, rodzaj spotkania, link online)
├── capacity/
│   └── page.tsx              # Krok 5: Pojemność (min/max uczestników, tryb)
└── settings/
    └── page.tsx              # Krok 6: Prywatność i dostęp (widoczność, tryb dołączania, poziomy, widoczność adresu/uczestników)
```

## Filozofia

Panel edycji `/manage/edit/` zawiera **pełne opcje** konfiguracji wydarzenia. Każdy panel jest **niezależny** - możesz wejść na dowolną stronę, dokonać zmian i zapisać tylko te zmiany. Nie ma wielokrokowego formularza ani kroku "Review".

### Relacja z uproszczonym kreatorem (`/intent/new`)

1. **Uproszczony kreator** (`/intent/new`) - szybkie tworzenie wydarzenia z podstawowymi polami:
   - Tytuł, kategorie, opis
   - Data i czas (z presetami)
   - Lokalizacja i format (onsite/online/hybrid)
   - Pojemność (1:1/grupowe/niestandardowe)
   - Prywatność (widoczność, tryb dołączania)
   - Okładka (opcjonalna)
   - Wydarzenie tworzone jako **DRAFT**

2. **Panel edycji** (`/manage/edit/`) - pełna konfiguracja:
   - Wszystkie pola z kreatora
   - **Zaawansowane okna zapisów** (joinOpensMinutesBeforeStart, joinCutoffMinutesBeforeStart, allowJoinLate, lateJoinCutoffMinutesAfterStart)
   - **Widoczność adresu** (publiczny/po dołączeniu/ukryty)
   - **Widoczność uczestników** (publiczna/po dołączeniu/ukryta)
   - **Poziomy zaawansowania** (początkujący/średniozaawansowany/zaawansowany)
   - **Notatki** dla uczestników

3. **Strona publikacji** (`/manage/publish`) - zarządzanie statusem:
   - **DRAFT** → **PUBLISHED** (natychmiastowa publikacja)
   - **DRAFT** → **SCHEDULED** (zaplanowana publikacja)
   - **SCHEDULED** → **DRAFT** (anulowanie planowania)
   - **PUBLISHED** → **DRAFT** (cofnięcie publikacji)

## Komponenty wspólne

### Layout i UI

- **`ManagementPageLayout`**: Wspólny layout dla wszystkich stron zarządzania z nagłówkiem i akcjami
- **`SaveButton`**: Przycisk "Save Changes" z animacją ładowania
- **`IntentEditProvider`**: Provider dostarczający stan formularza i dane wydarzenia
- **`useSaveIntentStep`**: Hook z funkcjami zapisywania dla każdego kroku

### Komponenty kroków

Każdy krok używa odpowiedniego komponentu z `/features/intents/components/`:

1. **Basics**: `BasicsStep` - tytuł, kategorie, tagi, opis
2. **Cover**: `CoverStep` - upload zdjęcia okładki
3. **Schedule**: `TimeStep` - data i czas rozpoczęcia/zakończenia, okna dołączania
4. **Location**: `PlaceStep` - lokalizacja, rodzaj spotkania (onsite/online/hybrid), link online
5. **Capacity**: `CapacityStep` - min/max uczestników, tryb (1:1/grupowe/niestandardowe)
6. **Privacy**: `PrivacyStep` - widoczność, tryb dołączania, poziomy zaawansowania, widoczność adresu i uczestników

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
  - Dashboard
  - **Publish** (zarządzanie statusem publikacji)
  - View Event
  - Members
  - Sponsorship Plans
  - **Event Settings** (grupa):
    - Basics
    - Cover Image
    - Schedule
    - Location
    - Capacity
    - Privacy
  - Engagement (Chat, Comments, Reviews, FAQ, Notifications)
  - Plus Features (Join Form, Invite Links, Feedback, Boost, Local Push, Appearance)
  - Pro Features (Analytics)
  - Danger Zone (Cancel & Delete)

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

## Status publikacji (PublicationStatus)

Nowy system zarządzania publikacją wydarzenia:

### Statusy

- **DRAFT**: Wersja robocza - widoczna tylko dla właściciela, moderatorów i administratorów
- **SCHEDULED**: Zaplanowana publikacja - wydarzenie zostanie automatycznie opublikowane w określonym czasie
- **PUBLISHED**: Opublikowane - widoczne dla wszystkich zgodnie z ustawieniami prywatności

### Mutacje

```graphql
# Natychmiastowa publikacja (DRAFT/SCHEDULED -> PUBLISHED)
publishIntent(id: ID!): Intent!

# Zaplanowanie publikacji (DRAFT -> SCHEDULED)
scheduleIntentPublication(id: ID!, publishAt: DateTime!): Intent!

# Anulowanie zaplanowanej publikacji (SCHEDULED -> DRAFT)
cancelScheduledPublication(id: ID!): Intent!

# Cofnięcie publikacji (PUBLISHED -> DRAFT)
unpublishIntent(id: ID!): Intent!
```

### Pola na typie Intent

```graphql
type Intent {
  # ...
  publicationStatus: PublicationStatus! # DRAFT, PUBLISHED, SCHEDULED
  publishedAt: DateTime # Kiedy zostało opublikowane
  scheduledPublishAt: DateTime # Kiedy ma być opublikowane (jeśli SCHEDULED)
  # ...
}
```

## Różnice z `/intent/new/` (uproszczony kreator)

| Aspekt                 | `/intent/new/`    | `/manage/edit/`    |
| ---------------------- | ----------------- | ------------------ |
| Cel                    | Szybkie tworzenie | Pełna konfiguracja |
| Pola                   | Podstawowe        | Wszystkie          |
| Okna zapisów           | Brak              | Pełne (4 pola)     |
| Widoczność adresu      | Domyślna          | Konfigurowalna     |
| Widoczność uczestników | Domyślna          | Konfigurowalna     |
| Poziomy                | Brak              | Konfigurowalne     |
| Notatki                | Brak              | Dostępne           |
| Status po utworzeniu   | DRAFT             | N/A (edycja)       |
| Nawigacja              | Krok po kroku     | Niezależne panele  |

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
- [x] ~~Dodać panel "Cover Image" do zarządzania zdjęciem okładki~~
- [x] ~~Dodać panel "Publish" do zarządzania statusem publikacji~~
- [ ] Dodać worker do automatycznej publikacji zaplanowanych wydarzeń
