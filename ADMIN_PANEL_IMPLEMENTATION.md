# Panel Administratora - Implementacja

## ✅ Zrealizowane (Faza 1)

### 1. **Struktura routingu i layout** (/admin/\*)

#### Pliki utworzone:

- `apps/web/src/app/admin/layout.tsx` - główny layout z sidebar i header
- `apps/web/src/app/admin/_components/admin-sidebar.tsx` - nawigacja boczna
- `apps/web/src/app/admin/_components/admin-header.tsx` - górny pasek z wyszukiwarką

**Funkcjonalność:**

- ✅ Responsywny layout z sidebar
- ✅ Nawigacja do wszystkich sekcji panelu
- ✅ Wyszukiwarka globalna (UI gotowe, logika TODO)
- ✅ Powiadomienia dla admina
- ✅ Menu użytkownika
- ⚠️ TODO: Dodać proper authentication check

### 2. **Dashboard** (/admin)

#### Pliki utworzone:

- `apps/web/src/app/admin/page.tsx` - strona główna dashboardu
- `apps/web/src/app/admin/_components/kpi-card.tsx` - komponent KPI
- `apps/web/src/app/admin/_components/alert-card.tsx` - komponent alertów

**Funkcjonalność:**

- ✅ 7 KPI kafli:
  - Aktywne wydarzenia (AVAILABLE/ONGOING)
  - Pełne/Zablokowane (% FULL/LOCKED)
  - Wnioski o dołączenie (JOIN_REQUEST)
  - Otwarte raporty (ReportStatus.OPEN)
  - Nowe recenzje
  - Nieprzeczytane DM
  - Aktywne sponsorstwa
- ✅ System alertów (warning/error/info)
- ✅ Trendy dla każdego KPI (+/- wartości)
- ⚠️ TODO: Podłączyć prawdziwe dane z API
- ⚠️ TODO: Wykresy (Intents per MeetingKind, heatmapa, rozkład Level)

### 3. **Panel Raportów** (/admin/reports) - PRIORYTET

#### Pliki utworzone:

- `apps/web/src/app/admin/reports/page.tsx` - strona raportów
- `apps/web/src/app/admin/reports/_components/reports-table.tsx` - TODO
- `apps/web/src/app/admin/reports/_components/reports-filters.tsx` - TODO
- `apps/web/src/app/admin/reports/_components/report-detail-modal.tsx` - TODO

**Funkcjonalność:**

- ✅ Integracja z `useGetReportsQuery`
- ✅ Filtry: status (OPEN/INVESTIGATING/RESOLVED/DISMISSED)
- ✅ Filtry: entity (INTENT/COMMENT/REVIEW/USER/MESSAGE)
- ✅ Tabela raportów
- ✅ Modal szczegółów raportu
- ⚠️ TODO: Komponenty tabeli i filtrów
- ⚠️ TODO: Akcje moderacyjne (zmiana statusu, działania na encji)

## 📋 TODO - Pozostałe sekcje

### Wysoki priorytet (do dokończenia w pierwszej kolejności)

#### 1. **Panel Raportów - komponenty** (IN PROGRESS)

- [ ] `reports-table.tsx` - tabela z raportami
- [ ] `reports-filters.tsx` - filtry status/entity
- [ ] `report-detail-modal.tsx` - szczegóły + akcje moderacyjne
- [ ] Akcje: updateReportStatus, działania na encji (ban, delete, etc.)

#### 2. **Panel Użytkownicy** (/admin/users)

- [ ] Lista użytkowników z filtrami (q, role, verifiedOnly)
- [ ] Sortowanie (UsersSortBy)
- [ ] Kolumny: name, email, role, verifiedAt, lastSeenAt, createdAt
- [ ] Akcje masowe: zmiana role, wysyłka powiadomień, weryfikacja
- [ ] Karta użytkownika: profil, blokady, preferencje, DM, działania admina

#### 3. **Panel Intenty** (/admin/intents)

- [ ] Lista z filtrami (visibility, joinMode, status, categories, tags, levels, kinds)
- [ ] Kolumny: title, owner, dates, kind, capacity, status, visibility
- [ ] Akcje masowe: cancel, delete, zmiana visibility
- [ ] Szczegóły: wszystkie pola + mini-mapa + sponsoring + invite links

### Średni priorytet

#### 4. **Panel Kategorie i Tagi** (/admin/categories, /admin/tags)

- [ ] CRUD dla kategorii (slug, names JSON)
- [ ] CRUD dla tagów
- [ ] Walidacja unikalności slug
- [ ] Podgląd "użyte w X intencjach"

#### 5. **Panel Komentarze i Recenzje** (/admin/comments, /admin/reviews)

- [ ] Lista komentarzy z filtrami (intentId, threadId, parentId)
- [ ] Lista recenzji z filtrem rating
- [ ] Akcje: edit, delete (soft), cascade delete wątku
- [ ] ReviewStats: średnia, rozkład 1-5

#### 6. **Panel Powiadomienia** (/admin/notifications)

- [ ] Lista z filtrami (recipientId, kind, entityType, unreadOnly)
- [ ] Akcje: mark read, delete, mark all read
- [ ] Dodaj ręcznie (SYSTEM): addNotification

### Niski priorytet (nice to have)

#### 7. **Panel DM** (/admin/dm)

- [ ] Przegląd wątków (filtry, sort by lastMessageAt)
- [ ] Szczegóły wątku: messages, reactions, readAt
- [ ] Akcje: delete message, delete thread, mark read
- [ ] Heurystyki spamu

#### 8. **Panel Czat wydarzenia** (/admin/event-chat)

- [ ] Lista per Intent
- [ ] Moderacja: edit, delete, mark read
- [ ] Telemetry: typing indicators

#### 9. **Panel Sponsoring** (/admin/sponsorship)

- [ ] Lista sponsorstw (plan, status, daty)
- [ ] Akcje: pause, cancel, extend, zmiana planu
- [ ] Liczniki: boosts, pushes

#### 10. **Narzędzia operacyjne** (/admin/tools)

- [ ] Reindeksacje (counters, search index)
- [ ] Vacuum orphaned data
- [ ] Geotile/Clustering: rekalkulacja
- [ ] Kolejki i webhooks: status, retry
- [ ] Health checks: DB, Redis, Stripe
- [ ] Eksporty/Importy CSV/JSON

#### 11. **Bezpieczeństwo** (/admin/security)

- [ ] RBAC: macierz uprawnień (ADMIN vs MODERATOR)
- [ ] Audit log globalny
- [ ] GDPR: eksport, anonimizacja, zgody
- [ ] Rate-limits / Abuse: limity, auto-flag

### Bardzo czasochłonne (do rozważenia w przyszłości)

#### 12. **Dashboard - Wykresy**

- [ ] Intents per MeetingKind (wykres kołowy)
- [ ] Heatmapa startAt (dni/godziny)
- [ ] Rozkład Level (wykres słupkowy)
- [ ] Rating distribution (histogram)
- [ ] Notyfikacje per NotificationKind (wykres)
- Wymaga: biblioteka wykresów (recharts/chart.js), agregacje danych

#### 13. **Live counters**

- [ ] Subskrypcje GraphQL dla live updates
- [ ] WebSocket connection
- [ ] Real-time badges w sidebar

## 📁 Struktura plików (utworzone)

```
apps/web/src/app/admin/
├── layout.tsx                          ✅ Główny layout
├── page.tsx                            ✅ Dashboard
├── _components/
│   ├── admin-sidebar.tsx              ✅ Nawigacja
│   ├── admin-header.tsx               ✅ Header z wyszukiwarką
│   ├── kpi-card.tsx                   ✅ Komponent KPI
│   └── alert-card.tsx                 ✅ Komponent alertów
└── reports/
    ├── page.tsx                        ✅ Strona raportów
    └── _components/
        ├── reports-table.tsx           ⏳ TODO
        ├── reports-filters.tsx         ⏳ TODO
        └── report-detail-modal.tsx     ⏳ TODO
```

## 🎨 Design System

### Kolory statusów

```typescript
// Report Status
OPEN: red (wymaga uwagi)
INVESTIGATING: amber (w trakcie)
RESOLVED: green (rozwiązane)
DISMISSED: gray (odrzucone)

// Intent Status
AVAILABLE: green
ONGOING: blue
FULL: amber
LOCKED: red
CANCELED: gray
DELETED: gray

// User Role
ADMIN: purple
MODERATOR: blue
USER: gray
```

### Komponenty reużywalne

- `KPICard` - kafle statystyk
- `AlertCard` - alerty (info/warning/error)
- `DataTable` - tabela z sortowaniem i filtrowaniem (TODO)
- `StatusBadge` - pill dla statusów (TODO)
- `ActionMenu` - dropdown z akcjami (TODO)
- `ConfirmDialog` - potwierdzenie destrukcyjnych akcji (TODO)

## 🔐 Bezpieczeństwo

### Authentication (TODO)

```typescript
// W layout.tsx
const session = await getServerSession();
if (!session || session.user.role !== 'ADMIN') {
  redirect('/');
}
```

### Authorization levels

- **ADMIN**: pełny dostęp do wszystkiego
- **MODERATOR**: dostęp do moderacji (raporty, komentarze, bany), bez zarządzania użytkownikami i ustawień

### Audit log (TODO)

Każda akcja admina powinna być logowana:

- Kto wykonał
- Co wykonał (mutation)
- Kiedy
- Payload (PII-safe)

## 📊 API Integration

### Hooki już dostępne:

- ✅ `useGetReportsQuery` - pobieranie raportów
- ✅ `useCreateReportMutation` - tworzenie raportu
- ✅ `useUpdateReportStatusMutation` - zmiana statusu
- ✅ `useDeleteReportMutation` - usuwanie raportu

### Hooki do utworzenia:

- [ ] `useGetUsersQuery` - lista użytkowników
- [ ] `useGetIntentsQuery` - już istnieje, do wykorzystania
- [ ] `useGetCategoriesQuery` - już istnieje
- [ ] `useGetTagsQuery` - już istnieje
- [ ] `useGetCommentsQuery` - TODO
- [ ] `useGetReviewsQuery` - TODO
- [ ] `useGetNotificationsQuery` - TODO
- [ ] `useGetDmThreadsQuery` - TODO

## 🚀 Deployment

### Environment variables

```env
NEXT_PUBLIC_ADMIN_ENABLED=true
ADMIN_SECRET_KEY=xxx
```

### Feature flags

```typescript
// Możliwość wyłączenia niektórych sekcji
const features = {
  dashboard: true,
  users: true,
  intents: true,
  reports: true,
  comments: true,
  reviews: true,
  categories: true,
  tags: true,
  notifications: false, // TODO
  dm: false, // TODO
  sponsorship: false, // TODO
  analytics: false, // TODO (wykresy)
  tools: false, // TODO
  security: false, // TODO
};
```

## 📈 Metryki sukcesu

### Faza 1 (MVP) - ✅ DONE

- [x] Struktura routingu i layout
- [x] Dashboard z KPI
- [x] System alertów
- [x] Panel raportów (struktura)

### Faza 2 (Core functionality) - TODO

- [ ] Panel użytkownicy (lista + karta)
- [ ] Panel intenty (lista + szczegóły)
- [ ] Panel raporty (dokończenie)
- [ ] Panel kategorie/tagi (CRUD)

### Faza 3 (Advanced) - TODO

- [ ] Panel komentarze/recenzje
- [ ] Panel powiadomienia
- [ ] Panel DM
- [ ] Narzędzia operacyjne

### Faza 4 (Analytics) - TODO

- [ ] Wykresy na dashboardzie
- [ ] Heatmapy
- [ ] Advanced analytics

### Faza 5 (Security & Compliance) - TODO

- [ ] Audit log
- [ ] GDPR tools
- [ ] Rate limiting dashboard

## 💡 Wskazówki implementacyjne

### 1. Używaj istniejących komponentów

```typescript
// Z projektu
import { Modal } from '@/components/feedback/modal';
import { NoticeModal } from '@/components/feedback/notice-modal';
```

### 2. Spójne filtry

```typescript
// Wzór dla wszystkich list
interface Filters {
  search?: string;
  status?: Status;
  sortBy?: SortBy;
  sortDir?: SortDir;
  limit?: number;
  offset?: number;
}
```

### 3. Bulk actions pattern

```typescript
const [selectedIds, setSelectedIds] = useState<string[]>([]);

// Checkbox w header
<input
  type="checkbox"
  checked={selectedIds.length === items.length}
  onChange={(e) => {
    if (e.target.checked) {
      setSelectedIds(items.map(i => i.id));
    } else {
      setSelectedIds([]);
    }
  }}
/>

// Akcje
{selectedIds.length > 0 && (
  <BulkActions
    count={selectedIds.length}
    onDelete={() => bulkDelete(selectedIds)}
    onUpdate={() => bulkUpdate(selectedIds)}
  />
)}
```

### 4. Confirmation dialogs

```typescript
// Zawsze pytaj przed destrukcyjnymi akcjami
<NoticeModal
  variant="error"
  title="Usunąć użytkownika?"
  subtitle="Ta akcja jest nieodwracalna"
  onPrimary={handleDelete}
/>
```

## 🎯 Następne kroki

1. **Dokończ panel raportów** (komponenty tabeli i modalu)
2. **Stwórz panel użytkownicy** (najważniejszy po raportach)
3. **Stwórz panel intenty** (wykorzystaj istniejące hooki)
4. **Dodaj authentication check** w layout
5. **Podłącz prawdziwe dane** do dashboardu (KPI z API)
6. **Stwórz reużywalne komponenty** (DataTable, StatusBadge, ActionMenu)
7. **Dodaj testy** dla krytycznych funkcji
8. **Dokumentacja** dla moderatorów (jak używać panelu)

## 📚 Dokumentacja dla użytkowników

TODO: Stworzyć przewodnik dla moderatorów:

- Jak przeglądać raporty
- Jak moderować treści
- Jak zarządzać użytkownikami
- Jak interpretować statystyki
- Best practices moderacji
