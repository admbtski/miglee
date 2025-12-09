# Dokumentacja Bazy Danych

## Przegląd

Miglee wykorzystuje PostgreSQL z rozszerzeniem PostGIS do obsługi danych geograficznych. Baza danych jest zarządzana przez Prisma ORM, która zapewnia type-safe dostęp i migracje.

## Struktura Bazy Danych

### Główne Tabele

#### `users`

Główna tabela użytkowników.

**Kluczowe Pola:**

- `id` (String, CUID) - Unikalny identyfikator
- `email` (String, unique) - Email użytkownika
- `name` (String, unique) - Nazwa użytkownika
- `avatarKey` (String?) - Klucz do MediaAsset dla avatara
- `role` (Role) - Rola użytkownika (ADMIN, MODERATOR, USER)
- `verifiedAt` (DateTime?) - Data weryfikacji
- `suspendedAt` (DateTime?) - Data zawieszenia
- `locale` (String) - Preferowany język (en, pl, de)
- `timezone` (String) - Strefa czasowa (IANA)

**Relacje:**

- `profile` (1:1) - UserProfile
- `privacy` (1:1) - UserPrivacy
- `stats` (1:1) - UserStats
- `eventMembers` (1:N) - EventMember
- `ownedEvents` (1:N) - Event (owner)
- `notifications` (1:N) - Notification

**Indeksy:**

- `email` - Szybkie wyszukiwanie po email
- `name` - Szybkie wyszukiwanie po nazwie
- `role` - Filtrowanie po roli
- `lastSeenAt` - Sortowanie po aktywności

#### `events`

Tabela wydarzeń.

**Kluczowe Pola:**

- `id` (String, CUID) - Unikalny identyfikator
- `title` (String) - Tytuł wydarzenia
- `description` (String?) - Opis
- `startAt` (DateTime) - Data rozpoczęcia
- `endAt` (DateTime) - Data zakończenia
- `visibility` (Visibility) - PUBLIC, HIDDEN
- `joinMode` (JoinMode) - OPEN, REQUEST, INVITE_ONLY
- `mode` (Mode) - ONE_TO_ONE, GROUP, CUSTOM
- `min` (Int?) - Minimalna liczba uczestników
- `max` (Int?) - Maksymalna liczba uczestników
- `meetingKind` (MeetingKind) - ONSITE, ONLINE, HYBRID
- `lat` (Float?) - Szerokość geograficzna
- `lng` (Float?) - Długość geograficzna
- `address` (String?) - Adres tekstowy
- `placeId` (String?) - Google Place ID
- `geom` (Geography(Point)) - PostGIS geometry
- `status` (PublicationStatus) - DRAFT, PUBLISHED, SCHEDULED
- `publishedAt` (DateTime?) - Data publikacji
- `ownerId` (String?) - ID właściciela
- `joinedCount` (Int) - Liczba dołączonych uczestników
- `sponsorshipPlan` (EventPlan) - FREE, PLUS, PRO

**Relacje:**

- `owner` (N:1) - User
- `categories` (N:M) - Category
- `tags` (N:M) - Tag
- `members` (1:N) - EventMember
- `comments` (1:N) - Comment
- `reviews` (1:N) - Review
- `sponsorship` (1:1) - EventSponsorship

**Indeksy:**

- `startAt`, `endAt` - Sortowanie po datach
- `lat, lng` - Wyszukiwanie geograficzne
- `geom` (GIST) - PostGIS spatial index
- `status, visibility, startAt` - Filtrowanie wydarzeń
- `boostedAt` - Sortowanie po boost

#### `event_members`

Tabela członkostwa w wydarzeniach.

**Kluczowe Pola:**

- `id` (String, CUID)
- `eventId` (String) - FK do Event
- `userId` (String) - FK do User
- `role` (EventMemberRole) - OWNER, MODERATOR, PARTICIPANT
- `status` (EventMemberStatus) - JOINED, PENDING, INVITED, REJECTED, BANNED, etc.
- `joinedAt` (DateTime?) - Data dołączenia
- `leftAt` (DateTime?) - Data opuszczenia
- `addedById` (String?) - Kto dodał członkostwo

**Relacje:**

- `event` (N:1) - Event
- `user` (N:1) - User
- `addedBy` (N:1) - User

**Indeksy:**

- `eventId, status` - Filtrowanie członków wydarzenia
- `userId, status` - Filtrowanie wydarzeń użytkownika
- `eventId, role` - Filtrowanie po roli
- Unique: `(eventId, userId)` - Jeden członek na wydarzenie

#### `notifications`

Tabela powiadomień.

**Kluczowe Pola:**

- `id` (String, CUID)
- `kind` (NotificationKind) - Rodzaj powiadomienia
- `recipientId` (String) - FK do User
- `actorId` (String?) - Kto wywołał akcję
- `entityType` (NotificationEntity) - Typ encji
- `entityId` (String?) - ID encji
- `eventId` (String?) - FK do Event (convenience)
- `title` (String?) - Tytuł
- `body` (String?) - Treść
- `data` (JSON?) - Dodatkowe dane
- `readAt` (DateTime?) - Data przeczytania
- `dedupeKey` (String?) - Klucz deduplikacji

**Indeksy:**

- `recipientId, readAt` - Filtrowanie nieprzeczytanych
- `recipientId, createdAt` - Sortowanie po czasie
- Unique: `(recipientId, dedupeKey)` - Deduplikacja

#### `comments`

Tabela komentarzy do wydarzeń.

**Kluczowe Pola:**

- `id` (String, CUID)
- `eventId` (String) - FK do Event
- `authorId` (String) - FK do User
- `threadId` (String) - ID głównego komentarza
- `parentId` (String?) - ID komentarza nadrzędnego
- `content` (String) - Treść komentarza
- `deletedAt` (DateTime?) - Soft delete
- `hiddenAt` (DateTime?) - Ukryty przez moderatora

**Relacje:**

- `event` (N:1) - Event
- `author` (N:1) - User
- `parent` (N:1) - Comment (self-reference)
- `replies` (1:N) - Comment (self-reference)

**Indeksy:**

- `eventId, createdAt` - Sortowanie komentarzy wydarzenia
- `threadId` - Grupowanie wątków
- `parentId` - Hierarchia odpowiedzi

#### `reviews`

Tabela recenzji wydarzeń.

**Kluczowe Pola:**

- `id` (String, CUID)
- `eventId` (String) - FK do Event
- `authorId` (String) - FK do User
- `rating` (Int) - Ocena 1-5
- `content` (String?) - Treść recenzji
- `deletedAt` (DateTime?) - Soft delete
- `hiddenAt` (DateTime?) - Ukryty przez moderatora

**Relacje:**

- `event` (N:1) - Event
- `author` (N:1) - User

**Indeksy:**

- `eventId, createdAt` - Sortowanie recenzji
- `eventId, rating` - Filtrowanie po ocenie
- Unique: `(eventId, authorId)` - Jedna recenzja na użytkownika

### Tabele Komunikacji

#### `dm_threads`

Wątki wiadomości prywatnych.

**Kluczowe Pola:**

- `id` (String, CUID)
- `aUserId` (String) - FK do User
- `bUserId` (String) - FK do User
- `pairKey` (String, unique) - Klucz pary użytkowników
- `lastMessageAt` (DateTime?) - Data ostatniej wiadomości

**Relacje:**

- `aUser` (N:1) - User
- `bUser` (N:1) - User
- `messages` (1:N) - DmMessage

#### `dm_messages`

Wiadomości prywatne.

**Kluczowe Pola:**

- `id` (String, CUID)
- `threadId` (String) - FK do DmThread
- `senderId` (String) - FK do User
- `content` (String) - Treść wiadomości
- `replyToId` (String?) - FK do DmMessage
- `readAt` (DateTime?) - Data przeczytania
- `editedAt` (DateTime?) - Data edycji
- `deletedAt` (DateTime?) - Soft delete

#### `event_chat_messages`

Wiadomości w czacie wydarzenia.

**Kluczowe Pola:**

- `id` (String, CUID)
- `eventId` (String) - FK do Event
- `authorId` (String) - FK do User
- `content` (String) - Treść wiadomości
- `replyToId` (String?) - FK do EventChatMessage
- `editedAt` (DateTime?) - Data edycji
- `deletedAt` (DateTime?) - Soft delete

### Tabele Billing

#### `user_subscriptions`

Subskrypcje użytkowników.

**Kluczowe Pola:**

- `id` (String, CUID)
- `userId` (String) - FK do User
- `plan` (SubscriptionPlan) - PLUS, PRO
- `billingPeriod` (BillingPeriod) - MONTHLY, YEARLY
- `status` (SubscriptionStatus) - ACTIVE, CANCELED, etc.
- `stripeSubscriptionId` (String, unique) - Stripe subscription ID
- `currentPeriodStart` (DateTime?)
- `currentPeriodEnd` (DateTime?)
- `cancelAtPeriodEnd` (Boolean)

#### `user_plan_periods`

Okresy planów użytkowników (subskrypcja lub jednorazowe).

**Kluczowe Pola:**

- `id` (String, CUID)
- `userId` (String) - FK do User
- `plan` (SubscriptionPlan) - PLUS, PRO
- `source` (UserPlanSource) - SUBSCRIPTION, ONE_OFF
- `billingPeriod` (BillingPeriod) - MONTHLY, YEARLY
- `amount` (Float) - Kwota płatności
- `currency` (String) - Waluta
- `startsAt` (DateTime) - Początek okresu
- `endsAt` (DateTime) - Koniec okresu
- `stripeSubscriptionId` (String?) - Dla subskrypcji
- `stripePaymentEventId` (String?) - Dla jednorazowych

#### `event_sponsorships`

Sponsoring wydarzeń.

**Kluczowe Pola:**

- `id` (String, CUID)
- `eventId` (String, unique) - FK do Event (1:1)
- `sponsorId` (String) - FK do User
- `plan` (EventPlan) - PLUS, PRO
- `status` (SponsorshipStatus) - PENDING, ACTIVE, EXPIRED
- `startsAt` (DateTime?)
- `endsAt` (DateTime?)
- `boostsTotal` (Int) - Całkowita liczba boostów
- `boostsUsed` (Int) - Użyte boosty
- `localPushesTotal` (Int) - Całkowita liczba pushy
- `localPushesUsed` (Int) - Użyte pushy

#### `event_sponsorship_periods`

Historia transakcji sponsoringu.

**Kluczowe Pola:**

- `id` (String, CUID)
- `eventId` (String) - FK do Event
- `sponsorId` (String) - FK do User
- `plan` (EventPlan) - PLUS, PRO
- `actionType` (String) - new, reload, upgrade
- `boostsAdded` (Int) - Dodane boosty
- `localPushesAdded` (Int) - Dodane pushy
- `amount` (Float) - Kwota
- `currency` (String) - Waluta
- `stripePaymentEventId` (String?) - Stripe payment ID

### Tabele Pomocnicze

#### `categories`

Kategorie wydarzeń.

**Kluczowe Pola:**

- `id` (String, CUID)
- `slug` (String, unique) - Unikalny slug
- `names` (JSON) - Nazwy w różnych językach

#### `tags`

Tagi wydarzeń.

**Kluczowe Pola:**

- `id` (String, CUID)
- `label` (String) - Etykieta
- `slug` (String, unique) - Unikalny slug

#### `user_profiles`

Profile użytkowników.

**Kluczowe Pola:**

- `id` (String, CUID)
- `userId` (String, unique) - FK do User (1:1)
- `displayName` (String?) - Wyświetlana nazwa
- `bioShort` (String?) - Krótki opis (max 200)
- `bioLong` (String?) - Długi opis (max 1000)
- `city` (String?) - Miasto
- `country` (String?) - Kraj
- `homeLat` (Float?) - Szerokość geograficzna domu
- `homeLng` (Float?) - Długość geograficzna domu
- `coverKey` (String?) - Klucz do MediaAsset dla covera
- `speaks` (String[]) - Języki
- `interests` (String[]) - Zainteresowania

#### `user_privacy`

Ustawienia prywatności użytkowników.

**Kluczowe Pola:**

- `id` (String, CUID)
- `userId` (String, unique) - FK do User (1:1)
- `dmPolicy` (String) - Polityka DM (ALL, MEMBERS, INVITE_ONLY, NONE)
- `showLastSeen` (String) - Pokazywanie ostatniej aktywności
- `showLocation` (String) - Pokazywanie lokalizacji
- `showEvents` (String) - Pokazywanie wydarzeń
- `showReviews` (String) - Pokazywanie recenzji
- `defaultAddressVisibility` (AddressVisibility) - Domyślna widoczność adresu
- `defaultMembersVisibility` (MembersVisibility) - Domyślna widoczność członków

#### `media_assets`

Zasoby multimedialne.

**Kluczowe Pola:**

- `id` (String, CUID)
- `key` (String, unique) - Klucz storage (S3 lub lokalny)
- `blurhash` (String?) - Blur hash dla placeholder
- `width` (Int?) - Szerokość
- `height` (Int?) - Wysokość
- `mimeType` (String?) - Typ MIME
- `ownerId` (String?) - ID właściciela (logiczne, nie FK)
- `purpose` (String?) - USER_AVATAR, USER_COVER, EVENT_COVER

## Enums

### Visibility

- `PUBLIC` - Publiczne
- `HIDDEN` - Ukryte

### JoinMode

- `OPEN` - Otwarte (każdy może dołączyć)
- `REQUEST` - Wymaga zatwierdzenia
- `INVITE_ONLY` - Tylko na zaproszenie

### Mode

- `ONE_TO_ONE` - Jeden na jednego
- `GROUP` - Grupowe
- `CUSTOM` - Niestandardowe

### MeetingKind

- `ONSITE` - Na miejscu
- `ONLINE` - Online
- `HYBRID` - Hybrydowe

### EventMemberStatus

- `JOINED` - Dołączony
- `PENDING` - Oczekujący na zatwierdzenie
- `INVITED` - Zaproszony
- `REJECTED` - Odrzucony
- `BANNED` - Zbanowany
- `LEFT` - Opuścił
- `KICKED` - Wyrzucony
- `CANCELLED` - Anulował prośbę
- `WAITLIST` - Na liście oczekujących

### PublicationStatus

- `DRAFT` - Szkic
- `PUBLISHED` - Opublikowane
- `SCHEDULED` - Zaplanowane do publikacji

## Relacje

### One-to-One

- `User` ↔ `UserProfile`
- `User` ↔ `UserPrivacy`
- `User` ↔ `UserStats`
- `Event` ↔ `EventSponsorship`

### One-to-Many

- `User` → `Event` (owner)
- `User` → `EventMember`
- `Event` → `EventMember`
- `Event` → `Comment`
- `Event` → `Review`
- `Event` → `EventChatMessage`

### Many-to-Many

- `Event` ↔ `Category` (przez tabelę pośrednią)
- `Event` ↔ `Tag` (przez tabelę pośrednią)

## Indeksy

### Wydajność Zapytań

**Często używane indeksy:**

- `events(startAt, endAt)` - Sortowanie po datach
- `events(lat, lng)` - Wyszukiwanie geograficzne
- `events(geom)` - PostGIS spatial index
- `event_members(eventId, status)` - Filtrowanie członków
- `notifications(recipientId, readAt)` - Nieprzeczytane powiadomienia

**Composite indexes:**

- `events(status, visibility, startAt)` - Filtrowanie wydarzeń
- `event_members(userId, status)` - Wydarzenia użytkownika

## Migracje

### Zarządzanie Migracjami

```bash
# Utwórz nową migrację
pnpm prisma:migrate dev --name migration_name

# Zastosuj migracje
pnpm prisma:migrate deploy

# Reset bazy danych (development)
pnpm prisma:migrate reset

# Wygeneruj Prisma Client
pnpm prisma:generate
```

### PostGIS Setup

PostGIS jest dodawany przez migrację:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

Kolumna `geom` jest automatycznie aktualizowana z `lat`/`lng` przez trigger lub aplikację.

## Seed Data

Baza danych może być wypełniona danymi testowymi przez:

```bash
pnpm prisma:seed
```

Seed tworzy:

- Przykładowych użytkowników
- Przykładowe kategorie
- Przykładowe wydarzenia

## Best Practices

1. **Używaj Transakcji** - Dla operacji wieloetapowych
2. **Indeksy** - Dodawaj indeksy dla często queryowanych kolumn
3. **Soft Delete** - Używaj `deletedAt` zamiast fizycznego usuwania
4. **Denormalizacja** - Liczniki (`joinedCount`, `commentsCount`) są denormalizowane
5. **PostGIS** - Używaj `geom` dla zapytań geograficznych
6. **Connection Pooling** - Konfiguruj pool size w Prisma
