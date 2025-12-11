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
- [x] Update chat mutation imports (direct to domainRateLimiter)

### Event Membership

- [x] Add import to `event-members.ts`
- [x] Add rate limit to `joinMember`
- [x] Add rate limit to `acceptInviteMutation`
- [x] Add rate limit to `leaveEventMutation`
- [x] Add rate limit to `joinWaitlistOpenMutation`
- [x] Add rate limit to `leaveWaitlistMutation`

### Join Requests

- [x] Add import to `join-requests.ts`
- [x] Add rate limit to `requestJoinEventWithAnswersMutation`
- [x] Add rate limit to `cancelJoinRequestMutation`

### Feedback

- [x] Add import to `feedback-questions.ts`
- [x] Add rate limit to `submitReviewAndFeedback`
- [x] Add rate limit to `sendFeedbackRequests` (CRITICAL!)

### Reports

- [x] Add import to `reports.ts`
- [x] Add rate limit to `createReport`

### Billing

- [x] Add import to `billing.ts`
- [x] Add rate limit to `createSubscriptionCheckout`
- [x] Add rate limit to `createOneOffCheckout`
- [x] Add rate limit to `createEventSponsorshipCheckout`
- [x] Add rate limit to `cancelSubscription`
- [x] Add rate limit to `reactivateSubscription`

### Testing & Documentation

- [x] TypeScript check (0 errors)
- [x] Update DOCUMENTATION.md
- [x] Update CHECKLIST_BEFORE_PRO.md
- [ ] Test rate limits in development (MANUAL TESTING REQUIRED)
- [ ] Monitor Redis keys in production (POST-DEPLOYMENT)

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

### ✅ COMPLETED (Implementation Phase)

1. ✅ **Core System Created**
   - `domainRateLimiter.ts` with sliding window + burst protection
   - 10 rate limit buckets configured
   - GraphQL error formatting with `retryAfter`
   - Fail-open strategy on Redis errors

2. ✅ **All Mutations Protected**
   - Billing (5): Stripe spam protection
   - Feedback (2): Email spam protection (CRITICAL)
   - Event Membership (5): Join/leave spam protection
   - Join Requests (2): Request spam protection
   - Reports (1): Abuse reporting protection
   - Chat (4): Already protected via refactored system

3. ✅ **Code Quality**
   - TypeScript: 0 errors
   - Deprecated code removed from `chat-rate-limit.ts`
   - Direct imports to `domainRateLimiter`
   - Consistent naming (`assert*RateLimit`)

4. ✅ **Documentation**
   - DOCUMENTATION.md updated with 2-layer architecture
   - CHECKLIST_BEFORE_PRO.md marked complete
   - RATE_LIMITING_IMPLEMENTATION.md comprehensive guide
   - JWT plugin dependency fixed

5. ✅ **REST Endpoints Protected**
   - `/health/*` → read preset (300/min)
   - `/webhooks/stripe` → webhook preset (200/min)
   - `/api/upload/local` → upload preset (20/hour)
   - `/admin/queues/stats` → expensive preset (5/min)

### 🧪 TESTING PHASE (Manual - Not Automated)

#### 1. Development Testing Checklist

**Prerequisites:**

```bash
# Start API + Redis
pnpm dev

# Open GraphQL playground
http://localhost:4000/graphql
```

**Test Cases:**

**A. Test Billing Rate Limit (10/10min)**

```graphql
# Run this mutation 11 times within 10 minutes
mutation {
  createSubscriptionCheckout(input: { planKind: PLUS, interval: MONTHLY }) {
    checkoutUrl
  }
}

# Expected: 11th request should return:
# {
#   "errors": [{
#     "message": "Rate limit exceeded. Please slow down and try again later.",
#     "extensions": {
#       "code": "RATE_LIMIT_EXCEEDED",
#       "retryAfter": 600,
#       "bucket": "gql:billing",
#       "currentCount": 11,
#       "maxAllowed": 10
#     }
#   }]
# }
```

**B. Test Event Write Rate Limit (30/min)**

```graphql
# Run this mutation 31 times within 1 minute
mutation {
  joinMember(eventId: "test-event-id") {
    id
  }
}

# Expected: 31st request should fail with RATE_LIMIT_EXCEEDED
```

**C. Test Chat Burst Limit (5/5s)**

```graphql
# Send 6 messages within 5 seconds
mutation {
  sendEventMessage(
    input: { eventId: "test-event-id", content: "Test message" }
  ) {
    id
  }
}

# Expected: 6th message within 5s should return:
# {
#   "errors": [{
#     "message": "Too many requests in a short time. Please wait a moment and try again.",
#     "extensions": {
#       "code": "RATE_LIMIT_BURST_EXCEEDED",
#       "retryAfter": 5,
#       "bucket": "chat:event:send"
#     }
#   }]
# }
```

**D. Test Email Spam Protection (3/hour) - CRITICAL**

```graphql
# Run this mutation 4 times within 1 hour
mutation {
  sendFeedbackRequests(eventId: "test-event-id") {
    sentCount
  }
}

# Expected: 4th request should fail with RATE_LIMIT_EXCEEDED
# This is CRITICAL - prevents accidental mass email spam!
```

**E. Verify Redis Keys**

```bash
# Check domain rate limit keys
redis-cli KEYS "domain:*"

# Expected output:
# 1) "domain:gql:billing:user-123"
# 2) "domain:gql:event:write:user-123"
# 3) "domain:chat:event:send:event-456:user-123"
# etc.

# Inspect specific key
redis-cli ZRANGE "domain:gql:billing:user-123" 0 -1 WITHSCORES

# Expected: timestamps of recent requests
```

**F. Test Fail-Open Behavior**

```bash
# Stop Redis
docker stop redis

# Try mutation
# Expected: Should succeed (fail-open), with Redis error logged
```

#### 2. Monitoring in Production

**Redis Monitoring:**

```bash
# Monitor rate limit keys
redis-cli --scan --pattern "domain:*" | wc -l

# Check memory usage
redis-cli INFO memory

# Monitor expired keys
redis-cli INFO keyspace
```

**Application Logs:**

```bash
# Filter rate limit events
grep "Rate limit" logs/app.log

# Check for Redis errors
grep "Rate limit check failed" logs/app.log

# Monitor exceeded limits
grep "Rate limit exceeded" logs/app.log
```

**Metrics to Track:**

- Rate limit hits per bucket per hour
- Rate limit failures (Redis errors)
- Most rate-limited users
- Most rate-limited endpoints

#### 3. Load Testing (Optional but Recommended)

**Using k6 or Artillery:**

```javascript
// k6 script example
import http from 'k6/http';

export default function () {
  const url = 'http://localhost:4000/graphql';
  const payload = JSON.stringify({
    query: `mutation { joinMember(eventId: "test") { id } }`,
  });

  http.post(url, payload, {
    headers: { 'Content-Type': 'application/json' },
  });
}

// Run: k6 run --vus 50 --duration 30s script.js
// Expected: Should see 429 errors after hitting limits
```

### 📊 SUCCESS CRITERIA

#### Development Testing

- [ ] All test cases (A-F) pass as expected
- [ ] Rate limit errors include correct `retryAfter`
- [ ] Redis keys created with proper TTL
- [ ] Fail-open works when Redis is down
- [ ] No TypeScript errors

#### Production Readiness

- [ ] Load testing completed (if applicable)
- [ ] Monitoring dashboards configured
- [ ] Alert thresholds set for rate limit violations
- [ ] Documentation reviewed by team
- [ ] Deployment plan includes Redis monitoring

### 🔧 TROUBLESHOOTING

**Issue: Rate limits not working**

```bash
# Check Redis connection
redis-cli PING
# Should return: PONG

# Check if rateLimitRedis is connected
# Look for log: "Redis connected" with connection: "rate-limit"

# Verify env variable
echo $REDIS_URL
```

**Issue: Too strict limits in development**

```typescript
// Temporarily increase limits in domainRateLimiter.ts
'gql:event:write': {
  maxRequests: 100, // increased from 30
  windowSeconds: 60,
},
```

**Issue: GraphQL errors not formatted correctly**

```typescript
// Check that error has extensions
console.log(error.extensions);
// Should include: { code, retryAfter, bucket, currentCount, maxAllowed }
```

### 🎯 POST-DEPLOYMENT

1. **First 24 Hours**
   - Monitor rate limit hits every hour
   - Check for unusual patterns (bot attacks, legitimate users hitting limits)
   - Adjust limits if needed

2. **First Week**
   - Analyze rate limit violations per bucket
   - Identify most limited operations
   - Fine-tune limits based on real usage

3. **Ongoing**
   - Weekly review of rate limit metrics
   - Monthly adjustment of limits based on growth
   - Quarterly review of bucket strategy

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

**Status:** ✅ **FULLY IMPLEMENTED** - All mutations protected, TypeScript passes, documentation updated
**Last Updated:** 2025-12-11
**Ready for:** Manual testing in development, then production deployment
