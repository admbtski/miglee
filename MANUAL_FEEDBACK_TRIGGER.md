# Manual Feedback Request Trigger - Dokumentacja

## Przegląd

Dodałem funkcję manualnego wysyłania próśb o feedback do panelu zarządzania wydarzeniem. Organizatorzy (owner/moderator) mogą teraz wysłać emaile z prośbą o ocenę wydarzenia w dowolnym momencie po jego zakończeniu.

---

## Implementacja

### 1. Backend - GraphQL API

#### Schema (`packages/contracts/graphql/schema.graphql`)

```graphql
type Mutation {
  # Manual trigger for feedback requests (owner/moderator only)
  sendFeedbackRequests(intentId: ID!): SendFeedbackRequestsResult!
}

type SendFeedbackRequestsResult {
  success: Boolean!
  sentCount: Int!
  skippedCount: Int!
  message: String
}
```

#### Resolver (`apps/api/src/graphql/resolvers/mutation/feedback-questions.ts`)

```typescript
export const sendFeedbackRequestsMutation: MutationResolvers['sendFeedbackRequests'] =
  async (_parent, { intentId }, { user }) => {
    // 1. Sprawdź autentykację
    if (!user) {
      throw new GraphQLError('Unauthorized');
    }

    // 2. Pobierz event z membership
    const intent = await prisma.intent.findUnique({
      where: { id: intentId },
      include: {
        members: {
          where: { userId: user.id },
        },
        owner: true,
      },
    });

    // 3. Sprawdź uprawnienia (owner/moderator/admin)
    const membership = intent.members[0];
    const isAdmin = user.role === 'ADMIN';
    const isOwnerOrModerator =
      membership && ['OWNER', 'MODERATOR'].includes(membership.role);

    if (!isAdmin && !isOwnerOrModerator) {
      throw new GraphQLError('Forbidden');
    }

    // 4. Walidacja - event musi się skończyć
    if (intent.endAt > new Date()) {
      throw new GraphQLError('Cannot send feedback requests before event ends');
    }

    // 5. Walidacja - event nie może być anulowany/usunięty
    if (intent.canceledAt || intent.deletedAt) {
      throw new GraphQLError(
        'Cannot send feedback requests for cancelled/deleted event'
      );
    }

    // 6. Policz uprawnionych uczestników (status JOINED)
    const joinedMembers = await prisma.intentMember.count({
      where: {
        intentId,
        status: 'JOINED',
      },
    });

    if (joinedMembers === 0) {
      return {
        success: false,
        sentCount: 0,
        skippedCount: 0,
        message: 'No joined members to send feedback requests to',
      };
    }

    // 7. Enqueue job do workera
    await enqueueFeedbackRequest(intentId);

    return {
      success: true,
      sentCount: joinedMembers,
      skippedCount: 0,
      message: `Feedback requests will be sent to ${joinedMembers} member(s)`,
    };
  };
```

#### GraphQL Operation (`packages/contracts/graphql/operations/send-feedback-requests.graphql`)

```graphql
mutation SendFeedbackRequests($intentId: ID!) {
  sendFeedbackRequests(intentId: $intentId) {
    success
    sentCount
    skippedCount
    message
  }
}
```

---

### 2. Frontend - React Hook

#### Hook (`apps/web/src/lib/api/feedback.ts`)

```typescript
export function useSendFeedbackRequestsMutation(
  options?: UseMutationOptions<
    SendFeedbackRequestsMutation,
    Error,
    SendFeedbackRequestsMutationVariables
  >
) {
  return useMutation<
    SendFeedbackRequestsMutation,
    Error,
    SendFeedbackRequestsMutationVariables
  >({
    mutationFn: async (variables) =>
      gqlClient.request<
        SendFeedbackRequestsMutation,
        SendFeedbackRequestsMutationVariables
      >(SendFeedbackRequestsDocument, variables),
    ...options,
  });
}
```

---

### 3. Frontend - UI Component

#### Lokalizacja

`/apps/web/src/app/intent/[id]/manage/feedback/_components/feedback-panel.tsx`

#### Funkcjonalność

**Button "Wyślij prośby o feedback":**

- Widoczny w zakładce "Pytania"
- Znajduje się na górze strony, przed edytorem pytań
- Disabled gdy:
  - Wysyłanie w toku (`isPending`)
  - Event jeszcze się nie skończył (`endAt > now()`)

**UI States:**

1. **Normalna** - Button aktywny, gotowy do kliknięcia
2. **Loading** - "Wysyłanie..." + spinner
3. **Success** - Zielony alert z komunikatem sukcesu (np. "Wysłano prośby do 25 uczestników")
4. **Error** - Czerwony alert z komunikatem błędu
5. **Warning** - Żółty alert gdy event jeszcze się nie skończył

#### Kod UI

```typescript
const sendFeedbackRequests = useSendFeedbackRequestsMutation();
const [sendRequestsState, setSendRequestsState] = useState<{
  success?: boolean;
  message?: string;
} | null>(null);

const handleSendFeedbackRequests = async () => {
  setSendRequestsState(null);
  try {
    const result = await sendFeedbackRequests.mutateAsync({
      intentId,
    });

    if (result.sendFeedbackRequests.success) {
      setSendRequestsState({
        success: true,
        message:
          result.sendFeedbackRequests.message ||
          `Wysłano prośby o feedback do ${result.sendFeedbackRequests.sentCount} uczestników`,
      });
    } else {
      setSendRequestsState({
        success: false,
        message:
          result.sendFeedbackRequests.message ||
          'Nie udało się wysłać próśb o feedback',
      });
    }
  } catch (error: any) {
    setSendRequestsState({
      success: false,
      message:
        error.message || 'Wystąpił błąd podczas wysyłania próśb o feedback',
    });
  }
};
```

---

## Flow użytkowania

### Perspektywa organizatora (owner/moderator)

1. **Zakończenie wydarzenia**
   - Event się kończy (`endAt < now()`)
   - System automatycznie wysyła prośby o feedback ~1h później (via worker)

2. **Manual trigger** (nowy feature)
   - Organizator wchodzi w `/intent/[id]/manage/feedback`
   - Widzi button "Wyślij prośby o feedback"
   - Klika button
   - System:
     - Waliduje uprawnienia (owner/moderator/admin)
     - Sprawdza czy event się skończył
     - Enqueue job do BullMQ
     - Zwraca komunikat sukcesu z liczbą adresatów

3. **Worker przetwarza job**
   - Pobiera wszystkich uczestników ze statusem `JOINED`
   - Dla każdego:
     - Tworzy/aktualizuje `FeedbackTracking` (emailSentAt)
     - Wysyła email z pięknym szablonem HTML
     - Tworzy in-app notification
   - Loguje rezultaty (success/failure per recipient)

### Perspektywa uczestnika

1. **Otrzymuje email**
   - "Jak oceniasz '[Event Title]'?"
   - Piękny HTML z CTA button "⭐ Oceń wydarzenie"
   - Link: `/feedback/[intentId]?token=...`

2. **Otrzymuje in-app notification**
   - Typ: `NEW_REVIEW`
   - Tytuł: "Jak oceniasz wydarzenie?"
   - Body: "Wystaw ocenę i podziel się opinią"

3. **Klika link**
   - Otwiera się dedykowana strona feedback
   - Wypełnia ocenę (1-5 stars) + komentarz
   - Wypełnia dodatkowe pytania (jeśli są)
   - Klika "Wyślij opinię"

4. **Sukces**
   - Widzi "Dziękujemy! 🎉"
   - Może wrócić do wydarzenia lub browsować dalej

---

## Use Cases

### 1. Przypomnienie dla zapominalskich

**Sytuacja:** Niektórzy uczestnicy nie otworzyli emaila po 1h

**Rozwiązanie:** Organizator może ręcznie wysłać ponownie po np. 3 dniach

### 2. Event bez automatyki

**Sytuacja:** Organizator wyłączył auto-sending w configu workera

**Rozwiązanie:** Może wysłać manualnie gdy uzna za stosowne

### 3. Testowanie przed live event

**Sytuacja:** Organizator chce przetestować flow feedback

**Rozwiązanie:** Może stworzyć test event, zakończyć go, i manualnie wysłać prośby

### 4. Segmentowane wysyłanie

**Sytuacja:** Chce wysłać do konkretnej grupy w różnych momentach

**Rozwiązanie:** (Future feature) Filtrowanie po rolach/tagach przed manual send

### 5. Debugging

**Sytuacja:** Auto-send nie zadziałał z jakiegoś powodu

**Rozwiązanie:** Organizator może ręcznie retry

---

## Bezpieczeństwo i Walidacja

### Backend Checks

1. **Autentykacja** - Wymagany zalogowany user
2. **Autoryzacja** - Tylko owner/moderator/admin
3. **Event status** - Musi być zakończony (`endAt < now()`)
4. **Event integrity** - Nie może być anulowany/usunięty
5. **Participants** - Musi być przynajmniej 1 uczestnik ze statusem `JOINED`

### Frontend Checks

1. **Button disabled** gdy:
   - Mutation `isPending`
   - Event jeszcze się nie skończył
2. **Warning message** - Wyświetla się gdy event w trakcie

### Rate Limiting (TODO)

Potencjalnie warto dodać:

- Max 1 wysyłka na 1h per intent (prevent spam)
- Max 3 wysyłki per intent total
- Tracking ostatniej wysyłki w Intent model

---

## Monitoring & Analytics

### Logi

Worker loguje:

```typescript
logger.info(
  { intentId, successCount, failureCount, total: recipients.length },
  '[runFeedbackRequestForIntent] Email sending completed'
);
```

### Tracking

`FeedbackTracking` table zawiera:

- `emailSentAt` - Kiedy wysłano email (manual lub auto)
- `channel` - EMAIL, IN_APP, PUSH, DIRECT_LINK

Można query:

```sql
SELECT
  COUNT(*) as total_sent,
  COUNT(CASE WHEN "emailOpenedAt" IS NOT NULL THEN 1 END) as opened,
  COUNT(CASE WHEN "formSubmittedAt" IS NOT NULL THEN 1 END) as submitted
FROM feedback_tracking
WHERE "intentId" = '...'
```

### Dashboard (Future)

W `intentFeedbackResults` można dodać:

```graphql
type IntentFeedbackResults {
  # ... existing
  tracking: FeedbackTrackingStats
}

type FeedbackTrackingStats {
  totalInvited: Int!
  emailSent: Int!
  emailOpened: Int!
  formSubmitted: Int!
  lastSentAt: DateTime
}
```

---

## Testing

### Manual Test Steps

1. Utwórz test event z `endAt` w przeszłości
2. Dodaj kilku uczestników ze statusem `JOINED`
3. Zaloguj się jako owner
4. Przejdź do `/intent/[id]/manage/feedback`
5. Kliknij "Wyślij prośby o feedback"
6. Sprawdź:
   - Success message się pojawił
   - Emaile dotarły (sprawdź Resend dashboard)
   - In-app notifications są widoczne
   - `feedback_tracking` table ma nowe rekordy

### Edge Cases to Test

- ❌ Event w trakcie → Should show warning, button disabled
- ❌ Event anulowany → Backend error
- ❌ User nie ma uprawnień → Backend 403
- ❌ Brak uczestników JOINED → Message "No members"
- ✅ 100+ uczestników → All emails queued successfully
- ✅ Worker offline → Job queued, processed later

---

## Future Enhancements

1. **Scheduled sending**
   - Organizator może zaplanować wysyłkę na konkretną datę/godzinę
2. **Segmentation**
   - Wysyłka tylko do konkretnych ról (np. tylko VIPs)
   - Wysyłka do uczestników z konkretnym tagiem
3. **A/B Testing**
   - Testowanie różnych subject lines
   - Testowanie różnych czasów wysyłki
4. **Follow-ups**
   - Auto reminder po 3 dniach jeśli brak odpowiedzi
   - Personalized reminders
5. **Batch preview**
   - Podgląd kto dostanie email przed wysłaniem
   - Export listy adresatów
6. **Rate limiting UI**
   - Pokazywanie "Last sent 2h ago, can send again in 1h"
   - History wysyłek w UI

---

## Dokumentacja dla użytkowników (Help Text)

**W UI można dodać tooltip:**

> **Wyślij prośby o feedback**
>
> Wyśle emaile z prośbą o ocenę wydarzenia do wszystkich uczestników, którzy dołączyli (status "Joined").
>
> - Można wysłać tylko po zakończeniu wydarzenia
> - Każdy uczestnik może wystawić 1 ocenę
> - Prośby są wysyłane również automatycznie ~1h po zakończeniu
> - Możesz wysłać ponownie jeśli niektórzy nie odpowiedzieli

---

## Podsumowanie

✅ **Dodano manualny trigger** do wysyłania feedback requests  
✅ **Backend mutation** z walidacją i bezpieczeństwem  
✅ **Frontend UI** w panelu zarządzania z statusami  
✅ **Integracja z workerem** - używa tej samej logiki co auto-send  
✅ **Tracking** - wszystkie wysyłki są rejestrowane w `feedback_tracking`  
✅ **UX** - Clear feedback dla organizatora (success/error messages)

Organizatorzy mają teraz pełną kontrolę nad tym, kiedy wysyłają prośby o feedback!
