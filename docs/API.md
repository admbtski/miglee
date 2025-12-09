# Dokumentacja API GraphQL

## Wprowadzenie

Miglee wykorzystuje GraphQL jako główne API. Wszystkie zapytania są wykonywane przez endpoint `/graphql` z obsługą WebSocket dla subscriptions.

## Autentykacja

API wykorzystuje JWT (JSON Web Tokens) do autentykacji. Token jest przekazywany w cookie lub headerze `Authorization`.

### Przykład Request

```http
POST /graphql
Content-Type: application/json
Cookie: token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "query": "query { me { id name email } }"
}
```

## Główne Query

### Użytkownicy

#### `me`

Pobiera informacje o zalogowanym użytkowniku.

```graphql
query {
  me {
    id
    name
    email
    role
    avatarKey
    effectivePlan
    profile {
      displayName
      bioShort
    }
  }
}
```

#### `user`

Pobiera informacje o użytkowniku po ID lub nazwie.

```graphql
query {
  user(id: "user123") {
    id
    name
    avatarKey
    profile {
      displayName
      city
    }
    stats {
      eventsCreated
      eventsJoined
    }
  }
}
```

### Wydarzenia

#### `events`

Pobiera listę wydarzeń z filtrowaniem i paginacją.

```graphql
query {
  events(
    limit: 20
    offset: 0
    status: UPCOMING
    categorySlugs: ["running", "cycling"]
    near: { lat: 52.2297, lng: 21.0122, radiusKm: 10 }
    sortBy: START_AT
    sortDir: ASC
  ) {
    items {
      id
      title
      startAt
      endAt
      joinedCount
      owner {
        name
      }
    }
    pageInfo {
      total
      hasNext
      hasPrev
    }
  }
}
```

#### `event`

Pobiera szczegóły pojedynczego wydarzenia.

```graphql
query {
  event(id: "event123") {
    id
    title
    description
    startAt
    endAt
    location {
      lat
      lng
      address
    }
    owner {
      id
      name
    }
    members {
      id
      user {
        name
      }
      role
      status
    }
    canJoin
    joinOpen
    lockReason
  }
}
```

#### `myEvents`

Pobiera wydarzenia użytkownika z filtrowaniem.

```graphql
query {
  myEvents(
    role: OWNER
    membershipStatus: JOINED
    eventStatuses: [UPCOMING, ONGOING]
    limit: 50
  ) {
    id
    event {
      id
      title
      startAt
      status
    }
    role
    status
  }
}
```

### Członkostwo

#### `eventMembers`

Pobiera listę członków wydarzenia.

```graphql
query {
  eventMembers(
    eventId: "event123"
    status: JOINED
    role: PARTICIPANT
    limit: 50
  ) {
    id
    user {
      id
      name
      avatarKey
    }
    role
    status
    joinedAt
  }
}
```

#### `eventPermissions`

Sprawdza uprawnienia użytkownika do wydarzenia.

```graphql
query {
  eventPermissions(eventId: "event123") {
    isOwner
    isModerator
    isParticipant
    canManage
  }
}
```

### Komunikacja

#### `comments`

Pobiera komentarze wydarzenia.

```graphql
query {
  comments(eventId: "event123", limit: 50, offset: 0) {
    items {
      id
      content
      createdAt
      author {
        id
        name
      }
      replies {
        id
        content
        author {
          name
        }
      }
    }
    pageInfo {
      total
      hasNext
    }
  }
}
```

#### `eventMessages`

Pobiera wiadomości z czatu wydarzenia (cursor-based pagination).

```graphql
query {
  eventMessages(eventId: "event123", first: 20, after: "cursor123") {
    edges {
      node {
        id
        content
        createdAt
        author {
          id
          name
        }
        reactions {
          emoji
          count
          reacted
        }
      }
      cursor
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
  }
}
```

#### `dmThreads`

Pobiera wątki wiadomości prywatnych.

```graphql
query {
  dmThreads(limit: 20, offset: 0, unreadOnly: false) {
    items {
      id
      aUser {
        id
        name
      }
      bUser {
        id
        name
      }
      lastMessage {
        content
        createdAt
      }
      unreadCount
    }
    pageInfo {
      total
      hasNext
    }
  }
}
```

### Powiadomienia

#### `notifications`

Pobiera powiadomienia użytkownika.

```graphql
query {
  notifications(
    recipientId: "user123"
    unreadOnly: true
    limit: 50
    offset: 0
  ) {
    items {
      id
      kind
      title
      body
      readAt
      createdAt
      actor {
        name
      }
      event {
        id
        title
      }
    }
    pageInfo {
      total
      hasNext
    }
  }
}
```

### Mapy

#### `clusters`

Pobiera klastry wydarzeń na mapie.

```graphql
query {
  clusters(
    bbox: { swLat: 52.0, swLon: 20.0, neLat: 52.5, neLon: 21.0 }
    zoom: 10
    filters: { categorySlugs: ["running"], status: UPCOMING }
  ) {
    id
    latitude
    longitude
    count
    region
    geoJson
  }
}
```

#### `regionEvents`

Pobiera wydarzenia w regionie mapy.

```graphql
query {
  regionEvents(
    region: "cluster123"
    page: 1
    perPage: 20
    filters: { categorySlugs: ["cycling"] }
  ) {
    data {
      id
      title
      startAt
      lat
      lng
    }
    meta {
      page
      totalItems
      totalPages
    }
  }
}
```

## Główne Mutations

### Wydarzenia

#### `createEvent`

Tworzy nowe wydarzenie.

```graphql
mutation {
  createEvent(
    input: {
      title: "Bieg w Parku"
      categorySlugs: ["running"]
      startAt: "2024-12-25T10:00:00Z"
      endAt: "2024-12-25T12:00:00Z"
      meetingKind: ONSITE
      location: {
        lat: 52.2297
        lng: 21.0122
        address: "Park Łazienkowski, Warszawa"
        placeId: "ChIJ..."
      }
      visibility: PUBLIC
      joinMode: OPEN
      mode: GROUP
      max: 20
    }
  ) {
    id
    title
    status
  }
}
```

#### `updateEvent`

Aktualizuje wydarzenie.

```graphql
mutation {
  updateEvent(
    id: "event123"
    input: { title: "Zaktualizowany tytuł", description: "Nowy opis", max: 30 }
  ) {
    id
    title
    description
    max
  }
}
```

#### `publishEvent`

Publikuje wydarzenie (DRAFT/SCHEDULED → PUBLISHED).

```graphql
mutation {
  publishEvent(id: "event123") {
    id
    publicationStatus
    publishedAt
  }
}
```

#### `scheduleEventPublication`

Planuje publikację wydarzenia.

```graphql
mutation {
  scheduleEventPublication(id: "event123", publishAt: "2024-12-20T10:00:00Z") {
    id
    publicationStatus
    scheduledPublishAt
  }
}
```

### Członkostwo

#### `requestJoinEventWithAnswers`

Wysyła prośbę o dołączenie z odpowiedziami na pytania.

```graphql
mutation {
  requestJoinEventWithAnswers(
    input: {
      eventId: "event123"
      answers: [{ questionId: "q1", answer: "Mam doświadczenie w bieganiu" }]
    }
  ) {
    id
    canJoin
    myMembership {
      status
    }
  }
}
```

#### `approveJoinRequest`

Zatwierdza prośbę o dołączenie.

```graphql
mutation {
  approveJoinRequest(input: { eventId: "event123", userId: "user456" }) {
    id
    members {
      id
      status
    }
  }
}
```

#### `rejectJoinRequest`

Odrzuca prośbę o dołączenie.

```graphql
mutation {
  rejectJoinRequest(
    input: { eventId: "event123", userId: "user456", reason: "Brak miejsc" }
  ) {
    id
  }
}
```

### Komunikacja

#### `createComment`

Dodaje komentarz do wydarzenia.

```graphql
mutation {
  createComment(
    input: {
      eventId: "event123"
      content: "Świetne wydarzenie!"
      parentId: null
    }
  ) {
    id
    content
    createdAt
    author {
      name
    }
  }
}
```

#### `sendEventMessage`

Wysyła wiadomość w czacie wydarzenia.

```graphql
mutation {
  sendEventMessage(
    input: { eventId: "event123", content: "Cześć wszystkim!", replyToId: null }
  ) {
    id
    content
    createdAt
    author {
      name
    }
  }
}
```

#### `sendDmMessage`

Wysyła wiadomość prywatną.

```graphql
mutation {
  sendDmMessage(
    input: { recipientId: "user456", content: "Cześć!", replyToId: null }
  ) {
    id
    content
    createdAt
    sender {
      name
    }
  }
}
```

### Recenzje i Feedback

#### `submitReviewAndFeedback`

Przesyła recenzję i odpowiedzi na feedback.

```graphql
mutation {
  submitReviewAndFeedback(
    input: {
      eventId: "event123"
      rating: 5
      content: "Świetne wydarzenie!"
      feedbackAnswers: [
        { questionId: "fq1", answer: "Bardzo dobrze zorganizowane" }
      ]
    }
  ) {
    review {
      id
      rating
      content
    }
    feedbackAnswers {
      id
      answer
    }
  }
}
```

### Billing

#### `createSubscriptionCheckout`

Tworzy sesję checkout dla subskrypcji.

```graphql
mutation {
  createSubscriptionCheckout(
    input: { plan: PLUS, billingPeriod: MONTHLY, withTrial: true }
  ) {
    checkoutUrl
    sessionId
  }
}
```

#### `createEventSponsorshipCheckout`

Tworzy sesję checkout dla sponsoringu wydarzenia.

```graphql
mutation {
  createEventSponsorshipCheckout(
    input: {
      eventId: "event123"
      plan: PRO
      actionType: "new"
      actionPackageSize: 1
    }
  ) {
    checkoutUrl
    sessionId
    sponsorshipId
  }
}
```

## Subscriptions

### Powiadomienia

```graphql
subscription {
  notificationAdded(recipientId: "user123") {
    id
    kind
    title
    body
    createdAt
    actor {
      name
    }
    event {
      id
      title
    }
  }
}
```

### Chat Wydarzeń

```graphql
subscription {
  eventMessageAdded(eventId: "event123") {
    id
    content
    createdAt
    author {
      id
      name
    }
  }

  eventTyping(eventId: "event123") {
    userId
    isTyping
  }
}
```

### Wiadomości Prywatne

```graphql
subscription {
  dmMessageAdded(threadId: "thread123") {
    id
    content
    createdAt
    sender {
      id
      name
    }
  }

  dmTyping(threadId: "thread123") {
    userId
    isTyping
  }
}
```

## Błędy

API zwraca błędy w standardowym formacie GraphQL:

```json
{
  "errors": [
    {
      "message": "Event not found",
      "extensions": {
        "code": "NOT_FOUND",
        "field": "eventId"
      }
    }
  ],
  "data": null
}
```

### Kody Błędów

- `UNAUTHORIZED` - Brak autentykacji
- `FORBIDDEN` - Brak uprawnień
- `NOT_FOUND` - Zasób nie znaleziony
- `VALIDATION_ERROR` - Błąd walidacji
- `RATE_LIMIT_EXCEEDED` - Przekroczony limit zapytań

## Rate Limiting

API ma włączony rate limiting:

- **Query/Mutation:** 100 requestów na minutę na użytkownika
- **Subscription:** Bez limitu (ale z timeoutem)

## WebSocket

Subscriptions używają WebSocket przez endpoint `ws://localhost:4000/graphql`.

### Przykład Połączenia

```javascript
import { createClient } from 'graphql-ws';

const client = createClient({
  url: 'ws://localhost:4000/graphql',
  connectionParams: {
    token: 'your-jwt-token',
  },
});
```

## Przykłady Użycia

### React z GraphQL Request

```typescript
import { request } from 'graphql-request';

const GET_EVENTS = `
  query {
    events(limit: 10) {
      items {
        id
        title
        startAt
      }
    }
  }
`;

const events = await request('http://localhost:4000/graphql', GET_EVENTS);
```

### React z TanStack Query

```typescript
import { useQuery } from '@tanstack/react-query';
import { request } from 'graphql-request';

function useEvents() {
  return useQuery({
    queryKey: ['events'],
    queryFn: () => request('http://localhost:4000/graphql', GET_EVENTS),
  });
}
```

## Best Practices

1. **Używaj Fragmentów** - Definiuj fragmenty GraphQL dla reużywalności
2. **Paginacja** - Używaj cursor-based pagination dla dużych list
3. **Error Handling** - Zawsze obsługuj błędy GraphQL
4. **Caching** - Wykorzystuj cache TanStack Query
5. **Subscriptions** - Używaj subscriptions dla real-time danych
