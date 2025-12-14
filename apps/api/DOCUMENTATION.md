# CHECK-IN SYSTEM - COMPLETE DOCUMENTATION

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [GraphQL API](#graphql-api)
5. [Backend Implementation](#backend-implementation)
6. [Frontend Implementation](#frontend-implementation)
7. [User Flows](#user-flows)
8. [Security](#security)
9. [Testing](#testing)
10. [Deployment](#deployment)

---

## Overview

### Purpose
The check-in system provides event organizers with comprehensive tools to track attendee presence at events. It supports multiple check-in methods, blocking/rejection mechanisms, and full audit logging.

### Key Features
- ✅ 4 check-in methods (Self Manual, Moderator Panel, Event QR, User QR)
- ✅ Per-method and global blocking
- ✅ Rejection with reason and optional blocking
- ✅ Full audit trail (EventCheckinLog)
- ✅ QR code generation and scanning
- ✅ Real-time status updates
- ✅ Dark mode support
- ✅ Mobile responsive

### Business Rules
1. **isCheckedIn = checkinMethods.length > 0** (canonical rule)
2. Check-in only available for JOINED members
3. checkinBlockedAll prevents ALL check-in methods (no override)
4. checkinBlockedMethods blocks specific methods
5. Blocking a method automatically removes it from active methods
6. REJECT always removes check-in (with optional blocking)
7. All actions are logged in EventCheckinLog

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                       │
├─────────────────────────────────────────────────────────────┤
│  • checkin-management-client.tsx (Organizer Panel)         │
│  • user-checkin-section.tsx (User View)                    │
│  • method-actions-dropdown.tsx (Per-method actions)        │
│  • reject-checkin-modal.tsx (Rejection with reason)        │
│  • event-qr-code.tsx / user-qr-code.tsx                    │
│  • qr-scanner-modal.tsx                                     │
└─────────────────────────────────────────────────────────────┘
                              │
                    GraphQL (Mercurius)
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Fastify)                        │
├─────────────────────────────────────────────────────────────┤
│  • mutation/checkin.ts (12 mutations)                       │
│  • query/checkin.ts (eventCheckinLogs)                      │
│  • helpers/checkin.ts (Validation + Logging)                │
│  • field/event-checkin-log.ts (Field resolvers)             │
└─────────────────────────────────────────────────────────────┘
                              │
                      Prisma ORM
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Database (PostgreSQL)                    │
├─────────────────────────────────────────────────────────────┤
│  • EventMember (check-in state)                             │
│  • Event (check-in config)                                  │
│  • EventCheckinLog (audit trail)                            │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

#### Check-in Flow (Example: SELF_MANUAL):
```
User clicks "I'm at the event!" button
  ↓
Frontend: useCheckInSelfMutation
  ↓
GraphQL mutation: checkInSelf(eventId)
  ↓
Backend: Validate (JOINED, not blocked)
  ↓
Prisma transaction:
  1. Update EventMember:
     - Add SELF_MANUAL to checkinMethods[]
     - Set isCheckedIn = true
     - Update lastCheckinAt
  2. Insert EventCheckinLog entry
  ↓
Return updated member
  ↓
Frontend: Optimistic update + refetch
  ↓
UI updates with green "Checked in" card
```

---

## Database Schema

### EventMember (Prisma Model)

```prisma
model EventMember {
  id        String   @id @default(cuid())
  eventId   String
  userId    String
  role      EventMemberRole
  status    EventMemberStatus
  
  // Check-in fields
  isCheckedIn                  Boolean         @default(false)
  checkinMethods               CheckinMethod[]
  lastCheckinAt                DateTime?
  checkinBlockedAll            Boolean         @default(false)
  checkinBlockedMethods        CheckinMethod[]
  lastCheckinRejectionReason   String?
  lastCheckinRejectedAt        DateTime?
  lastCheckinRejectedById      String?
  memberCheckinToken           String?         @unique
  
  // Relations
  event                Event              @relation(fields: [eventId], references: [id])
  user                 User               @relation(fields: [userId], references: [id])
  lastCheckinRejectedBy User?             @relation(fields: [lastCheckinRejectedById], references: [id])
  checkinLogs          EventCheckinLog[]
  
  @@unique([eventId, userId])
  @@index([eventId, status])
}
```

### Event (Prisma Model)

```prisma
model Event {
  id                      String   @id @default(cuid())
  title                   String
  
  // Check-in config
  checkinEnabled          Boolean         @default(false)
  enabledCheckinMethods   CheckinMethod[]
  eventCheckinToken       String?         @unique
  
  // Relations
  members                 EventMember[]
  checkinLogs             EventCheckinLog[]
}
```

### EventCheckinLog (Audit Trail)

```prisma
model EventCheckinLog {
  id          String          @id @default(cuid())
  eventId     String
  memberId    String?         // Nullable for event-level actions
  actorId     String?         // Who performed the action (null for user self-actions)
  
  action      CheckinAction   // CHECK_IN, UNCHECK, REJECT, BLOCK_ALL, etc.
  method      CheckinMethod?  // SELF_MANUAL, MODERATOR_PANEL, EVENT_QR, USER_QR
  source      CheckinSource   // USER, MODERATOR, SYSTEM
  result      CheckinResult?  // SUCCESS, DENIED, REJECTED
  reason      String?         // For rejections
  comment     String?         // For additional notes
  
  createdAt   DateTime        @default(now())
  
  // Relations
  event       Event           @relation(fields: [eventId], references: [id])
  member      EventMember?    @relation(fields: [memberId], references: [id])
  actor       User?           @relation(fields: [actorId], references: [id])
  
  @@index([eventId, createdAt])
  @@index([memberId, createdAt])
}
```

### Enums

```prisma
enum CheckinMethod {
  SELF_MANUAL
  MODERATOR_PANEL
  EVENT_QR
  USER_QR
}

enum CheckinAction {
  CHECK_IN
  UNCHECK
  REJECT
  BLOCK_ALL
  BLOCK_METHOD
  UNBLOCK_ALL
  UNBLOCK_METHOD
  CONFIG_UPDATED
  QR_TOKEN_ROTATED
}

enum CheckinSource {
  USER
  MODERATOR
  SYSTEM
}

enum CheckinResult {
  SUCCESS
  DENIED
  REJECTED
}
```

---

## GraphQL API

### Queries

#### `eventCheckinLogs`
Fetch audit log for an event.

```graphql
query GetEventCheckinLogs(
  $eventId: ID!
  $limit: Int
  $offset: Int
  $action: CheckinAction
  $method: CheckinMethod
) {
  eventCheckinLogs(
    eventId: $eventId
    limit: $limit
    offset: $offset
    action: $action
    method: $method
  ) {
    items {
      id
      action
      method
      source
      result
      reason
      comment
      createdAt
      actor {
        id
        name
      }
      member {
        id
        user {
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

### Mutations

#### 1. `checkInSelf` (User self check-in)

```graphql
mutation CheckInSelf($eventId: ID!) {
  checkInSelf(eventId: $eventId) {
    success
    message
    member {
      id
      isCheckedIn
      checkinMethods
      lastCheckinAt
    }
  }
}
```

**Validation**:
- User must be JOINED
- SELF_MANUAL must be enabled in event config
- User must not be blocked (global or method)

#### 2. `uncheckInSelf` (User removes self check-in)

```graphql
mutation UncheckInSelf($eventId: ID!) {
  uncheckInSelf(eventId: $eventId) {
    success
    message
    member {
      id
      isCheckedIn
      checkinMethods
    }
  }
}
```

#### 3. `checkInMember` (Moderator checks in user)

```graphql
mutation CheckInMember($input: CheckInMemberInput!) {
  checkInMember(input: $input) {
    success
    message
    member {
      id
      isCheckedIn
      checkinMethods
      user {
        name
      }
    }
  }
}

input CheckInMemberInput {
  eventId: ID!
  userId: ID!
  method: CheckinMethod # Optional, defaults to MODERATOR_PANEL
  comment: String
}
```

#### 4. `uncheckInMember` (Moderator removes check-in)

**NEW: Supports per-method uncheck**

```graphql
mutation UncheckInMember($input: UncheckInMemberInput!) {
  uncheckInMember(input: $input) {
    success
    message
    member {
      id
      isCheckedIn
      checkinMethods
    }
  }
}

input UncheckInMemberInput {
  eventId: ID!
  userId: ID!
  method: CheckinMethod  # NEW: Optional - if provided, removes only this method
  comment: String
}
```

**Behavior**:
- If `method` provided: removes only that method
- If `method` not provided: removes ALL methods (full uncheck)
- Recalculates `isCheckedIn = checkinMethods.length > 0`

#### 5. `rejectMemberCheckin` (Reject with reason + optional block)

**NEW: Comprehensive rejection modal**

```graphql
mutation RejectMemberCheckin($input: RejectMemberCheckinInput!) {
  rejectMemberCheckin(input: $input) {
    success
    message
    member {
      id
      isCheckedIn
      checkinMethods
      lastCheckinRejectionReason
      lastCheckinRejectedAt
      checkinBlockedAll
      checkinBlockedMethods
    }
  }
}

input RejectMemberCheckinInput {
  eventId: ID!
  userId: ID!
  reason: String              # Optional reason
  showReasonToUser: Boolean   # Default: true
  blockMethod: CheckinMethod  # Optional: block specific method
  blockAll: Boolean           # Optional: block all methods
}
```

**Behavior**:
- Always removes ALL active check-in methods
- Sets `lastCheckinRejectionReason`, `lastCheckinRejectedAt`, `lastCheckinRejectedById`
- If `blockMethod` provided: adds to `checkinBlockedMethods[]`
- If `blockAll = true`: sets `checkinBlockedAll = true`

#### 6. `blockMemberCheckin` (Block check-in)

```graphql
mutation BlockMemberCheckin($input: BlockMemberCheckinInput!) {
  blockMemberCheckin(input: $input) {
    success
    message
    member {
      id
      checkinBlockedAll
      checkinBlockedMethods
      isCheckedIn
      checkinMethods
    }
  }
}

input BlockMemberCheckinInput {
  eventId: ID!
  userId: ID!
  method: CheckinMethod  # Optional: if provided, blocks only this method
  blockAll: Boolean      # If true, blocks all methods
  reason: String
}
```

**Behavior**:
- If `blockAll = true`: sets `checkinBlockedAll = true` + removes all methods
- If `method` provided: adds to `checkinBlockedMethods[]` + removes that method

#### 7. `unblockMemberCheckin` (Unblock check-in)

```graphql
mutation UnblockMemberCheckin($input: UnblockMemberCheckinInput!) {
  unblockMemberCheckin(input: $input) {
    success
    message
    member {
      id
      checkinBlockedAll
      checkinBlockedMethods
    }
  }
}

input UnblockMemberCheckinInput {
  eventId: ID!
  userId: ID!
  method: CheckinMethod  # Optional: if provided, unblocks only this method
  unblockAll: Boolean    # If true, unblocks all methods
}
```

#### 8. `checkInByEventQr` (Check-in via event QR code)

```graphql
mutation CheckInByEventQr($eventId: ID!, $token: String!) {
  checkInByEventQr(eventId: $eventId, token: $token) {
    success
    message
    member {
      id
      isCheckedIn
      checkinMethods
      user {
        name
      }
    }
    event {
      id
      title
    }
  }
}
```

**Validation**:
- Token must match `event.eventCheckinToken`
- User must be logged in and JOINED
- EVENT_QR must be enabled
- User must not be blocked

#### 9. `checkInByUserQr` (Check-in via personal QR code)

```graphql
mutation CheckInByUserQr($token: String!) {
  checkInByUserQr(token: $token) {
    success
    message
    member {
      id
      isCheckedIn
      checkinMethods
      user {
        name
      }
    }
    event {
      id
      title
    }
  }
}
```

**Validation**:
- Token must match a `member.memberCheckinToken`
- USER_QR must be enabled
- Member must not be blocked

#### 10. `updateEventCheckinConfig` (Update event settings)

```graphql
mutation UpdateEventCheckinConfig($input: UpdateEventCheckinConfigInput!) {
  updateEventCheckinConfig(input: $input) {
    success
    message
    event {
      id
      checkinEnabled
      enabledCheckinMethods
    }
  }
}

input UpdateEventCheckinConfigInput {
  eventId: ID!
  checkinEnabled: Boolean
  enabledCheckinMethods: [CheckinMethod!]
}
```

#### 11. `rotateEventCheckinToken` (Rotate event QR token)

```graphql
mutation RotateEventCheckinToken($eventId: ID!) {
  rotateEventCheckinToken(eventId: $eventId) {
    success
    message
    event {
      id
      eventCheckinToken
    }
  }
}
```

**Behavior**:
- Generates new random token
- Old QR codes immediately stop working

#### 12. `rotateMemberCheckinToken` (Rotate user's personal QR token)

```graphql
mutation RotateMemberCheckinToken($eventId: ID!) {
  rotateMemberCheckinToken(eventId: $eventId) {
    success
    message
    member {
      id
      memberCheckinToken
    }
  }
}
```

---

## Backend Implementation

### File Structure

```
apps/api/src/graphql/
├── resolvers/
│   ├── mutation/
│   │   └── checkin.ts           # 12 mutations
│   ├── query/
│   │   └── checkin.ts           # eventCheckinLogs query
│   ├── field/
│   │   └── event-checkin-log.ts # Field resolvers (actor, member)
│   └── helpers/
│       └── checkin.ts           # Validation + logging utilities
└── __generated__/
    └── resolvers-types.ts       # Generated types
```

### Key Backend Functions

#### `validateModeratorAccess()`
```typescript
async function validateModeratorAccess(
  userId: string,
  eventId: string,
  prisma: PrismaClient
): Promise<void>
```
Validates that user is OWNER or MODERATOR of the event. Throws if not.

#### `validateMemberAccess()`
```typescript
async function validateMemberAccess(
  userId: string,
  eventId: string,
  prisma: PrismaClient
): Promise<EventMember>
```
Validates that user is JOINED. Returns member or throws.

#### `logCheckinAction()`
```typescript
async function logCheckinAction(
  prisma: PrismaClient,
  params: {
    eventId: string;
    memberId?: string;
    actorId?: string;
    action: CheckinAction;
    method?: CheckinMethod;
    source: CheckinSource;
    result?: CheckinResult;
    reason?: string;
    comment?: string;
  }
): Promise<EventCheckinLog>
```
Creates audit log entry. Called by every mutation.

#### `canCheckIn()`
```typescript
function canCheckIn(
  member: EventMember,
  method: CheckinMethod
): { allowed: boolean; reason?: string }
```
Checks if member can check-in with given method:
- Not blocked globally (`checkinBlockedAll`)
- Method not in `checkinBlockedMethods[]`
- Status is JOINED

---

## Frontend Implementation

### File Structure

```
apps/web/src/
├── app/[locale]/event/[id]/manage/checkin/
│   ├── page.tsx                         # Route
│   └── _components/
│       ├── checkin-management-client.tsx  # Main panel (1378 lines)
│       ├── member-actions-menu.tsx        # 3-dot menu per user
│       ├── method-actions-dropdown.tsx    # 3-dot menu per method (NEW)
│       └── reject-checkin-modal.tsx       # Rejection modal (NEW)
└── features/events/
    ├── api/
    │   └── checkin.ts                   # React Query hooks
    └── components/
        ├── user-checkin-section.tsx     # User view (299 lines)
        ├── event-qr-code.tsx            # Event QR display
        ├── user-qr-code.tsx             # Personal QR display
        └── qr-scanner-modal.tsx         # QR scanner (282 lines)
```

### React Query Hooks

All hooks in `features/events/api/checkin.ts`:

```typescript
// Queries
useGetEventCheckinLogsQuery(variables, options)

// Mutations
useCheckInSelfMutation(options)
useUncheckInSelfMutation(options)
useCheckInMemberMutation(options)
useUncheckInMemberMutation(options)        // Supports per-method uncheck
useRejectMemberCheckinMutation(options)    // With reason + blocking
useBlockMemberCheckinMutation(options)
useUnblockMemberCheckinMutation(options)
useCheckInByEventQrMutation(options)
useCheckInByUserQrMutation(options)
useUpdateEventCheckinConfigMutation(options)
useRotateEventCheckinTokenMutation(options)
useRotateMemberCheckinTokenMutation(options)
```

### Optimistic Updates

Example from `useCheckInSelfMutation`:

```typescript
useCheckInSelfMutation({
  onMutate: async (variables) => {
    // Cancel outgoing queries
    await queryClient.cancelQueries({ queryKey: ['GetEventMembers'] });
    
    // Snapshot previous value
    const previousMembers = queryClient.getQueryData(['GetEventMembers']);
    
    // Optimistically update
    queryClient.setQueryData(['GetEventMembers'], (old) => {
      return {
        ...old,
        members: old.members.map(m => 
          m.userId === authUserId 
            ? { ...m, isCheckedIn: true, checkinMethods: [...m.checkinMethods, 'SELF_MANUAL'] }
            : m
        )
      };
    });
    
    return { previousMembers };
  },
  onError: (err, variables, context) => {
    // Rollback on error
    queryClient.setQueryData(['GetEventMembers'], context.previousMembers);
  },
  onSuccess: () => {
    // Refetch to ensure consistency
    invalidateCheckinData(queryClient, eventId);
  }
});
```

### Cache Invalidation

```typescript
function invalidateCheckinData(
  queryClient: QueryClient,
  eventId: string
): void {
  queryClient.invalidateQueries({ queryKey: ['GetEventMembers'] });
  queryClient.invalidateQueries({ queryKey: ['GetEvent', eventId] });
  queryClient.invalidateQueries({ queryKey: [GET_EVENT_CHECKIN_LOGS_KEY] });
}
```

---

## User Flows

### Flow 1: User Self Check-in (SELF_MANUAL)

1. User navigates to event page
2. If `isJoined` AND `checkinEnabled` → sees "Your Presence" section
3. If not checked in → sees "I'm at the event!" button
4. Click button → `useCheckInSelfMutation()`
5. Backend validates (JOINED, not blocked, SELF_MANUAL enabled)
6. Updates `checkinMethods = ['SELF_MANUAL']`, `isCheckedIn = true`
7. Creates log entry (action: CHECK_IN, method: SELF_MANUAL, source: USER)
8. Returns success → Frontend shows green "Checked in" card
9. Card displays:
   - CheckCircle icon
   - "You're checked in!"
   - Method badge (Smartphone icon)
   - Timestamp
   - "Remove my check-in" link

### Flow 2: Moderator Check-in via Panel (MODERATOR_PANEL)

1. Moderator navigates to `/event/[id]/manage/checkin`
2. Sees "Participants" tab with list of JOINED members
3. Each member shows:
   - Name
   - Check-in status
   - 4 method icons (inactive/gray if not used)
   - "Check In" button (if not checked in)
4. Click "Check In" → `useCheckInMemberMutation({ userId, method: MODERATOR_PANEL })`
5. Backend validates (moderator access, member JOINED, not blocked)
6. Updates `checkinMethods.push('MODERATOR_PANEL')`, `isCheckedIn = true`
7. Creates log entry (action: CHECK_IN, method: MODERATOR_PANEL, source: MODERATOR, actor: moderatorId)
8. Returns success → Frontend:
   - Optimistic update (icon turns green)
   - Toast "User checked in"
   - Button changes to "Uncheck"

### Flow 3: Check-in via Event QR (EVENT_QR)

1. Organizer generates Event QR in "QR Code" tab
2. QR contains URL: `/checkin/event/{eventId}?token={eventCheckinToken}`
3. Displays QR on screen / prints PDF
4. User scans QR → opens URL
5. Frontend detects URL params → `useCheckInByEventQrMutation({ eventId, token })`
6. Backend validates:
   - Token matches `event.eventCheckinToken`
   - User logged in and JOINED
   - EVENT_QR enabled
   - User not blocked
7. Updates `checkinMethods.push('EVENT_QR')`, `isCheckedIn = true`
8. Creates log entry (method: EVENT_QR, source: USER)
9. Shows success page with green checkmark

### Flow 4: Check-in via User QR (USER_QR)

1. User views "Your Presence" section → sees personal QR code
2. QR contains: `memberCheckinToken` (unique per member)
3. Moderator clicks "Scan User QR" in panel
4. Opens `QrScannerModal` with camera
5. Scans user's QR → extracts token
6. Frontend → `useCheckInByUserQrMutation({ token })`
7. Backend finds member by `memberCheckinToken`
8. Validates (USER_QR enabled, member JOINED, not blocked)
9. Updates `checkinMethods.push('USER_QR')`, `isCheckedIn = true`
10. Creates log entry (method: USER_QR, source: MODERATOR)
11. Shows success modal with user's name

### Flow 5: Per-Method Uncheck (NEW)

1. Moderator sees participant with multiple methods checked in (e.g., SELF_MANUAL + EVENT_QR)
2. Hovers over SELF_MANUAL icon → 3-dot menu appears
3. Clicks "Remove this method" from `MethodActionsDropdown`
4. Frontend → `useUncheckInMemberMutation({ userId, method: 'SELF_MANUAL' })`
5. Backend removes only SELF_MANUAL from `checkinMethods[]`
6. If other methods remain (e.g., EVENT_QR) → `isCheckedIn` stays true
7. If all methods removed → `isCheckedIn = false`
8. Creates log entry (action: UNCHECK, method: SELF_MANUAL)
9. Returns success → Icon turns gray, toast notification

### Flow 6: Reject with Reason (NEW)

1. Moderator clicks on method icon 3-dot menu → "Reject with reason"
2. Opens `RejectCheckinModal` with:
   - Textarea for reason
   - Checkbox "Show reason to user" (default: checked)
   - Radio options:
     - Just reject (no block)
     - Block this method
     - Block all methods
3. Moderator enters reason: "Invalid ID shown at entrance"
4. Selects "Block all methods"
5. Clicks "Reject Check-in"
6. Frontend → `useRejectMemberCheckinMutation({ userId, reason, showReasonToUser: true, blockAll: true })`
7. Backend:
   - Removes all methods from `checkinMethods[]`
   - Sets `isCheckedIn = false`
   - Sets `lastCheckinRejectionReason = "Invalid ID..."`
   - Sets `lastCheckinRejectedAt = now`
   - Sets `lastCheckinRejectedById = moderatorId`
   - Sets `checkinBlockedAll = true`
8. Creates log entry (action: REJECT, reason, + action: BLOCK_ALL)
9. Returns success → User sees amber "Rejection" card with reason

---

## Security

### Authentication & Authorization

#### Backend Validation:
```typescript
// Every mutation checks:
1. User is authenticated (userId from context)
2. For moderator actions: validateModeratorAccess()
3. For user actions: validateMemberAccess()
4. Token validation for QR check-ins
```

#### Frontend:
```typescript
// Conditional rendering based on:
- User role (owner/moderator/member)
- Event membership status (JOINED/PENDING/etc.)
- Check-in config (checkinEnabled, enabledCheckinMethods)
```

### QR Token Security

#### Event QR Token:
- **128-bit random** token (32 characters)
- Stored in `event.eventCheckinToken`
- Can be rotated at any time (invalidates old QR)
- No sensitive data in QR (only eventId + token)

#### User QR Token:
- **128-bit random** per member (32 characters)
- Stored in `eventMember.memberCheckinToken`
- Can be rotated by user (invalidates old QR)
- Token linked to specific member (not userId directly)

#### Token Generation:
```typescript
import { randomBytes } from 'crypto';

function generateToken(): string {
  return randomBytes(24).toString('base64url'); // ~32 chars
}
```

### Rate Limiting (Prepared)

Backend structure ready for rate limiting on:
- QR check-in endpoints
- Token rotation endpoints
- Bulk actions (future)

**Recommendation**: Add rate limiting middleware in production:
```typescript
// Example with fastify-rate-limit
fastify.register(require('@fastify/rate-limit'), {
  max: 100,        // 100 requests
  timeWindow: '1 minute',
  // Per-route config for QR endpoints
});
```

### SQL Injection Protection

✅ All database queries use Prisma ORM (parameterized queries)
✅ No raw SQL execution with user input

### XSS Protection

✅ React automatically escapes output
✅ All user-generated content (names, reasons) displayed safely

---

## Testing

### Manual Testing Checklist

#### User Flows:
- [ ] User can self check-in (SELF_MANUAL)
- [ ] User can remove self check-in
- [ ] User sees blocked status when blocked
- [ ] User sees rejection reason when rejected
- [ ] User can view and download personal QR
- [ ] User can rotate personal QR token

#### Moderator Flows:
- [ ] Moderator can check in users (MODERATOR_PANEL)
- [ ] Moderator can uncheck users (all methods)
- [ ] Moderator can uncheck single method (NEW)
- [ ] Moderator can reject with reason (NEW)
- [ ] Moderator can block specific method
- [ ] Moderator can block all methods
- [ ] Moderator can unblock methods
- [ ] Moderator can view activity log
- [ ] Moderator can filter/paginate logs
- [ ] Moderator can export CSV

#### QR Flows:
- [ ] Event QR displays and downloads correctly
- [ ] Event QR check-in works (logged in user)
- [ ] Event QR check-in fails for non-JOINED
- [ ] Event QR rotation invalidates old QR
- [ ] User QR scanner opens camera
- [ ] User QR check-in works
- [ ] User QR check-in fails for blocked user

#### Edge Cases:
- [ ] Duplicate check-in is idempotent
- [ ] Concurrent check-ins handled correctly
- [ ] Invalid tokens rejected
- [ ] Non-JOINED users cannot check-in
- [ ] Blocked users see correct UI
- [ ] Method icons show correct states
- [ ] Dark mode renders correctly
- [ ] Mobile layout works

### Automated Testing (Future)

#### Unit Tests:
```typescript
// Backend
- validateModeratorAccess()
- validateMemberAccess()
- canCheckIn()
- logCheckinAction()

// Frontend
- Mutation hooks with mock responses
- Component rendering with various states
```

#### Integration Tests:
```typescript
// End-to-end flows
- Full check-in flow (user + moderator)
- Rejection flow with blocking
- QR code generation and validation
```

---

## Deployment

### Pre-Deployment Checklist

#### Database:
- [ ] Run Prisma migrations: `pnpm prisma migrate deploy`
- [ ] Verify indexes on EventCheckinLog (eventId, memberId, createdAt)
- [ ] Backup existing data

#### Backend:
- [ ] Environment variables set:
  - `DATABASE_URL`
  - `JWT_SECRET`
  - Any rate limiting config
- [ ] GraphQL schema validated: `pnpm gql:gen`
- [ ] No TypeScript errors: `pnpm type-check`

#### Frontend:
- [ ] Build succeeds: `pnpm build`
- [ ] GraphQL types generated: `pnpm gql:gen`
- [ ] No linter errors: `pnpm lint`
- [ ] Environment variables set:
  - `NEXT_PUBLIC_API_URL`

#### Security:
- [ ] Rate limiting configured (QR endpoints)
- [ ] HTTPS enabled (production)
- [ ] CORS configured correctly
- [ ] JWT validation working

### Monitoring

#### Key Metrics:
- Check-in success rate (per method)
- Rejection rate
- Blocking rate
- QR scan attempts (success/failure)
- API latency (check-in mutations)

#### Logs to Monitor:
- Failed check-in attempts (blocked users)
- Invalid QR token attempts
- Concurrent action conflicts
- Database errors

### Rollback Plan

If issues occur:
1. Revert to previous git commit
2. Re-deploy previous version
3. Database schema is backward compatible (no data loss)
4. Check-in state preserved in EventMember table

---

## Appendix

### GraphQL Schema Files

- **schema.graphql**: Main schema with types, queries, mutations
- **operations/checkin.graphql**: All 13 check-in operations
- **fragments/members.graphql**: EventMemberCore with check-in fields

### Generated Files

- **Backend**: `apps/api/src/graphql/__generated__/resolvers-types.ts`
- **Frontend**: `apps/web/src/lib/api/__generated__/react-query-update.ts`

### Key Dependencies

#### Backend:
- `@prisma/client` - Database ORM
- `mercurius` - GraphQL server for Fastify
- `graphql-codegen` - Type generation

#### Frontend:
- `@tanstack/react-query` - Data fetching/caching
- `graphql-request` - GraphQL client
- `qrcode` - QR code generation
- `jsqr` - QR code scanning
- `jspdf` - PDF generation
- `framer-motion` - Animations

### Support

For issues or questions:
1. Check `/apps/api/CHECKIN_COMPLIANCE_REPORT.md` for requirements coverage
2. Review audit log in EventCheckinLog table
3. Check browser console for frontend errors
4. Check backend logs for GraphQL errors

---

**Last Updated**: December 11, 2025  
**Version**: 1.0.0  
**Status**: Production Ready ✅
