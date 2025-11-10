# Admin User Management - Wymagane rozszerzenia GraphQL Schema

## 📋 Podsumowanie implementacji

Zaimplementowano kompletny panel zarządzania użytkownikami z następującymi funkcjonalnościami:

### ✅ Zrealizowane komponenty UI:

1. **Główna strona użytkowników** (`/admin/users`)
   - Lista użytkowników z filtrami (search, role, verifiedOnly)
   - Sortowanie i paginacja
   - Szczegółowe informacje w tabeli

2. **Modal szczegółów użytkownika** - 7 zakładek:
   - **Konto**: zmiana roli, weryfikacja, edycja danych, usuwanie
   - **Komunikacja**: wysyłanie powiadomień, zarządzanie preferencjami
   - **Bezpieczeństwo**: blokady, zawieszenia, wątki DM
   - **Treści**: komentarze i recenzje użytkownika
   - **Wydarzenia**: członkostwa i akcje moderacyjne
   - **Narzędzia**: reset hasła, impersonacja (dev-only)
   - **Historia**: audit log wszystkich akcji administracyjnych

3. **Modal dodawania użytkownika**
   - Tryb zaproszenia (email invite)
   - Tryb ręczny (instant create)

---

## 🔧 Wymagane mutations do dodania w schema.graphql

### 1. Podstawowe zarządzanie użytkownikiem

```graphql
input AdminUpdateUserInput {
  role: Role
  verifiedAt: DateTime
  name: String
  locale: String
  timezone: String
}

type Mutation {
  """
  Aktualizacja użytkownika przez admina
  """
  adminUpdateUser(id: ID!, input: AdminUpdateUserInput!): User!

  """
  Usunięcie/anonimizacja użytkownika
  """
  adminDeleteUser(id: ID!, anonymize: Boolean = true): Boolean!
}
```

**Guardy:**

- Nie można zmienić własnej roli
- Nie można zdegradować ostatniego ADMINA
- Tylko ADMIN może zmieniać role
- Logowanie do audit log

---

### 2. Dodawanie użytkowników

```graphql
input AdminInviteUserInput {
  email: String!
  name: String
  role: Role = USER
}

input AdminCreateUserInput {
  email: String!
  name: String
  role: Role = USER
  verifiedAt: DateTime
}

type Mutation {
  """
  Zaproszenie użytkownika (wysyła email)
  """
  adminInviteUser(input: AdminInviteUserInput!): User!

  """
  Ręczne utworzenie użytkownika
  """
  adminCreateUser(input: AdminCreateUserInput!): User!
}
```

**Flow zaproszenia:**

1. Tworzy "pół-konto" z `verifiedAt: null`
2. Wysyła email z linkiem aktywacyjnym
3. Po akceptacji ustawia `verifiedAt`

---

### 3. Komunikacja

```graphql
input AdminSendNotificationInput {
  recipientId: ID!
  kind: NotificationKind = SYSTEM
  title: String!
  body: String!
  entityType: NotificationEntity
  entityId: ID
}

input UpdateNotificationPreferencesInput {
  email: Boolean
  push: Boolean
  inApp: Boolean
}

type Mutation {
  """
  Wysłanie powiadomienia systemowego
  """
  adminSendNotification(input: AdminSendNotificationInput!): Notification!

  """
  Aktualizacja preferencji powiadomień użytkownika
  """
  adminUpdateNotificationPreferences(
    userId: ID!
    input: UpdateNotificationPreferencesInput!
  ): User!
}
```

---

### 4. Bezpieczeństwo i blokady

```graphql
type Mutation {
  """
  Zablokowanie użytkownika (UserBlock relation)
  """
  adminBlockUser(userId: ID!, reason: String): UserBlock!

  """
  Odblokowanie użytkownika
  """
  adminUnblockUser(userId: ID!): Boolean!

  """
  Globalne zawieszenie konta (soft-suspend)
  """
  adminSuspendUser(userId: ID!, reason: String): User!

  """
  Cofnięcie zawieszenia
  """
  adminUnsuspendUser(userId: ID!): User!
}

type Query {
  """
  Wątki DM użytkownika (admin view)
  """
  adminUserDmThreads(userId: ID!, limit: Int, offset: Int): DmThreadsResult!
}

type Mutation {
  """
  Usunięcie wątku DM
  """
  adminDeleteDmThread(threadId: ID!): Boolean!

  """
  Usunięcie wiadomości DM
  """
  adminDeleteDmMessage(messageId: ID!): Boolean!
}
```

**Pole w User schema:**

```graphql
type User {
  # ... existing fields
  suspendedAt: DateTime
  suspensionReason: String
}
```

**Middleware:**

- Sprawdzaj `suspendedAt != null` przy wszystkich mutacjach użytkownika
- Zwracaj error: "Account suspended"

---

### 5. Treści użytkownika

```graphql
type Query {
  """
  Komentarze użytkownika (admin view)
  """
  adminUserComments(userId: ID!, limit: Int, offset: Int): CommentsResult!

  """
  Recenzje użytkownika (admin view)
  """
  adminUserReviews(userId: ID!, limit: Int, offset: Int): ReviewsResult!
}

type Mutation {
  """
  Usunięcie komentarza (admin)
  """
  adminDeleteComment(id: ID!): Boolean!

  """
  Przywrócenie komentarza
  """
  adminRestoreComment(id: ID!): Comment!

  """
  Usunięcie recenzji (admin)
  """
  adminDeleteReview(id: ID!): Boolean!
}
```

---

### 6. Wydarzenia i członkostwa

```graphql
type Query {
  """
  Członkostwa użytkownika (admin view)
  """
  adminUserMemberships(
    userId: ID!
    limit: Int
    offset: Int
  ): IntentMembersResult!

  """
  Wydarzenia utworzone przez użytkownika
  """
  adminUserIntents(userId: ID!, limit: Int, offset: Int): IntentsResult!
}

type Mutation {
  """
  Wyrzucenie użytkownika z wydarzenia
  """
  adminKickMember(intentId: ID!, userId: ID!): Boolean!

  """
  Zbanowanie użytkownika w wydarzeniu
  """
  adminBanMember(intentId: ID!, userId: ID!, reason: String): Boolean!

  """
  Odbanowanie użytkownika
  """
  adminUnbanMember(intentId: ID!, userId: ID!): Boolean!

  """
  Zatwierdzenie członkostwa
  """
  adminApproveMembership(intentId: ID!, userId: ID!): IntentMember!

  """
  Odrzucenie członkostwa
  """
  adminRejectMembership(intentId: ID!, userId: ID!): Boolean!
}
```

---

### 7. Narzędzia diagnostyczne (opcjonalne)

```graphql
type Mutation {
  """
  Wysłanie email z resetem hasła
  """
  adminSendPasswordReset(userId: ID!): Boolean!

  """
  Impersonacja użytkownika (dev-only, ADMIN only)
  """
  adminImpersonate(userId: ID!): SessionUser!
}
```

**Guardy dla impersonacji:**

- Tylko ADMIN
- Logowanie do audit log z IP, timestamp, reason
- Timeout sesji impersonacji (np. 1h)
- Wyraźny indicator w UI

---

## 📊 Rozszerzenia istniejących queries

### Dodaj parametr `userId` do istniejących queries:

```graphql
type Query {
  # Existing queries - add userId parameter
  comments(
    # ... existing params
    authorId: ID # NEW
  ): CommentsResult!

  reviews(
    # ... existing params
    authorId: ID # NEW
  ): ReviewsResult!

  myMemberships(
    userId: ID # NEW - for admin view
  ): IntentMembersResult!
}
```

---

## 🔐 Authorization & Guards

### Role-based access:

```typescript
// Przykładowa implementacja guardów
const adminGuards = {
  // Tylko ADMIN może zmieniać role
  canChangeRole: (me: User, target: User) => {
    return me.role === Role.ADMIN && me.id !== target.id;
  },

  // Nie można zdegradować ostatniego ADMINA
  canDemoteAdmin: async (targetId: string) => {
    const adminCount = await prisma.user.count({
      where: { role: Role.ADMIN },
    });
    return adminCount > 1;
  },

  // ADMIN lub MODERATOR może moderować treści
  canModerate: (me: User) => {
    return [Role.ADMIN, Role.MODERATOR].includes(me.role);
  },

  // Tylko ADMIN może usuwać użytkowników
  canDeleteUser: (me: User) => {
    return me.role === Role.ADMIN;
  },
};
```

---

## 📝 Audit Log

Wszystkie akcje admina powinny być logowane:

```graphql
type AdminAuditLog {
  id: ID!
  adminId: ID!
  admin: User!
  action: String! # e.g., "UPDATE_USER_ROLE", "DELETE_COMMENT"
  targetType: String! # "USER", "COMMENT", "INTENT"
  targetId: ID!
  changes: JSON # Before/after values
  reason: String
  ipAddress: String
  userAgent: String
  createdAt: DateTime!
}

type Query {
  adminAuditLogs(
    adminId: ID
    targetType: String
    targetId: ID
    limit: Int
    offset: Int
  ): AdminAuditLogsResult!
}
```

---

## 🎯 Priorytety implementacji

### Faza 1 (MVP) - Podstawowe zarządzanie:

1. ✅ UI components (DONE)
2. ⏳ `adminUpdateUser` (role, verifiedAt, name)
3. ⏳ `adminInviteUser` / `adminCreateUser`
4. ⏳ `adminSendNotification`

### Faza 2 - Moderacja treści:

5. ⏳ `adminUserComments` / `adminUserReviews`
6. ⏳ `adminDeleteComment` / `adminDeleteReview`
7. ⏳ `adminDeleteUser`

### Faza 3 - Bezpieczeństwo:

8. ⏳ `adminBlockUser` / `adminUnblockUser`
9. ⏳ `adminSuspendUser` (global ban)
10. ⏳ `adminUserDmThreads` + delete operations

### Faza 4 - Wydarzenia:

11. ⏳ `adminUserMemberships` / `adminUserIntents`
12. ⏳ Member actions (kick, ban, approve, reject)

### Faza 5 - Advanced:

13. ⏳ Notification preferences
14. ⏳ Audit log
15. ⏳ Diagnostic tools (password reset, impersonation)

---

## 📦 Przykładowa implementacja resolver (TypeScript)

```typescript
// apps/api/src/graphql/resolvers/mutation/admin-users.ts

import { MutationResolvers } from '../__generated__/resolvers-types';
import { GraphQLError } from 'graphql';
import { Role } from '@prisma/client';

export const adminUpdateUser: MutationResolvers['adminUpdateUser'] = async (
  _parent,
  { id, input },
  { prisma, user }
) => {
  // Guard: Only ADMIN can change roles
  if (input.role && user?.role !== Role.ADMIN) {
    throw new GraphQLError('Insufficient permissions', {
      extensions: { code: 'FORBIDDEN' },
    });
  }

  // Guard: Cannot change own role
  if (input.role && user?.id === id) {
    throw new GraphQLError('Cannot change your own role', {
      extensions: { code: 'BAD_REQUEST' },
    });
  }

  // Guard: Cannot demote last ADMIN
  if (input.role && input.role !== Role.ADMIN) {
    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (targetUser?.role === Role.ADMIN) {
      const adminCount = await prisma.user.count({
        where: { role: Role.ADMIN },
      });
      if (adminCount <= 1) {
        throw new GraphQLError('Cannot demote the last admin', {
          extensions: { code: 'BAD_REQUEST' },
        });
      }
    }
  }

  // Log to audit
  await prisma.adminAuditLog.create({
    data: {
      adminId: user!.id,
      action: 'UPDATE_USER',
      targetType: 'USER',
      targetId: id,
      changes: input,
      ipAddress: /* get from context */,
      userAgent: /* get from context */,
    },
  });

  // Update user
  return prisma.user.update({
    where: { id },
    data: {
      ...input,
      updatedAt: new Date(),
    },
  });
};
```

---

## ✅ Status implementacji

- ✅ **UI Components** - W pełni zaimplementowane (7 zakładek + modals)
- ✅ **GraphQL Operations** - Zdefiniowane w `admin-users.graphql` (35+ operacji)
- ⏳ **Backend Mutations** - Wymagane (ten dokument)
- ⏳ **GraphQL Schema** - Do rozszerzenia
- ⏳ **Resolvers** - Do implementacji
- ⏳ **Guards & Authorization** - Do implementacji
- ⏳ **Audit Log** - Do implementacji

---

## 📊 Pełna lista zaimplementowanych funkcjonalności UI

### 1️⃣ Zakładka "Konto"

- ✅ Zmiana roli (USER ⟷ MODERATOR ⟷ ADMIN)
- ✅ Guard: nie można zmienić własnej roli
- ✅ Guard: nie można zdegradować ostatniego admina
- ✅ Weryfikacja/cofnięcie weryfikacji konta
- ✅ Wyświetlanie szczegółowych danych użytkownika (ID, email, daty)
- ✅ Usuwanie/anonimizacja użytkownika
- ✅ Modals potwierdzające dla wszystkich akcji
- ✅ Loading states i success notifications

### 2️⃣ Zakładka "Komunikacja"

- ✅ Wysyłanie powiadomień systemowych (4 typy: INFO, WARNING, ERROR, SUCCESS)
- ✅ Podgląd powiadomienia przed wysłaniem
- ✅ Zarządzanie preferencjami powiadomień:
  - Email notifications (włącz/wyłącz)
  - Push notifications (włącz/wyłącz)
  - In-app notifications (włącz/wyłącz)
- ✅ Success modal po wysłaniu

### 3️⃣ Zakładka "Bezpieczeństwo"

- ✅ Blokowanie/odblokowanie użytkownika z powodem
- ✅ Globalne zawieszenie konta (suspend) z powodem
- ✅ Wyświetlanie statusu zawieszenia z datą i powodem
- ✅ Przeglądanie wątków DM użytkownika
- ✅ Usuwanie wątków DM
- ✅ Modals dla wszystkich akcji z potwierdzeniami

### 4️⃣ Zakładka "Treści"

- ✅ Przeglądanie komentarzy użytkownika
- ✅ Przeglądanie recenzji użytkownika
- ✅ Usuwanie/przywracanie komentarzy
- ✅ Usuwanie recenzji
- ✅ Linki do wydarzeń
- ✅ Modals z listami treści

### 5️⃣ Zakładka "Wydarzenia"

- ✅ Przeglądanie członkostw użytkownika
- ✅ Przeglądanie utworzonych wydarzeń
- ✅ Akcje moderacyjne:
  - Kick (wyrzuć z wydarzenia)
  - Ban (zbanuj na wydarzeniu)
  - Unban (odbanuj)
  - Approve (zatwierdź członkostwo)
  - Reject (odrzuć członkostwo)
- ✅ Linki do wydarzeń
- ✅ Statusy i role członkostw
- ✅ Modals z listami i akcjami

### 6️⃣ Zakładka "Narzędzia" (Diagnostic Tools)

- ✅ Wysyłanie emaila z resetem hasła
- ✅ Impersonacja użytkownika (dev-only)
- ✅ Ostrzeżenia o bezpieczeństwie
- ✅ Informacje o audit log
- ✅ Modals potwierdzające

### 7️⃣ Zakładka "Historia" (Audit Log)

- ✅ Wyświetlanie historii akcji administracyjnych
- ✅ Filtrowanie po typie akcji:
  - Zmiana roli
  - Weryfikacja
  - Zawieszenie
  - Blokada
  - Powiadomienia
  - Usunięcie treści
- ✅ Szczegóły akcji (kto, kiedy, metadata)
- ✅ Kolorowe oznaczenia typów akcji
- ✅ Timeline view

### 8️⃣ Modal dodawania użytkownika

- ✅ **Tryb zaproszenia:**
  - Email (wymagany)
  - Imię (opcjonalne)
  - Rola (domyślnie USER)
  - Wysyła email z zaproszeniem
- ✅ **Tryb ręczny:**
  - Email (wymagany)
  - Imię (wymagane)
  - Rola (wybór)
  - Opcja "Mark as verified"
  - Tworzy konto natychmiast
- ✅ Toggle między trybami
- ✅ Informacje o różnicach między trybami

### 9️⃣ Strona główna `/admin/users`

- ✅ Lista użytkowników w tabeli
- ✅ Filtry:
  - Wyszukiwanie (search)
  - Rola (ALL, USER, MODERATOR, ADMIN)
  - Tylko zweryfikowani (verifiedOnly)
- ✅ Kolumny:
  - Imię
  - Email
  - Rola (z kolorowymi badges)
  - Status (verified/suspended)
  - Data utworzenia
  - Ostatnia aktywność
  - Akcje (przycisk "Szczegóły")
- ✅ Przycisk "Dodaj użytkownika"
- ✅ Licznik użytkowników
- ✅ Informacja o paginacji

---

## 🚀 Następne kroki

1. Dodaj mutations i queries do `packages/contracts/graphql/schema.graphql`
2. Regeneruj typy: `pnpm codegen`
3. Implementuj resolvers w `apps/api/src/graphql/resolvers/`
4. Dodaj guardy i authorization (tylko ADMIN i MODERATOR)
5. Implementuj audit log (tabela AdminAuditLog w Prisma)
6. Dodaj testy jednostkowe i integracyjne
7. Testuj z UI

---

## 📁 Struktura plików

```
apps/web/src/app/admin/users/
├── page.tsx                                    # Główna strona
├── _components/
│   ├── user-detail-modal.tsx                  # Modal z 7 zakładkami
│   ├── add-user-modal.tsx                     # Modal dodawania (2 tryby)
│   └── tabs/
│       ├── account-tab.tsx                    # ✅ Pełna funkcjonalność
│       ├── communication-tab.tsx              # ✅ Pełna funkcjonalność
│       ├── security-tab.tsx                   # ✅ Pełna funkcjonalność
│       ├── content-tab.tsx                    # ✅ Pełna funkcjonalność
│       ├── intents-tab.tsx                    # ✅ Pełna funkcjonalność
│       ├── diagnostic-tools.tsx               # ✅ Pełna funkcjonalność
│       └── audit-log-tab.tsx                  # ✅ Pełna funkcjonalność

packages/contracts/graphql/operations/
└── admin-users.graphql                        # ✅ 35+ operacji GraphQL
```

---

**Autor:** AI Assistant  
**Data:** 2025-11-10  
**Status:** ✅ UI Complete (100%), ⏳ Backend TODO
