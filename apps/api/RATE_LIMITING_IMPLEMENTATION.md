# 🎯 RATE LIMITING - IMPLEMENTATION GUIDE

## ✅ ZAIMPLEMENTOWANE

### 1. Domain Rate Limiter (Core System)

**Plik:** `src/lib/rate-limit/domainRateLimiter.ts`

✅ Sliding window algorithm (Redis ZSET)
✅ Burst protection
✅ GraphQL errors z `retryAfter`
✅ Centralized bucket configuration
✅ Fail-open on Redis errors

**Dostępne buckety:**

- `chat:event:send` - 30/30s, burst 5/5s
- `chat:dm:send` - 30/30s, burst 5/5s
- `chat:edit` - 5/min
- `chat:delete` - 5/min
- `gql:event:write` - 30/min
- `gql:auth` - 10/5min
- `gql:feedback` - 5/min
- `gql:feedback:send` - 3/hour
- `gql:report` - 10/10min
- `gql:billing` - 10/10min

### 2. Chat Rate Limiting

**Plik:** `src/lib/chat-rate-limit.ts`

✅ Refaktoryzowane do używania `domainRateLimiter`
✅ Backward compatibility helpers
✅ Deprecated warnings

### 3. REST Endpoints Rate Limiting

**Pliki:** `src/plugins/rate-limit.ts`, `health.ts`, `stripe-webhook.ts`, `local-upload.ts`, `bull-board.ts`

✅ HTTP layer rate limiting z presetami
✅ Redis w production, in-memory w dev
✅ Per-endpoint configuration

---

## 🔧 DO ZAIMPLEMENTOWANIA

### 1. Event Membership Mutations (PRIORITY: HIGH)

**Plik:** `src/graphql/resolvers/mutation/event-members.ts`

**Mutations do ochrony:**

```typescript
// Na początku każdej funkcji dodaj:
const userId = assertAuth(ctx);
await assertEventWriteRateLimit(userId);
```

**Lista mutations:**

1. ✅ `joinMember` (linia ~370)
2. ✅ `acceptInviteMutation` (linia ~514)
3. ✅ `leaveEventMutation` (linia ~693)
4. ✅ `joinWaitlistOpenMutation` (linia ~1266)
5. ✅ `leaveWaitlistMutation` (linia ~1363)
6. ⚠️ `promoteFromWaitlistMutation` - SKIP (admin/mod only, nie user action)

**Import dodany:** ✅

```typescript
import { assertEventWriteRateLimit } from '../../../lib/rate-limit/domainRateLimiter';
```

**Przykład implementacji:**

```typescript
export const joinMember: MutationResolvers['joinMember'] = resolverWithMetrics(
  'Mutation',
  'joinMember',
  async (_p, { eventId }, ctx) => {
    const userId = assertAuth(ctx);

    // RATE LIMIT CHECK
    await assertEventWriteRateLimit(userId);

    // ... reszta logiki
  }
);
```

---

### 2. Join Requests Mutations

**Plik:** `src/graphql/resolvers/mutation/join-requests.ts`

**Mutations do ochrony:**

```typescript
// Import
import { assertEventWriteRateLimit } from '../../../lib/rate-limit/domainRateLimiter';

// W mutations:
1. requestJoinEventWithAnswersMutation (linia ~9)
2. cancelJoinRequestMutation (linia ~677)
```

**Implementacja:**

```typescript
export const requestJoinEventWithAnswersMutation: MutationResolvers['requestJoinEventWithAnswers'] =
  resolverWithMetrics(
    'Mutation',
    'requestJoinEventWithAnswers',
    async (_p, { input }, ctx) => {
      const userId = assertAuth(ctx);

      // RATE LIMIT CHECK
      await assertEventWriteRateLimit(userId);

      // ... reszta logiki
    }
  );
```

---

### 3. Feedback Mutations (PRIORITY: HIGH)

**Plik:** `src/graphql/resolvers/mutation/feedback-questions.ts`

**Mutations do ochrony:**

```typescript
// Import
import {
  assertFeedbackRateLimit,
  assertFeedbackSendRateLimit
} from '../../../lib/rate-limit/domainRateLimiter';

// W mutations:
1. submitReviewAndFeedback (uses assertFeedbackRateLimit)
2. sendFeedbackRequests (uses assertFeedbackSendRateLimit - CRITICAL!)
```

**Przykład:**

```typescript
export const submitReviewAndFeedback: MutationResolvers['submitReviewAndFeedback'] =
  resolverWithMetrics(
    'Mutation',
    'submitReviewAndFeedback',
    async (_p, { input }, ctx) => {
      const userId = assertAuth(ctx);

      // RATE LIMIT CHECK
      await assertFeedbackRateLimit(userId);

      // ... reszta logiki
    }
  );

export const sendFeedbackRequests: MutationResolvers['sendFeedbackRequests'] =
  resolverWithMetrics(
    'Mutation',
    'sendFeedbackRequests',
    async (_p, { eventId }, ctx) => {
      const userId = assertAuth(ctx);

      // RATE LIMIT CHECK - bardzo ważne! (email sending)
      await assertFeedbackSendRateLimit(userId);

      // ... reszta logiki
    }
  );
```

---

### 4. Report Mutations (PRIORITY: MEDIUM)

**Plik:** `src/graphql/resolvers/mutation/reports.ts`

**Mutations do ochrony:**

```typescript
// Import
import { assertReportRateLimit } from '../../../lib/rate-limit/domainRateLimiter';

// W mutation:
1. createReport
```

**Implementacja:**

```typescript
export const createReport: MutationResolvers['createReport'] =
  resolverWithMetrics(
    'Mutation',
    'createReport',
    async (_p, { input }, ctx) => {
      const userId = assertAuth(ctx);

      // RATE LIMIT CHECK
      await assertReportRateLimit(userId);

      // ... reszta logiki
    }
  );
```

---

### 5. Billing Mutations (PRIORITY: HIGH - Stripe Protection!)

**Plik:** `src/graphql/resolvers/mutation/billing.ts`

**Mutations do ochrony:**

```typescript
// Import
import { assertBillingRateLimit } from '../../../lib/rate-limit/domainRateLimiter';

// W mutations:
1. createSubscriptionCheckout
2. createOneOffCheckout
3. createEventSponsorshipCheckout
4. cancelSubscription
5. reactivateSubscription
```

**Przykład:**

```typescript
export const createSubscriptionCheckout: MutationResolvers['createSubscriptionCheckout'] =
  resolverWithMetrics(
    'Mutation',
    'createSubscriptionCheckout',
    async (_p, { input }, ctx) => {
      const userId = assertAuth(ctx);

      // RATE LIMIT CHECK - chroni przed Stripe spam!
      await assertBillingRateLimit(userId);

      // ... reszta logiki
    }
  );
```

---

### 6. Chat Mutations (JUŻ CHRONIONE - tylko update imports)

**Pliki:**

- `src/graphql/resolvers/mutation/event-chat.ts`
- `src/graphql/resolvers/mutation/dm.ts`

**Status:** ✅ Już używają `checkEventChatSendRateLimit`, `checkDmSendRateLimit`, etc.

**Opcjonalne:** Zamień stare importy na nowe:

```typescript
// Stare (deprecated):
import { checkEventChatSendRateLimit } from '../../../lib/chat-rate-limit';

// Nowe (recommended):
import { assertEventChatSendRateLimit } from '../../../lib/rate-limit/domainRateLimiter';
```

---

## 📋 CHECKLIST

### Core System

- [x] Utworzyć `domainRateLimiter.ts`
- [x] Sliding window algorithm
- [x] Burst protection
- [x] GraphQL error formatting
- [x] Bucket configuration
- [x] Helper functions

### Chat

- [x] Refactor `chat-rate-limit.ts`
- [ ] Update chat mutation imports (optional)

### Event Membership

- [x] Add import to `event-members.ts`
- [ ] Add rate limit to `joinMember`
- [ ] Add rate limit to `acceptInviteMutation`
- [ ] Add rate limit to `leaveEventMutation`
- [ ] Add rate limit to `joinWaitlistOpenMutation`
- [ ] Add rate limit to `leaveWaitlistMutation`

### Join Requests

- [ ] Add import to `join-requests.ts`
- [ ] Add rate limit to `requestJoinEventWithAnswersMutation`
- [ ] Add rate limit to `cancelJoinRequestMutation`

### Feedback

- [ ] Add import to `feedback-questions.ts`
- [ ] Add rate limit to `submitReviewAndFeedback`
- [ ] Add rate limit to `sendFeedbackRequests` (CRITICAL!)

### Reports

- [ ] Add import to `reports.ts`
- [ ] Add rate limit to `createReport`

### Billing

- [ ] Add import to `billing.ts`
- [ ] Add rate limit to `createSubscriptionCheckout`
- [ ] Add rate limit to `createOneOffCheckout`
- [ ] Add rate limit to `createEventSponsorshipCheckout`
- [ ] Add rate limit to `cancelSubscription`
- [ ] Add rate limit to `reactivateSubscription`

### Testing & Documentation

- [ ] TypeScript check
- [ ] Update DOCUMENTATION.md
- [ ] Test rate limits in development
- [ ] Monitor Redis keys in production

---

## 🔥 PATTERN DO KOPIOWANIA

```typescript
// 1. Import na początku pliku
import { assertEventWriteRateLimit } from '../../../lib/rate-limit/domainRateLimiter';
// lub inny helper: assertFeedbackRateLimit, assertBillingRateLimit, etc.

// 2. W każdej chronionej mutation (zaraz po assertAuth):
export const myMutation: MutationResolvers['myMutation'] = resolverWithMetrics(
  'Mutation',
  'myMutation',
  async (_p, { input }, ctx) => {
    const userId = assertAuth(ctx);

    // ⚡ RATE LIMIT CHECK
    await assertEventWriteRateLimit(userId);
    // lub: await assertFeedbackRateLimit(userId);
    // lub: await assertBillingRateLimit(userId);
    // lub: await assertReportRateLimit(userId);

    // ... reszta logiki mutation
  }
);
```

---

## 💡 DEBUGGING

### Sprawdź klucze Redis

```bash
redis-cli KEYS "rl:domain:*"
redis-cli ZRANGE "rl:domain:gql:event:write:user123" 0 -1 WITHSCORES
```

### Zobacz limity

```typescript
import { BUCKET_CONFIG } from './lib/rate-limit/domainRateLimiter';
console.log(BUCKET_CONFIG);
```

### Test error handling

```graphql
# Wywołaj mutation 31 razy w ciągu 60s
mutation {
  joinMember(eventId: "...") {
    id
  }
}
# 31. request powinien zwrócić:
# {
#   "errors": [{
#     "message": "Rate limit exceeded. Please slow down and try again later.",
#     "extensions": {
#       "code": "RATE_LIMIT_EXCEEDED",
#       "retryAfter": 60
#     }
#   }]
# }
```

---

## 🚀 NASTĘPNE KROKI

1. **Zaaplikuj rate limiting w mutation resolvers** (follow checklist)
2. **Uruchom `pnpm typecheck`**
3. **Przetestuj w development** (spróbuj przekroczyć limit)
4. **Update DOCUMENTATION.md** (dodaj sekcję o rate limiting)
5. **Deploy na staging** i monitoruj Redis
6. **Production deployment** z monitoring

---

## 📊 EXPECTED REDIS KEY STRUCTURE

```
rl:domain:chat:event:send:{eventId}:{userId}      (ZSET, TTL 90s)
rl:domain:chat:dm:send:{threadId}:{userId}        (ZSET, TTL 90s)
rl:domain:gql:event:write:{userId}                (ZSET, TTL 120s)
rl:domain:gql:feedback:{userId}                   (ZSET, TTL 120s)
rl:domain:gql:feedback:send:{userId}              (ZSET, TTL 3660s)
rl:domain:gql:report:{userId}                     (ZSET, TTL 660s)
rl:domain:gql:billing:{userId}                    (ZSET, TTL 660s)
```

---

**Status:** 🟡 PARTIALLY IMPLEMENTED - Core system ready, mutations need updates
**Last Updated:** 2025-12-11
