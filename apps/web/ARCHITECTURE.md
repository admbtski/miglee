# 🏗️ Frontend Architecture Guide

## 📁 Struktura Projektu

```
apps/web/src/
├── app/                    # Next.js App Router pages
│   ├── [[...slug]]/       # Główna strona z listą intentów
│   ├── account/           # Panel użytkownika
│   ├── admin/             # Panel administracyjny
│   └── intent/[id]/       # Szczegóły pojedynczego intentu
├── components/            # Globalne, reusable komponenty UI
│   ├── chat/             # Komponenty chatu
│   ├── feedback/         # Error boundaries, modals
│   ├── forms/            # Formularze (combobox, inputs)
│   ├── layout/           # Layout components (navbar, footer)
│   └── ui/               # Atomic UI components (badges, buttons)
├── features/              # Feature-based modules
│   ├── account/          # Logika konta użytkownika
│   ├── admin/            # Logika panelu admina
│   ├── auth/             # Autentykacja
│   ├── intents/          # Logika intentów/wydarzeń
│   ├── maps/             # Mapy i geolokalizacja
│   └── notifications/    # Powiadomienia
├── hooks/                 # Globalne custom hooks
├── lib/                   # Biblioteki i utilities
│   ├── adapters/         # Data adapters/mappers
│   ├── api/              # GraphQL queries & mutations
│   ├── config/           # Konfiguracja (query-client, otel)
│   ├── constants/        # Globalne stałe
│   ├── i18n/             # Internacjonalizacja
│   └── utils/            # Utility functions
├── styles/                # Globalne style CSS
└── types/                 # Globalne typy TypeScript
```

---

## 🎯 Zasady Organizacji Kodu

### **1. Kiedy używać `_components`, `_hooks`, `_lib`?**

#### **Route-specific (z prefixem `_`)**

Używaj gdy kod jest **specyficzny dla danej route** i nie będzie reużywany:

```
app/[[...slug]]/_components/     ✅ Komponenty tylko dla listy intentów
app/[[...slug]]/_hooks/          ✅ Hooki tylko dla tej strony
app/admin/users/_components/     ✅ Komponenty tylko dla zarządzania userami
```

#### **Global (bez prefiksu `_`)**

Używaj gdy kod jest **reużywalny** w wielu miejscach:

```
/components/ui/badge.tsx         ✅ Badge używany wszędzie
/hooks/use-debounced-value.tsx   ✅ Hook używany w wielu miejscach
/lib/utils/date-format.ts        ✅ Formatowanie dat w całej aplikacji
```

---

### **2. Gdzie umieszczać nowe pliki?**

#### **Typy (`types/`)**

```typescript
// ✅ DOBRZE: Globalne typy
/types/einntt.ts / types / user.ts / types / event -
  details.ts /
    // ❌ ŹLE: Typy w folderze route
    app /
    [[...slug]] /
    _types /
    intent.ts; // Przenieś do /types/
```

#### **Adaptery (`lib/adapters/`)**

```typescript
// ✅ DOBRZE: Mapowanie danych z API
/lib/adapters/intent-adapter.ts
/lib/adapters/user-adapter.ts

// ❌ ŹLE: Adapter w folderze route
/app/[[...slug]]/_lib/adapters/  // Przenieś do /lib/adapters/
```

#### **Constants (`lib/constants/`)**

```typescript
// ✅ DOBRZE: Stałe pogrupowane tematycznie
/lib/acnnosstt /
  intents.ts /
  lib /
  constants /
  ui.ts /
  lib /
  constants /
  api.ts /
  // ❌ ŹLE: Stałe w route
  app /
  [[...slug]] /
  _lib /
  constants.ts; // Przenieś do /lib/constants/
```

#### **Utils (`lib/utils/`)**

```typescript
// ✅ DOBRZE: Utility functions pogrupowane
/lib/ilstu /
  intents.ts / // buildGridCols, notEmptyString
  lib /
  utils /
  date -
  format.ts / // formatDate, parseISO
    lib /
    utils /
    slug.ts / // slugify, deslugify
    // ❌ ŹLE: Utils w route
    app /
    [[...slug]] /
    _lib /
    utils.ts; // Przenieś do /lib/utils/
```

#### **i18n (`lib/i18n/`)**

```typescript
// ✅ DOBRZE: Globalna internacjonalizacja
/lib/i18n/translations.ts
/lib/i18n/en.ts
/lib/i18n/pl.ts

// ❌ ŹLE: i18n w route
/app/[[...slug]]/_lib/i18n/  // Przenieś do /lib/i18n/
```

---

### **3. Feature-based vs Component-based**

#### **Feature-based (`features/`)**

Używaj dla **domeny biznesowej** z własną logiką:

```
features/intents/
├── components/           # Komponenty specyficzne dla intentów
│   ├── intent-card.tsx
│   └── intent-modal.tsx
├── hooks/               # Hooki dla intentów
│   └── use-intent-detail.ts
├── types/               # Typy dla intentów
│   └── intent-types.ts
└── utils/               # Utils dla intentów
    └── intent-helpers.ts
```

**Przykłady feature:**

- `features/intents/` - Wydarzenia/spotkania
- `features/auth/` - Autentykacja
- `features/admin/` - Panel administracyjny
- `features/chat/` - System czatu

#### **Component-based (`components/`)**

Używaj dla **reużywalnych komponentów UI** bez logiki biznesowej:

```
components/ui/
├── badge.tsx            # Prosty badge
├── button.tsx           # Przycisk
├── modal.tsx            # Modal wrapper
└── progress-bar.tsx     # Progress bar
```

---

### **4. Importy - Best Practices**

#### **Używaj alias paths (`@/`)**

```typescript
// ✅ DOBRZE
import { IntentListItem } from '@/types/intent';
import { INTENTS_CONFIG } from '@/lib/constants/intents';
import { mapIntentToEventCardProps } from '@/lib/adapters/intent-adapter';

// ❌ ŹLE
import { IntentListItem } from '../../../types/intent';
import { INTENTS_CONFIG } from '../../_lib/constants';
```

#### **Grupuj importy**

```typescript
// 1. React & Next.js
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

// 2. External libraries
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';

// 3. Internal - components
import { Navbar } from '@/components/layout/navbar';
import { EventCard } from '@/components/events/event-card';

// 4. Internal - hooks & utils
import { useDebounced } from '@/hooks/use-debounced';
import { formatDate } from '@/lib/utils/date-format';

// 5. Internal - types
import type { IntentListItem } from '@/types/intent';
```

---

### **5. Naming Conventions**

#### **Pliki**

```
kebab-case.tsx           ✅ event-card.tsx
kebab-case.ts            ✅ intent-adapter.ts
PascalCase.tsx           ❌ EventCard.tsx (tylko dla komponentów w starym kodzie)
```

#### **Komponenty**

```typescript
// ✅ DOBRZE: PascalCase
export function EventCard() {}
export const LoadingState = memo(function LoadingState() {});

// ❌ ŹLE: camelCase
export function eventCard() {}
```

#### **Hooki**

```typescript
// ✅ DOBRZE: use + PascalCase
export function useDebounced() {}
export function useActiveFiltersCount() {}

// ❌ ŹLE: bez prefixu 'use'
export function debounced() {}
```

#### **Typy**

```typescript
// ✅ DOBRZE: PascalCase
export type IntentListItem = { ... };
export interface EventCardProps { ... };

// ❌ ŹLE: camelCase
export type intentListItem = { ... };
```

#### **Utility functions**

```typescript
// ✅ DOBRZE: camelCase
export function buildGridCols() {}
export const notEmptyString = () => {};

// ❌ ŹLE: PascalCase
export function BuildGridCols() {}
```

---

### **6. Component Structure**

#### **Mały komponent (< 150 linii)**

```typescript
'use client';

import { memo } from 'react';
import type { Props } from './types';

export const ComponentName = memo(function ComponentName({ prop }: Props) {
  return <div>{prop}</div>;
});
```

#### **Duży komponent (> 150 linii)**

Podziel na:

1. **Główny komponent** - orchestracja
2. **Sub-komponenty** - w tym samym pliku lub osobnym folderze
3. **Hooki** - w `_hooks/` lub `/hooks/`
4. **Utils** - w `_lib/` lub `/lib/utils/`
5. **Typy** - w `_types/` lub `/types/`

---

### **7. Performance Best Practices**

#### **Memoizacja**

```typescript
// ✅ DOBRZE: Memoizuj komponenty list
export const EventCard = memo(function EventCard(props) {
  // ...
});

// ✅ DOBRZE: Memoizuj ciężkie obliczenia
const mappedItems = useMemo(
  () => items.map((item) => transform(item)),
  [items]
);

// ✅ DOBRZE: Memoizuj callbacks
const handleClick = useCallback(() => {
  // ...
}, [deps]);
```

#### **Lazy Loading**

```typescript
// ✅ DOBRZE: Lazy load dużych komponentów
const FilterModal = lazy(() => import('./filter-modal'));
const AdminPanel = lazy(() => import('./admin-panel'));
```

---

### **8. Error Handling**

#### **Error Boundaries**

```typescript
// ✅ DOBRZE: Wrap sekcje w Error Boundary
<ErrorBoundary>
  <EventsGrid items={items} />
</ErrorBoundary>

// ✅ DOBRZE: Multiple levels
<ErrorBoundary>  {/* Page level */}
  <Header />
  <ErrorBoundary>  {/* Section level */}
    <ComplexComponent />
  </ErrorBoundary>
</ErrorBoundary>
```

---

### **9. Testing Strategy** (TODO)

```
__tests__/
├── unit/              # Unit tests
├── integration/       # Integration tests
└── e2e/              # End-to-end tests
```

---

## 📊 Decision Tree: Gdzie umieścić kod?

```
Czy kod jest specyficzny dla jednej route?
├─ TAK → app/[route]/_components|_hooks|_lib/
└─ NIE → Czy to logika biznesowa (feature)?
    ├─ TAK → features/[feature]/
    └─ NIE → Czy to reużywalny komponent UI?
        ├─ TAK → components/
        └─ NIE → Czy to utility/helper?
            ├─ TAK → lib/utils/
            └─ NIE → Czy to typ?
                ├─ TAK → types/
                └─ NIE → Czy to stała?
                    ├─ TAK → lib/constants/
                    └─ NIE → Czy to API call?
                        ├─ TAK → lib/api/
                        └─ NIE → Czy to hook?
                            ├─ TAK → hooks/
                            └─ NIE → Przemyśl architekturę!
```

---

## 🚀 Migration Checklist

Przy przenoszeniu kodu z route-specific do global:

- [ ] Przenieś plik do odpowiedniego folderu globalnego
- [ ] Zaktualizuj wszystkie importy (użyj `@/` alias)
- [ ] Sprawdź czy nie ma duplikatów
- [ ] Uruchom linter i testy
- [ ] Zaktualizuj dokumentację jeśli potrzeba

---

## 📚 Przykłady Refaktoringu

### **Przed:**

```
app/[[...slug]]/
├── _types/intent.ts
├── _lib/
│   ├── constants.ts
│   ├── utils.ts
│   └── adapters/intent-adapter.ts
└── page-client.tsx (486 linii)
```

### **Po:**

```
types/intent.ts                    # Globalne typy
lib/constants/intents.ts           # Globalne stałe
lib/utils/intents.ts               # Globalne utils
lib/adapters/intent-adapter.ts     # Globalne adaptery

app/[[...slug]]/
├── _components/
│   ├── events-list/              # Podzielone komponenty
│   └── filters/                  # Podzielone komponenty
├── _hooks/                       # Route-specific hooks
└── page-client.tsx (243 linii)   # 50% mniej kodu!
```

---

## ✅ Checklist dla nowych features

- [ ] Struktura zgodna z architekturą
- [ ] Typy w `/types/` lub `features/[name]/types/`
- [ ] Komponenty z `memo()` gdzie potrzeba
- [ ] Error boundaries dla sekcji
- [ ] Importy z `@/` alias
- [ ] Naming conventions zgodne z przewodnikiem
- [ ] Kod < 150 linii per plik
- [ ] Brak duplikacji kodu
- [ ] Performance: memoizacja, lazy loading
- [ ] Accessibility: aria-labels, keyboard nav

---

## 🔗 Przydatne Linki

- [Next.js App Router](https://nextjs.org/docs/app)
- [React Performance](https://react.dev/learn/render-and-commit)
- [TypeScript Best Practices](https://typescript-eslint.io/rules/)
- [Clean Code Principles](https://github.com/ryanmcdermott/clean-code-javascript)

---

**Ostatnia aktualizacja:** 2025-01-10
**Wersja:** 1.0.0
