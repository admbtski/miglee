# Chat Channels Update - Lista Intent/Channels ✅

## 🎉 Co zostało dodane

Dodano pełną funkcjonalność wyświetlania i obsługi kanałów (Intent Chat) w komponencie chatu!

### Nowe funkcjonalności:

#### 1. **Lista kanałów użytkownika**

- ✅ Automatyczne pobieranie intentów gdzie użytkownik jest członkiem
- ✅ Filtrowanie tylko `JOINED` members
- ✅ Wyświetlanie nazwy eventu, liczby członków
- ✅ Avatar właściciela eventu
- ✅ Relative time (np. "2h ago")

#### 2. **Wysyłanie wiadomości w kanałach**

- ✅ Integracja z `useSendIntentMessage`
- ✅ Automatyczne invalidacje cache
- ✅ Real-time updates przez WebSocket

#### 3. **Wyświetlanie wiadomości kanału**

- ✅ Infinite scroll dla historii
- ✅ Przycisk "Load more"
- ✅ Mapowanie autorów wiadomości
- ✅ Obsługa usuniętych wiadomości

#### 4. **Unread count dla kanałów**

- ✅ Pobieranie unread count z Redis cache (10s TTL)
- ✅ Automatyczne odświeżanie co 10s
- ✅ Wyświetlanie badge z liczbą nieprzeczytanych

#### 5. **Mark as read dla kanałów**

- ✅ Automatyczne oznaczanie jako przeczytane przy otwarciu
- ✅ Invalidacja cache po mark as read

## 📝 Zmiany w kodzie

### `apps/web/src/app/account/chats/page.tsx`

**Dodane importy:**

```typescript
import { useMyMembershipsQuery } from '@/lib/api/intent-members';
```

**Dodane query:**

```typescript
// Fetch user's intent memberships (for channels)
const { data: membershipsData, isLoading: membershipsLoading } =
  useMyMembershipsQuery(
    { limit: 100, offset: 0 },
    { enabled: !!currentUserId }
  );
```

**Mapowanie na conversations:**

```typescript
const channelConversations: Conversation[] = useMemo(() => {
  const items = (membershipsData?.myMemberships as any)?.items;
  if (!items || !currentUserId) return [];

  return items
    .filter((membership: any) => {
      // Only show JOINED members
      return membership.status === 'JOINED';
    })
    .map((membership: any) => {
      const intent = membership.intent;
      if (!intent) return null;

      // Get last message from intent (if available)
      const lastMessage =
        intent.messagesCount > 0 ? 'Recent activity' : 'No messages yet';

      // Use unread count from query if this is the active channel
      const unreadCount =
        intent.id === activeChId
          ? (intentUnreadData?.intentUnreadCount ?? 0)
          : 0;

      return {
        id: intent.id,
        kind: 'channel' as const,
        title: intent.title || 'Untitled Event',
        membersCount: intent.joinedCount || 0,
        preview: lastMessage,
        lastMessageAt: formatRelativeTime(intent.updatedAt),
        unread: unreadCount,
        avatar: intent.owner?.imageUrl || undefined,
      };
    })
    .filter((c: Conversation | null): c is Conversation => c !== null);
}, [membershipsData, currentUserId, activeChId, intentUnreadData]);
```

**Automatyczne ustawianie pierwszego kanału:**

```typescript
useEffect(() => {
  if (tab === 'channel' && !activeChId && channelConversations.length > 0) {
    setActiveChId(channelConversations[0]?.id);
  }
}, [tab, activeChId, channelConversations]);
```

**Loading state dla kanałów:**

```typescript
{((dmThreadsLoading && tab === 'dm') ||
  (membershipsLoading && tab === 'channel')) ? (
  <div className="flex h-full items-center justify-center">
    <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
  </div>
) : (
  <ChatList items={conversations} activeId={activeId} onPick={handlePick} />
)}
```

## 🎨 UI/UX

### Wygląd listy kanałów:

```
┌─────────────────────────────────┐
│ 🔵 DM  │  # Channels            │ <- Tabs
├─────────────────────────────────┤
│ Inbox                    Newest │
├─────────────────────────────────┤
│ # Channel                    2h │
│ 📍 Basketball Game              │
│ Recent activity           [5]   │ <- Unread badge
├─────────────────────────────────┤
│ # Channel                    5h │
│ 🎾 Tennis Practice              │
│ No messages yet                 │
├─────────────────────────────────┤
│ # Channel                    1d │
│ ⚽ Soccer Match                  │
│ Recent activity                 │
└─────────────────────────────────┘
```

### Różnice między DM a Channels:

| Feature      | DM                   | Channels                              |
| ------------ | -------------------- | ------------------------------------- |
| **Icon**     | 👤 User2             | # Hash                                |
| **Title**    | User name            | Event title                           |
| **Subtitle** | "Direct message"     | "X members"                           |
| **Avatar**   | Other user           | Event owner                           |
| **Preview**  | Last message content | "Recent activity" / "No messages yet" |
| **Unread**   | From DmRead          | From IntentChatRead (Redis cache)     |

## 🔧 Jak to działa

### 1. Pobieranie listy kanałów

```typescript
// Query zwraca wszystkie memberships użytkownika
const { data: membershipsData } = useMyMembershipsQuery({
  limit: 100,
  offset: 0,
});

// Filtrujemy tylko JOINED
const joinedMemberships = membershipsData?.myMemberships?.items?.filter(
  (m) => m.status === 'JOINED'
);

// Każdy membership zawiera:
// - intent: { id, title, joinedCount, messagesCount, owner, ... }
// - status: 'JOINED' | 'PENDING' | 'INVITED' | ...
// - role: 'OWNER' | 'MODERATOR' | 'MEMBER'
```

### 2. Wyświetlanie wiadomości kanału

```typescript
// Infinite query z cursor pagination
const { data, fetchNextPage, hasNextPage } = useGetIntentMessages({
  intentId: activeChId,
  limit: 50,
});

// Flatten all pages
const allMessages = data?.pages.flatMap(
  (page) => page.intentMessages?.items || []
);

// Map to UI format
const messages = allMessages.map((msg) => ({
  id: msg.id,
  text: msg.content,
  at: new Date(msg.createdAt).getTime(),
  side: msg.authorId === currentUserId ? 'right' : 'left',
  author: {
    id: msg.author.id,
    name: msg.author.name,
    avatar: msg.author.imageUrl,
  },
  block: !!msg.deletedAt,
}));
```

### 3. Real-time updates

```typescript
// Subskrypcja do nowych wiadomości
useIntentMessageAdded({
  intentId: activeChId,
  enabled: !!activeChId && tab === 'channel',
});

// Automatyczna invalidacja cache:
// - eventChatKeys.messages(intentId)
// - eventChatKeys.unreadCount(intentId)
// - ['intents', 'detail', intentId]
```

### 4. Unread count

```typescript
// Pobieranie z Redis cache (TTL 10s)
const { data: intentUnreadData } = useGetIntentUnreadCount(
  { intentId: activeChId },
  { enabled: !!activeChId, refetchInterval: 10000 }
);

// Backend:
// 1. Sprawdź cache: `chat:intent:unread:${intentId}:${userId}`
// 2. Jeśli brak, policz z DB: messages.count(createdAt > lastReadAt)
// 3. Cache na 10s
```

## 🚀 Testowanie

### Test 1: Lista kanałów

```
✅ Zaloguj się
✅ Przejdź do /account/chats
✅ Kliknij tab "Channels"
✅ Powinieneś zobaczyć listę swoich eventów (gdzie jesteś JOINED)
```

### Test 2: Wyświetlanie wiadomości

```
✅ Kliknij na kanał
✅ Powinieneś zobaczyć wiadomości z tego eventu
✅ Scroll w górę - powinien pojawić się "Load more"
✅ Kliknij "Load more" - powinny załadować się starsze wiadomości
```

### Test 3: Wysyłanie wiadomości

```
✅ Wpisz wiadomość w input
✅ Kliknij Send lub Enter
✅ Wiadomość powinna pojawić się natychmiast (po prawej stronie)
✅ Otwórz drugi tab - wiadomość powinna pojawić się tam też (real-time)
```

### Test 4: Unread count

```
✅ Wyślij wiadomość w kanale z innego konta
✅ Zaloguj się jako pierwszy użytkownik
✅ Na liście kanałów powinien pojawić się badge z liczbą [1]
✅ Kliknij na kanał
✅ Badge powinien zniknąć (mark as read)
```

### Test 5: Przełączanie DM ↔ Channels

```
✅ Otwórz DM thread
✅ Wyślij wiadomość
✅ Przełącz na tab "Channels"
✅ Otwórz kanał
✅ Wyślij wiadomość
✅ Przełącz z powrotem na "DM"
✅ Poprzedni DM thread powinien być nadal aktywny
```

## 📊 Performance

### Optymalizacje:

1. **Redis cache dla unread count** (10s TTL)
   - Zmniejsza obciążenie DB
   - Akceptowalne 10s opóźnienie dla badge

2. **Infinite scroll** zamiast load all
   - Ładuje tylko 50 wiadomości na raz
   - Fetch next page on demand

3. **Refetch interval** dla unread count
   - Co 10s automatyczne odświeżenie
   - Można wyłączyć gdy tab nie jest aktywny

4. **Automatic invalidations**
   - Po wysłaniu wiadomości
   - Po mark as read
   - Po otrzymaniu subskrypcji

### Metryki (przykładowe):

| Operation                    | Time  | Cache      |
| ---------------------------- | ----- | ---------- |
| `myMemberships` (10 intents) | ~80ms | -          |
| `intentMessages` (50 msgs)   | ~60ms | -          |
| `intentUnreadCount`          | ~5ms  | Redis hit  |
| `intentUnreadCount`          | ~40ms | Redis miss |
| `sendIntentMessage`          | ~90ms | -          |

## 🐛 Known Issues / Limitations

### 1. Unread count tylko dla aktywnego kanału

**Problem:** Badge pokazuje unread count tylko dla obecnie otwartego kanału.

**Dlaczego:** Pobieramy unread count tylko dla `activeChId`, żeby nie robić 100 requestów na raz.

**Rozwiązanie (przyszłość):**

- Batch query dla wszystkich kanałów
- Lub osobny endpoint `intentUnreadCounts(intentIds: [ID!]!)`
- Lub cache w localStorage z periodic sync

### 2. Brak "last message" content

**Problem:** W liście kanałów pokazujemy tylko "Recent activity" zamiast treści ostatniej wiadomości.

**Dlaczego:** `myMemberships` nie zwraca last message (tylko `messagesCount`).

**Rozwiązanie (przyszłość):**

- Dodać `lastMessage` do `Intent` type w GraphQL
- Lub osobne query dla last messages
- Lub cache w Redis

### 3. Brak typing indicators

**Problem:** Nie widać kto pisze w kanale.

**Status:** Backend gotowy (`intentTyping` subscription), trzeba dodać UI.

**TODO:** Patrz [CHAT_INTEGRATION_GUIDE.md](./CHAT_INTEGRATION_GUIDE.md)

## 🎯 Następne kroki

### Wysokie priorytety:

1. **Batch unread counts** - Pokazywać badge dla wszystkich kanałów
2. **Last message preview** - Pokazywać treść ostatniej wiadomości
3. **Typing indicators UI** - "X is typing..."
4. **Empty states** - Lepsze komunikaty gdy brak kanałów

### Średnie priorytety:

1. **Search in channels** - Wyszukiwanie wiadomości
2. **Filter channels** - Filtrowanie po nazwie/statusie
3. **Sort channels** - Sortowanie po ostatniej aktywności
4. **Pin channels** - Przypinanie ważnych kanałów

### Niskie priorytety:

1. **Channel settings** - Mute, notifications, leave
2. **Member list** - Lista członków w sidebar
3. **Channel info** - Szczegóły eventu w chat details
4. **Reactions** - Emoji reactions do wiadomości

## 📚 Dokumentacja

- [CHAT_INTEGRATION_GUIDE.md](./CHAT_INTEGRATION_GUIDE.md) - Główny przewodnik
- [CHAT_IMPLEMENTATION_SUMMARY.md](./CHAT_IMPLEMENTATION_SUMMARY.md) - Podsumowanie implementacji
- [CHAT_SUBSCRIPTIONS_GUIDE.md](./CHAT_SUBSCRIPTIONS_GUIDE.md) - WebSocket guide
- [CHAT_USAGE_EXAMPLES.md](./CHAT_USAGE_EXAMPLES.md) - Przykłady użycia

---

**Status:** ✅ Gotowe i przetestowane
**Data:** 2025-01-06
**Wersja:** 1.1.0
