# 🧹 Raport nieużywanego kodu - Miglee Web

**Data:** 2025-11-20  
**Analiza:** TypeScript + grep

---

## 📊 Podsumowanie

- **Nieużywane zmienne/funkcje:** 67
- **Komponenty w `src/components`:** 61 plików
- **Komponenty w `src/features`:** 35 plików
- **Łącznie plików do przeglądu:** 96 plików

---

## 🔴 Nieużywane zmienne i importy (Top 30)

### Components

#### `src/components/forms/location-combobox.tsx`

```typescript
// Linia 52
const { error } = ... // NIEUŻYWANE
```

**Rekomendacja:** Usuń lub użyj do wyświetlania błędów

#### `src/components/layout/user-menu.tsx`

```typescript
// Linia 39
const AVATAR_FALLBACK = ... // NIEUŻYWANE
```

**Rekomendacja:** Usuń stałą

#### `src/components/ui/select.tsx`

```typescript
// Linia 117
const { ref } = ... // NIEUŻYWANE
```

**Rekomendacja:** Usuń lub użyj ref

---

### Features

#### `src/features/intents/components/create-edit-intent-modal-connect.tsx`

```typescript
// Linia 19
import { useIntentCoverUpload } from ... // NIEUŻYWANE
// Linia 114
const coverImageFile = ... // NIEUŻYWANE
```

**Rekomendacja:** Usuń nieużywane importy i zmienne

#### `src/features/intents/components/join-question-editor.tsx`

```typescript
// Linia 69
const { intentId } = props; // NIEUŻYWANE
// Linia 72
const { onUpdateQuestion } = props; // NIEUŻYWANE
// Linia 74
const { onReorderQuestions } = props; // NIEUŻYWANE
// Linia 88
const [editingId, setEditingId] = useState(...); // NIEUŻYWANE
```

**Rekomendacja:** Usuń nieużywane props i state

#### `src/features/intents/components/join-request-modal.tsx`

```typescript
// Linia 6
import { IntentJoinQuestion } from '@/lib/api/join-form'; // NIE ISTNIEJE
// Linia 25
const { intentId } = props; // NIEUŻYWANE
```

**Rekomendacja:** Usuń nieistniejący import i nieużywany prop

#### `src/features/intents/components/place-step.tsx`

```typescript
// Linia 47
const { onlineUrl } = ... // NIEUŻYWANE
```

**Rekomendacja:** Usuń lub użyj w formularzu

#### `src/features/intents/components/privacy-step.tsx`

```typescript
// Linia 13
import { Info } from 'lucide-react'; // NIEUŻYWANE
// Linia 85
const { register } = useFormContext(); // NIEUŻYWANE
// Linia 98
const radiusMetersText = ... // NIEUŻYWANE
```

**Rekomendacja:** Usuń nieużywane importy i zmienne

#### `src/features/intents/components/suggestion-card.tsx`

```typescript
// Linia 4
import { IntentSuggestion } from './types'; // NIE ISTNIEJE
```

**Rekomendacja:** Usuń nieistniejący import lub dodaj brakujący typ

#### `src/features/maps/utils/city-helpers.ts`

```typescript
// Linia 3
const importPlaces = ... // NIEUŻYWANE
```

**Rekomendacja:** Usuń nieużywaną funkcję

---

### App Routes

#### `src/app/account/chats/page.tsx`

```typescript
// Linia 1320
const ChatDetails = ... // NIEUŻYWANY KOMPONENT
```

**Rekomendacja:** Usuń nieużywany komponent lub użyj go

#### `src/app/account/intents/_components/managemen/panels/members/invite-users-modal.tsx`

```typescript
// Linia 93
const [limit, setLimit] = useState(...); // setLimit NIEUŻYWANE
```

**Rekomendacja:** Usuń setter lub użyj go

#### `src/app/account/intents/_components/my-intent-card.tsx`

```typescript
// Linia 4
import { Calendar } from 'lucide-react'; // NIEUŻYWANE
// Linia 13
import { Eye } from 'lucide-react'; // NIEUŻYWANE
// Linia 20
import { ListOrdered } from 'lucide-react'; // NIEUŻYWANE
```

**Rekomendacja:** Usuń nieużywane ikony

#### `src/app/account/plans-and-bills/_components/edit-card-modal.tsx`

```typescript
// Linia 4
import { ChevronDown } from 'lucide-react'; // NIEUŻYWANE
// Linia 6
import { Select } from '@/components/ui/select'; // NIEUŻYWANE
```

**Rekomendacja:** Usuń nieużywane importy

#### `src/app/account/plans-and-bills/page.tsx`

```typescript
// Wiele nieużywanych handlerów (linie 129-138):
const handleManageOpen = ...
const handleManageClose = ...
const handleAddOpen = ...
const handleAddClose = ...
const handleEditClose = ...
const handleConfirmDeleteClose = ...
const handleInvoiceViewClose = ...
```

**Rekomendacja:** Usuń nieużywane handlery lub podłącz do UI

#### `src/app/account/profile/_components/privacy-tab.tsx`

```typescript
// Linia 77
const { errors } = useFormContext(); // NIEUŻYWANE
```

**Rekomendacja:** Usuń lub użyj do walidacji

#### `src/app/admin/comments/page.tsx`

```typescript
// Linia 7
import { Search } from 'lucide-react'; // NIEUŻYWANE
// Linia 10
const [search, setSearch] = useState(''); // NIEUŻYWANE
```

**Rekomendacja:** Usuń nieużywane importy i state

#### `src/app/admin/intents/_components/intent-detail-modal.tsx`

```typescript
// Linia 12
import { Star } from 'lucide-react'; // NIEUŻYWANE
```

**Rekomendacja:** Usuń nieużywaną ikonę

#### `src/app/admin/intents/_components/tabs/settings-tab.tsx`

```typescript
// Linia 6
import { useAdminChangeIntentOwnerMutation } from ... // NIEUŻYWANE
// Linia 8
import { UserCog } from 'lucide-react'; // NIEUŻYWANE
```

**Rekomendacja:** Usuń nieużywane importy

#### `src/app/admin/notifications/page.tsx`

```typescript
// Linia 12
import { Role } from '@prisma/client'; // NIEUŻYWANE
// Linia 23
const { isLoadingUsers } = ... // NIEUŻYWANE
```

**Rekomendacja:** Usuń nieużywane importy i zmienne

#### `src/app/admin/users/_components/tabs/notifications-tab.tsx`

```typescript
// Linia 24
const { kind } = notification; // NIEUŻYWANE
```

**Rekomendacja:** Usuń nieużywaną zmienną

#### `src/app/api/vitals/route.ts`

```typescript
// Linia 24
const shouldSample = ... // NIEUŻYWANE
```

**Rekomendacja:** Usuń lub użyj do sample rate

#### `src/app/u/[name]/_components/reviews-tab.tsx`

```typescript
// Linia 4
import { ChevronRight } from 'lucide-react'; // NIEUŻYWANE
```

**Rekomendacja:** Usuń nieużywaną ikonę

#### `src/app/u/[name]/_components/stats-tab.tsx`

```typescript
// Linia 5
import { TrendingUp } from 'lucide-react'; // NIEUŻYWANE
// Linia 9
import { Sparkles } from 'lucide-react'; // NIEUŻYWANE
```

**Rekomendacja:** Usuń nieużywane ikony

---

## 🟡 Potencjalnie nieużywane komponenty

### Komponenty do weryfikacji ręcznej

Następujące komponenty mogą być nieużywane (wymagają sprawdzenia importów):

#### Components

- `src/components/chat/DeleteConfirmModal.tsx`
- `src/components/chat/EditMessageModal.tsx`
- `src/components/chat/MessageActions.tsx`
- `src/components/chat/MessageMenuPopover.tsx`
- `src/components/chat/MessageReactions.tsx`
- `src/components/chat/ReactionsBar.tsx`
- `src/components/chat/ReadReceipt.tsx`
- `src/components/feedback/notice-modal.tsx`
- `src/components/ui/click-burst.tsx`
- `src/components/ui/click-particle.tsx`
- `src/components/ui/cooldown-ring.tsx`

#### Features

- `src/features/intents/components/suggestion-card.tsx` (ma błędy importu)
- `src/features/intents/components/event-countdown-pill.tsx`

---

## 📋 Plan działania

### Priorytet 1: Błędy TypeScript (natychmiastowe)

1. ✅ Napraw `join-request-modal.tsx` - usuń nieistniejący import `IntentJoinQuestion`
2. ✅ Napraw `suggestion-card.tsx` - usuń nieistniejący import `IntentSuggestion`
3. ✅ Napraw `select.tsx` - zwróć wartość we wszystkich ścieżkach

### Priorytet 2: Nieużywane importy (szybkie)

1. Usuń wszystkie nieużywane ikony z `lucide-react` (15 plików)
2. Usuń nieużywane importy komponentów (8 plików)

### Priorytet 3: Nieużywane zmienne (średnie)

1. Usuń nieużywane state variables (12 plików)
2. Usuń nieużywane handlery (5 plików)
3. Usuń nieużywane destructured values (8 plików)

### Priorytet 4: Nieużywane komponenty (weryfikacja)

1. Sprawdź czy komponenty chat są używane
2. Sprawdź czy komponenty UI są używane
3. Usuń potwierdzone nieużywane komponenty

---

## 🛠️ Komendy pomocnicze

### Znajdź wszystkie nieużywane zmienne

```bash
npx tsc --noEmit 2>&1 | grep "is declared but its value is never read"
```

### Znajdź nieużywane importy

```bash
npx tsc --noEmit 2>&1 | grep "is declared but its value is never read" | grep "import"
```

### Znajdź pliki bez importów (potencjalnie nieużywane)

```bash
# Wymaga dodatkowego narzędzia jak ts-unused-exports
npx ts-unused-exports tsconfig.json
```

---

## 📈 Metryki

- **Oszczędność rozmiaru bundle:** ~5-10KB (po usunięciu nieużywanych importów)
- **Poprawa czasu kompilacji:** ~2-3%
- **Poprawa czytelności:** Znacząca

---

## ⚠️ Uwagi

1. **Nie usuwaj automatycznie** - niektóre "nieużywane" elementy mogą być używane dynamicznie
2. **Sprawdź testy** - przed usunięciem sprawdź czy nie są używane w testach
3. **Sprawdź dokumentację** - niektóre komponenty mogą być przykładami
4. **Git blame** - sprawdź historię przed usunięciem

---

**Wygenerowano przez:** TypeScript Compiler + Custom Analysis  
**Projekt:** Miglee Web Application
