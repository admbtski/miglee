# Tracking Konwersji Feedback - Dokumentacja

## 1. Co to jest tracking konwersji feedback?

**Tracking konwersji feedback** to system śledzenia i analizowania, jak użytkownicy reagują na prośbę o feedback po zakończeniu wydarzenia. Pozwala to mierzyć skuteczność systemu feedback i optymalizować go.

## 2. Kluczowe metryki do śledzenia

### 2.1. Podstawowe metryki konwersji

- **Invite Rate** - Ile osób otrzymało prośbę o feedback
- **View Rate** - Ile osób otworzyło stronę feedback
- **Start Rate** - Ile osób zaczęło wypełniać formularz
- **Completion Rate** - Ile osób wysłało kompletny feedback
- **Drop-off Rate** - Gdzie użytkownicy porzucają formularz

### 2.2. Metryki czasowe

- **Time to First Interaction** - Jak szybko po wysłaniu emaila użytkownik reaguje
- **Time to Completion** - Ile czasu zajmuje wypełnienie formularza
- **Best Time to Send** - Optymalny czas wysyłki emaili (godzina dnia, dzień tygodnia)

### 2.3. Metryki jakościowe

- **Average Rating** - Średnia ocena wydarzeń
- **Comment Rate** - Ile osób dodaje komentarze (nie tylko ocenę)
- **Question Response Rate** - Które pytania są najczęściej wypełniane

### 2.4. Metryki business

- **Feedback ROI** - Wartość feedback vs koszt pozyskania
- **NPS (Net Promoter Score)** - Jeśli dodasz pytanie "Czy polecisz to wydarzenie?"
- **Sentiment Analysis** - Analiza sentymentu komentarzy (pozytywne/negatywne)

## 3. Implementacja trackingu

### 3.1. Model danych (Prisma Schema)

```prisma
// Nowa tabela do trackingu
model FeedbackTracking {
  id        String   @id @default(cuid())
  intentId  String
  userId    String

  // Etapy konwersji
  emailSentAt      DateTime?
  emailOpenedAt    DateTime?   // via tracking pixel lub unique link
  pageViewedAt     DateTime?   // gdy użytkownik otwiera stronę
  formStartedAt    DateTime?   // gdy użytkownik zaczyna wypełniać
  formSubmittedAt  DateTime?   // gdy użytkownik wysyła

  // Kanał
  channel          FeedbackChannel @default(EMAIL)  // EMAIL, IN_APP, PUSH

  // Dodatkowe dane
  metadata         Json?  // np. device, browser, referrer

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  intent Intent @relation(fields: [intentId], references: [id], onDelete: Cascade)
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([intentId, userId])
  @@index([intentId])
  @@index([userId])
  @@index([emailSentAt])
  @@map("feedback_tracking")
}

enum FeedbackChannel {
  EMAIL
  IN_APP
  PUSH
  DIRECT_LINK
}
```

### 3.2. Tracking w kodzie

#### A. Tracking wysyłki emaila

```typescript
// W runFeedbackRequestForIntent.ts (już mamy)
await prisma.feedbackTracking.upsert({
  where: {
    intentId_userId: {
      intentId: intent.id,
      userId: member.userId,
    },
  },
  update: {
    emailSentAt: new Date(),
    channel: 'EMAIL',
  },
  create: {
    intentId: intent.id,
    userId: member.userId,
    emailSentAt: new Date(),
    channel: 'EMAIL',
  },
});
```

#### B. Tracking otwarcia emaila (tracking pixel)

Dodaj do emaila:

```html
<img
  src="{{APP_URL}}/api/track/email-open?trackingId={{trackingId}}"
  width="1"
  height="1"
  style="display:none"
/>
```

Endpoint:

```typescript
// apps/api/src/plugins/tracking.ts
fastify.get('/api/track/email-open', async (request, reply) => {
  const { trackingId } = request.query;

  await prisma.feedbackTracking.updateMany({
    where: {
      id: trackingId,
      emailOpenedAt: null,
    },
    data: {
      emailOpenedAt: new Date(),
    },
  });

  // Return 1x1 transparent pixel
  const pixel = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    'base64'
  );
  reply.type('image/gif').send(pixel);
});
```

#### C. Tracking otwarcia strony

```typescript
// W FeedbackPageClient
useEffect(() => {
  // Track page view
  fetch('/api/track/feedback-view', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ intentId }),
  });
}, [intentId]);
```

Backend:

```typescript
// apps/api/src/graphql/resolvers/mutation/feedback-tracking.ts
export const trackFeedbackViewMutation = async (
  _parent,
  { intentId },
  { user }
) => {
  if (!user) return false;

  await prisma.feedbackTracking.updateMany({
    where: {
      intentId,
      userId: user.id,
      pageViewedAt: null,
    },
    data: {
      pageViewedAt: new Date(),
    },
  });

  return true;
};
```

#### D. Tracking rozpoczęcia formularza

```typescript
// W ReviewAndFeedbackForm
const [hasStarted, setHasStarted] = useState(false);

const handleFormInteraction = () => {
  if (!hasStarted) {
    setHasStarted(true);
    fetch('/api/track/feedback-start', {
      method: 'POST',
      body: JSON.stringify({ intentId }),
    });
  }
};

// Na pierwszym focus/change
<Textarea
  onFocus={handleFormInteraction}
  // ...
/>
```

#### E. Tracking submitu (już mamy)

```typescript
// W submitReviewAndFeedbackMutation
await prisma.feedbackTracking.updateMany({
  where: {
    intentId,
    userId: user.id,
    formSubmittedAt: null,
  },
  data: {
    formSubmittedAt: new Date(),
  },
});
```

### 3.3. Analiza danych (GraphQL Query)

```graphql
type FeedbackConversionStats {
  intentId: ID!
  totalInvited: Int!
  emailOpened: Int!
  pageViewed: Int!
  formStarted: Int!
  formSubmitted: Int!

  # Conversion rates (%)
  emailOpenRate: Float!
  pageViewRate: Float!
  startRate: Float!
  completionRate: Float!

  # Average times (seconds)
  avgTimeToView: Float
  avgTimeToStart: Float
  avgTimeToComplete: Float

  # Dropoff analysis
  dropoffAtEmailOpen: Int!
  dropoffAtPageView: Int!
  dropoffAtFormStart: Int!
}

type Query {
  feedbackConversionStats(intentId: ID!): FeedbackConversionStats!
  feedbackConversionStatsOverall: FeedbackConversionStats!
}
```

Implementacja:

```typescript
export const feedbackConversionStatsQuery = async (_parent, { intentId }) => {
  const tracking = await prisma.feedbackTracking.findMany({
    where: { intentId },
  });

  const totalInvited = tracking.length;
  const emailOpened = tracking.filter((t) => t.emailOpenedAt).length;
  const pageViewed = tracking.filter((t) => t.pageViewedAt).length;
  const formStarted = tracking.filter((t) => t.formStartedAt).length;
  const formSubmitted = tracking.filter((t) => t.formSubmittedAt).length;

  const emailOpenRate = (emailOpened / totalInvited) * 100;
  const pageViewRate = (pageViewed / totalInvited) * 100;
  const startRate = (formStarted / totalInvited) * 100;
  const completionRate = (formSubmitted / totalInvited) * 100;

  // Calculate average times
  const avgTimeToView =
    tracking
      .filter((t) => t.emailSentAt && t.pageViewedAt)
      .reduce((sum, t) => {
        const diff = t.pageViewedAt.getTime() - t.emailSentAt.getTime();
        return sum + diff / 1000; // seconds
      }, 0) / pageViewed || 0;

  // Similar for other times...

  return {
    intentId,
    totalInvited,
    emailOpened,
    pageViewed,
    formStarted,
    formSubmitted,
    emailOpenRate,
    pageViewRate,
    startRate,
    completionRate,
    avgTimeToView,
    // ...
  };
};
```

## 4. Dashboard wizualizacji

### 4.1. Funnel Chart (Lejek konwersji)

```typescript
// W feedback-panel.tsx - nowa zakładka "Analytics"
const FeedbackAnalytics = ({ intentId }) => {
  const { data: stats } = useFeedbackConversionStatsQuery({ intentId });

  return (
    <div className="space-y-6">
      <h3>Lejek konwersji feedback</h3>

      <div className="space-y-2">
        {[
          { label: 'Wysłane', value: stats.totalInvited, rate: 100 },
          { label: 'Otwarte', value: stats.emailOpened, rate: stats.emailOpenRate },
          { label: 'Odwiedzone', value: stats.pageViewed, rate: stats.pageViewRate },
          { label: 'Rozpoczęte', value: stats.formStarted, rate: stats.startRate },
          { label: 'Wysłane', value: stats.formSubmitted, rate: stats.completionRate },
        ].map((step, i) => (
          <div key={i} className="flex items-center gap-4">
            <div
              className="h-12 bg-indigo-500 rounded"
              style={{ width: `${step.rate}%` }}
            />
            <span>{step.label}: {step.value} ({step.rate.toFixed(1)}%)</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label="Średni czas do otwarcia"
          value={formatTime(stats.avgTimeToView)}
        />
        <StatCard
          label="Średni czas wypełnienia"
          value={formatTime(stats.avgTimeToComplete)}
        />
        <StatCard
          label="Overall Completion Rate"
          value={`${stats.completionRate.toFixed(1)}%`}
        />
      </div>
    </div>
  );
};
```

## 5. Optymalizacja na podstawie danych

### 5.1. A/B Testing

- **Subject line** - Testuj różne tematy emaili
- **Send time** - Testuj różne czasy wysyłki
- **Email design** - Testuj różne layouty emaili
- **CTA placement** - Testuj pozycję przycisków
- **Question order** - Testuj kolejność pytań

### 5.2. Automated Insights

```typescript
// Automatyczne sugestie na podstawie danych
const getInsights = (stats: FeedbackConversionStats) => {
  const insights = [];

  if (stats.emailOpenRate < 20) {
    insights.push({
      type: 'warning',
      message: 'Niska stopa otwarć emaili. Rozważ zmianę tematu wiadomości.',
      action: 'Testuj różne subject lines',
    });
  }

  if (stats.completionRate < 30) {
    insights.push({
      type: 'warning',
      message: 'Niski completion rate. Formularz może być za długi.',
      action: 'Ogranicz liczbę pytań lub ustaw niektóre jako opcjonalne',
    });
  }

  if (stats.avgTimeToComplete > 300) {
    // 5 min
    insights.push({
      type: 'info',
      message: 'Użytkownicy spędzają dużo czasu na formularzu.',
      action: 'To może oznaczać zaangażowanie lub trudności z wypełnieniem',
    });
  }

  return insights;
};
```

## 6. Integracje zewnętrzne

### 6.1. Google Analytics / Plausible

```typescript
// W FeedbackPageClient
useEffect(() => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'feedback_view', {
      event_category: 'feedback',
      event_label: intentId,
    });
  }
}, [intentId]);
```

### 6.2. Mixpanel / Amplitude

```typescript
import mixpanel from 'mixpanel-browser';

mixpanel.track('Feedback Form Viewed', {
  intentId,
  channel: 'email',
  hasQuestions: questions.length > 0,
});
```

## 7. Privacy & GDPR

- **Anonimizacja** - Po X dniach usuń szczegółowe tracking data
- **Consent** - Informuj użytkowników o trackingu
- **Opt-out** - Pozwól na wyłączenie trackingu
- **Data retention** - Określ, jak długo przechowujesz dane

```typescript
// Automatyczne czyszczenie starych danych
// Run as cron job
async function cleanupOldTracking() {
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  await prisma.feedbackTracking.deleteMany({
    where: {
      createdAt: {
        lt: threeMonthsAgo,
      },
    },
  });
}
```

## 8. Roadmap

1. **Phase 1 (MVP)** ✅
   - Track email sent
   - Track form submission
   - Basic stats

2. **Phase 2 (Current)**
   - Email open tracking (pixel)
   - Page view tracking
   - Form start tracking
   - Conversion funnel

3. **Phase 3 (Future)**
   - A/B testing framework
   - Automated insights
   - External analytics integrations
   - Sentiment analysis
   - Predictive analytics (who is likely to respond)

## 9. Przykładowe metryki benchmarkowe

Dla referencji, typowe wskaźniki w branży:

- **Email open rate**: 20-30%
- **Page view rate**: 10-20% (z wysłanych emaili)
- **Completion rate**: 5-15% (z wysłanych emaili)
- **Time to complete**: 2-5 minut

Jeśli Twoje metryki są poniżej tych wartości, warto zoptymalizować proces.

---

## Podsumowanie

**Tracking konwersji feedback** to kluczowy element optymalizacji systemu feedback. Pozwala:

1. **Zrozumieć**, gdzie użytkownicy porzucają proces
2. **Optymalizować** każdy etap lejka konwersji
3. **Testować** różne podejścia (A/B testing)
4. **Zwiększyć** liczbę odpowiedzi
5. **Poprawić** jakość danych feedback

Implementacja powinna być stopniowa - zacznij od podstawowego trackingu (email sent, form submitted), a potem dodawaj kolejne etapy.
