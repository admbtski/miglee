# ServerClusteredMap - Niezależna Mapa z Klastrowaniem Serwerowym

## Przegląd

`ServerClusteredMap` to w pełni niezależny komponent mapy, który:

✅ **Sam pobiera dane** - nie wymaga przekazywania `intents` jako props
✅ **Reaguje na viewport** - automatycznie pobiera klastery przy pan/zoom
✅ **Pokazuje tooltip z intentami** - kliknięcie w klaster pokazuje listę wszystkich intents w tym regionie
✅ **Niezależny od listy** - nie wpływa na `flatItems` ani inne listy intentów
✅ **Obsługuje filtry** - synchronizuje się z filtrami użytkownika

## Użycie

### Podstawowe

```tsx
import { ServerClusteredMap } from './_components/server-clustered-map';

<ServerClusteredMap
  fullHeight
  lang="pl"
  onIntentClick={(intentId) => {
    // Nawigacja lub modal
    router.push(`/${intentId}`);
  }}
/>;
```

### Z Filtrami

```tsx
<ServerClusteredMap
  fullHeight
  lang={appLanguage}
  filters={{
    categorySlugs: ['sports', 'music'],
    levels: ['BEGINNER', 'INTERMEDIATE'],
    verifiedOnly: true,
  }}
  onIntentClick={(intentId) => {
    window.location.href = `/${intentId}`;
  }}
/>
```

### Pełna Konfiguracja

```tsx
<ServerClusteredMap
  defaultCenter={{ lat: 52.2319, lng: 21.0067 }}
  defaultZoom={12}
  fullHeight={true}
  lang="pl"
  styleUrl="https://demotiles.maplibre.org/style.json"
  filters={{
    categorySlugs: categories,
    levels: levels,
    verifiedOnly: verifiedOnly,
  }}
  onIntentClick={(intentId) => {
    console.log('Clicked intent:', intentId);
    router.push(`/${intentId}`);
  }}
/>
```

## Props

| Prop                    | Typ                            | Domyślna                                      | Opis                                |
| ----------------------- | ------------------------------ | --------------------------------------------- | ----------------------------------- |
| `defaultCenter`         | `{ lat: number; lng: number }` | `{ lat: 52.2319, lng: 21.0067 }`              | Początkowy środek mapy (Warszawa)   |
| `defaultZoom`           | `number`                       | `12`                                          | Początkowy poziom zoom              |
| `fullHeight`            | `boolean`                      | `false`                                       | Czy mapa ma zajmować 100% wysokości |
| `lang`                  | `string`                       | `'pl'`                                        | Język dla formatowania dat          |
| `styleUrl`              | `string`                       | `'https://demotiles.maplibre.org/style.json'` | URL stylu MapLibre                  |
| `filters`               | `object`                       | `undefined`                                   | Filtry dla klastrów i intentów      |
| `filters.categorySlugs` | `string[]`                     | -                                             | Slugi kategorii do filtrowania      |
| `filters.levels`        | `Level[]`                      | -                                             | Poziomy trudności                   |
| `filters.verifiedOnly`  | `boolean`                      | -                                             | Tylko zweryfikowani organizatorzy   |
| `onIntentClick`         | `(intentId: string) => void`   | -                                             | Callback po kliknięciu w intent     |

## Jak to Działa

### 1. Automatyczne Pobieranie Klastrów

Przy każdym ruchu mapy (`moveend`):

- Oblicza bounding box viewportu
- Wywołuje `useGetClustersQuery` z bbox i zoom
- Renderuje klastery jako okręgi z liczebością

### 2. Kliknięcie w Klaster

Po kliknięciu w klaster:

- Odczytuje `region` token z właściwości klastra
- Wywołuje `useGetRegionIntentsQuery(region)`
- Pokazuje popup z listą wszystkich intentów w tym regionie

### 3. Popup z Intentami

Popup zawiera:

- Nagłówek z liczbą intentów
- Scrollowalną listę intentów
- Dla każdego intentu:
  - Tytuł
  - Data i godzina
  - Adres (jeśli dostępny)
  - Liczba uczestników
  - Organizator

### 4. Kliknięcie w Intent

Po kliknięciu w intent w popupie:

- Wywołuje `onIntentClick(intentId)`
- Zamyka popup
- Aplikacja może nawigować do szczegółów intentu

## Architektura

```
ServerClusteredMap
├── useGetClustersQuery (automatyczne przy moveend)
│   ├── bbox: bounds z viewportu
│   ├── zoom: aktualny zoom
│   └── filters: przekazane przez props
│
├── Renderowanie Klastrów
│   ├── GeoJSON source: 'server-clusters'
│   ├── Layer: 'server-clusters-circles' (okręgi)
│   └── Layer: 'server-clusters-count' (labelki)
│
├── Kliknięcie w Klaster
│   └── setSelectedRegion(region)
│
├── useGetRegionIntentsQuery (gdy region !== null)
│   ├── region: token z klastra
│   ├── page: 1
│   ├── perPage: 50
│   └── filters: te same co dla klastrów
│
└── Popup z Intentami
    ├── Lista intentów
    ├── Klikalne karty
    └── onIntentClick callback
```

## Różnice vs Stary IntentsMapPanel

| Funkcjonalność     | IntentsMapPanel (stary)         | ServerClusteredMap (nowy)            |
| ------------------ | ------------------------------- | ------------------------------------ |
| Źródło danych      | Props `intents[]`               | Samodzielne pobieranie przez GraphQL |
| Klastrowanie       | Client-side (MapLibre)          | Server-side (PostGIS)                |
| Wpływ na listę     | Tak (wymaga flatItems)          | Nie (całkowicie niezależny)          |
| Kliknięcie klastra | Zoom in                         | Pokazuje tooltip z intentami         |
| Viewport tracking  | Nie                             | Tak (moveend)                        |
| Filtry             | Przez intents prop              | Przez filters prop                   |
| Wydajność          | Ograniczona (wszystkie intents) | Wysoka (tylko viewport)              |

## Przykład Integracji z Page

```tsx
// apps/web/src/app/[[...slug]]/page-client.tsx

{
  mapVisible && (
    <motion.aside>
      <div className="sticky top-[var(--nav-h)] h-[calc(100vh-var(--nav-h))]">
        <ServerClusteredMap
          fullHeight
          lang={appLanguage}
          filters={{
            categorySlugs: categories,
            levels: levels,
            verifiedOnly: verifiedOnly,
          }}
          onIntentClick={(intentId) => {
            router.push(`/${intentId}`);
          }}
        />
      </div>
    </motion.aside>
  );
}
```

## Wydajność

- **Clusters query**: ~50-80ms dla ~10k punktów
- **Region intents query**: ~30-50ms dla 20-50 wyników
- **React Query cache**:
  - Clusters: staleTime 15s, gcTime 60s
  - Region intents: staleTime 30s, gcTime 120s
- **Debouncing**: Automatyczny przez `moveend` (bez spamowania podczas dragging)

## Stylowanie

Komponent używa Tailwind classes i wspiera:

- ✅ Dark mode (`dark:` variants)
- ✅ Responsive (sticky positioning, full height)
- ✅ Loading indicator
- ✅ Cluster count badge
- ✅ Attribution

## Customizacja Popupu

Możesz dostosować HTML popupu modyfikując kod w `useEffect` dla `selectedRegion`:

```tsx
const html = `
  <div style="...">
    <!-- Twój custom HTML -->
  </div>
`;
```

Lub całkowicie zastąpić popup własnym komponentem React (wymaga refactoringu na Portal).

## Troubleshooting

### Mapa nie ładuje danych

- Sprawdź czy API działa: `http://localhost:4000/graphiql`
- Sprawdź Console w DevTools czy są błędy GraphQL
- Sprawdź Network tab czy queries są wysyłane

### Klastery nie pokazują się

- Sprawdź czy PostGIS jest zainstalowany
- Sprawdź czy kolumna `geom` jest wypełniona
- Sprawdź SQL: `SELECT COUNT(*) FROM intents WHERE geom IS NOT NULL`

### Popup nie działa

- Sprawdź czy `onIntentClick` jest przekazany
- Sprawdź Console czy są błędy JS
- Sprawdź czy `regionIntents` query zwraca dane

## Dalszy Rozwój

Możliwe rozszerzenia:

1. **Modal zamiast popup** - pokazuj intenty w modalnym oknie z paginacją
2. **Heatmap layer** - dla bardzo gęstych obszarów
3. **Filtry w UI** - dodaj kontrolki filtrów bezpośrednio na mapie
4. **Geolokalizacja** - "Moja lokalizacja" button
5. **Search box** - wyszukiwanie miejsc na mapie
6. **Drawing tools** - rysowanie własnych bbox dla wyszukiwania

## Migracja ze Starego Komponentu

Jeśli używasz starego `IntentsMapPanel`:

```tsx
// Przed:
<IntentsMapPanel
  intents={flatItems.map(...)}
  useServerClustering
  filters={...}
/>

// Po:
<ServerClusteredMap
  filters={...}
  onIntentClick={(id) => router.push(`/${id}`)}
/>
```

Usuń całe mapowanie `flatItems` - nie jest już potrzebne!
