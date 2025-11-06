# Chat Integration - Migration Checklist ✅

## Szybki Start (5 minut)

### 1. Backup oryginalnego pliku

```bash
cd apps/web/src/app/account/chats
mv page.tsx page-mock.tsx
mv page-integrated.tsx page.tsx
```

### 2. Sprawdź zmienne środowiskowe

```bash
# apps/web/.env.local
NEXT_PUBLIC_WS_URL=ws://localhost:4000/graphql
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:4000/graphql
```

### 3. Uruchom aplikację

```bash
# Terminal 1 - Backend
cd apps/api
pnpm dev

# Terminal 2 - Frontend
cd apps/web
pnpm dev
```

### 4. Testuj

1. Otwórz `http://localhost:3000/account/chats`
2. Zaloguj się
3. Powinieneś zobaczyć swoje DM threads
4. Kliknij na thread i wyślij wiadomość
5. ✅ Wiadomość powinna pojawić się natychmiast

---

## Co zostało dodane

### Nowe pliki

- ✅ `apps/web/src/lib/api/dm-subscriptions.tsx` - WebSocket hooki dla DM
- ✅ `apps/web/src/lib/api/event-chat-subscriptions.tsx` - WebSocket hooki dla Channels
- ✅ `apps/web/src/app/account/chats/page-integrated.tsx` - Zintegrowana strona chatu
- ✅ `CHAT_INTEGRATION_GUIDE.md` - Przewodnik integracji
- ✅ `CHAT_MIGRATION_CHECKLIST.md` - Ten plik

### Zmodyfikowane pliki (backend - już zrobione wcześniej)

- ✅ `apps/api/src/graphql/resolvers/mutation/dm.ts` - Dodano publikację subskrypcji
- ✅ `apps/api/src/graphql/resolvers/query/dm.ts` - Dodano obliczanie unread count
- ✅ `apps/api/src/graphql/resolvers/query/event-chat.ts` - Dodano Redis cache
- ✅ `apps/api/src/graphql/resolvers/mutation/event-chat.ts` - Dodano invalidację cache
- ✅ `packages/contracts/graphql/operations/dm.graphql` - Dodano operacje
- ✅ `packages/contracts/graphql/operations/event-chat.graphql` - Dodano operacje

---

## Funkcjonalności

### ✅ Zaimplementowane

- [x] Lista wątków DM z prawdziwymi danymi
- [x] Wyświetlanie wiadomości DM
- [x] Wysyłanie wiadomości DM
- [x] Real-time updates przez WebSocket
- [x] Automatyczne mark as read
- [x] Unread badges
- [x] Loading states
- [x] Responsive design
- [x] Error handling
- [x] Reconnect logic
- [x] Rate limiting (backend)
- [x] Content sanitization (backend)
- [x] Redis cache dla unread counts (backend)

### 🚧 Do zrobienia (opcjonalne)

- [ ] Lista Intent/Channels (obecnie tylko DM)
- [ ] Typing indicators UI
- [ ] Optimistic updates dla wysyłania
- [ ] Message editing UI
- [ ] Message deletion UI
- [ ] Reply to message
- [ ] File attachments
- [ ] Emoji reactions

---

## Testowanie

### Test 1: Podstawowa funkcjonalność

```
✅ Zaloguj się
✅ Przejdź do /account/chats
✅ Zobacz listę DM threads
✅ Kliknij na thread
✅ Zobacz wiadomości
✅ Wyślij wiadomość
✅ Wiadomość pojawia się natychmiast
```

### Test 2: Real-time updates

```
✅ Otwórz dwa okna przeglądarki
✅ Zaloguj się jako różni użytkownicy
✅ Wyślij wiadomość z okna 1
✅ Wiadomość pojawia się w oknie 2 bez odświeżania
```

### Test 3: Unread badges

```
✅ Wyślij wiadomość do użytkownika
✅ Zaloguj się jako ten użytkownik
✅ Zobacz unread badge na liście
✅ Otwórz thread
✅ Badge znika
```

### Test 4: Reconnect

```
✅ Otwórz chat
✅ Zatrzymaj backend (Ctrl+C)
✅ Zobacz w console próby reconnect
✅ Uruchom backend ponownie
✅ Połączenie powinno zostać przywrócone
```

---

## Troubleshooting

### Problem: Nie widzę żadnych wątków DM

**Możliwe przyczyny:**

1. Nie jesteś zalogowany
2. Nie masz żadnych DM threads w bazie
3. Backend nie działa

**Rozwiązanie:**

```bash
# 1. Sprawdź czy jesteś zalogowany
# Otwórz DevTools > Application > Local Storage
# Sprawdź czy masz 'accessToken'

# 2. Stwórz testowy DM thread (w Prisma Studio lub przez API)
# Lub wyślij wiadomość do innego użytkownika

# 3. Sprawdź backend
curl http://localhost:4000/health
# Powinno zwrócić 200 OK
```

### Problem: WebSocket nie łączy się

**Symptom:** W console widzisz błędy `❌ [WS]`

**Rozwiązanie:**

```bash
# 1. Sprawdź zmienne środowiskowe
cat apps/web/.env.local | grep WS_URL
# Powinno być: NEXT_PUBLIC_WS_URL=ws://localhost:4000/graphql

# 2. Sprawdź czy backend obsługuje WebSocket
# W apps/api/src/server.ts powinno być:
# app.register(mercurius, { subscription: true, ... })

# 3. Sprawdź logi backendu
# Powinny być logi o połączeniach WebSocket
```

### Problem: Wiadomości nie pojawiają się w czasie rzeczywistym

**Symptom:** Musisz odświeżyć stronę, żeby zobaczyć nowe wiadomości

**Rozwiązanie:**

```bash
# 1. Sprawdź czy subskrypcja jest aktywna
# W DevTools > Network > WS
# Powinno być połączenie WebSocket

# 2. Sprawdź czy backend publikuje subskrypcje
# W apps/api/src/graphql/resolvers/mutation/dm.ts
# Powinno być: await pubsub?.publish({ topic: `dmMessageAdded:${threadId}`, ... })

# 3. Sprawdź logi backendu
# Powinny być logi o publikacji subskrypcji
```

### Problem: Błąd "Cannot read property 'id' of undefined"

**Symptom:** Crash przy próbie wyświetlenia wiadomości

**Rozwiązanie:**

```typescript
// Dodaj sprawdzenie w komponencie
if (!currentUserId) {
  return <Loader2 className="h-8 w-8 animate-spin" />;
}

// Lub użyj optional chaining
const messages = dmMessagesData?.dmMessages?.items ?? [];
```

---

## Performance Checklist

### Frontend

- [ ] Użyj `enabled` flag w query aby nie ładować niepotrzebnych danych
- [ ] Dodaj debouncing dla typing indicators (300ms)
- [ ] Dodaj throttling dla mark as read (500ms)
- [ ] Użyj `react-window` dla bardzo długich list (>100 wiadomości)
- [ ] Dodaj lazy loading dla attachments

### Backend

- [ ] Sprawdź czy rate limiting działa (10 msg / 30s)
- [ ] Sprawdź czy Redis cache działa dla unread counts
- [ ] Dodaj DataLoaders dla batching (opcjonalne)
- [ ] Monitoruj query performance w Prisma

---

## Deployment Checklist

### Przed deploymentem

- [ ] Uruchom testy: `pnpm test`
- [ ] Sprawdź linting: `pnpm lint`
- [ ] Sprawdź TypeScript: `pnpm type-check`
- [ ] Przetestuj na staging
- [ ] Sprawdź czy zmienne środowiskowe są ustawione na produkcji

### Po deploymencie

- [ ] Sprawdź czy WebSocket działa na produkcji
- [ ] Sprawdź logi backendu
- [ ] Sprawdź metryki (latency, error rate)
- [ ] Przetestuj z prawdziwymi użytkownikami

---

## Rollback Plan

Jeśli coś pójdzie nie tak:

```bash
# 1. Przywróć oryginalny plik
cd apps/web/src/app/account/chats
mv page.tsx page-integrated-backup.tsx
mv page-mock.tsx page.tsx

# 2. Restart frontendu
# Ctrl+C w terminalu z pnpm dev
pnpm dev

# 3. Aplikacja powinna działać z mockami
```

---

## Next Steps

Po udanej integracji DM:

1. **Dodaj listę Intent/Channels**
   - Stwórz query dla listy intentów użytkownika
   - Dodaj do `channelConversations` w page.tsx
   - Przetestuj wysyłanie wiadomości w kanałach

2. **Implementuj typing indicators**
   - Dodaj mutation `publishTyping` na backendzie
   - Użyj `useDmTyping` / `useIntentTyping` na frontendzie
   - Dodaj UI dla "X is typing..."

3. **Dodaj optimistic updates**
   - Użyj `onMutate` w `useSendDmMessage`
   - Dodaj tymczasowe ID dla wiadomości
   - Zamień na prawdziwe ID po success

4. **Implementuj message editing**
   - Dodaj UI dla edit (np. dropdown menu)
   - Użyj `useUpdateDmMessage` / `useEditIntentMessage`
   - Pokaż "edited" badge

5. **Dodaj file attachments**
   - Stwórz upload endpoint
   - Dodaj UI dla file picker
   - Wyświetlaj preview dla obrazów

---

## Dokumentacja

- [CHAT_INTEGRATION_GUIDE.md](./CHAT_INTEGRATION_GUIDE.md) - Szczegółowy przewodnik
- [CHAT_IMPLEMENTATION_SUMMARY.md](./CHAT_IMPLEMENTATION_SUMMARY.md) - Podsumowanie
- [CHAT_SUBSCRIPTIONS_GUIDE.md](./CHAT_SUBSCRIPTIONS_GUIDE.md) - WebSocket guide
- [CHAT_USAGE_EXAMPLES.md](./CHAT_USAGE_EXAMPLES.md) - Przykłady użycia
- [CHAT_TESTING_GUIDE.md](./CHAT_TESTING_GUIDE.md) - Jak testować
- [README_CHAT_IMPLEMENTATION.md](./README_CHAT_IMPLEMENTATION.md) - Główna dokumentacja

---

## Support

Jeśli masz pytania lub problemy:

1. Sprawdź dokumentację powyżej
2. Przejrzyj kod w `page-integrated.tsx` - jest dobrze skomentowany
3. Sprawdź console w DevTools - są szczegółowe logi
4. Sprawdź logi backendu - są logi dla subskrypcji i mutacji
5. Stwórz issue na GitHubie z opisem problemu

---

**Status:** ✅ Gotowe do użycia
**Ostatnia aktualizacja:** 2025-01-06
**Wersja:** 1.0.0
