# GraphQL Contracts - Recommendations & Best Practices

## ✅ Co zostało poprawione

### 1. **Formatowanie i organizacja**

- ✅ Dodane sekcje z wyraźnymi separatorami (`=============`)
- ✅ Spójne komentarze dla wszystkich operations
- ✅ Logiczne grupowanie queries, mutations, subscriptions

### 2. **Nowe fragmenty**

- ✅ `IntentLight` - lekka wersja dla list (lepsza wydajność)
- ✅ `IntentMemberLight` - lekka wersja członków
- ✅ `IntentsResultLight` - paginowane wyniki z lekkimi danymi

### 3. **Poprawione operations**

- ✅ Dodane `sortBy` i `sortDir` do `GetIntents`
- ✅ Nowe query `GetIntentsLight` dla lepszej wydajności
- ✅ Dodana mutation `DeleteNotification`
- ✅ Poprawione typy zwracane przez membership mutations (Intent zamiast IntentMember)
- ✅ Dodane `intentId` i `userId` do `IntentMemberCore`

### 4. **Dokumentacja**

- ✅ Utworzony README.md z przykładami użycia
- ✅ Komentarze wyjaśniające przeznaczenie każdej operacji

---

## 📋 Dodatkowe rekomendacje

### 1. **Optymalizacja wydajności**

#### A. DataLoader pattern (backend)

Zaimplementuj DataLoader dla N+1 query problem:

```typescript
// apps/api/src/graphql/dataloaders.ts
import DataLoader from 'dataloader';

export const createLoaders = () => ({
  userLoader: new DataLoader(async (ids: string[]) => {
    const users = await prisma.user.findMany({
      where: { id: { in: ids } },
    });
    return ids.map((id) => users.find((u) => u.id === id));
  }),

  categoryLoader: new DataLoader(async (ids: string[]) => {
    const categories = await prisma.category.findMany({
      where: { id: { in: ids } },
    });
    return ids.map((id) => categories.find((c) => c.id === id));
  }),
});
```

#### B. Field-level caching

Dodaj cache hints do schema:

```graphql
type Category @cacheControl(maxAge: 3600) {
  id: ID!
  slug: String!
  names: JSONObject!
}

type Intent @cacheControl(maxAge: 60) {
  id: ID!
  title: String!
  # ...
}
```

### 2. **Persisted Queries**

Dla produkcji, użyj persisted queries (bezpieczeństwo + wydajność):

```typescript
// apps/web/lib/graphql/persisted-queries.ts
import { createPersistedQueryLink } from '@apollo/client/link/persisted-queries';
import { sha256 } from 'crypto-hash';

const persistedQueriesLink = createPersistedQueryLink({ sha256 });
```

### 3. **Batching i Deduplication**

Włącz batching dla Apollo Client:

```typescript
// apps/web/lib/graphql/client.ts
import { BatchHttpLink } from '@apollo/client/link/batch-http';

const batchLink = new BatchHttpLink({
  uri: '/graphql',
  batchMax: 10,
  batchInterval: 20,
});
```

### 4. **Error Handling**

Stwórz standardowe error codes:

```graphql
# packages/contracts/graphql/schema.graphql
enum ErrorCode {
  UNAUTHENTICATED
  UNAUTHORIZED
  NOT_FOUND
  BAD_USER_INPUT
  FAILED_PRECONDITION
  RATE_LIMITED
  INTERNAL_ERROR
}

type Error {
  code: ErrorCode!
  message: String!
  field: String
  details: JSON
}
```

### 5. **Pagination - Cursor-based**

Rozważ cursor-based pagination dla lepszej wydajności:

```graphql
type IntentEdge {
  cursor: String!
  node: Intent!
}

type IntentConnection {
  edges: [IntentEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}

type Query {
  intents(
    first: Int
    after: String
    last: Int
    before: String
  ): IntentConnection!
}
```

### 6. **Real-time Updates - Optimistic UI**

Dodaj optimistic responses dla lepszego UX:

```typescript
// apps/web/hooks/graphql/intents.tsx
const [joinIntent] = useMutation(JOIN_INTENT, {
  optimisticResponse: {
    requestJoinIntent: {
      __typename: 'Intent',
      id: intentId,
      joinedCount: intent.joinedCount + 1,
      // ... inne pola
    },
  },
  update: (cache, { data }) => {
    // Aktualizuj cache
  },
});
```

### 7. **Type Safety - Strict Mode**

Włącz strict mode w codegen:

```yaml
# packages/contracts/graphql/codegen.ts
generates:
  './src/__generated__/types.ts':
    plugins:
      - typescript
      - typescript-operations
      - typescript-react-apollo
    config:
      strictScalars: true
      scalars:
        DateTime: string
        JSON: Record<string, any>
        JSONObject: Record<string, any>
      avoidOptionals:
        field: true
        inputValue: false
      maybeValue: T | null
```

### 8. **Subscription Filters**

Dodaj filtry do subscriptions:

```graphql
type Subscription {
  notificationAdded(
    recipientId: ID!
    kinds: [NotificationKind!] # Filtruj po typie
  ): Notification!

  intentUpdated(intentId: ID!): Intent!
}
```

### 9. **Rate Limiting**

Dodaj rate limiting do schema:

```graphql
type Mutation {
  createIntent(input: CreateIntentInput!): Intent!
    @rateLimit(limit: 10, duration: 60) # 10 per minute
  sendMessage(input: SendMessageInput!): Message!
    @rateLimit(limit: 30, duration: 60) # 30 per minute
}
```

### 10. **Monitoring & Tracing**

Dodaj custom scalars dla metryk:

```graphql
directive @trace(label: String, threshold: Int) on FIELD_DEFINITION

type Query {
  intents: IntentsResult! @trace(label: "intents_query", threshold: 1000)
  intent(id: ID!): Intent @trace(label: "intent_detail")
}
```

### 11. **Schema Stitching / Federation**

Jeśli planujesz microservices, rozważ Apollo Federation:

```graphql
# Service 1: Users
type User @key(fields: "id") {
  id: ID!
  name: String!
  email: String!
}

# Service 2: Intents
type Intent {
  id: ID!
  title: String!
  owner: User @provides(fields: "id name")
}
```

### 12. **Input Validation**

Dodaj custom directives dla walidacji:

```graphql
directive @constraint(
  minLength: Int
  maxLength: Int
  pattern: String
  min: Float
  max: Float
) on INPUT_FIELD_DEFINITION | ARGUMENT_DEFINITION

input CreateIntentInput {
  title: String! @constraint(minLength: 3, maxLength: 100)
  description: String @constraint(maxLength: 2000)
  min: Int! @constraint(min: 2, max: 1000)
  max: Int! @constraint(min: 2, max: 1000)
}
```

### 13. **Deprecation Strategy**

Oznaczaj deprecated fields:

```graphql
type Intent {
  id: ID!
  title: String!

  # Old field (deprecated)
  location: String @deprecated(reason: "Use lat/lng/address instead")

  # New fields
  lat: Float
  lng: Float
  address: String
}
```

### 14. **Testing**

Stwórz mock server dla testów:

```typescript
// packages/contracts/graphql/mocks.ts
import { MockedProvider } from '@apollo/client/testing';

export const intentMocks = [
  {
    request: {
      query: GET_INTENTS,
      variables: { limit: 20 },
    },
    result: {
      data: {
        intents: {
          items: [
            /* mock data */
          ],
          pageInfo: { total: 100, hasNext: true },
        },
      },
    },
  },
];
```

### 15. **Documentation Generation**

Użyj GraphQL Voyager lub Magidoc:

```bash
# Wygeneruj interaktywną dokumentację
pnpm add -D @magidoc/cli

# magidoc.config.js
module.exports = {
  introspection: {
    type: 'sdl',
    paths: ['packages/contracts/graphql/schema.graphql']
  },
  website: {
    template: 'carbon-multi-page',
    output: 'docs/graphql'
  }
};
```

---

## 🎯 Priority Recommendations

### High Priority (Zrób teraz)

1. ✅ **Używaj `IntentLight` dla list** - już zaimplementowane
2. 🔄 **Dodaj DataLoader** - eliminuje N+1 problem
3. 🔄 **Włącz batching** - redukuje liczbę requestów

### Medium Priority (Najbliższe 2-4 tygodnie)

4. 🔄 **Persisted queries** - bezpieczeństwo + wydajność
5. 🔄 **Optimistic UI** - lepsze UX
6. 🔄 **Error handling** - standardowe kody błędów

### Low Priority (Nice to have)

7. 🔄 **Cursor pagination** - dla bardzo dużych list
8. 🔄 **Apollo Federation** - jeśli planujesz microservices
9. 🔄 **GraphQL Voyager** - wizualizacja schema

---

## 📊 Metryki do monitorowania

1. **Query Performance**
   - Średni czas odpowiedzi per query
   - 95th percentile latency
   - Liczba N+1 queries

2. **Cache Hit Rate**
   - Apollo cache hit ratio
   - Redis cache hit ratio (jeśli używasz)

3. **Error Rate**
   - Błędy per endpoint
   - Typy błędów (4xx vs 5xx)

4. **Usage Patterns**
   - Najpopularniejsze queries
   - Overfetching ratio (requested vs used fields)

---

## 🔗 Przydatne linki

- [Apollo Best Practices](https://www.apollographql.com/docs/react/data/operation-best-practices/)
- [GraphQL Performance](https://graphql.org/learn/best-practices/)
- [DataLoader Pattern](https://github.com/graphql/dataloader)
- [Persisted Queries](https://www.apollographql.com/docs/apollo-server/performance/apq/)
