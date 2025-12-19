# Audit Log System - Event Governance

## Cel i zakres

System Audit Log zapewnia spójną, jednoznaczną historię zmian dla wydarzeń i ich kluczowych obszarów:
- Publikacja i widoczność
- Członkostwo i zaproszenia
- Moderacja treści
- Konfiguracja check-in
- Formularze dołączenia i feedback

### Co NIE jest Audit Logiem

Audit Log nie zastępuje:
- **Logów technicznych** (Pino/OTel) - błędy, debugging, performance
- **Analytics/telemetry** - odsłony, scroll, read receipts, typing, reakcje

---

## Architektura

### Model danych

```prisma
model EventAuditLog {
  id          String      @id @default(cuid())
  eventId     String
  actorId     String?
  actorRole   String?
  scope       AuditScope
  action      AuditAction
  entityType  String?
  entityId    String?
  diff        Json?
  meta        Json?
  severity    Int         @default(2)
  createdAt   DateTime    @default(now())

  event Event @relation(fields: [eventId], references: [id], onDelete: Cascade)
  actor User? @relation(fields: [actorId], references: [id], onDelete: SetNull)

  @@index([eventId, createdAt(sort: Desc)])
  @@index([eventId, scope])
  @@index([eventId, action])
  @@index([actorId, createdAt])
  @@map("event_audit_logs")
}
```

### Kategorie (Scope)

| Scope | Opis |
|-------|------|
| `EVENT` | Zmiany wydarzenia (create, update, cancel, delete) |
| `PUBLICATION` | Publikacja, harmonogramowanie, cofnięcie publikacji |
| `MEMBER` | Członkostwo, zaproszenia, role |
| `MODERATION` | Ban, ukrywanie treści |
| `CHECKIN` | Konfiguracja check-in, blokady |
| `INVITE_LINK` | Linki zaproszeń |
| `COMMENT` | Komentarze |
| `REVIEW` | Recenzje |
| `AGENDA` | Agenda wydarzenia |
| `FAQ` | Pytania i odpowiedzi |
| `BILLING` | Płatności, subskrypcje |
| `SYSTEM` | Operacje systemowe |

### Akcje (Action)

| Action | Opis |
|--------|------|
| `CREATE` | Utworzenie |
| `UPDATE` | Aktualizacja |
| `DELETE` | Usunięcie |
| `PUBLISH` | Publikacja |
| `UNPUBLISH` | Cofnięcie publikacji |
| `SCHEDULE` | Harmonogramowanie |
| `CANCEL` | Anulowanie |
| `STATUS_CHANGE` | Zmiana statusu |
| `ROLE_CHANGE` | Zmiana roli |
| `INVITE` | Zaproszenie |
| `APPROVE` | Akceptacja |
| `REJECT` | Odrzucenie |
| `KICK` | Wyrzucenie |
| `BAN` / `UNBAN` | Ban / odbanowanie |
| `CONFIG_CHANGE` | Zmiana konfiguracji |
| `HIDE` / `UNHIDE` | Ukrycie / przywrócenie treści |

### Severity (Poziomy ważności)

| Level | Nazwa | Opis |
|-------|-------|------|
| 1 | Info | Informacyjne |
| 2 | Normal | Standardowe operacje |
| 3 | Important | Ważne zmiany |
| 4 | Critical | Krytyczne operacje (kick, ban, hide) |
| 5 | Security | Operacje bezpieczeństwa |

---

## Implementacja w resolverach

### Zasada główna

```
❌ NIE middleware
❌ NIE automatycznie każda mutacja
✅ Jawne wywołanie w resolverze po udanej zmianie stanu
```

### Helper `createAuditLog`

```typescript
import { createAuditLog, buildDiff, EVENT_DIFF_WHITELIST } from '../../../lib/audit';

// W transakcji (STRICT mode - rollback przy błędzie)
await prisma.$transaction(async (tx) => {
  const event = await tx.event.update({ ... });
  
  await createAuditLog(tx, {
    eventId: event.id,
    actorId: userId,
    actorRole: 'OWNER',
    scope: 'EVENT',
    action: 'UPDATE',
    entityType: 'Event',
    entityId: event.id,
    diff: buildDiff(before, after, EVENT_DIFF_WHITELIST),
    severity: 2,
  });
});
```

### Tryby logowania

| Tryb | Użycie | Zachowanie przy błędzie |
|------|--------|------------------------|
| **STRICT** (`createAuditLog`) | Mutacje MUST (A) | Rollback transakcji |
| **SAFE** (`createAuditLogSafe`) | Mutacje SHOULD (B) | Log error, mutacja succeeds |

### Diff i Meta

**Diff** - zmiany pól (whitelista):
```typescript
const diff = buildDiff(before, after, EVENT_DIFF_WHITELIST);
// { title: { from: "Old", to: "New" }, startAt: { from: ..., to: ... } }
```

**Meta** - kontekst operacji:
```typescript
meta: {
  reason: 'Spam content',
  targetUserId: 'user_123',
  from: 'PENDING',
  to: 'JOINED',
  bulk: { added: 5, removed: 2 },
}
```

---

## Whitelisty pól

### Event
```typescript
const EVENT_DIFF_WHITELIST = [
  'title', 'description', 'notes',
  'visibility', 'joinMode', 'mode', 'min', 'max',
  'startAt', 'endAt',
  'joinOpensMinutesBeforeStart', 'joinCutoffMinutesBeforeStart',
  'allowJoinLate', 'lateJoinCutoffMinutesAfterStart',
  'joinManuallyClosed', 'joinManualCloseReason',
  'meetingKind', 'onlineUrl', 'address', 'placeId',
  'lat', 'lng', 'radiusKm', 'cityName',
  'addressVisibility', 'membersVisibility',
  'status', 'publishedAt', 'scheduledPublishAt',
  'checkinEnabled', 'enabledCheckinMethods',
  'sponsorshipPlan', 'boostedAt',
];
```

### EventMember
```typescript
const EVENT_MEMBER_DIFF_WHITELIST = [
  'role', 'status',
  'checkinBlockedAll', 'checkinBlockedMethods',
];
```

### InviteLink
```typescript
const INVITE_LINK_DIFF_WHITELIST = [
  'maxUses', 'expiresAt', 'label', 'revokedAt',
];
```

---

## API GraphQL

### Query: Lista audit logów

```graphql
query GetEventAuditLogs(
  $eventId: ID!
  $scope: [AuditScope!]
  $action: [AuditAction!]
  $actorId: ID
  $from: DateTime
  $to: DateTime
  $limit: Int
  $cursor: ID
) {
  eventAuditLogs(
    eventId: $eventId
    scope: $scope
    action: $action
    actorId: $actorId
    from: $from
    to: $to
    limit: $limit
    cursor: $cursor
  ) {
    items {
      id
      createdAt
      scope
      action
      severity
      actor { id name }
      entityType
      entityId
      diff
      meta
    }
    pageInfo {
      total
      hasNext
      hasPrev
    }
  }
}
```

### Query: Export do JSON

```graphql
query ExportEventAuditLogs(
  $eventId: ID!
  $scope: [AuditScope!]
  $action: [AuditAction!]
  $from: DateTime
  $to: DateTime
  $limit: Int
) {
  exportEventAuditLogs(
    eventId: $eventId
    scope: $scope
    action: $action
    from: $from
    to: $to
    limit: $limit
  ) {
    count
    eventId
    eventTitle
    exportedAt
    data  # JSON string
  }
}
```

---

## Uprawnienia

| Rola | Dostęp |
|------|--------|
| **Owner** | Pełny dostęp do audit logów wydarzenia |
| **Moderator** | Pełny dostęp do audit logów wydarzenia |
| **Participant** | Brak dostępu (MVP) |
| **App Admin/Moderator** | Pełny dostęp do wszystkich wydarzeń |

### Wymagania planowe

- **Wyświetlanie**: Plan PRO
- **Export**: Plan PRO

---

## Archiwizacja i retencja

### Retencja w "hot" bazie

| Środowisko | Retencja |
|------------|----------|
| Production | 30 dni po zakończeniu wydarzenia |
| Development | 30 minut po zakończeniu wydarzenia |

### Proces archiwizacji (BullMQ Worker)

1. **Schedule** - Job tworzony przy `createEvent` i aktualizowany przy zmianie `endAt`
2. **Fetch** - Pobierz wszystkie logi dla wydarzenia
3. **Export** - Zapisz do S3 jako `audit-archives/{eventId}.jsonl.gz`
4. **Delete** - Usuń logi z bazy danych
5. **Mark** - Ustaw `event.auditArchivedAt`

### Format archiwum

```
s3://bucket/audit-archives/{eventId}.jsonl.gz
```

Zawartość (JSONL - jeden JSON per linia):
```json
{"id":"...","createdAt":"...","scope":"EVENT","action":"CREATE",...}
{"id":"...","createdAt":"...","scope":"MEMBER","action":"INVITE",...}
```

---

## Pliki i struktura

### Backend (API)

```
apps/api/src/
├── lib/audit/
│   ├── index.ts              # Eksporty
│   ├── create-audit-log.ts   # createAuditLog, createAuditLogSafe
│   ├── diff.ts               # buildDiff helper
│   └── whitelists.ts         # EVENT_DIFF_WHITELIST, etc.
├── graphql/resolvers/
│   └── query/audit.ts        # eventAuditLogs, exportEventAuditLogs
└── workers/audit-archive/
    ├── queue.ts              # BullMQ queue
    ├── run-audit-archive.ts  # Archive logic + S3 upload
    └── worker.ts             # Worker entry point
```

### Frontend (Web)

```
apps/web/src/features/audit/
├── api/
│   ├── audit-query-keys.ts     # Query keys
│   ├── use-event-audit-logs.ts # useInfiniteQuery hook
│   ├── use-export-audit-logs.ts # Export mutation
│   └── index.ts
├── components/
│   ├── audit-log-timeline.tsx      # Main timeline
│   ├── audit-log-item.tsx          # Single log entry
│   ├── audit-log-filters.tsx       # Filters UI
│   └── audit-log-details-modal.tsx # Details modal
├── types.ts
└── index.ts
```

### Strona zarządzania

```
apps/web/src/app/[locale]/event/[id]/manage/activity/
├── page.tsx
└── _components/
    ├── activity-log-panel.tsx
    └── activity-panel-wrapper.tsx  # PRO plan guard
```

---

## Lista mutacji z audytem

### MUST (A) - Zawsze logować

| Mutacja | Scope | Action | Severity |
|---------|-------|--------|----------|
| `createEvent` | EVENT | CREATE | 2 |
| `updateEvent` | EVENT | UPDATE | 2 |
| `deleteEvent` | EVENT | DELETE | 4 |
| `cancelEvent` | EVENT | CANCEL | 3 |
| `publishEvent` | PUBLICATION | PUBLISH | 3 |
| `unpublishEvent` | PUBLICATION | UNPUBLISH | 4 |
| `inviteMember` | MEMBER | INVITE | 3 |
| `approveMembershipMutation` | MEMBER | APPROVE | 3 |
| `rejectMembershipMutation` | MEMBER | REJECT | 3 |
| `kickMemberMutation` | MEMBER | KICK | 4 |
| `banMemberMutation` | MODERATION | BAN | 5 |
| `unbanMemberMutation` | MODERATION | UNBAN | 4 |
| `updateMemberRole` | MEMBER | ROLE_CHANGE | 4 |
| `hideComment` | MODERATION | HIDE | 4 |
| `unhideComment` | MODERATION | UNHIDE | 4 |
| `hideReview` | MODERATION | HIDE | 4 |
| `unhideReview` | MODERATION | UNHIDE | 4 |

### SHOULD (B) - Warto logować

| Mutacja | Scope | Action | Severity |
|---------|-------|--------|----------|
| `createComment` | COMMENT | CREATE | 2 |
| `updateComment` | COMMENT | UPDATE | 2 |
| `deleteComment` | COMMENT | DELETE | 3 |
| `createReview` | REVIEW | CREATE | 2 |
| `updateReview` | REVIEW | UPDATE | 2 |
| `deleteReview` | REVIEW | DELETE | 3 |
| `updateEventAgenda` | AGENDA | UPDATE | 3 |
| `updateEventFaqs` | FAQ | UPDATE | 2 |

### NO (C) - Nie logować

- Reakcje (`add*Reaction`, `remove*Reaction`)
- Read markers
- Typing indicators
- Preferencje użytkownika
- Mute/favourite

---

## Uruchamianie workera archiwizacji

### Development

```bash
cd apps/api
npx ts-node src/workers/audit-archive/worker.ts
```

### Production (Docker/PM2)

Dodaj do `docker-compose.yml` lub konfiguracji PM2:

```yaml
services:
  audit-archive-worker:
    build: ./apps/api
    command: node dist/workers/audit-archive/worker.js
    environment:
      - NODE_ENV=production
      - DATABASE_URL=...
      - REDIS_HOST=...
      - S3_BUCKET=...
```

---

## Migracje

### Wymagane migracje

1. **Audit Log Model**
   ```bash
   npx prisma migrate dev --name add_event_audit_log
   ```

2. **Audit Archived At**
   ```bash
   npx prisma migrate dev --name add_audit_archived_at
   ```

3. **Regeneracja typów**
   ```bash
   npx prisma generate
   npm run generate  # GraphQL codegen
   ```

---

## Troubleshooting

### Audit log nie pojawia się

1. Sprawdź czy mutacja jest w transakcji z `createAuditLog`
2. Sprawdź czy nie ma błędów w logach (SAFE mode może ukryć błędy)
3. Sprawdź czy użytkownik ma uprawnienia do zapisu

### Export nie działa

1. Sprawdź plan wydarzenia (wymaga PRO)
2. Sprawdź uprawnienia użytkownika (Owner/Moderator/Admin)
3. Sprawdź limity (max 10,000 logów)

### Archiwizacja nie uruchamia się

1. Sprawdź czy worker jest uruchomiony
2. Sprawdź połączenie z Redis (BullMQ)
3. Sprawdź logi workera
4. Sprawdź czy `endAt` wydarzenia jest poprawna

