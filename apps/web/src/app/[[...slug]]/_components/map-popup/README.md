# RegionPopup - Infinity Scroll

## Przegląd

Komponent `RegionPopup` został zaktualizowany o wsparcie dla infinity scroll używając biblioteki `react-virtuoso`. Umożliwia to płynne przewijanie dużych list wydarzeń w popup-ie mapy.

## Nowe Props

```typescript
export interface RegionPopupProps {
  intents: PopupIntent[];
  onIntentClick?: (id: string) => void;
  isLoading?: boolean;

  // Nowe props dla infinity scroll
  hasNextPage?: boolean; // Czy są kolejne strony do załadowania
  isFetchingNextPage?: boolean; // Czy trwa ładowanie kolejnej strony
  onLoadMore?: () => void; // Callback wywoływany gdy użytkownik scrolluje do końca
}
```

## Użycie

### Podstawowe użycie (bez infinity scroll)

```tsx
<RegionPopup
  intents={intents}
  isLoading={false}
  onIntentClick={(id) => console.log('Clicked:', id)}
/>
```

### Z infinity scroll

```tsx
import { useInfiniteQuery } from '@tanstack/react-query';

function MapComponent() {
  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useInfiniteQuery({
      queryKey: ['region-intents', regionId],
      queryFn: ({ pageParam = 0 }) => fetchRegionIntents(regionId, pageParam),
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    });

  const allIntents = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <RegionPopup
      intents={allIntents}
      isLoading={isLoading}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      onLoadMore={() => fetchNextPage()}
      onIntentClick={(id) => router.push(`/intent/${id}`)}
    />
  );
}
```

## Funkcjonalności

### Virtualizacja

- Używa `react-virtuoso` do renderowania tylko widocznych elementów
- Płynny scroll nawet z tysiącami wydarzeń
- Automatyczne zarządzanie wysokością elementów

### Infinity Scroll

- Automatyczne ładowanie kolejnych stron gdy użytkownik scrolluje do końca
- Loading indicator podczas ładowania kolejnych stron
- Informacja o załadowaniu wszystkich elementów

### Responsywność

- Maksymalna szerokość: 280px
- Maksymalna wysokość: 420px
- Automatyczne przewijanie gdy lista jest dłuższa

### Loading States

- **Initial loading**: Pokazuje 3 skeleton loadery
- **Loading more**: Pokazuje skeleton loader na dole listy
- **All loaded**: Pokazuje informację o liczbie załadowanych elementów

## Konfiguracja Virtuoso

```typescript
<Virtuoso
  style={{ height: '420px' }}
  data={itemsWithPlan}
  totalCount={itemsWithPlan.length}
  endReached={handleEndReached}        // Callback gdy użytkownik scrolluje do końca
  overscan={2}                          // Renderuj 2 dodatkowe elementy poza widokiem
  itemContent={renderItem}              // Renderer pojedynczego elementu
  computeItemKey={computeItemKey}       // Klucz dla każdego elementu
  components={virtuosoComponents}       // Custom komponenty (List, Footer)
  increaseViewportBy={{ top: 200, bottom: 200 }}  // Buffer dla lepszego UX
/>
```

## Przykład integracji z GraphQL

```typescript
const GET_REGION_INTENTS = gql`
  query GetRegionIntents($region: String!, $limit: Int!, $offset: Int!) {
    regionIntents(region: $region, limit: $limit, offset: $offset) {
      items {
        id
        title
        startAt
        endAt
        address
        joinedCount
        min
        max
        owner {
          name
          imageUrl
          verifiedAt
        }
        isCanceled
        isDeleted
        isFull
        isOngoing
        hasStarted
        withinLock
        canJoin
        levels
        meetingKind
        categorySlugs
      }
      hasMore
      total
    }
  }
`;

function useRegionIntents(region: string) {
  return useInfiniteQuery({
    queryKey: ['region-intents', region],
    queryFn: async ({ pageParam = 0 }) => {
      const { data } = await client.query({
        query: GET_REGION_INTENTS,
        variables: {
          region,
          limit: 20,
          offset: pageParam,
        },
      });
      return data.regionIntents;
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.hasMore) return undefined;
      return allPages.length * 20;
    },
  });
}
```

## Performance

- **Virtualizacja**: Renderuje tylko ~5-7 elementów jednocześnie (zależnie od wysokości)
- **Memoizacja**: Wszystkie callbacki są memoizowane
- **Lazy loading**: Elementy są ładowane tylko gdy są potrzebne
- **Optimistic updates**: Brak opóźnień podczas scrollowania

## Stylowanie

Komponent używa Tailwind CSS:

- Dark mode support
- Responsive design
- Smooth transitions
- Custom scrollbar (jeśli potrzebne, można dodać)

## Migracja z poprzedniej wersji

### Przed:

```tsx
<RegionPopup
  intents={allIntents}
  isLoading={loading}
  onIntentClick={handleClick}
/>
```

### Po (z infinity scroll):

```tsx
<RegionPopup
  intents={allIntents}
  isLoading={loading}
  hasNextPage={hasNextPage}
  isFetchingNextPage={isFetchingNextPage}
  onLoadMore={fetchNextPage}
  onIntentClick={handleClick}
/>
```

**Uwaga**: Stare użycie nadal działa! Nowe props są opcjonalne.
