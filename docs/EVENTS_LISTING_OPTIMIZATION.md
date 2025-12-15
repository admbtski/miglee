# Events Listing Query Optimization

## Cel
Optymalizacja pobierania wydarzeń dla listy/grida poprzez redukcję ilości przesyłanych danych z API.

## Zmiany

### 1. Nowy fragment GraphQL: `EventCardData`
**Plik:** `packages/contracts/graphql/fragments/events.graphql`

Stworzony minimalny fragment zawierający **tylko** pola rzeczywiście używane w komponencie `EventCard`:

- **Podstawowe:** `id`, `title`, `min`, `max`, `startAt`, `endAt`
- **Lokalizacja:** `lat`, `lng`, `address`, `radiusKm`, `addressVisibility`, `meetingKind`
- **Wygląd:** `coverKey`, `coverBlurhash`, `appearance`
- **Join config:** `allowJoinLate`, `joinOpensMinutesBeforeStart`, `joinCutoffMinutesBeforeStart`, etc.
- **Computed fields:** `joinedCount`, `isFull`, `hasStarted`, `isCanceled`, `isDeleted`, `canJoin`, `isOngoing`, `isOnsite`, `isOnline`, `isHybrid`, `isFavourite`
- **Boost:** `boostedAt`
- **Relacje (minimal):** 
  - `categories` (tylko `CategoryCore`)
  - `owner` (tylko: `id`, `name`, `email`, `avatarKey`, `avatarBlurhash`, `verifiedAt`)

**Pominięto** (nie używane w karcie):
- `description`, `notes`
- `visibility`, `joinMode`, `mode`
- `onlineUrl`, `placeId`, `levels`
- `membersVisibility`
- `commentsCount`, `messagesCount`, `hasEnded`
- `publicationStatus`, `publishedAt`, `scheduledPublishAt`
- `ownerId`, `createdAt`, `updatedAt`
- `sponsorshipPlan`, checkin fields
- Rozbudowane relacje (`tags`, `members`, `sponsorship`, etc.)

### 2. Nowy result wrapper: `EventsListingResult`
Fragment wrappera dla wyników query używający `EventCardData`.

### 3. Nowa query: `GetEventsListing`
**Plik:** `packages/contracts/graphql/operations/events.graphql`

Query przyjmująca te same parametry co `GetEvents`, ale zwracająca dane przez `EventsListingResult`.

**Dodano również:**
- Parametr `joinModes: [JoinMode!]` (obsługuje multi-select)

### 4. Nowy hook: `useEventsListingInfiniteQuery`
**Plik:** `apps/web/src/features/events/api/events.tsx`

Zoptymalizowana wersja infinite query hook'a dla list wydarzeń:
- `buildGetEventsListingInfiniteOptions()` - builder
- `useEventsListingInfiniteQuery()` - publiczny hook
- `GET_EVENTS_LISTING_INFINITE_KEY()` - klucz cache

### 5. Aktualizacja komponentu EventsPage
**Plik:** `apps/web/src/app/[locale]/events/events-page-client.tsx`

Zmieniono z `useEventsInfiniteQuery` na `useEventsListingInfiniteQuery`.

## Korzyści

### Redukcja rozmiaru odpowiedzi
Dla typowego wydarzenia:
- **Przed:** ~2.5-3 KB JSON (z pełnym `EventCore`)
- **Po:** ~1-1.5 KB JSON (tylko `EventCardData`)
- **Oszczędność:** ~40-50% danych

Dla strony z 20 wydarzeniami:
- **Przed:** ~50-60 KB
- **Po:** ~20-30 KB
- **Redukcja:** ~50% mniejszy payload

### Wydajność
- Szybsze pobieranie (mniej danych przez sieć)
- Mniejsze zużycie pamięci na kliencie
- Szybsze parsowanie JSON
- Mniejsze obciążenie bazy danych (mniej joinów)

### Kompatybilność wsteczna
- Stara query `GetEvents` pozostaje niezmieniona
- Komponenty szczegółowe (`EventDetail`) nadal używają pełnych danych
- Brak breaking changes

## Użycie

```typescript
// W komponencie listy wydarzeń
import { useEventsListingInfiniteQuery } from '@/features/events/api/events';

const { data, fetchNextPage, hasNextPage } = useEventsListingInfiniteQuery({
  limit: 20,
  status: 'UPCOMING',
  // ... inne filtry
});
```

## Resolver
Query używa istniejącego resolvera `events` z `apps/api/src/graphql/resolvers/query/events.ts`.
Fragment automatycznie ogranicza zwracane pola.

## Testy
Po wdrożeniu należy przetestować:
- [ ] Poprawne wyświetlanie kart wydarzeń
- [ ] Infinite scroll działa poprawnie
- [ ] Wszystkie filtry działają
- [ ] Hover na karcie (mapa) działa
- [ ] Favourites działają
- [ ] Boost badges wyświetlają się poprawnie

## Przyszłe optymalizacje
- Dodać cache w Redis dla częstych zapytań
- Rozważyć DataLoader dla batch loading
- Compression (gzip/brotli) na poziomie API
- GraphQL persisted queries

