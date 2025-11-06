# Chat System - Testing Guide

## Overview

Ten dokument opisuje, jak testować system czatu (DM + Event Chat).

## Test Structure

```
apps/api/src/
├── lib/__tests__/
│   ├── chat-rate-limit.test.ts
│   ├── chat-utils.test.ts
│   └── chat-guards.test.ts
├── graphql/resolvers/__tests__/
│   ├── dm.test.ts
│   ├── event-chat.test.ts
│   └── subscriptions.test.ts

apps/web/src/lib/api/__tests__/
├── dm.test.tsx
├── event-chat.test.tsx
└── subscriptions.test.tsx
```

## Backend Tests

### 1. Rate Limiting Tests

```typescript
// apps/api/src/lib/__tests__/chat-rate-limit.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { healthRedis } from '../redis';
import {
  checkDmSendRateLimit,
  checkEventChatSendRateLimit,
} from '../chat-rate-limit';

describe('Chat Rate Limiting', () => {
  beforeEach(async () => {
    // Clear Redis before each test
    await healthRedis.flushdb();
  });

  afterEach(async () => {
    await healthRedis.flushdb();
  });

  describe('checkDmSendRateLimit', () => {
    it('should allow messages within rate limit', async () => {
      const userId = 'user-1';
      const threadId = 'thread-1';

      // Should not throw for first 10 messages
      for (let i = 0; i < 10; i++) {
        await expect(
          checkDmSendRateLimit(userId, threadId)
        ).resolves.not.toThrow();
      }
    });

    it('should throw error when rate limit exceeded', async () => {
      const userId = 'user-1';
      const threadId = 'thread-1';

      // Send 10 messages (limit)
      for (let i = 0; i < 10; i++) {
        await checkDmSendRateLimit(userId, threadId);
      }

      // 11th message should fail
      await expect(checkDmSendRateLimit(userId, threadId)).rejects.toThrow(
        'Rate limit exceeded'
      );
    });

    it('should reset after window expires', async () => {
      const userId = 'user-1';
      const threadId = 'thread-1';

      // Send 10 messages
      for (let i = 0; i < 10; i++) {
        await checkDmSendRateLimit(userId, threadId);
      }

      // Wait for window to expire (30s + buffer)
      await new Promise((resolve) => setTimeout(resolve, 31000));

      // Should allow messages again
      await expect(
        checkDmSendRateLimit(userId, threadId)
      ).resolves.not.toThrow();
    });

    it('should isolate rate limits per user-thread pair', async () => {
      const user1 = 'user-1';
      const user2 = 'user-2';
      const thread1 = 'thread-1';

      // User 1 sends 10 messages
      for (let i = 0; i < 10; i++) {
        await checkDmSendRateLimit(user1, thread1);
      }

      // User 2 should still be able to send
      await expect(checkDmSendRateLimit(user2, thread1)).resolves.not.toThrow();
    });
  });

  describe('checkEventChatSendRateLimit', () => {
    it('should enforce rate limit per user-intent', async () => {
      const userId = 'user-1';
      const intentId = 'intent-1';

      // Send 10 messages
      for (let i = 0; i < 10; i++) {
        await checkEventChatSendRateLimit(userId, intentId);
      }

      // 11th should fail
      await expect(
        checkEventChatSendRateLimit(userId, intentId)
      ).rejects.toThrow('Rate limit exceeded');
    });
  });
});
```

### 2. Content Sanitization Tests

```typescript
// apps/api/src/lib/__tests__/chat-utils.test.ts
import { describe, it, expect } from 'vitest';
import {
  sanitizeMessageContent,
  sanitizeDmContent,
  buildCursor,
  parseCursor,
  canEdit,
  canSoftDelete,
} from '../chat-utils';

describe('Chat Utils', () => {
  describe('sanitizeMessageContent', () => {
    it('should strip HTML tags', () => {
      const input = '<script>alert("XSS")</script>Hello';
      const output = sanitizeMessageContent(input);
      expect(output).toBe('alert("XSS")Hello');
    });

    it('should trim whitespace', () => {
      const input = '  Hello World  ';
      const output = sanitizeMessageContent(input);
      expect(output).toBe('Hello World');
    });

    it('should throw on empty content', () => {
      expect(() => sanitizeMessageContent('')).toThrow(
        'Content cannot be empty'
      );
      expect(() => sanitizeMessageContent('   ')).toThrow(
        'Content cannot be empty'
      );
    });

    it('should throw on content too long', () => {
      const input = 'a'.repeat(2001);
      expect(() => sanitizeMessageContent(input)).toThrow('Content too long');
    });

    it('should validate URLs in markdown links', () => {
      const input = '[Google](https://google.com) [Bad](javascript:alert(1))';
      const output = sanitizeMessageContent(input);
      expect(output).toContain('[Google](https://google.com)');
      expect(output).toContain('Bad'); // Invalid link stripped
      expect(output).not.toContain('javascript:');
    });

    it('should preserve allowed markdown', () => {
      const input = '**bold** _italic_ `code`';
      const output = sanitizeMessageContent(input);
      expect(output).toBe('**bold** _italic_ `code`');
    });
  });

  describe('cursor pagination', () => {
    it('should build and parse cursor correctly', () => {
      const data = {
        createdAt: new Date('2025-01-01T00:00:00Z'),
        id: 'msg-123',
      };

      const cursor = buildCursor(data);
      expect(cursor).toBeTruthy();

      const parsed = parseCursor(cursor);
      expect(parsed).toEqual({
        createdAt: data.createdAt,
        id: data.id,
      });
    });

    it('should return null for invalid cursor', () => {
      expect(parseCursor('invalid')).toBeNull();
      expect(parseCursor('')).toBeNull();
    });
  });

  describe('time window validation', () => {
    it('should allow edit within 5 minutes', () => {
      const now = new Date();
      const fourMinutesAgo = new Date(now.getTime() - 4 * 60 * 1000);

      expect(canEdit(fourMinutesAgo)).toBe(true);
    });

    it('should not allow edit after 5 minutes', () => {
      const now = new Date();
      const sixMinutesAgo = new Date(now.getTime() - 6 * 60 * 1000);

      expect(canEdit(sixMinutesAgo)).toBe(false);
    });

    it('should allow soft delete within 15 minutes', () => {
      const now = new Date();
      const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

      expect(canSoftDelete(tenMinutesAgo)).toBe(true);
    });

    it('should not allow soft delete after 15 minutes', () => {
      const now = new Date();
      const twentyMinutesAgo = new Date(now.getTime() - 20 * 60 * 1000);

      expect(canSoftDelete(twentyMinutesAgo)).toBe(false);
    });
  });
});
```

### 3. DM Resolver Tests

```typescript
// apps/api/src/graphql/resolvers/__tests__/dm.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '../../../lib/prisma';
import { sendDmMessageMutation } from '../mutation/dm';
import { dmThreadsQuery } from '../query/dm';

describe('DM Resolvers', () => {
  let user1: any;
  let user2: any;

  beforeEach(async () => {
    // Create test users
    user1 = await prisma.user.create({
      data: {
        email: 'user1@test.com',
        name: 'User 1',
      },
    });

    user2 = await prisma.user.create({
      data: {
        email: 'user2@test.com',
        name: 'User 2',
      },
    });
  });

  describe('sendDmMessage', () => {
    it('should create thread and send message', async () => {
      const context = {
        user: {
          id: user1.id,
          name: user1.name,
          email: user1.email,
          role: 'USER',
        },
        pubsub: {
          publish: vi.fn(),
        },
      };

      const result = await sendDmMessageMutation(
        {},
        {
          input: {
            recipientId: user2.id,
            content: 'Hello!',
          },
        },
        context as any,
        {} as any
      );

      expect(result).toBeDefined();
      expect(result.content).toBe('Hello!');
      expect(result.senderId).toBe(user1.id);

      // Verify thread was created
      const thread = await prisma.dmThread.findFirst({
        where: {
          OR: [
            { aUserId: user1.id, bUserId: user2.id },
            { aUserId: user2.id, bUserId: user1.id },
          ],
        },
      });

      expect(thread).toBeDefined();
    });

    it('should publish dmMessageAdded subscription', async () => {
      const mockPublish = vi.fn();
      const context = {
        user: {
          id: user1.id,
          name: user1.name,
          email: user1.email,
          role: 'USER',
        },
        pubsub: {
          publish: mockPublish,
        },
      };

      await sendDmMessageMutation(
        {},
        {
          input: {
            recipientId: user2.id,
            content: 'Hello!',
          },
        },
        context as any,
        {} as any
      );

      // Verify subscription was published
      expect(mockPublish).toHaveBeenCalledWith(
        expect.objectContaining({
          topic: expect.stringMatching(/^dmMessageAdded:/),
        })
      );
    });

    it('should respect user blocks', async () => {
      // Create block
      await prisma.userBlock.create({
        data: {
          blockerId: user2.id,
          blockedId: user1.id,
        },
      });

      const context = {
        user: {
          id: user1.id,
          name: user1.name,
          email: user1.email,
          role: 'USER',
        },
        pubsub: { publish: vi.fn() },
      };

      await expect(
        sendDmMessageMutation(
          {},
          {
            input: {
              recipientId: user2.id,
              content: 'Hello!',
            },
          },
          context as any,
          {} as any
        )
      ).rejects.toThrow('Cannot send message to this user');
    });

    it('should sanitize content', async () => {
      const context = {
        user: {
          id: user1.id,
          name: user1.name,
          email: user1.email,
          role: 'USER',
        },
        pubsub: { publish: vi.fn() },
      };

      const result = await sendDmMessageMutation(
        {},
        {
          input: {
            recipientId: user2.id,
            content: '<script>alert(1)</script>Hello',
          },
        },
        context as any,
        {} as any
      );

      expect(result.content).not.toContain('<script>');
      expect(result.content).toContain('Hello');
    });
  });

  describe('dmThreads', () => {
    it('should return threads for user', async () => {
      // Create thread with messages
      const thread = await prisma.dmThread.create({
        data: {
          aUserId: user1.id,
          bUserId: user2.id,
          pairKey: `${user1.id}|${user2.id}`,
          messages: {
            create: {
              senderId: user1.id,
              content: 'Hello!',
            },
          },
        },
      });

      const context = {
        user: {
          id: user1.id,
          name: user1.name,
          email: user1.email,
          role: 'USER',
        },
      };

      const result = await dmThreadsQuery(
        {},
        { limit: 20, offset: 0 },
        context as any,
        {} as any
      );

      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe(thread.id);
    });

    it('should calculate unread count correctly', async () => {
      // Create thread with unread messages
      const thread = await prisma.dmThread.create({
        data: {
          aUserId: user1.id,
          bUserId: user2.id,
          pairKey: `${user1.id}|${user2.id}`,
          messages: {
            create: [
              { senderId: user2.id, content: 'Msg 1' },
              { senderId: user2.id, content: 'Msg 2' },
            ],
          },
        },
      });

      const context = {
        user: {
          id: user1.id,
          name: user1.name,
          email: user1.email,
          role: 'USER',
        },
      };

      const result = await dmThreadsQuery(
        {},
        { limit: 20, offset: 0 },
        context as any,
        {} as any
      );

      expect(result.items[0].unreadCount).toBe(2);
    });
  });
});
```

### 4. Event Chat Resolver Tests

```typescript
// apps/api/src/graphql/resolvers/__tests__/event-chat.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '../../../lib/prisma';
import { sendIntentMessageMutation } from '../mutation/event-chat';
import { intentUnreadCountQuery } from '../query/event-chat';

describe('Event Chat Resolvers', () => {
  let user: any;
  let intent: any;
  let member: any;

  beforeEach(async () => {
    user = await prisma.user.create({
      data: {
        email: 'user@test.com',
        name: 'Test User',
      },
    });

    intent = await prisma.intent.create({
      data: {
        title: 'Test Intent',
        startAt: new Date(),
        endAt: new Date(Date.now() + 3600000),
        ownerId: user.id,
      },
    });

    member = await prisma.intentMember.create({
      data: {
        intentId: intent.id,
        userId: user.id,
        status: 'JOINED',
        role: 'OWNER',
      },
    });
  });

  describe('sendIntentMessage', () => {
    it('should send message if user is JOINED', async () => {
      const context = {
        user: { id: user.id, name: user.name, email: user.email, role: 'USER' },
        pubsub: { publish: vi.fn() },
      };

      const result = await sendIntentMessageMutation(
        {},
        {
          input: {
            intentId: intent.id,
            content: 'Hello event!',
          },
        },
        context as any,
        {} as any
      );

      expect(result).toBeDefined();
      expect(result.content).toBe('Hello event!');
      expect(result.authorId).toBe(user.id);
    });

    it('should reject if user is not JOINED', async () => {
      const otherUser = await prisma.user.create({
        data: {
          email: 'other@test.com',
          name: 'Other User',
        },
      });

      const context = {
        user: {
          id: otherUser.id,
          name: otherUser.name,
          email: otherUser.email,
          role: 'USER',
        },
        pubsub: { publish: vi.fn() },
      };

      await expect(
        sendIntentMessageMutation(
          {},
          {
            input: {
              intentId: intent.id,
              content: 'Hello!',
            },
          },
          context as any,
          {} as any
        )
      ).rejects.toThrow('You must be a joined member');
    });

    it('should validate replyTo is in same intent', async () => {
      // Create message in different intent
      const otherIntent = await prisma.intent.create({
        data: {
          title: 'Other Intent',
          startAt: new Date(),
          endAt: new Date(Date.now() + 3600000),
          ownerId: user.id,
        },
      });

      const otherMessage = await prisma.intentChatMessage.create({
        data: {
          intentId: otherIntent.id,
          authorId: user.id,
          content: 'Other message',
        },
      });

      const context = {
        user: { id: user.id, name: user.name, email: user.email, role: 'USER' },
        pubsub: { publish: vi.fn() },
      };

      await expect(
        sendIntentMessageMutation(
          {},
          {
            input: {
              intentId: intent.id,
              content: 'Reply',
              replyToId: otherMessage.id,
            },
          },
          context as any,
          {} as any
        )
      ).rejects.toThrow('Reply target not found in this intent');
    });
  });

  describe('intentUnreadCount', () => {
    it('should return 0 if no unread messages', async () => {
      const context = {
        user: { id: user.id, name: user.name, email: user.email, role: 'USER' },
      };

      const result = await intentUnreadCountQuery(
        {},
        { intentId: intent.id },
        context as any,
        {} as any
      );

      expect(result).toBe(0);
    });

    it('should count unread messages correctly', async () => {
      // Create messages
      await prisma.intentChatMessage.createMany({
        data: [
          { intentId: intent.id, authorId: user.id, content: 'Msg 1' },
          { intentId: intent.id, authorId: user.id, content: 'Msg 2' },
        ],
      });

      // Create another user who hasn't read
      const otherUser = await prisma.user.create({
        data: {
          email: 'other@test.com',
          name: 'Other User',
        },
      });

      await prisma.intentMember.create({
        data: {
          intentId: intent.id,
          userId: otherUser.id,
          status: 'JOINED',
        },
      });

      const context = {
        user: {
          id: otherUser.id,
          name: otherUser.name,
          email: otherUser.email,
          role: 'USER',
        },
      };

      const result = await intentUnreadCountQuery(
        {},
        { intentId: intent.id },
        context as any,
        {} as any
      );

      expect(result).toBe(2);
    });

    it('should use Redis cache', async () => {
      // First call - cache miss
      const context = {
        user: { id: user.id, name: user.name, email: user.email, role: 'USER' },
      };

      const result1 = await intentUnreadCountQuery(
        {},
        { intentId: intent.id },
        context as any,
        {} as any
      );

      // Second call - should hit cache
      const result2 = await intentUnreadCountQuery(
        {},
        { intentId: intent.id },
        context as any,
        {} as any
      );

      expect(result1).toBe(result2);
      // TODO: Verify Redis was hit (mock Redis client)
    });
  });
});
```

## Frontend Tests

### 1. Hook Tests

```typescript
// apps/web/src/lib/api/__tests__/dm.test.tsx
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, beforeEach } from 'vitest';
import { useGetDmThreads, useSendDmMessage } from '../dm';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('DM Hooks', () => {
  describe('useGetDmThreads', () => {
    it('should fetch threads', async () => {
      const { result } = renderHook(() => useGetDmThreads(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeDefined();
    });
  });

  describe('useSendDmMessage', () => {
    it('should send message and invalidate cache', async () => {
      const { result } = renderHook(() => useSendDmMessage(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        input: {
          recipientId: 'user-2',
          content: 'Hello!',
        },
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // TODO: Verify cache was invalidated
    });
  });
});
```

## Integration Tests

### E2E Chat Flow

```typescript
// apps/api/src/__tests__/e2e/chat-flow.test.ts
import { describe, it, expect } from 'vitest';
import { createTestClient } from '../test-utils';

describe('E2E: Chat Flow', () => {
  it('should complete full DM conversation', async () => {
    const user1Client = createTestClient('user-1');
    const user2Client = createTestClient('user-2');

    // User 1 sends message
    const { data: msg1 } = await user1Client.mutate({
      mutation: SEND_DM_MESSAGE,
      variables: {
        input: {
          recipientId: 'user-2',
          content: 'Hello!',
        },
      },
    });

    expect(msg1.sendDmMessage).toBeDefined();

    // User 2 sees message
    const { data: threads } = await user2Client.query({
      query: GET_DM_THREADS,
    });

    expect(threads.dmThreads.items).toHaveLength(1);
    expect(threads.dmThreads.items[0].unreadCount).toBe(1);

    // User 2 marks as read
    await user2Client.mutate({
      mutation: MARK_DM_THREAD_READ,
      variables: {
        threadId: threads.dmThreads.items[0].id,
      },
    });

    // Verify unread count is 0
    const { data: updatedThreads } = await user2Client.query({
      query: GET_DM_THREADS,
    });

    expect(updatedThreads.dmThreads.items[0].unreadCount).toBe(0);
  });
});
```

## Running Tests

### Backend

```bash
# Run all tests
cd apps/api
pnpm test

# Run specific test file
pnpm test chat-rate-limit.test.ts

# Run with coverage
pnpm test:coverage

# Watch mode
pnpm test:watch
```

### Frontend

```bash
# Run all tests
cd apps/web
pnpm test

# Run specific test file
pnpm test dm.test.tsx

# Watch mode
pnpm test:watch
```

## Test Coverage Goals

| Module               | Target Coverage |
| -------------------- | --------------- |
| Rate Limiting        | 100%            |
| Sanitization         | 100%            |
| DM Resolvers         | 90%             |
| Event Chat Resolvers | 90%             |
| Frontend Hooks       | 80%             |
| Subscriptions        | 70%             |

## CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgis/postgis:15-3.3
        env:
          POSTGRES_PASSWORD: postgres
        ports:
          - 5432:5432
      redis:
        image: redis:7
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'pnpm'

      - run: pnpm install
      - run: pnpm --filter api test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./apps/api/coverage/lcov.info

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'pnpm'

      - run: pnpm install
      - run: pnpm --filter web test:coverage
```

---

**Next Steps:**

1. Implement unit tests for rate limiting ✅ (examples provided)
2. Implement unit tests for sanitization ✅ (examples provided)
3. Add integration tests for resolvers
4. Add E2E tests for complete flows
5. Set up CI/CD pipeline
