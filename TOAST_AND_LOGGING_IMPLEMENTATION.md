# Toast & Logging System - Implementation Guide

## 📦 Co zostało stworzone

### 1. **DevLogger** (`/lib/utils/dev-logger.ts`)

Zaawansowany system logowania dla developerów z:

- Kolorowe, strukturalne logi w konsoli
- Kategorie: query, mutation, subscription, auth, navigation, api, cache, websocket
- Automatyczne grupowanie i stack traces
- Pomiar czasu wykonania
- Włączanie/wyłączanie przez localStorage
- Dostęp globalny: `window.devLogger`, `window.enableDebug()`, `window.disableDebug()`

### 2. **ToastManager** (`/lib/utils/toast-manager.ts`)

Centralny system powiadomień toast z:

- Integracja z sonner
- Automatyczne logowanie do konsoli
- Metody: success, error, info, warning, loading, promise
- Specjalizowane metody dla query, mutation, auth, subscription
- Opcja `silent` - tylko logi, bez toast
- Dostęp globalny: `window.toast`

### 3. **React Query Config** (`/lib/utils/react-query-config.ts`)

Konfiguracja React Query z:

- Automatyczne logowanie wszystkich query i mutations
- Automatyczne toast dla błędów
- Inteligentne rozpoznawanie błędów (network, auth, validation)
- Helpers: `createMutationWithToast`, `createOptimisticUpdate`
- Dostęp globalny: `window.queryClient`

### 4. **Centralized Exports** (`/lib/utils/index.ts`)

Jeden punkt importu dla wszystkich utilities

---

## 🚀 Jak używać

### Podstawowe użycie toast

```typescript
import { toast } from '@/lib/utils';

// Success
toast.success('Event created successfully');

// Error
toast.error('Failed to create event', {
  description: 'Please try again later',
  duration: 5000,
});

// Info
toast.info('New message received');

// Warning
toast.warning('You have unsaved changes');

// Loading
const toastId = toast.loading('Creating event...');
// Later:
toast.dismiss(toastId);

// Promise (auto handles loading/success/error)
toast.promise(createEventMutation.mutateAsync(data), {
  loading: 'Creating event...',
  success: 'Event created!',
  error: 'Failed to create event',
});
```

### Specjalizowane toast dla API

```typescript
// Query success/error
toast.querySuccess('Events');
toast.queryError('Events', error);

// Mutation success/error
toast.mutationSuccess('Event created');
toast.mutationError('Create event', error);

// Auth
toast.authSuccess('Logged in successfully');
toast.authError('Login failed', error);

// Network
toast.networkError();

// Permission
toast.permissionDenied('delete this event');

// Validation
toast.validationError('Invalid form data', ['email', 'password']);

// Copy
toast.copied('Link copied to clipboard');

// File upload
toast.fileUploaded('image.png');
toast.fileUploadError('image.png', error);
```

### Developer Logging

```typescript
import { devLogger } from '@/lib/utils';

// Basic logs
devLogger.info('User clicked button', {
  category: 'navigation',
  data: { buttonId: 'submit' },
});
devLogger.success('Data loaded', { category: 'query', data: response });
devLogger.warning('Slow query', { category: 'query', duration: 2000 });
devLogger.error('Failed to save', { category: 'mutation', error });
devLogger.debug('Debug info', { category: 'general', data: debugData });

// Query logs
devLogger.queryStart(['getEvents', { page: 1 }]);
devLogger.querySuccess(['getEvents', { page: 1 }], data, 250);
devLogger.queryError(['getEvents', { page: 1 }], error, 500);

// Mutation logs
devLogger.mutationStart('createEvent', variables);
devLogger.mutationSuccess('createEvent', data, 300);
devLogger.mutationError('createEvent', error, variables, 400);

// Subscription logs
devLogger.subscriptionConnected('event-chat-123');
devLogger.subscriptionMessage('event-chat-123', message);
devLogger.subscriptionError('event-chat-123', error);
devLogger.subscriptionDisconnected('event-chat-123');

// Cache logs
devLogger.cacheInvalidated(['getEvents']);
devLogger.cacheUpdated(['getEvents'], newData);

// WebSocket logs
devLogger.wsConnected('wss://api.example.com');
devLogger.wsMessage('chat:message', data);
devLogger.wsError(error);
devLogger.wsDisconnected('wss://api.example.com', 'User logout');

// Auth logs
devLogger.authLogin('user-123');
devLogger.authLogout();
devLogger.authError(error);

// Performance
devLogger.performance('Page render', 150);
```

### Console Commands

```javascript
// W konsoli przeglądarki:

// Włącz debug mode
enableDebug();

// Wyłącz debug mode
disableDebug();

// Dostęp do devLogger
devLogger.info('Test message');

// Dostęp do toast
toast.success('Test toast');

// Dostęp do queryClient
queryClient.getQueryCache();
queryClient.invalidateQueries(['getEvents']);
```

---

## 📝 TODO - Kroki do wdrożenia

### ✅ Wykonane (przez AI)

1. ✅ Stworzono `dev-logger.ts` - zaawansowany system logowania
2. ✅ Stworzono `toast-manager.ts` - centralny system toast
3. ✅ Stworzono `react-query-config.ts` - konfiguracja React Query z logami
4. ✅ Stworzono `index.ts` - centralized exports

### 🔲 Do zrobienia (Twoja decyzja)

#### Priorytet 1 - Podstawowa integracja

- [ ] **Zainstalować sonner** (jeśli nie ma): `pnpm add sonner`
- [ ] **Dodać Toaster do root layout** (`apps/web/src/app/layout.tsx`):

  ```tsx
  import { Toaster } from 'sonner';

  export default function RootLayout({ children }) {
    return (
      <html>
        <body>
          {children}
          <Toaster position="top-right" richColors closeButton />
        </body>
      </html>
    );
  }
  ```

- [ ] **Zastąpić istniejący QueryClient** w `apps/web/src/app/providers.tsx`:

  ```tsx
  import { queryClient } from '@/lib/utils/react-query-config';

  <QueryClientProvider client={queryClient}>
  ```

#### Priorytet 2 - Migracja istniejących hooks (przykłady)

- [ ] **Dodać toast do mutations w `intents.tsx`**:

  ```tsx
  export function useCreateIntentMutation() {
    return useMutation({
      mutationFn: createIntent,
      mutationKey: ['createIntent'],
      meta: {
        successMessage: 'Event created successfully',
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['getIntents'] });
      },
    });
  }
  ```

- [ ] **Dodać toast do mutations w `comments.tsx`**:

  ```tsx
  export function useCreateCommentMutation() {
    return useMutation({
      mutationFn: createComment,
      meta: {
        successMessage: 'Comment added',
      },
    });
  }
  ```

- [ ] **Dodać toast do mutations w `intent-members.tsx`**:

  ```tsx
  export function useJoinIntentMutation() {
    return useMutation({
      mutationFn: joinIntent,
      meta: {
        successMessage: 'Successfully joined event',
      },
    });
  }
  ```

- [ ] **Dodać toast do auth operations w `auth.tsx`**:
  ```tsx
  export function useLoginMutation() {
    return useMutation({
      mutationFn: login,
      onSuccess: (data) => {
        toast.authSuccess('Logged in successfully');
        devLogger.authLogin(data.userId);
      },
      onError: (error) => {
        toast.authError('Login failed', error);
      },
    });
  }
  ```

#### Priorytet 3 - Dodać logi do subscriptions

- [ ] **Dodać logi do `event-chat-subscriptions.tsx`**:

  ```tsx
  useEffect(() => {
    const ws = new WebSocket(url);

    ws.onopen = () => {
      devLogger.wsConnected(url);
      toast.subscriptionConnected('Event chat');
    };

    ws.onmessage = (event) => {
      devLogger.wsMessage('chat:message', event.data);
    };

    ws.onerror = (error) => {
      devLogger.wsError(error);
      toast.subscriptionError('Event chat', error);
    };

    ws.onclose = () => {
      devLogger.wsDisconnected(url);
    };
  }, [url]);
  ```

- [ ] **Dodać logi do `dm-subscriptions.tsx`**
- [ ] **Dodać logi do `reactions-subscriptions.tsx`**

#### Priorytet 4 - Dodać logi do admin operations

- [ ] **Dodać toast do `admin-users.tsx`** (suspend, ban, delete)
- [ ] **Dodać toast do `admin-intents.tsx`** (approve, reject, delete)
- [ ] **Dodać toast do `admin-comments.tsx`** (delete, restore)

#### Priorytet 5 - Optymalizacje

- [ ] **Dodać optimistic updates z logami**:

  ```tsx
  export function useLikeCommentMutation() {
    return useMutation({
      ...createOptimisticUpdate({
        queryKey: ['getComments', commentId],
        updater: (oldData, variables) => ({
          ...oldData,
          likes: oldData.likes + 1,
        }),
      }),
      mutationFn: likeComment,
    });
  }
  ```

- [ ] **Dodać performance monitoring**:
  ```tsx
  useEffect(() => {
    const start = Date.now();

    // Heavy operation

    const duration = Date.now() - start;
    devLogger.performance('Component render', duration);
  }, []);
  ```

#### Priorytet 6 - Custom hooks dla częstych operacji

- [ ] **Stworzyć `useToastMutation` hook**:

  ```tsx
  export function useToastMutation<TData, TVariables>(
    mutationFn: (variables: TVariables) => Promise<TData>,
    options: {
      successMessage: string;
      errorMessage?: string;
      onSuccess?: (data: TData) => void;
    }
  ) {
    return useMutation({
      mutationFn,
      meta: {
        successMessage: options.successMessage,
      },
      onSuccess: options.onSuccess,
    });
  }
  ```

- [ ] **Stworzyć `useDebugQuery` hook** dla debug mode:
  ```tsx
  export function useDebugQuery<TData>(
    queryKey: unknown[],
    queryFn: () => Promise<TData>
  ) {
    return useQuery({
      queryKey,
      queryFn: async () => {
        const start = Date.now();
        const data = await queryFn();
        const duration = Date.now() - start;
        devLogger.querySuccess(queryKey, data, duration);
        return data;
      },
    });
  }
  ```

#### Priorytet 7 - Dodatkowe features

- [ ] **Dodać toast queue management** (max 3 toasts naraz)
- [ ] **Dodać toast persistence** (zapisz ważne toasty w localStorage)
- [ ] **Dodać error reporting** (integracja z Sentry/LogRocket)
- [ ] **Dodać analytics tracking** dla user actions
- [ ] **Stworzyć dev panel** (React component z logami i statystykami)

---

## 🎯 Rekomendowane podejście

### Faza 1: Setup (15 min)

1. Zainstaluj sonner
2. Dodaj Toaster do layout
3. Zastąp QueryClient

### Faza 2: Quick Wins (30 min)

1. Dodaj toast do 5 najważniejszych mutations (create event, join event, send message, etc.)
2. Dodaj logi do WebSocket connections
3. Test w przeglądarce: `enableDebug()` i sprawdź logi

### Faza 3: Systematyczna migracja (2-3h)

1. Przejdź przez każdy plik w `/lib/api/`
2. Dodaj `meta.successMessage` do mutations
3. Dodaj logi do subscriptions
4. Test każdej operacji

### Faza 4: Optymalizacje (1-2h)

1. Dodaj optimistic updates gdzie potrzeba
2. Dodaj performance monitoring
3. Stwórz custom hooks

---

## 💡 Przykłady użycia w kodzie

### Przed:

```tsx
const createEventMutation = useMutation({
  mutationFn: createEvent,
  onSuccess: () => {
    queryClient.invalidateQueries(['getEvents']);
  },
  onError: (error) => {
    console.error('Failed to create event:', error);
  },
});
```

### Po:

```tsx
const createEventMutation = useMutation({
  mutationFn: createEvent,
  mutationKey: ['createEvent'],
  meta: {
    successMessage: 'Event created successfully',
  },
  onSuccess: () => {
    queryClient.invalidateQueries(['getEvents']);
  },
});
// Toast i logi są automatyczne!
```

---

## 🔍 Debugging Tips

```javascript
// W konsoli:

// 1. Włącz debug mode
enableDebug();

// 2. Zobacz wszystkie query w cache
queryClient.getQueryCache().getAll();

// 3. Zobacz konkretne query
queryClient.getQueryData(['getEvents', { page: 1 }]);

// 4. Invalidate query
queryClient.invalidateQueries(['getEvents']);

// 5. Refetch query
queryClient.refetchQueries(['getEvents']);

// 6. Zobacz wszystkie mutations
queryClient.getMutationCache().getAll();

// 7. Test toast
toast.success('Test');
toast.error('Test error');
toast.promise(new Promise((resolve) => setTimeout(resolve, 2000)), {
  loading: 'Loading...',
  success: 'Done!',
  error: 'Failed!',
});

// 8. Test logger
devLogger.info('Test', { category: 'general', data: { test: true } });
```

---

## 📊 Statystyki

**Pliki do potencjalnej aktualizacji:**

- 24 plików API hooks
- ~244 query/mutation/subscription hooks
- Szacowany czas pełnej migracji: 4-6h
- Szacowany czas podstawowej integracji: 1h

**Korzyści:**

- ✅ Automatyczne logi dla wszystkich operacji API
- ✅ Spójne toast notifications
- ✅ Łatwiejszy debugging
- ✅ Lepsza developer experience
- ✅ Automatyczne error handling
- ✅ Performance monitoring
- ✅ Centralized configuration
