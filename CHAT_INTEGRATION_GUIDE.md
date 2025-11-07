# Chat Integration Guide

## 📦 Co zostało zaimplementowane

### 1. **Hooki Subskrypcji**

Utworzono dwa nowe pliki z hookami WebSocket:

#### `apps/web/src/lib/api/dm-subscriptions.tsx`

```typescript
// Subskrypcja do nowych wiadomości DM
useDmMessageAdded({ threadId, onMessage?, enabled? })

// Subskrypcja do typing indicators DM
useDmTyping({ threadId, onTyping?, enabled? })
```

#### `apps/web/src/lib/api/event-chat-subscriptions.tsx`

```typescript
// Subskrypcja do nowych wiadomości w kanale
useIntentMessageAdded({ intentId, onMessage?, enabled? })

// Subskrypcja do typing indicators w kanale
useIntentTyping({ intentId, onTyping?, enabled? })
```

**Cechy:**

- ✅ Automatyczne reconnect z exponential backoff
- ✅ Graceful error handling
- ✅ Automatyczne invalidacje cache
- ✅ Custom callbacks dla custom logic
- ✅ Enable/disable flag

### 2. **Zintegrowana Strona Chatu**

Utworzono `apps/web/src/app/account/chats/page-integrated.tsx` z pełną integracją:

**Funkcjonalności:**

- ✅ Lista wątków DM z prawdziwymi danymi
- ✅ Wyświetlanie wiadomości DM
- ✅ Wysyłanie wiadomości DM/Channel
- ✅ Real-time updates przez WebSocket
- ✅ Automatyczne mark as read
- ✅ Unread badges
- ✅ Loading states
- ✅ Infinite scroll dla kanałów
- ✅ Responsive design

## 🚀 Jak użyć

### Krok 1: Zamień oryginalny page.tsx

```bash
# Backup oryginalnego pliku
mv apps/web/src/app/account/chats/page.tsx apps/web/src/app/account/chats/page-mock.tsx

# Użyj nowej wersji
mv apps/web/src/app/account/chats/page-integrated.tsx apps/web/src/app/account/chats/page.tsx
```

### Krok 2: Upewnij się, że masz zmienne środowiskowe

W `.env.local`:

```bash
NEXT_PUBLIC_WS_URL=ws://localhost:4000/graphql
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:4000/graphql
```

### Krok 3: Uruchom aplikację

```bash
# Terminal 1: Backend
cd apps/api
pnpm dev

# Terminal 2: Frontend
cd apps/web
pnpm dev
```

### Krok 4: Testowanie

1. Otwórz `http://localhost:3000/account/chats`
2. Zaloguj się (jeśli nie jesteś)
3. Powinieneś zobaczyć listę swoich DM threads
4. Kliknij na thread, aby zobaczyć wiadomości
5. Wyślij wiadomość - powinna pojawić się natychmiast
6. Otwórz drugi tab/okno i zobacz real-time updates

## 📝 Przykłady użycia hooków

### 1. Podstawowa subskrypcja DM

```typescript
import { useDmMessageAdded } from '@/lib/api/dm-subscriptions';

function MyDmComponent({ threadId }: { threadId: string }) {
  // Automatyczna invalidacja cache
  useDmMessageAdded({ threadId });

  // Lub custom callback
  useDmMessageAdded({
    threadId,
    onMessage: (message) => {
      console.log('New message:', message);
      // Custom logic
    },
  });

  return <div>...</div>;
}
```

### 2. Typing indicators

```typescript
import { useDmTyping } from '@/lib/api/dm-subscriptions';

function MyDmComponent({ threadId }: { threadId: string }) {
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

  useDmTyping({
    threadId,
    onTyping: ({ userId, isTyping }) => {
      setTypingUsers((prev) => {
        const next = new Set(prev);
        if (isTyping) {
          next.add(userId);
        } else {
          next.delete(userId);
        }
        return next;
      });
    },
  });

  return (
    <div>
      {typingUsers.size > 0 && (
        <div className="text-sm text-zinc-500">
          {typingUsers.size} {typingUsers.size === 1 ? 'person' : 'people'} typing...
        </div>
      )}
    </div>
  );
}
```

### 3. Conditional subscriptions

```typescript
import { useDmMessageAdded } from '@/lib/api/dm-subscriptions';

function MyDmComponent({ threadId, isActive }: { threadId: string; isActive: boolean }) {
  // Subskrybuj tylko gdy thread jest aktywny
  useDmMessageAdded({
    threadId,
    enabled: isActive,
  });

  return <div>...</div>;
}
```

### 4. Channel subscriptions

```typescript
import { useIntentMessageAdded } from '@/lib/api/event-chat-subscriptions';

function MyChannelComponent({ intentId }: { intentId: string }) {
  useIntentMessageAdded({
    intentId,
    onMessage: (message) => {
      // Show toast notification
      toast.success(`New message from ${message.author.name}`);
    },
  });

  return <div>...</div>;
}
```

## 🎨 Customizacja UI

### Zmiana stylu wiadomości

W `page-integrated.tsx`, znajdź funkcję `Bubble`:

```typescript
function Bubble({ align, children, time, block }: BubbleProps) {
  const base =
    'max-w-[80%] rounded-2xl px-3 py-2 text-sm inline-flex items-end gap-2';

  // Zmień kolory tutaj
  const cls =
    align === 'right'
      ? 'ml-auto bg-indigo-600 text-white' // Twoje wiadomości
      : block
        ? 'bg-zinc-100 text-zinc-800' // Usunięte wiadomości
        : 'bg-zinc-800/70 text-zinc-100'; // Wiadomości innych

  // ...
}
```

### Dodanie avatarów do wiadomości

```typescript
function MsgIn({ children, time, block, author }: MsgInProps) {
  return (
    <div className="flex items-end gap-2 mb-2">
      <Avatar token={author.avatar} />
      <Bubble align="left" time={time} block={block}>
        {children}
      </Bubble>
    </div>
  );
}
```

## 🔧 Troubleshooting

### Problem: Brak połączenia WebSocket

**Symptom:** Wiadomości nie pojawiają się w czasie rzeczywistym

**Rozwiązanie:**

1. Sprawdź console - powinny być logi `🐞 [WS]`
2. Upewnij się, że backend działa na porcie 4000
3. Sprawdź `NEXT_PUBLIC_WS_URL` w `.env.local`
4. Sprawdź czy masz `accessToken` w localStorage

### Problem: "Cannot read property 'id' of undefined"

**Symptom:** Błąd przy próbie wyświetlenia wiadomości

**Rozwiązanie:**

1. Sprawdź czy użytkownik jest zalogowany (`useMeQuery`)
2. Sprawdź czy `threadId`/`intentId` jest poprawne
3. Dodaj `enabled: !!threadId` do query

### Problem: Duplikaty wiadomości

**Symptom:** Ta sama wiadomość pojawia się wielokrotnie

**Rozwiązanie:**

1. Sprawdź czy nie masz wielu instancji subskrypcji
2. Użyj `enabled` flag aby kontrolować subskrypcje
3. Dodaj deduplikację po `id` w komponencie

### Problem: Wiadomości nie są oznaczane jako przeczytane

**Symptom:** Unread badge nie znika

**Rozwiązanie:**

1. Sprawdź czy `markDmThreadRead`/`markIntentChatRead` jest wywoływane
2. Sprawdź czy invalidacja cache działa
3. Sprawdź backend logs dla błędów w mutation

## 📊 Performance Tips

### 1. Lazy loading wątków

```typescript
// Zamiast ładować wszystkie wątki na raz
const { data } = useGetDmThreads({ limit: 50 });

// Użyj infinite scroll
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
  queryKey: dmKeys.threadsList(),
  queryFn: ({ pageParam = 0 }) =>
    gqlClient.request(GetDmThreadsDocument, {
      limit: 20,
      offset: pageParam,
    }),
  getNextPageParam: (lastPage, pages) => {
    if (lastPage.dmThreads.pageInfo.hasNext) {
      return pages.length * 20;
    }
    return undefined;
  },
});
```

### 2. Debounce typing indicators

```typescript
import { useDebouncedCallback } from 'use-debounce';

function MyInput() {
  const publishTyping = useDebouncedCallback(
    (isTyping: boolean) => {
      // Publish typing indicator
    },
    300 // 300ms debounce
  );

  return (
    <input
      onChange={(e) => {
        publishTyping(e.target.value.length > 0);
      }}
    />
  );
}
```

### 3. Throttle mark as read

```typescript
import { useThrottledCallback } from 'use-debounce';

function MyThread({ threadId }: { threadId: string }) {
  const markRead = useMarkDmThreadRead();

  const throttledMarkRead = useThrottledCallback(
    () => {
      markRead.mutate({ threadId });
    },
    500 // Max once per 500ms
  );

  useEffect(() => {
    throttledMarkRead();
  }, [threadId]); // eslint-disable-line react-hooks/exhaustive-deps

  return <div>...</div>;
}
```

### 4. Virtualizacja długich list

Dla bardzo długich list wiadomości (>100), użyj `react-window`:

```typescript
import { FixedSizeList } from 'react-window';

function MessageList({ messages }: { messages: Message[] }) {
  return (
    <FixedSizeList
      height={600}
      itemCount={messages.length}
      itemSize={60}
      width="100%"
    >
      {({ index, style }) => (
        <div style={style}>
          <MessageBubble message={messages[index]} />
        </div>
      )}
    </FixedSizeList>
  );
}
```

## 🚧 TODO / Następne kroki

### Wysokie priorytety

- [x] ~~Dodać listę Intent/Channels~~ ✅ **GOTOWE!**
- [x] ~~Implementacja typing indicators UI~~ ✅ **GOTOWE!**
- [ ] Optimistic updates dla wysyłania wiadomości
- [ ] Error boundaries dla błędów WebSocket
- [ ] Retry logic dla failed messages

### Średnie priorytety

- [ ] Message editing UI
- [ ] Message deletion UI
- [ ] Reply to message
- [ ] File attachments
- [ ] Emoji reactions
- [ ] Search in messages

### Niskie priorytety

- [ ] Message read receipts (per user)
- [ ] Voice messages
- [ ] Video calls
- [ ] Screen sharing
- [ ] Message threading

## 📚 Dodatkowe zasoby

- [CHAT_IMPLEMENTATION_SUMMARY.md](./CHAT_IMPLEMENTATION_SUMMARY.md) - Podsumowanie implementacji
- [CHAT_SUBSCRIPTIONS_GUIDE.md](./CHAT_SUBSCRIPTIONS_GUIDE.md) - Szczegółowy przewodnik po subskrypcjach
- [CHAT_USAGE_EXAMPLES.md](./CHAT_USAGE_EXAMPLES.md) - Więcej przykładów użycia
- [CHAT_TESTING_GUIDE.md](./CHAT_TESTING_GUIDE.md) - Jak testować chat
- [README_CHAT_IMPLEMENTATION.md](./README_CHAT_IMPLEMENTATION.md) - Główna dokumentacja

## 🤝 Contributing

Jeśli znajdziesz bug lub masz sugestię:

1. Sprawdź czy issue już istnieje
2. Stwórz nowy issue z opisem problemu
3. Jeśli chcesz naprawić - stwórz PR z opisem zmian

## 📄 License

Ten kod jest częścią projektu Miglee i podlega tej samej licencji.
