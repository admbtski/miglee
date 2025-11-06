# Chat System - Usage Examples

## Quick Start

### 1. Direct Messages (DM)

#### Wyświetl listę wątków DM

```typescript
import { useGetDmThreads } from '@/lib/api/dm';

export function DmThreadsList() {
  const { data, isLoading } = useGetDmThreads({
    limit: 20,
    offset: 0,
    unreadOnly: false,
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {data?.dmThreads.items.map((thread) => (
        <div key={thread.id}>
          <h3>{thread.aUser.name} & {thread.bUser.name}</h3>
          <p>{thread.lastMessage?.content}</p>
          {thread.unreadCount > 0 && (
            <span className="badge">{thread.unreadCount}</span>
          )}
        </div>
      ))}
    </div>
  );
}
```

#### Wyświetl wiadomości w wątku

```typescript
import { useGetDmMessages, useSendDmMessage, useMarkDmThreadRead } from '@/lib/api/dm';
import { useEffect } from 'react';

export function DmMessagesView({ threadId }: { threadId: string }) {
  const { data: messages } = useGetDmMessages({ threadId, limit: 50 });
  const sendMessage = useSendDmMessage();
  const markRead = useMarkDmThreadRead();

  // Mark as read when component mounts
  useEffect(() => {
    markRead.mutate({ threadId });
  }, [threadId]);

  const handleSend = (content: string) => {
    sendMessage.mutate({
      input: {
        recipientId: 'other-user-id', // Get from thread
        content,
      },
    });
  };

  return (
    <div>
      {messages?.dmMessages.map((msg) => (
        <div key={msg.id}>
          <strong>{msg.sender.name}:</strong> {msg.content}
          {msg.editedAt && <span> (edited)</span>}
        </div>
      ))}

      <input
        onKeyPress={(e) => {
          if (e.key === 'Enter') {
            handleSend(e.currentTarget.value);
            e.currentTarget.value = '';
          }
        }}
      />
    </div>
  );
}
```

#### Utwórz lub pobierz wątek DM

```typescript
import { useCreateOrGetDmThread } from '@/lib/api/dm';
import { useRouter } from 'next/navigation';

export function StartDmButton({ userId }: { userId: string }) {
  const router = useRouter();
  const createThread = useCreateOrGetDmThread();

  const handleClick = () => {
    createThread.mutate(
      { userId },
      {
        onSuccess: (data) => {
          // Navigate to thread
          router.push(`/account/chats/${data.createOrGetDmThread.id}`);
        },
      }
    );
  };

  return (
    <button onClick={handleClick} disabled={createThread.isPending}>
      {createThread.isPending ? 'Creating...' : 'Send Message'}
    </button>
  );
}
```

#### Edytuj wiadomość

```typescript
import { useUpdateDmMessage } from '@/lib/api/dm';

export function EditMessageButton({ messageId, currentContent }: { messageId: string; currentContent: string }) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(currentContent);
  const updateMessage = useUpdateDmMessage();

  const handleSave = () => {
    updateMessage.mutate(
      {
        id: messageId,
        input: { content },
      },
      {
        onSuccess: () => {
          setIsEditing(false);
        },
      }
    );
  };

  if (!isEditing) {
    return <button onClick={() => setIsEditing(true)}>Edit</button>;
  }

  return (
    <div>
      <input value={content} onChange={(e) => setContent(e.target.value)} />
      <button onClick={handleSave}>Save</button>
      <button onClick={() => setIsEditing(false)}>Cancel</button>
    </div>
  );
}
```

#### Wycisz wątek DM

```typescript
import { useMuteDmThread } from '@/lib/api/dm';

export function MuteThreadButton({ threadId, isMuted }: { threadId: string; isMuted: boolean }) {
  const muteThread = useMuteDmThread();

  const handleToggle = () => {
    muteThread.mutate({
      threadId,
      muted: !isMuted,
    });
  };

  return (
    <button onClick={handleToggle}>
      {isMuted ? '🔔 Unmute' : '🔕 Mute'}
    </button>
  );
}
```

### 2. Event Chat (Intent Chat)

#### Wyświetl wiadomości eventu (infinite scroll)

```typescript
import { useGetIntentMessages, useSendIntentMessage } from '@/lib/api/event-chat';
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll';

export function IntentChatView({ intentId }: { intentId: string }) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGetIntentMessages({ intentId, limit: 50 });

  const sendMessage = useSendIntentMessage();

  // Infinite scroll hook
  const { ref } = useInfiniteScroll({
    onLoadMore: fetchNextPage,
    hasMore: hasNextPage,
    isLoading: isFetchingNextPage,
  });

  const allMessages = data?.pages.flatMap((page) => page.intentMessages.items) ?? [];

  const handleSend = (content: string, replyToId?: string) => {
    sendMessage.mutate({
      input: {
        intentId,
        content,
        replyToId,
      },
    });
  };

  return (
    <div>
      <div ref={ref}>
        {allMessages.map((msg) => (
          <div key={msg.id}>
            <strong>{msg.author.name}:</strong> {msg.content}
            {msg.replyTo && (
              <div className="reply">
                Replying to: {msg.replyTo.content}
              </div>
            )}
            {msg.isEdited && <span> (edited)</span>}
            {msg.isDeleted && <span className="deleted">Message deleted</span>}
          </div>
        ))}
      </div>

      {isFetchingNextPage && <div>Loading more...</div>}

      <input
        onKeyPress={(e) => {
          if (e.key === 'Enter') {
            handleSend(e.currentTarget.value);
            e.currentTarget.value = '';
          }
        }}
      />
    </div>
  );
}
```

#### Wyświetl unread count

```typescript
import { useGetIntentUnreadCount } from '@/lib/api/event-chat';

export function IntentChatBadge({ intentId }: { intentId: string }) {
  const { data: unreadCount } = useGetIntentUnreadCount(
    { intentId },
    {
      refetchInterval: 30000, // Refetch every 30s
    }
  );

  if (!unreadCount || unreadCount === 0) return null;

  return <span className="badge">{unreadCount}</span>;
}
```

#### Edytuj wiadomość eventu

```typescript
import { useEditIntentMessage } from '@/lib/api/event-chat';

export function EditIntentMessageButton({
  messageId,
  currentContent,
}: {
  messageId: string;
  currentContent: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(currentContent);
  const editMessage = useEditIntentMessage();

  const handleSave = () => {
    editMessage.mutate(
      {
        id: messageId,
        input: { content },
      },
      {
        onSuccess: () => {
          setIsEditing(false);
        },
        onError: (error) => {
          // Handle error (e.g., "can only edit within 5 minutes")
          alert(error.message);
        },
      }
    );
  };

  // ... similar UI as DM edit
}
```

#### Usuń wiadomość (soft delete)

```typescript
import { useDeleteIntentMessage } from '@/lib/api/event-chat';

export function DeleteIntentMessageButton({ messageId }: { messageId: string }) {
  const deleteMessage = useDeleteIntentMessage();

  const handleDelete = () => {
    if (!confirm('Delete this message?')) return;

    deleteMessage.mutate({
      id: messageId,
      soft: true, // Soft delete (shows "Message deleted")
    });
  };

  return <button onClick={handleDelete}>🗑️ Delete</button>;
}
```

#### Oznacz jako przeczytane

```typescript
import { useMarkIntentChatRead } from '@/lib/api/event-chat';
import { useEffect } from 'react';

export function IntentChatView({ intentId }: { intentId: string }) {
  const markRead = useMarkIntentChatRead();

  // Mark as read when user views the chat
  useEffect(() => {
    markRead.mutate({ intentId });
  }, [intentId]);

  // ... rest of component
}
```

#### Wycisz chat eventu

```typescript
import { useMuteIntent } from '@/lib/api/event-chat';

export function MuteIntentButton({ intentId, isMuted }: { intentId: string; isMuted: boolean }) {
  const muteIntent = useMuteIntent();

  const handleToggle = () => {
    muteIntent.mutate({
      intentId,
      muted: !isMuted,
    });
  };

  return (
    <button onClick={handleToggle}>
      {isMuted ? '🔔 Unmute Chat' : '🔕 Mute Chat'}
    </button>
  );
}
```

### 3. Advanced Patterns

#### Optimistic Updates

```typescript
import { useSendDmMessage } from '@/lib/api/dm';
import { useQueryClient } from '@tanstack/react-query';
import { dmKeys } from '@/lib/api/dm';

export function OptimisticDmInput({
  threadId,
  recipientId,
}: {
  threadId: string;
  recipientId: string;
}) {
  const queryClient = useQueryClient();
  const sendMessage = useSendDmMessage({
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: dmKeys.messages(threadId) });

      // Snapshot previous value
      const previousMessages = queryClient.getQueryData(
        dmKeys.messages(threadId)
      );

      // Optimistically update
      const tempId = `temp-${Date.now()}`;
      queryClient.setQueryData(dmKeys.messages(threadId), (old: any) => [
        ...old,
        {
          id: tempId,
          content: variables.input.content,
          senderId: 'current-user-id',
          createdAt: new Date(),
          sender: { id: 'current-user-id', name: 'You' },
        },
      ]);

      return { previousMessages, tempId };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousMessages) {
        queryClient.setQueryData(
          dmKeys.messages(threadId),
          context.previousMessages
        );
      }
    },
    onSuccess: (data, variables, context) => {
      // Replace temp message with real one
      queryClient.setQueryData(dmKeys.messages(threadId), (old: any) =>
        old.map((m: any) => (m.id === context?.tempId ? data.sendDmMessage : m))
      );
    },
  });

  // ... rest of component
}
```

#### Debounced Mark as Read

```typescript
import { useMarkDmThreadRead } from '@/lib/api/dm';
import { useMemo, useCallback } from 'react';
import { debounce } from 'lodash';

export function DmMessagesView({ threadId }: { threadId: string }) {
  const markRead = useMarkDmThreadRead();

  // Debounce mark as read (500ms after last scroll)
  const debouncedMarkRead = useMemo(
    () =>
      debounce(() => {
        markRead.mutate({ threadId });
      }, 500),
    [threadId, markRead]
  );

  const handleScroll = useCallback(() => {
    debouncedMarkRead();
  }, [debouncedMarkRead]);

  return (
    <div onScroll={handleScroll}>
      {/* Messages */}
    </div>
  );
}
```

#### Pagination with beforeMessageId

```typescript
import { useGetDmMessages } from '@/lib/api/dm';
import { useState } from 'react';

export function DmMessagesWithPagination({ threadId }: { threadId: string }) {
  const [beforeMessageId, setBeforeMessageId] = useState<string | undefined>();

  const { data: messages, isLoading } = useGetDmMessages({
    threadId,
    limit: 50,
    beforeMessageId,
  });

  const loadOlder = () => {
    if (messages && messages.dmMessages.length > 0) {
      const oldestMessage = messages.dmMessages[messages.dmMessages.length - 1];
      setBeforeMessageId(oldestMessage.id);
    }
  };

  return (
    <div>
      <button onClick={loadOlder}>Load Older Messages</button>
      {messages?.dmMessages.map((msg) => (
        <div key={msg.id}>{msg.content}</div>
      ))}
    </div>
  );
}
```

#### Reply to Message

```typescript
import { useSendIntentMessage } from '@/lib/api/event-chat';
import { useState } from 'react';

export function IntentMessageItem({ message, intentId }: { message: any; intentId: string }) {
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const sendMessage = useSendIntentMessage();

  const handleReply = () => {
    sendMessage.mutate(
      {
        input: {
          intentId,
          content: replyContent,
          replyToId: message.id,
        },
      },
      {
        onSuccess: () => {
          setIsReplying(false);
          setReplyContent('');
        },
      }
    );
  };

  return (
    <div>
      <div>{message.content}</div>
      <button onClick={() => setIsReplying(!isReplying)}>Reply</button>

      {isReplying && (
        <div>
          <input
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Write a reply..."
          />
          <button onClick={handleReply}>Send</button>
        </div>
      )}
    </div>
  );
}
```

### 4. Error Handling

#### Handle Rate Limit Errors

```typescript
import { useSendDmMessage } from '@/lib/api/dm';
import { useState } from 'react';

export function DmInputWithRateLimit({ threadId, recipientId }: { threadId: string; recipientId: string }) {
  const [cooldown, setCooldown] = useState(0);
  const sendMessage = useSendDmMessage({
    onError: (error: any) => {
      if (error.extensions?.code === 'RATE_LIMIT_EXCEEDED') {
        const retryAfter = error.extensions.retryAfter || 30;
        setCooldown(retryAfter);

        // Countdown
        const interval = setInterval(() => {
          setCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        alert(error.message);
      }
    },
  });

  const handleSend = (content: string) => {
    if (cooldown > 0) return;

    sendMessage.mutate({
      input: { recipientId, content },
    });
  };

  return (
    <div>
      <input disabled={cooldown > 0} />
      {cooldown > 0 && (
        <div>Too many messages. Please wait {cooldown}s</div>
      )}
    </div>
  );
}
```

#### Handle Block Errors

```typescript
import { useSendDmMessage } from '@/lib/api/dm';

export function DmInputWithBlockCheck({
  recipientId,
}: {
  recipientId: string;
}) {
  const sendMessage = useSendDmMessage({
    onError: (error: any) => {
      if (error.extensions?.code === 'FORBIDDEN') {
        alert('Cannot send message. User may have blocked you.');
      }
    },
  });

  // ... rest of component
}
```

### 5. Performance Tips

#### Virtualized Message List

```typescript
import { useGetDmMessages } from '@/lib/api/dm';
import { FixedSizeList } from 'react-window';

export function VirtualizedDmMessages({ threadId }: { threadId: string }) {
  const { data: messages } = useGetDmMessages({ threadId, limit: 1000 });

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const message = messages?.dmMessages[index];
    return (
      <div style={style}>
        {message?.content}
      </div>
    );
  };

  return (
    <FixedSizeList
      height={600}
      itemCount={messages?.dmMessages.length || 0}
      itemSize={50}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
}
```

#### Prefetch Next Page

```typescript
import { useGetIntentMessages } from '@/lib/api/event-chat';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

export function IntentChatWithPrefetch({ intentId }: { intentId: string }) {
  const queryClient = useQueryClient();
  const { data, fetchNextPage, hasNextPage } = useGetIntentMessages({
    intentId,
    limit: 50,
  });

  // Prefetch next page when near the end
  useEffect(() => {
    if (hasNextPage) {
      // Prefetch in background
      fetchNextPage();
    }
  }, [hasNextPage, fetchNextPage]);

  // ... rest of component
}
```

---

## Common Patterns Summary

| Pattern        | Use Case              | Hook                                                |
| -------------- | --------------------- | --------------------------------------------------- |
| List threads   | Show DM inbox         | `useGetDmThreads()`                                 |
| View messages  | Display chat history  | `useGetDmMessages()` / `useGetIntentMessages()`     |
| Send message   | User sends text       | `useSendDmMessage()` / `useSendIntentMessage()`     |
| Edit message   | Fix typo              | `useUpdateDmMessage()` / `useEditIntentMessage()`   |
| Delete message | Remove content        | `useDeleteDmMessage()` / `useDeleteIntentMessage()` |
| Mark as read   | Update unread badge   | `useMarkDmThreadRead()` / `useMarkIntentChatRead()` |
| Mute chat      | Silence notifications | `useMuteDmThread()` / `useMuteIntent()`             |
| Create thread  | Start new DM          | `useCreateOrGetDmThread()`                          |
| Unread count   | Show badge            | `useGetIntentUnreadCount()`                         |

## Next Steps

1. **Implement WebSocket subscriptions** - See `CHAT_SUBSCRIPTIONS_GUIDE.md`
2. **Add typing indicators** - Real-time "user is typing..."
3. **Implement optimistic updates** - Instant UI feedback
4. **Add message reactions** - Emoji reactions (future feature)
5. **Implement search** - Full-text search in messages (future feature)

---

**Need Help?**

- Backend API: `apps/api/src/graphql/resolvers/`
- Frontend Hooks: `apps/web/src/lib/api/`
- GraphQL Schema: `packages/contracts/graphql/schema.graphql`
