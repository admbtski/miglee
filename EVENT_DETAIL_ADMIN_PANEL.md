# Panel Zarządzania Wydarzeniem - Dokumentacja

## Przegląd

Panel zarządzania wydarzeniem został dodany do strony szczegółów wydarzenia (`/intent/[id]`), umożliwiając administratorom i moderatorom pełne zarządzanie wydarzeniem bezpośrednio z widoku detali.

## Komponenty

### 1. EventAdminPanel (`event-admin-panel.tsx`)

Nowy komponent wyświetlający panel zarządzania z następującymi funkcjami:

#### Widoczność

- Panel jest widoczny **tylko** dla właściciela (OWNER) i moderatorów (MODERATOR)
- Automatycznie ukrywa się dla zwykłych uczestników i niezalogowanych użytkowników

#### Dostępne akcje

1. **Edytuj wydarzenie** (tylko właściciel)
   - Otwiera modal `CreateEditIntentModalConnect`
   - Pozwala na edycję wszystkich parametrów wydarzenia
   - Niedostępne dla usuniętych wydarzeń

2. **Zarządzaj uczestnikami** (właściciel + moderator)
   - Otwiera modal `EventManagementModalConnect`
   - Funkcje:
     - Zatwierdzanie/odrzucanie wniosków o dołączenie
     - Zarządzanie rolami uczestników (awansowanie/degradowanie)
     - Wyrzucanie (kick) i banowanie użytkowników
     - Zapraszanie nowych uczestników
     - Wyświetla liczbę oczekujących wniosków

3. **Anuluj wydarzenie** (właściciel + moderator)
   - Otwiera modal `CancelIntentModals`
   - Anulowanie jest odwracalne
   - Uczestnicy są powiadamiani o anulowaniu
   - Niedostępne dla już anulowanych lub usuniętych wydarzeń

4. **Usuń wydarzenie** (tylko właściciel)
   - Otwiera modal `DeleteIntentModals`
   - **Akcja nieodwracalna** - trwałe usunięcie
   - Wszystkie dane są permanentnie usuwane
   - Niedostępne dla już usuniętych wydarzeń

#### Wyświetlanie statusu

Panel pokazuje informacje o statusie wydarzenia:

- Czy wydarzenie zostało anulowane (z powodem)
- Czy wydarzenie zostało usunięte (z powodem)

### 2. Integracja w EventDetailClient

Komponent `event-detail-client.tsx` został zaktualizowany:

#### Dodane importy

```typescript
import { EventAdminPanel } from './event-admin-panel';
import { CreateEditIntentModalConnect } from '@/features/intents/components/create-edit-intent-modal-connect';
import { EventManagementModalConnect } from '@/app/account/intents/_components/managemen/event-management-modal-connect';
import { CancelIntentModals } from '@/app/account/intents/_components/cancel-intent-modals';
import { DeleteIntentModals } from '@/app/account/intents/_components/delete-intent-modals';
```

#### Stany modali

```typescript
const [editOpen, setEditOpen] = useState(false);
const [manageOpen, setManageOpen] = useState(false);
const [cancelId, setCancelId] = useState<string | null>(null);
const [deleteId, setDeleteId] = useState<string | null>(null);
```

#### Umiejscowienie w UI

Panel został umieszczony w prawej kolumnie (sidebar) między:

- `EventJoinSection` (sekcja dołączania)
- `EventActions` (standardowe akcje użytkownika)

## Przepływ użytkownika

### Dla właściciela wydarzenia:

1. Wchodzi na stronę swojego wydarzenia
2. Widzi panel zarządzania w prawym sidebarze
3. Może:
   - Edytować szczegóły wydarzenia
   - Zarządzać uczestnikami
   - Anulować wydarzenie
   - Usunąć wydarzenie

### Dla moderatora:

1. Wchodzi na stronę wydarzenia, w którym jest moderatorem
2. Widzi panel zarządzania (bez opcji edycji i usunięcia)
3. Może:
   - Zarządzać uczestnikami
   - Anulować wydarzenie

### Dla zwykłego uczestnika:

- Panel zarządzania jest całkowicie ukryty
- Widzi tylko standardowe akcje użytkownika

## Odświeżanie danych

Wszystkie modale po wykonaniu akcji wywołują `refetch()`:

- Po edycji wydarzenia
- Po zamknięciu panelu zarządzania uczestnikami
- Po anulowaniu wydarzenia
- Po usunięciu wydarzenia

Dzięki temu dane są zawsze aktualne bez potrzeby odświeżania strony.

## Bezpieczeństwo

### Frontend

- Panel widoczny tylko dla uprawnionych użytkowników
- Walidacja roli na poziomie komponentu
- Przyciski warunkowe w zależności od uprawnień

### Backend

Wszystkie operacje są dodatkowo zabezpieczone na poziomie API:

- Mutacje GraphQL sprawdzają uprawnienia
- Tylko właściciel może edytować i usuwać
- Właściciel i moderator mogą anulować i zarządzać uczestnikami

## Lokalizacja (i18n)

Wszystkie teksty są w języku polskim, zgodnie z resztą aplikacji:

- Tytuły akcji
- Komunikaty potwierdzenia
- Komunikaty sukcesu/błędu
- Opisy statusów

## Stylizacja

Panel wykorzystuje spójny design system:

- Niebieskie tło dla panelu zarządzania (odróżnienie od innych sekcji)
- Ikony Lucide dla każdej akcji
- Kolorystyka:
  - Niebieski: akcje zarządzania (edycja, zarządzanie uczestnikami)
  - Pomarańczowy: akcje ostrzegawcze (anulowanie)
  - Czerwony: akcje destrukcyjne (usuwanie)
- Dark mode support

## Komponenty wykorzystane

1. **CreateEditIntentModalConnect** - modal edycji wydarzenia
2. **EventManagementModalConnect** - modal zarządzania uczestnikami
3. **CancelIntentModals** - flow anulowania wydarzenia
4. **DeleteIntentModals** - flow usuwania wydarzenia
5. **NoticeModal** - bazowy komponent dla wszystkich potwierdzeń

## Testowanie

### Scenariusze testowe:

1. **Jako właściciel:**
   - ✓ Widzę wszystkie 4 opcje zarządzania
   - ✓ Mogę edytować wydarzenie
   - ✓ Mogę zarządzać uczestnikami
   - ✓ Mogę anulować wydarzenie
   - ✓ Mogę usunąć wydarzenie

2. **Jako moderator:**
   - ✓ Widzę 2 opcje zarządzania
   - ✓ Mogę zarządzać uczestnikami
   - ✓ Mogę anulować wydarzenie
   - ✗ Nie widzę opcji edycji
   - ✗ Nie widzę opcji usunięcia

3. **Jako uczestnik:**
   - ✗ Nie widzę panelu zarządzania

4. **Jako niezalogowany:**
   - ✗ Nie widzę panelu zarządzania

## Pliki zmodyfikowane/dodane

### Nowe pliki:

- `apps/web/src/app/intent/[id]/_components/event-admin-panel.tsx`
- `EVENT_DETAIL_ADMIN_PANEL.md` (ten plik)

### Zmodyfikowane pliki:

- `apps/web/src/app/intent/[id]/_components/event-detail-client.tsx`

## Zgodność z istniejącym kodem

Implementacja wykorzystuje te same komponenty co strona `/account/intents`:

- Zachowana spójność UX
- Reużycie istniejącej logiki
- Brak duplikacji kodu
- Zgodność z istniejącymi mutacjami GraphQL

## Przyszłe ulepszenia

Potencjalne rozszerzenia funkcjonalności:

1. Statystyki wydarzenia w panelu
2. Szybki podgląd oczekujących wniosków
3. Eksport listy uczestników
4. Historia zmian wydarzenia
5. Powiadomienia push dla moderatorów
6. Bulk actions dla uczestników
