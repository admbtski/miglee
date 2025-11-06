# Chat System Implementation - Complete Guide

## 📚 Documentation Index

1. **[CHAT_IMPLEMENTATION_SUMMARY.md](./CHAT_IMPLEMENTATION_SUMMARY.md)** - Główne podsumowanie implementacji
   - ✅ Completed tasks (8/12)
   - 🚧 Pending tasks (4/12)
   - Architecture decisions
   - Performance benchmarks
   - Known issues

2. **[CHAT_SUBSCRIPTIONS_GUIDE.md](./CHAT_SUBSCRIPTIONS_GUIDE.md)** - Przewodnik po WebSocket subscriptions
   - WebSocket client setup
   - Subscription hooks implementation
   - Usage in components
   - Best practices

3. **[CHAT_USAGE_EXAMPLES.md](./CHAT_USAGE_EXAMPLES.md)** - Przykłady użycia
   - DM operations
   - Event Chat operations
   - Advanced patterns
   - Error handling

4. **[CHAT_TESTING_GUIDE.md](./CHAT_TESTING_GUIDE.md)** - Przewodnik po testach
   - Unit tests
   - Integration tests
   - E2E tests
   - CI/CD setup

## 🎯 Quick Start

### Backend (API)

```bash
cd apps/api

# Install dependencies
pnpm install

# Run migrations (if needed)
pnpm prisma migrate dev

# Start dev server
pnpm dev

# Run tests
pnpm test
```

### Frontend (Web)

```bash
cd apps/web

# Install dependencies
pnpm install

# Generate GraphQL types
pnpm codegen

# Start dev server
pnpm dev

# Run tests
pnpm test
```

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                   │
├─────────────────────────────────────────────────────────────┤
│  React Query Hooks          WebSocket Client                │
│  - useGetDmThreads()        - useDmMessageAdded()          │
│  - useSendDmMessage()       - useIntentMessageAdded()      │
│  - useGetIntentMessages()   - Typing indicators            │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ GraphQL (HTTP + WebSocket)
                 │
┌────────────────┴────────────────────────────────────────────┐
│                    Backend (Fastify + Mercurius)             │
├─────────────────────────────────────────────────────────────┤
│  Resolvers                  Subscriptions                   │
│  - DM (Query/Mutation)      - dmMessageAdded               │
│  - Event Chat               - intentMessageAdded           │
│  - Rate Limiting            - Typing indicators            │
│  - Sanitization                                            │
└────────────────┬────────────────────────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
┌───────┴──────┐  ┌──────┴──────┐
│  PostgreSQL  │  │    Redis    │
│  (Prisma)    │  │  (Cache +   │
│              │  │  Rate Limit) │
└──────────────┘  └─────────────┘
```

## 📋 Implementation Status

### ✅ Completed (8/12)

1. **Backend DM - Subskrypcje**
   - Publikacja `dmMessageAdded` w `sendDmMessage`
   - WebSocket subscriptions w `subscription/chat.ts`

2. **Backend DM - Rate Limiting**
   - Redis sliding window (10 msg / 30s)
   - Per user-thread isolation

3. **Backend DM - Sanityzacja**
   - XSS protection (HTML stripping)
   - URL validation w markdown links
   - Max 2000 chars

4. **Backend DM - DmRead**
   - `lastReadAt` timestamp per user per thread
   - Efficient unread count calculation

5. **Backend Event Chat - Redis Cache**
   - `intentUnreadCount` cache (TTL 10s)
   - Auto-invalidation po `markIntentChatRead`

6. **Backend - Mute Mutations**
   - `muteIntent` i `muteDmThread` już zaimplementowane

7. **Frontend - GraphQL Operations**
   - `CreateOrGetDmThread` mutation
   - `MuteDmThread` / `MuteIntent` mutations
   - Subscription operations (DM + Event Chat)

8. **Frontend - Hooki**
   - `useCreateOrGetDmThread()`
   - `useMuteDmThread()`
   - `useMuteIntent()`

### 🚧 Pending (4/12)

1. **Backend - DataLoaders** (TODO #6)
   - User batching
   - Intent batching
   - Membership batching
   - **Impact:** Eliminacja N+1 queries

2. **Frontend - Subskrypcje** (TODO #9)
   - `useDmMessageAdded()`
   - `useIntentMessageAdded()`
   - Typing indicators
   - **Impact:** Real-time updates

3. **Frontend - Optymalizacje** (TODO #10)
   - Optimistic updates
   - Deduplikacja wiadomości
   - Throttling typing indicators
   - **Impact:** Lepsze UX

4. **Testy** (TODO #12)
   - Unit tests (rate limiting, sanitization)
   - Integration tests (resolvers)
   - E2E tests (flows)
   - **Impact:** Jakość kodu

## 🔑 Key Features

### Direct Messages (DM)

- ✅ 1:1 conversations
- ✅ Create/get thread
- ✅ Send/edit/delete messages
- ✅ Read receipts (DmRead)
- ✅ Unread count
- ✅ Mute threads
- ✅ User blocks enforcement
- ✅ Rate limiting (10 msg / 30s)
- ✅ Content sanitization
- ⚠️ Real-time updates (pending subscriptions)
- ⚠️ Typing indicators (pending)

### Event Chat (Intent Chat)

- ✅ Group chat per Intent
- ✅ Send/edit/delete messages
- ✅ Reply to messages
- ✅ Read receipts (IntentChatRead)
- ✅ Unread count (cached)
- ✅ Mute chat
- ✅ Access control (JOINED members only)
- ✅ Rate limiting (10 msg / 30s)
- ✅ Content sanitization
- ✅ Soft delete (tombstone)
- ✅ Hard delete (owner/admin)
- ⚠️ Real-time updates (pending subscriptions)
- ⚠️ Typing indicators (pending)

## 🚀 Performance

### Current Metrics

| Operation                | Before | After            | Target  |
| ------------------------ | ------ | ---------------- | ------- |
| `dmThreads` (20 threads) | ~150ms | ~120ms           | ~60ms\* |
| `intentUnreadCount`      | ~50ms  | ~5ms (cache hit) | ~5ms    |
| `sendDmMessage`          | ~80ms  | ~85ms            | ~80ms   |

\* With DataLoaders

### Optimizations Implemented

1. **Redis Cache** - `intentUnreadCount` (10s TTL)
2. **DmRead Table** - Efficient unread calculation
3. **Parallel Queries** - `Promise.all()` for unread counts
4. **Rate Limiting** - Prevent abuse, reduce load

### Planned Optimizations

1. **DataLoaders** - Batch user/intent/membership queries
2. **Prefetching** - Next page during scroll
3. **Virtualization** - Large message lists
4. **Debouncing** - `markAsRead` throttling

## 🔒 Security

### Implemented

- ✅ Rate limiting (Redis sliding window)
- ✅ Content sanitization (XSS protection)
- ✅ User blocks enforcement
- ✅ Access control (JOINED members)
- ✅ Message length validation
- ✅ URL validation in links
- ✅ Auth required for all operations

### TODO

- ⚠️ Spam detection (NLP-based)
- ⚠️ Shadow-mute dla repeat offenders
- ⚠️ GDPR compliance (export/redaction)
- ⚠️ Audit logs dla moderacji
- ⚠️ End-to-end encryption

## 📖 API Reference

### DM Operations

```typescript
// Queries
useGetDmThreads({ limit, offset, unreadOnly });
useGetDmThread({ id, otherUserId });
useGetDmMessages({ threadId, limit, offset, beforeMessageId });

// Mutations
useCreateOrGetDmThread({ userId });
useSendDmMessage({ input: { recipientId, content } });
useUpdateDmMessage({ id, input: { content } });
useDeleteDmMessage({ id });
useMarkDmThreadRead({ threadId });
useDeleteDmThread({ id });
useMuteDmThread({ threadId, muted });

// Subscriptions (TODO)
useDmMessageAdded(threadId);
useDmTyping(threadId, onTyping);
```

### Event Chat Operations

```typescript
// Queries
useGetIntentMessages({ intentId, after, limit }); // Infinite scroll
useGetIntentUnreadCount({ intentId });

// Mutations
useSendIntentMessage({ input: { intentId, content, replyToId } });
useEditIntentMessage({ id, input: { content } });
useDeleteIntentMessage({ id, soft });
useMarkIntentChatRead({ intentId, at });
useMuteIntent({ intentId, muted });

// Subscriptions (TODO)
useIntentMessageAdded(intentId);
useIntentTyping(intentId, onTyping);
```

## 🛠️ Development Workflow

### 1. Make Backend Changes

```bash
cd apps/api

# Edit resolvers
vim src/graphql/resolvers/mutation/dm.ts

# Run tests
pnpm test

# Check types
pnpm typecheck
```

### 2. Update GraphQL Operations

```bash
cd packages/contracts

# Edit operations
vim graphql/operations/dm.graphql

# Regenerate types
cd ../../apps/web
pnpm codegen
```

### 3. Update Frontend Hooks

```bash
cd apps/web

# Edit hooks
vim src/lib/api/dm.tsx

# Run tests
pnpm test

# Check types
pnpm typecheck
```

### 4. Test End-to-End

```bash
# Start backend
cd apps/api
pnpm dev

# Start frontend (new terminal)
cd apps/web
pnpm dev

# Open http://localhost:3000
```

## 🐛 Troubleshooting

### Issue: "Rate limit exceeded"

**Cause:** Sending too many messages (>10 in 30s)

**Solution:**

- Wait for cooldown period
- Check `error.extensions.retryAfter`
- Implement UI cooldown indicator

### Issue: "Cannot send message to this user"

**Cause:** User has blocked you or you blocked them

**Solution:**

- Check `UserBlock` table
- Use `isBlocked(userId)` query
- Show appropriate UI message

### Issue: "You must be a joined member"

**Cause:** Trying to access event chat without JOINED status

**Solution:**

- Check `IntentMember.status`
- Verify user has `status: 'JOINED'`
- Handle PENDING/INVITED/BANNED states

### Issue: Duplicate messages in UI

**Cause:** Subscription + optimistic update conflict

**Solution:**

- Implement dedupe by `id`
- Use `Map<id, message>` instead of array
- Filter duplicates in subscription handler

### Issue: Unread count not updating

**Cause:** Cache not invalidated

**Solution:**

- Call `markDmThreadRead()` or `markIntentChatRead()`
- Check cache invalidation in mutation hooks
- Verify Redis cache TTL

## 📞 Support

### Documentation

- [Prisma Schema](apps/api/prisma/schema.prisma)
- [GraphQL Schema](packages/contracts/graphql/schema.graphql)
- [API Resolvers](apps/api/src/graphql/resolvers/)
- [Frontend Hooks](apps/web/src/lib/api/)

### Related Files

- Rate Limiting: `apps/api/src/lib/chat-rate-limit.ts`
- Sanitization: `apps/api/src/lib/chat-utils.ts`
- Guards: `apps/api/src/graphql/resolvers/chat-guards.ts`
- Helpers: `apps/api/src/graphql/resolvers/helpers.ts`

### Contact

- GitHub Issues: [miglee/issues](https://github.com/your-org/miglee/issues)
- Slack: #dev-chat-system

## 🎓 Learning Resources

### GraphQL

- [Mercurius Docs](https://mercurius.dev/)
- [GraphQL Best Practices](https://graphql.org/learn/best-practices/)

### React Query

- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Optimistic Updates](https://tanstack.com/query/latest/docs/react/guides/optimistic-updates)

### Prisma

- [Prisma Docs](https://www.prisma.io/docs)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)

### Redis

- [Redis Docs](https://redis.io/docs/)
- [Rate Limiting Patterns](https://redis.io/docs/manual/patterns/rate-limiter/)

## 📝 License

MIT

---

**Last Updated:** 2025-11-06  
**Version:** 1.0.0  
**Status:** In Progress (8/12 tasks completed)

**Next Steps:**

1. Implement WebSocket subscriptions (see [CHAT_SUBSCRIPTIONS_GUIDE.md](./CHAT_SUBSCRIPTIONS_GUIDE.md))
2. Add optimistic updates (see [CHAT_USAGE_EXAMPLES.md](./CHAT_USAGE_EXAMPLES.md))
3. Implement DataLoaders for batching
4. Write tests (see [CHAT_TESTING_GUIDE.md](./CHAT_TESTING_GUIDE.md))
