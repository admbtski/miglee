# Funkcjonalność Zgłaszania Wydarzeń - Dokumentacja

## ✅ Zrealizowane

Dodano kompletną funkcjonalność zgłaszania wydarzeń z interfejsem użytkownika i integracją z API.

## 📦 Komponenty

### 1. **ReportIntentModal** (NOWY)

**Lokalizacja:** `apps/web/src/app/intent/[id]/_components/report-intent-modal.tsx`

Modal do zgłaszania wydarzeń z następującymi funkcjami:

#### Funkcjonalność:

- ✅ 8 predefiniowanych powodów zgłoszenia
- ✅ Możliwość dodania własnego opisu (dla opcji "Inne")
- ✅ Walidacja długości opisu (max 1000 znaków)
- ✅ Obsługa błędów (np. duplikat zgłoszenia)
- ✅ Modal sukcesu po wysłaniu zgłoszenia
- ✅ Modal błędu w przypadku problemów
- ✅ Ostrzeżenie o konsekwencjach fałszywych zgłoszeń

#### Predefiniowane powody:

1. **Spam lub treści reklamowe** - niechciana reklama
2. **Treści nieodpowiednie lub obraźliwe** - wulgaryzmy, obelgi
3. **Wprowadzające w błąd informacje** - fake news, oszukańcze dane
4. **Oszustwo lub próba wyłudzenia** - phishing, scam
5. **Przemoc lub nienawiść** - mowa nienawiści, groźby
6. **Nielegalna działalność** - łamanie prawa
7. **Naruszenie praw autorskich** - kradzież treści
8. **Inne** - z możliwością własnego opisu

### 2. **useCreateReportMutation** (NOWY)

**Lokalizacja:** `apps/web/src/lib/api/reports.ts`

Hook React Query do tworzenia zgłoszeń:

```typescript
const { mutateAsync: createReport } = useCreateReportMutation();

await createReport({
  input: {
    entity: 'INTENT',
    entityId: intentId,
    reason: 'Spam lub treści reklamowe',
  },
});
```

### 3. **EventActions** (ZMODYFIKOWANY)

**Lokalizacja:** `apps/web/src/app/intent/[id]/_components/event-actions.tsx`

Zaktualizowano komponent akcji:

- ✅ Usunięto atrybut `disabled` z przycisku "Zgłoś"
- ✅ Dodano obsługę kliknięcia - otwiera modal zgłaszania
- ✅ Dodano stan `reportOpen` do zarządzania modelem
- ✅ Dodano renderowanie `ReportIntentModal`

## 🔄 Przepływ użytkownika

```
1. Użytkownik klika "Zgłoś" w sekcji Akcje
   ↓
2. Otwiera się modal "Zgłoś wydarzenie"
   ↓
3. Użytkownik wybiera powód z listy
   ↓
4. (Opcjonalnie) Jeśli wybrano "Inne", wpisuje własny opis
   ↓
5. Klika "Wyślij zgłoszenie"
   ↓
6. System sprawdza:
   - Czy użytkownik jest zalogowany
   - Czy wydarzenie istnieje
   - Czy użytkownik nie zgłosił już tego wydarzenia
   ↓
7a. Sukces:
    - Modal się zamyka
    - Pojawia się modal sukcesu
    - Zgłoszenie trafia do bazy danych ze statusem OPEN
    ↓
7b. Błąd:
    - Modal się zamyka
    - Pojawia się modal błędu z opisem problemu
```

## 🎨 UI/UX

### Modal zgłaszania

```
╔═══════════════════════════════════════════════════╗
║  🚩  Zgłoś wydarzenie                             ║
║      Nazwa wydarzenia                             ║
╠═══════════════════════════════════════════════════╣
║                                                   ║
║  Jeśli to wydarzenie narusza regulamin...        ║
║                                                   ║
║  Powód zgłoszenia *                              ║
║  ○ Spam lub treści reklamowe                     ║
║  ○ Treści nieodpowiednie lub obraźliwe          ║
║  ○ Wprowadzające w błąd informacje              ║
║  ○ Oszustwo lub próba wyłudzenia                ║
║  ○ Przemoc lub nienawiść                         ║
║  ○ Nielegalna działalność                        ║
║  ○ Naruszenie praw autorskich                    ║
║  ● Inne                                          ║
║                                                   ║
║  Opisz problem *                                 ║
║  ┌─────────────────────────────────────────────┐ ║
║  │ Opisz szczegółowo...                        │ ║
║  │                                             │ ║
║  │                                             │ ║
║  └─────────────────────────────────────────────┘ ║
║  0/1000 znaków                                   ║
║                                                   ║
║  ⚠️ Uwaga: Fałszywe zgłoszenia mogą skutkować   ║
║     zablokowaniem Twojego konta.                 ║
║                                                   ║
╠═══════════════════════════════════════════════════╣
║                    [Anuluj] [Wyślij zgłoszenie] ║
╚═══════════════════════════════════════════════════╝
```

### Modal sukcesu

```
╔═══════════════════════════════════════════════════╗
║  ✅  Zgłoszenie wysłane                           ║
║                                                   ║
║  Dziękujemy za zgłoszenie. Nasz zespół sprawdzi  ║
║  je w ciągu 24-48 godzin.                        ║
║                                                   ║
║                              [OK]                 ║
╚═══════════════════════════════════════════════════╝
```

## 🔐 Bezpieczeństwo

### Frontend

- ✅ Walidacja wybranego powodu przed wysłaniem
- ✅ Walidacja długości własnego opisu (1-1000 znaków)
- ✅ Wyłączenie przycisków podczas wysyłania
- ✅ Ostrzeżenie o konsekwencjach fałszywych zgłoszeń

### Backend (GraphQL)

- ✅ Wymagane uwierzytelnienie (tylko zalogowani użytkownicy)
- ✅ Sprawdzenie czy wydarzenie istnieje
- ✅ Sprawdzenie czy nie jest usunięte
- ✅ Blokada duplikatów (jeden użytkownik może zgłosić dane wydarzenie tylko raz)
- ✅ Walidacja długości powodu (1-1000 znaków)
- ✅ Automatyczny status OPEN dla nowych zgłoszeń

### Ochrona przed spamem

```typescript
// Backend sprawdza czy użytkownik już zgłosił to wydarzenie
const existing = await prisma.report.findFirst({
  where: {
    reporterId: user.id,
    entity: 'INTENT',
    entityId,
    status: { in: ['OPEN', 'INVESTIGATING'] },
  },
});

if (existing) {
  throw new GraphQLError('You have already reported this content.');
}
```

## 📊 Model danych

### Report (Prisma Schema)

```prisma
model Report {
  id          String       @id @default(cuid())
  reporterId  String
  entity      ReportEntity
  entityId    String
  reason      String       @db.Text
  status      ReportStatus @default(OPEN)
  createdAt   DateTime     @default(now())
  resolvedAt  DateTime?

  reporter    User         @relation(...)
}

enum ReportEntity {
  INTENT
  COMMENT
  REVIEW
  USER
  MESSAGE
}

enum ReportStatus {
  OPEN
  INVESTIGATING
  RESOLVED
  DISMISSED
}
```

### GraphQL Types

```graphql
type Report {
  id: ID!
  reporterId: ID!
  entity: ReportEntity!
  entityId: ID!
  reason: String!
  status: ReportStatus!
  createdAt: DateTime!
  resolvedAt: DateTime
  reporter: User!
}

input CreateReportInput {
  entity: ReportEntity!
  entityId: ID!
  reason: String!
}
```

## 🔧 API

### Mutation: createReport

```graphql
mutation CreateReport($input: CreateReportInput!) {
  createReport(input: $input) {
    id
    reporterId
    entity
    entityId
    reason
    status
    createdAt
    reporter {
      id
      name
      email
    }
  }
}
```

### Przykład użycia

```typescript
const { mutateAsync: createReport } = useCreateReportMutation();

try {
  await createReport({
    input: {
      entity: 'INTENT',
      entityId: 'intent_123',
      reason: 'Spam lub treści reklamowe',
    },
  });
  // Sukces
} catch (error) {
  // Obsługa błędu
}
```

## 🎯 Obsługa błędów

### Możliwe błędy:

1. **UNAUTHENTICATED** - użytkownik niezalogowany

   ```
   "Authentication required."
   ```

2. **BAD_USER_INPUT** - pusty powód

   ```
   "Report reason cannot be empty."
   ```

3. **BAD_USER_INPUT** - za długi powód

   ```
   "Report reason too long (max 1000 characters)."
   ```

4. **NOT_FOUND** - wydarzenie nie istnieje

   ```
   "Reported entity not found."
   ```

5. **FAILED_PRECONDITION** - duplikat zgłoszenia
   ```
   "You have already reported this content."
   ```

### Obsługa w UI:

```typescript
try {
  await createReport({ input });
  setSuccessOpen(true);
} catch (error: any) {
  setErrorMessage(
    error?.response?.errors?.[0]?.message ||
      'Nie udało się wysłać zgłoszenia. Spróbuj ponownie.'
  );
  setErrorOpen(true);
}
```

## 📱 Responsywność

Modal działa na wszystkich urządzeniach:

- **Desktop**: Wyśrodkowany modal, szerokość max 500px
- **Tablet**: Dostosowana szerokość
- **Mobile**: Pełna szerokość z paddingiem

## 🌐 Lokalizacja

Wszystkie teksty w języku polskim:

- Tytuły modali
- Etykiety przycisków
- Powody zgłoszenia
- Komunikaty sukcesu/błędu
- Ostrzeżenia

## 🧪 Testowanie

### Scenariusze testowe:

#### 1. Pomyślne zgłoszenie

```
✓ Użytkownik zalogowany
✓ Wybiera powód "Spam"
✓ Klika "Wyślij zgłoszenie"
✓ Zgłoszenie zostaje utworzone
✓ Modal sukcesu się pojawia
```

#### 2. Zgłoszenie z własnym opisem

```
✓ Użytkownik zalogowany
✓ Wybiera "Inne"
✓ Wpisuje własny opis (min 1 znak)
✓ Klika "Wyślij zgłoszenie"
✓ Zgłoszenie zostaje utworzone z własnym opisem
```

#### 3. Duplikat zgłoszenia

```
✓ Użytkownik już zgłosił to wydarzenie
✓ Próbuje zgłosić ponownie
✗ Backend zwraca błąd "Already reported"
✓ Modal błędu z odpowiednim komunikatem
```

#### 4. Niezalogowany użytkownik

```
✗ Użytkownik niezalogowany
✗ Backend zwraca błąd "Authentication required"
✓ Modal błędu z komunikatem
```

#### 5. Walidacja formularza

```
✓ Przycisk "Wyślij" disabled gdy:
  - Nie wybrano powodu
  - Wybrano "Inne" ale nie wpisano opisu
✓ Licznik znaków dla własnego opisu
✓ Max 1000 znaków
```

## 📁 Pliki

### Utworzone:

- ✅ `apps/web/src/lib/api/reports.ts` - hook do API
- ✅ `apps/web/src/app/intent/[id]/_components/report-intent-modal.tsx` - modal zgłaszania
- ✅ `REPORT_FEATURE_IMPLEMENTATION.md` - dokumentacja

### Zmodyfikowane:

- ✅ `apps/web/src/app/intent/[id]/_components/event-actions.tsx` - integracja przycisku

## 🚀 Gotowe do użycia

Funkcjonalność jest w pełni zaimplementowana i gotowa do użycia:

- ✅ Brak błędów TypeScript
- ✅ Brak błędów ESLint
- ✅ Pełna integracja z API
- ✅ Obsługa błędów
- ✅ Responsywny design
- ✅ Dark mode support

## 🔮 Przyszłe rozszerzenia

Możliwe ulepszenia:

1. **Historia zgłoszeń** - panel dla użytkownika z jego zgłoszeniami
2. **Panel moderatora** - zarządzanie zgłoszeniami (już istnieje w API)
3. **Powiadomienia** - informowanie o statusie zgłoszenia
4. **Kategorie zgłoszeń** - bardziej szczegółowe powody
5. **Załączniki** - możliwość dodania screenshotów
6. **Priorytet** - oznaczanie pilnych zgłoszeń

## 📞 Dla moderatorów

### Panel administracyjny (do zaimplementowania)

Moderatorzy mogą zarządzać zgłoszeniami przez API:

```graphql
# Pobierz zgłoszenia (admin only)
query GetReports {
  reports(limit: 50, status: OPEN) {
    items {
      id
      reason
      entity
      entityId
      status
      createdAt
      reporter {
        name
        email
      }
    }
  }
}

# Zaktualizuj status (admin only)
mutation UpdateReportStatus($id: ID!, $input: UpdateReportStatusInput!) {
  updateReportStatus(id: $id, input: $input) {
    id
    status
    resolvedAt
  }
}
```

### Dostępne statusy:

- **OPEN** - nowe zgłoszenie
- **INVESTIGATING** - w trakcie sprawdzania
- **RESOLVED** - rozwiązane (podjęto akcję)
- **DISMISSED** - odrzucone (brak podstaw)

## 💡 Wskazówki dla użytkowników

### Kiedy zgłaszać?

✅ **Zgłaszaj:**

- Spam i niechciane reklamy
- Treści obraźliwe lub wulgarne
- Oszustwa i próby wyłudzenia
- Nielegalne działania
- Naruszenia praw autorskich

❌ **Nie zgłaszaj:**

- Wydarzeń, które po prostu Ci się nie podobają
- Wydarzeń konkurencji
- Wydarzeń z błędami (skontaktuj się z organizatorem)

### Co się dzieje po zgłoszeniu?

1. Zgłoszenie trafia do kolejki moderacji
2. Moderator sprawdza zgłoszenie w ciągu 24-48h
3. Jeśli zgłoszenie jest zasadne, podejmowana jest akcja:
   - Ostrzeżenie organizatora
   - Usunięcie wydarzenia
   - Zablokowanie użytkownika
4. Zgłaszający może otrzymać powiadomienie o wyniku

### Konsekwencje fałszywych zgłoszeń:

⚠️ Wielokrotne fałszywe zgłoszenia mogą skutkować:

- Ostrzeżeniem
- Tymczasowym zawieszeniem konta
- Trwałym zablokowaniem konta
