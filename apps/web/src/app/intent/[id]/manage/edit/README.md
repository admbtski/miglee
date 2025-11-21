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
│   └── page.tsx              # Krok 3: Kiedy (data i czas rozpoczęcia/zakończenia)
├── where/
│   └── page.tsx              # Krok 4: Gdzie (lokalizacja, rodzaj spotkania, link online)
├── settings/
│   └── page.tsx              # Krok 5: Prywatność i dostęp (widoczność, tryb dołączania, poziomy)
├── cover/
│   └── page.tsx              # Krok 6: Zdjęcie okładki (opcjonalne)
└── review/
    └── page.tsx              # Krok 7: Przegląd i zapisanie zmian
```

## Komponenty wspólne

Wszystkie kroki używają wspólnych komponentów z `/features/intents/components/edit-steps/`:

- **`IntentEditProvider`**: Provider dostarczający stan formularza i dane wydarzenia
- **`EditStepLayout`**: Layout dla każdego kroku z nawigacją i paskiem postępu
- **`useEditStepNavigation`**: Hook do nawigacji między krokami
- **`useIntentEdit`**: Hook do dostępu do stanu formularza

## Komponenty kroków

Każdy krok używa odpowiedniego komponentu z `/features/intents/components/`:

1. **Basics**: `BasicsStep` - tytuł, kategorie, tagi, opis, tryb (1:1 / grupa)
2. **Capacity**: `CapacityStep` - min/max uczestników
3. **When**: `TimeStep` - data i czas rozpoczęcia/zakończenia, okna dołączania
4. **Where**: `PlaceStep` - lokalizacja, rodzaj spotkania (onsite/online/hybrid), link online
5. **Settings**: `PrivacyStep` - widoczność, tryb dołączania, poziomy zaawansowania
6. **Cover**: `CoverStep` - upload zdjęcia okładki
7. **Review**: `ReviewStep` - przegląd wszystkich danych + przycisk zapisania

## Przepływ danych

1. **Layout** (`layout.tsx`):
   - Opakowuje wszystkie strony w providery
   - `IntentEditProvider` pobiera dane wydarzenia i inicjalizuje formularz
   - `CategorySelectionProvider` i `TagSelectionProvider` zarządzają wybranymi kategoriami i tagami

2. **Strony kroków** (np. `basics/page.tsx`):
   - Używają `useIntentEdit()` aby uzyskać dostęp do formularza
   - Renderują odpowiedni komponent kroku wewnątrz `EditStepLayout`
   - `EditStepLayout` dostarcza nawigację i pasek postępu

3. **Zapisywanie** (`review/page.tsx`):
   - Waliduje wszystkie pola formularza
   - Wywołuje `useUpdateIntentMutation` aby zapisać zmiany
   - Po sukcesie przekierowuje do `/intent/[id]/manage`

## Nawigacja

Nawigacja między krokami jest obsługiwana przez:

- **Sidebar**: `IntentManagementSidebar` - wyświetla wszystkie kroki jako zakładki
- **Mobile Sidebar**: `IntentManagementMobileSidebar` - wersja mobilna
- **Przyciski**: "Previous" i "Next" w `EditStepLayout`
- **URL**: Każdy krok ma dedykowany URL (np. `/intent/[id]/manage/edit/basics`)

## Walidacja

Walidacja jest wykonywana przez:

- **React Hook Form**: Walidacja na poziomie pól formularza
- **Zod Schema**: `IntentSchema` w `use-intent-form.tsx`
- **Walidacja przed zapisem**: W `review/page.tsx` przed wywołaniem mutacji

## Stan formularza

Stan formularza jest zarządzany przez:

- **`useIntentForm`**: Hook tworzący instancję React Hook Form z walidacją Zod
- **`IntentEditProvider`**: Provider dostarczający formularz i dane do wszystkich kroków
- **`useCategorySelection`** i **`useTagSelection`**: Providery dla kategorii i tagów

## Różnice z `/creator/`

- **`/creator/`**: Wielokrokowy formularz w jednym komponencie (`IntentCreatorForm`)
- **`/manage/edit/`**: Każdy krok to osobna strona z dedykowanym URL
- **Wspólne komponenty**: Oba używają tych samych komponentów kroków (`BasicsStep`, `CapacityStep`, etc.)
- **Nawigacja**: `/creator/` używa stanu lokalnego, `/manage/edit/` używa Next.js routing

## Przyszłe ulepszenia

- [ ] Dodać auto-save (zapisywanie draftu co X sekund)
- [ ] Dodać możliwość pominięcia kroków
- [ ] Dodać walidację przed przejściem do następnego kroku
- [ ] Dodać animacje przejść między krokami
- [ ] Zsynchronizować `/creator/` aby używał tego samego systemu kroków

