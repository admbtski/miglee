# Chat Subscriptions Implementation Guide

## Overview

Ten dokument opisuje, jak zaimplementować hooki subskrypcji WebSocket dla real-time chat updates.

## Prerequisites

- ✅ Backend subscriptions są już zaimplementowane (`apps/api/src/graphql/resolvers/subscription/chat.ts`)
- ✅ GraphQL operations są zdefiniowane (`packages/contracts/graphql/operations/`)
- ⚠️ Potrzebny WebSocket client (`apps/web/src/lib/api/ws-client.ts`)

## Architecture

### WebSocket Client Setup

```typescript
// apps/web/src/lib/api/ws-client.ts
import { createClient } from 'graphql-ws';

const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000/graphql';

export const wsClient = createClient({
  url: wsUrl,
  connectionParams: () => {
    // Include auth token from cookies
    return {
      // Add authentication headers if needed
    };
  },
  retryAttempts: 5,
  shouldRetry: () => true,
});
```

## Implementation Steps

### Step 1: Create Subscription Hooks

#### DM Subscriptions

```typescript
// apps/web/src/lib/api/dm-subscriptions.tsx
'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { wsClient } from './ws-client';
import { dmKeys } from './dm';
import type { DmMessage } from './__generated__/react-query-update';

/**
 * Subscribe to new messages in a DM thread
 */
export function useDmMessageAdded(threadId: string, enabled = true) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled || !threadId) return;

    const subscription = wsClient.iterate({
      query: `
        subscription OnDmMessageAdded($threadId: ID!) {
          dmMessageAdded(threadId: $threadId) {
            id
            threadId
            senderId
            content
            createdAt
            editedAt
            deletedAt
            sender {
              id
              name
              imageUrl
            }
          }
        }
      `,
      variables: { threadId },
    });

    const unsubscribe = (async () => {
      for await (const result of subscription) {
        if (result.data?.dmMessageAdded) {
          const newMessage = result.data.dmMessageAdded as DmMessage;

          // Update messages cache
          queryClient.setQueryData<DmMessage[]>(
            dmKeys.messages(threadId),
            (old = []) => {
              // Deduplicate by id
              const exists = old.some((m) => m.id === newMessage.id);
              if (exists) return old;

              // Append new message
              return [...old, newMessage];
            }
          );

          // Invalidate thread to update lastMessage and unreadCount
          queryClient.invalidateQueries({
            queryKey: dmKeys.thread(threadId),
          });

          // Invalidate threads list
          queryClient.invalidateQueries({
            queryKey: dmKeys.threads(),
          });
        }
      }
    })();

    return () => {
      unsubscribe.then((unsub) => unsub?.());
    };
  }, [threadId, enabled, queryClient]);
}

/**
 * Subscribe to typing indicators in a DM thread
 */
export function useDmTyping(
  threadId: string,
  onTyping?: (userId: string, isTyping: boolean) => void,
  enabled = true
) {
  useEffect(() => {
    if (!enabled || !threadId) return;

    const subscription = wsClient.iterate({
      query: `
        subscription OnDmTyping($threadId: ID!) {
          dmTyping(threadId: $threadId) {
            userId
            isTyping
          }
        }
      `,
      variables: { threadId },
    });

    const unsubscribe = (async () => {
      for await (const result of subscription) {
        if (result.data?.dmTyping && onTyping) {
          const { userId, isTyping } = result.data.dmTyping;
          onTyping(userId, isTyping);
        }
      }
    })();

    return () => {
      unsubscribe.then((unsub) => unsub?.());
    };
  }, [threadId, enabled, onTyping]);
}
```

#### Event Chat Subscriptions

```typescript
// apps/web/src/lib/api/event-chat-subscriptions.tsx
'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { wsClient } from './ws-client';
import { eventChatKeys } from './event-chat';
import type { IntentChatMessage } from './__generated__/react-query-update';

/**
 * Subscribe to new messages in an intent chat
 */
export function useIntentMessageAdded(intentId: string, enabled = true) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled || !intentId) return;

    const subscription = wsClient.iterate({
      query: `
        subscription OnIntentMessageAdded($intentId: ID!) {
          intentMessageAdded(intentId: $intentId) {
            id
            intentId
            authorId
            content
            replyToId
            createdAt
            editedAt
            deletedAt
            isEdited
            isDeleted
            author {
              id
              name
              imageUrl
            }
            replyTo {
              id
              content
              authorId
              author {
                id
                name
                imageUrl
              }
            }
          }
        }
      `,
      variables: { intentId },
    });

    const unsubscribe = (async () => {
      for await (const result of subscription) {
        if (result.data?.intentMessageAdded) {
          const newMessage = result.data
            .intentMessageAdded as IntentChatMessage;

          // Update infinite query cache
          queryClient.setQueryData(
            eventChatKeys.messages(intentId),
            (old: any) => {
              if (!old?.pages) return old;

              // Add to first page (most recent)
              const firstPage = old.pages[0];
              const exists = firstPage.intentMessages.items.some(
                (m: IntentChatMessage) => m.id === newMessage.id
              );

              if (exists) return old;

              return {
                ...old,
                pages: [
                  {
                    ...firstPage,
                    intentMessages: {
                      ...firstPage.intentMessages,
                      items: [newMessage, ...firstPage.intentMessages.items],
                    },
                  },
                  ...old.pages.slice(1),
                ],
              };
            }
          );

          // Invalidate unread count
          queryClient.invalidateQueries({
            queryKey: eventChatKeys.unreadCount(intentId),
          });

          // Invalidate intent to update messagesCount
          queryClient.invalidateQueries({
            queryKey: ['intents', 'detail', intentId],
          });
        }
      }
    })();

    return () => {
      unsubscribe.then((unsub) => unsub?.());
    };
  }, [intentId, enabled, queryClient]);
}

/**
 * Subscribe to typing indicators in an intent chat
 */
export function useIntentTyping(
  intentId: string,
  onTyping?: (userId: string, isTyping: boolean) => void,
  enabled = true
) {
  useEffect(() => {
    if (!enabled || !intentId) return;

    const subscription = wsClient.iterate({
      query: `
        subscription OnIntentTyping($intentId: ID!) {
          intentTyping(intentId: $intentId) {
            userId
            isTyping
          }
        }
      `,
      variables: { intentId },
    });

    const unsubscribe = (async () => {
      for await (const result of subscription) {
        if (result.data?.intentTyping && onTyping) {
          const { userId, isTyping } = result.data.intentTyping;
          onTyping(userId, isTyping);
        }
      }
    })();

    return () => {
      unsubscribe.then((unsub) => unsub?.());
    };
  }, [intentId, enabled, onTyping]);
}
```

### Step 2: Usage in Components

#### DM Chat Component

```typescript
// apps/web/src/features/dm/components/dm-chat.tsx
'use client';

import { useState } from 'react';
import { useGetDmMessages, useSendDmMessage } from '@/lib/api/dm';
import { useDmMessageAdded, useDmTyping } from '@/lib/api/dm-subscriptions';

export function DmChat({ threadId }: { threadId: string }) {
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

  // Fetch messages
  const { data: messages, isLoading } = useGetDmMessages({ threadId });

  // Send message mutation
  const sendMessage = useSendDmMessage();

  // Subscribe to new messages
  useDmMessageAdded(threadId);

  // Subscribe to typing indicators
  useDmTyping(threadId, (userId, isTyping) => {
    setTypingUsers((prev) => {
      const next = new Set(prev);
      if (isTyping) {
        next.add(userId);
      } else {
        next.delete(userId);
      }
      return next;
    });
  });

  const handleSend = (content: string) => {
    sendMessage.mutate({
      input: {
        recipientId: otherUserId, // Get from thread
        content,
      },
    });
  };

  return (
    <div>
      {/* Messages list */}
      {messages?.dmMessages.map((msg) => (
        <div key={msg.id}>{msg.content}</div>
      ))}

      {/* Typing indicator */}
      {typingUsers.size > 0 && (
        <div>Someone is typing...</div>
      )}

      {/* Input */}
      <input onKeyPress={(e) => {
        if (e.key === 'Enter') {
          handleSend(e.currentTarget.value);
          e.currentTarget.value = '';
        }
      }} />
    </div>
  );
}
```

#### Event Chat Component

```typescript
// apps/web/src/features/intents/components/intent-chat.tsx
'use client';

import { useState } from 'react';
import { useGetIntentMessages, useSendIntentMessage } from '@/lib/api/event-chat';
import { useIntentMessageAdded, useIntentTyping } from '@/lib/api/event-chat-subscriptions';

export function IntentChat({ intentId }: { intentId: string }) {
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

  // Fetch messages (infinite scroll)
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading,
  } = useGetIntentMessages({ intentId, limit: 50 });

  // Send message mutation
  const sendMessage = useSendIntentMessage();

  // Subscribe to new messages
  useIntentMessageAdded(intentId);

  // Subscribe to typing indicators
  useIntentTyping(intentId, (userId, isTyping) => {
    setTypingUsers((prev) => {
      const next = new Set(prev);
      if (isTyping) {
        next.add(userId);
      } else {
        next.delete(userId);
      }
      return next;
    });
  });

  const handleSend = (content: string) => {
    sendMessage.mutate({
      input: {
        intentId,
        content,
      },
    });
  };

  const allMessages = data?.pages.flatMap((page) => page.intentMessages.items) ?? [];

  return (
    <div>
      {/* Messages list */}
      {allMessages.map((msg) => (
        <div key={msg.id}>{msg.content}</div>
      ))}

      {/* Load more */}
      {hasNextPage && (
        <button onClick={() => fetchNextPage()}>Load more</button>
      )}

      {/* Typing indicator */}
      {typingUsers.size > 0 && (
        <div>{typingUsers.size} user(s) typing...</div>
      )}

      {/* Input */}
      <input onKeyPress={(e) => {
        if (e.key === 'Enter') {
          handleSend(e.currentTarget.value);
          e.currentTarget.value = '';
        }
      }} />
    </div>
  );
}
```

### Step 3: Typing Indicator Publishing

#### Backend Mutation (TODO)

```typescript
// apps/api/src/graphql/resolvers/mutation/chat-typing.ts
import { GraphQLError } from 'graphql';
import { setDmTyping, setEventChatTyping } from '../../../lib/chat-rate-limit';
import type { MutationResolvers } from '../../__generated__/resolvers-types';

export const publishDmTypingMutation: MutationResolvers['publishDmTyping'] =
  async (_p, { threadId, isTyping }, { user, pubsub }) => {
    if (!user?.id) {
      throw new GraphQLError('Authentication required.', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    // Verify access to thread
    // ...

    // Set typing in Redis (3s TTL)
    await setDmTyping(user.id, threadId, isTyping);

    // Publish to subscribers
    await pubsub.publish({
      topic: `dmTyping:${threadId}`,
      payload: {
        dmTyping: {
          userId: user.id,
          isTyping,
        },
      },
    });

    return true;
  };

export const publishIntentTypingMutation: MutationResolvers['publishIntentTyping'] =
  async (_p, { intentId, isTyping }, { user, pubsub }) => {
    if (!user?.id) {
      throw new GraphQLError('Authentication required.', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    // Verify JOINED member
    // ...

    // Set typing in Redis (3s TTL)
    await setEventChatTyping(user.id, intentId, isTyping);

    // Publish to subscribers
    await pubsub.publish({
      topic: `intentTyping:${intentId}`,
      payload: {
        intentTyping: {
          userId: user.id,
          isTyping,
        },
      },
    });

    return true;
  };
```

#### Frontend Hook

```typescript
// apps/web/src/lib/api/use-typing-indicator.tsx
import { useCallback, useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { gqlClient } from './client';

export function useTypingIndicator(
  scope: { type: 'dm'; threadId: string } | { type: 'intent'; intentId: string }
) {
  const timeoutRef = useRef<NodeJS.Timeout>();

  const mutation = useMutation({
    mutationFn: async (isTyping: boolean) => {
      if (scope.type === 'dm') {
        return gqlClient.request(
          `
          mutation PublishDmTyping($threadId: ID!, $isTyping: Boolean!) {
            publishDmTyping(threadId: $threadId, isTyping: $isTyping)
          }
        `,
          { threadId: scope.threadId, isTyping }
        );
      } else {
        return gqlClient.request(
          `
          mutation PublishIntentTyping($intentId: ID!, $isTyping: Boolean!) {
            publishIntentTyping(intentId: $intentId, isTyping: $isTyping)
          }
        `,
          { intentId: scope.intentId, isTyping }
        );
      }
    },
  });

  const startTyping = useCallback(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Publish typing=true
    mutation.mutate(true);

    // Auto-stop after 3s
    timeoutRef.current = setTimeout(() => {
      mutation.mutate(false);
    }, 3000);
  }, [mutation]);

  const stopTyping = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    mutation.mutate(false);
  }, [mutation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      mutation.mutate(false);
    };
  }, [mutation]);

  return { startTyping, stopTyping };
}
```

## Best Practices

### 1. **Deduplikacja**

Zawsze sprawdzaj, czy wiadomość już istnieje przed dodaniem do cache:

```typescript
const exists = old.some((m) => m.id === newMessage.id);
if (exists) return old;
```

### 2. **Throttling Typing Indicators**

Użyj debounce 300ms dla `onInput` events:

```typescript
const debouncedStartTyping = useMemo(
  () => debounce(startTyping, 300),
  [startTyping]
);
```

### 3. **Cleanup Subscriptions**

Zawsze cleanup w `useEffect`:

```typescript
return () => {
  unsubscribe.then((unsub) => unsub?.());
};
```

### 4. **Error Handling**

Obsłuż błędy WebSocket:

```typescript
wsClient.on('error', (error) => {
  console.error('WebSocket error:', error);
  // Show reconnection toast
});
```

### 5. **Conditional Subscriptions**

Używaj `enabled` flag:

```typescript
useDmMessageAdded(threadId, isVisible && !!threadId);
```

## Testing

### Unit Tests

```typescript
// apps/web/src/lib/api/__tests__/dm-subscriptions.test.tsx
import { renderHook, waitFor } from '@testing-library/react';
import { useDmMessageAdded } from '../dm-subscriptions';

describe('useDmMessageAdded', () => {
  it('should subscribe to messages', async () => {
    const { result } = renderHook(() => useDmMessageAdded('thread-1'));

    // Simulate incoming message
    // ...

    await waitFor(() => {
      // Assert cache updated
    });
  });
});
```

### Integration Tests

```typescript
// apps/api/src/graphql/resolvers/__tests__/subscriptions.test.ts
describe('Chat Subscriptions', () => {
  it('should publish dmMessageAdded on sendDmMessage', async () => {
    // Setup subscription listener
    // Send message
    // Assert subscription received event
  });
});
```

## Troubleshooting

### Issue: Duplicate Messages

**Solution:** Implement proper dedupe logic by `id`.

### Issue: Subscription Not Connecting

**Solution:** Check WebSocket URL, auth headers, and CORS settings.

### Issue: Memory Leaks

**Solution:** Ensure cleanup in `useEffect` return function.

### Issue: Stale Data After Reconnect

**Solution:** Invalidate queries on WebSocket reconnect:

```typescript
wsClient.on('connected', () => {
  queryClient.invalidateQueries();
});
```

---

**Next Steps:**

1. Implement `ws-client.ts`
2. Create subscription hooks
3. Integrate in chat components
4. Add typing indicator mutations (backend)
5. Test real-time updates
