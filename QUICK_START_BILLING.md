# 🚀 Quick Start Guide - Billing System

## ✅ System Gotowy!

Cały system billingowy jest w pełni zaimplementowany i gotowy do użycia:

- ✅ Backend API (GraphQL resolvers + serwisy)
- ✅ Webhook handler (Stripe)
- ✅ Frontend hooks (React Query)
- ✅ Frontend UI (bez mocków, tylko prawdziwe dane z API)
- ✅ Seed data (4 użytkowników z aktywnymi planami)
- ✅ Produkty Stripe skonfigurowane (ceny w PLN)

## 🆔 Testowi użytkownicy z aktywnymi planami

W seed.ts zostali dodani użytkownicy do testowania:

| Email                      | Username       | Plan | Okres                |
| -------------------------- | -------------- | ---- | -------------------- |
| `plus.monthly@example.com` | `plus.monthly` | PLUS | Miesięczny (one-off) |
| `pro.monthly@example.com`  | `pro.monthly`  | PRO  | Miesięczny (one-off) |
| `plus.yearly@example.com`  | `plus.yearly`  | PLUS | Roczny (one-off)     |
| `pro.yearly@example.com`   | `pro.yearly`   | PRO  | Roczny (one-off)     |

**Aby zalogować się jako testowy użytkownik:**

```graphql
mutation {
  devLogin(name: "plus.monthly") {
    id
    name
    email
  }
}
```

## 💰 Konfiguracja cen Stripe (PLN)

W twoim Stripe Dashboard masz już skonfigurowane następujące ceny:

### User Plans (Subskrypcje użytkownika)

- `STRIPE_PRICE_USER_PLUS_MONTHLY_SUB` - zł29.99 PLN / miesiąc (auto-renewal)
- `STRIPE_PRICE_USER_PLUS_MONTHLY_ONEOFF` - zł35.99 PLN (jednorazowa, 30 dni)
- `STRIPE_PRICE_USER_PLUS_YEARLY_ONEOFF` - zł359.99 PLN (jednorazowa, 365 dni)
- `STRIPE_PRICE_USER_PRO_MONTHLY_SUB` - zł69.99 PLN / miesiąc (auto-renewal)
- `STRIPE_PRICE_USER_PRO_MONTHLY_ONEOFF` - zł83.99 PLN (jednorazowa, 30 dni)
- `STRIPE_PRICE_USER_PRO_YEARLY_ONEOFF` - zł839.99 PLN (jednorazowa, 365 dni)

**💡 Ważne**: Plan użytkownika określa funkcje dostępne dla **nowo tworzonych wydarzeń**. Istniejące wydarzenia zachowują swoje obecne ustawienia. Aby ulepszyć konkretne wydarzenie, użyj Event Sponsorship.

### Event Sponsorship (Sponsoring eventów)

- `STRIPE_PRICE_EVENT_PLUS` - zł14.99 PLN (jednorazowa)
  - **1 podbicie wydarzenia** (stackuje się)
  - **1 lokalne powiadomienie push** (stackuje się)
- `STRIPE_PRICE_EVENT_PRO` - zł29.99 PLN (jednorazowa)
  - **3 podbicia wydarzenia** (stackują się)
  - **3 lokalne powiadomienia push** (stackują się)

#### 🔥 System Stackowania Akcji

**Kluczowa funkcja**: Akcje (boosts i pushes) **stackują się** przy:

- **Reload** - kupno tego samego planu ponownie
- **Upgrade** - zmiana z Plus na Pro

**Przykłady**:

1. Kupno Plus: 0 → **1 boost, 1 push**
2. Reload Plus: 1 → **2 boosts, 2 pushes** (1+1)
3. Upgrade Plus→Pro: 1 → **4 boosts, 4 pushes** (1+3)
4. Reload Pro: 4 → **7 boosts, 7 pushes** (4+3)

**Zasady**:

- ✅ Upgrade: PLUS → PRO (akcje się stackują)
- ✅ Reload: Ten sam plan (akcje się stackują)
- ❌ Downgrade: PRO → PLUS (niedozwolony)
- ❌ Downgrade: Płatny → FREE (niedozwolony)
- 🔒 Akcje nigdy nie wygasają (ważne przez cały cykl życia wydarzenia)

**Wszystkie ceny są już w .env i gotowe do użycia!**

## Szybki start bez Stripe CLI

### 1. Uruchom API

```bash
cd /Users/abartski/dev-vibe/miglee/apps/api
pnpm dev
```

API wystartuje na `http://localhost:4000`

### 2. Testuj webhook endpoint (bez Stripe CLI)

Webhook endpoint jest już zarejestrowany: `POST /webhooks/stripe`

**Tryb development** (bez weryfikacji podpisu):

- Endpoint automatycznie wykrywa, że `STRIPE_WEBHOOK_SECRET` nie jest ustawiony
- Pomija weryfikację podpisu Stripe
- ⚠️ TYLKO dla lokalnego developmentu!

### 3. Wyślij test webhook

#### Opcja A: Użyj skryptu testowego

```bash
cd /Users/abartski/dev-vibe/miglee/apps/api
npx tsx test-webhook.ts
```

#### Opcja B: Użyj curl

```bash
curl -X POST http://localhost:4000/webhooks/stripe \
  -H "Content-Type: application/json" \
  -d '{
    "id": "evt_test_'$(date +%s)'",
    "type": "checkout.session.completed",
    "data": {
      "object": {
        "id": "cs_test_123",
        "mode": "subscription",
        "customer": "cus_test_123",
        "subscription": "sub_test_123",
        "payment_status": "paid",
        "metadata": {
          "type": "user_subscription",
          "userId": "user_admin_00000000000000000001",
          "plan": "PLUS",
          "billingPeriod": "MONTHLY"
        },
        "line_items": {
          "data": [{
            "price": { "id": "price_test_123" }
          }]
        }
      }
    }
  }'
```

### 4. Sprawdź w bazie danych

```bash
# Połącz się z bazą
psql postgresql://postgres:password@localhost:5432/app

# Sprawdź payment events
SELECT * FROM payment_events ORDER BY "receivedAt" DESC LIMIT 5;

# Sprawdź user subscriptions
SELECT * FROM user_subscriptions ORDER BY "createdAt" DESC LIMIT 5;

# Sprawdź user plan periods
SELECT * FROM user_plan_periods ORDER BY "createdAt" DESC LIMIT 5;
```

---

## Następne kroki (gdy będziesz gotowy)

### Instalacja Stripe CLI (dla prawdziwych testów)

```bash
# Otwórz NOWY terminal (poza Cursor)
brew install stripe/stripe-cli/stripe

# Zaloguj się
stripe login

# Forward webhooks
stripe listen --forward-to localhost:4000/webhooks/stripe
```

### Konfiguracja Stripe

1. **Załóż konto Stripe** (lub użyj istniejącego)
   - https://dashboard.stripe.com

2. **Stwórz produkty i ceny**
   - Products → Create product
   - Dla każdego planu (PLUS, PRO) utwórz:
     - Monthly subscription
     - Monthly one-off
     - Yearly one-off

3. **Dodaj Price IDs do .env**

```bash
# apps/api/.env
STRIPE_SECRET_KEY=sk_test_... # Z Stripe Dashboard
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_... # Z webhook endpoint

# Price IDs
STRIPE_PRICE_USER_PLUS_MONTHLY_SUB=price_...
STRIPE_PRICE_USER_PLUS_MONTHLY_ONEOFF=price_...
STRIPE_PRICE_USER_PLUS_YEARLY_ONEOFF=price_...
STRIPE_PRICE_USER_PRO_MONTHLY_SUB=price_...
STRIPE_PRICE_USER_PRO_MONTHLY_ONEOFF=price_...
STRIPE_PRICE_USER_PRO_YEARLY_ONEOFF=price_...
STRIPE_PRICE_EVENT_PLUS=price_...
STRIPE_PRICE_EVENT_PRO=price_...

APP_URL=http://localhost:3000
API_URL=http://localhost:4000
```

4. **Restart API**

```bash
cd apps/api
pnpm dev
```

---

## Użycie API

### Frontend (React Query hooks)

System udostępnia gotowe hooki w `apps/web/src/lib/api/billing.tsx`:

```typescript
import {
  useMyPlan,
  useMySubscription,
  useCreateSubscriptionCheckout,
  useCreateOneOffCheckout,
  useCancelSubscription,
} from '@/lib/api/billing';

// W komponencie
function MyComponent() {
  // Pobierz aktualny plan użytkownika
  const { data: planInfo } = useMyPlan();

  // Utwórz checkout dla subskrypcji
  const createCheckout = useCreateSubscriptionCheckout({
    onSuccess: (data) => {
      // Przekieruj na Stripe Checkout
      window.location.href = data.createSubscriptionCheckout.checkoutUrl;
    },
  });

  const handleUpgrade = () => {
    createCheckout.mutate({
      input: {
        plan: 'PLUS',
        billingPeriod: 'MONTHLY',
        withTrial: true,
      },
    });
  };
}
```

### Backend (GraphQL)

### Przykład 1: Sprawdź plan użytkownika

```typescript
import { getUserEffectivePlan } from '@/lib/billing';

const planInfo = await getUserEffectivePlan('user_id_123');
console.log(planInfo);
// { plan: 'FREE', planEndsAt: null, source: null, billingPeriod: null }
```

### Przykład 2: Utwórz checkout session

```typescript
import { createSubscriptionCheckout } from '@/lib/billing';

const { checkoutUrl } = await createSubscriptionCheckout({
  userId: 'user_id_123',
  userEmail: 'user@example.com',
  userName: 'John Doe',
  plan: 'PLUS',
  billingPeriod: 'MONTHLY',
  withTrial: true,
});

console.log('Redirect user to:', checkoutUrl);
```

### Przykład 3: Boost event (zakup sponsoringu)

```typescript
import { createEventSponsorshipCheckout } from '@/lib/billing';

const { checkoutUrl } = await createEventSponsorshipCheckout({
  intentId: 'intent_123',
  userId: 'user_id_123',
  userEmail: 'user@example.com',
  userName: 'John Doe',
  plan: 'PLUS',
});

console.log('Redirect user to:', checkoutUrl);
```

### Przykład 4: Użyj podbicia (boost)

**Podbicie (boost)** przesuwa wydarzenie na górę listy przez zaktualizowanie pola `boostedAt`:

```typescript
import { useBoost } from '@/lib/billing';

// Boost event - trafia na szczyt listingu
await useBoost('intent_123');
```

**Jak działa sortowanie**:

- Wydarzenia są sortowane najpierw po `boostedAt` (najświeższe na górze, null na końcu)
- Następnie po wybranym kryterium (`startAt`, `createdAt`, etc.)
- Dzięki temu podbite wydarzenia zawsze są na szczycie, niezależnie od trybu sortowania

---

## Debug

### Logi webhooków

Wszystkie webhooki są zapisywane w tabeli `payment_events`:

```sql
SELECT
  "eventId",
  "type",
  "success",
  "processedAt",
  "lastError"
FROM payment_events
ORDER BY "receivedAt" DESC
LIMIT 10;
```

### Status subskrypcji

```sql
SELECT
  u.name,
  us.plan,
  us.status,
  us."currentPeriodEnd",
  us."cancelAtPeriodEnd"
FROM user_subscriptions us
JOIN users u ON u.id = us."userId"
ORDER BY us."createdAt" DESC;
```

### Aktywne okresy planów

```sql
SELECT
  u.name,
  upp.plan,
  upp.source,
  upp."startsAt",
  upp."endsAt"
FROM user_plan_periods upp
JOIN users u ON u.id = upp."userId"
WHERE upp."endsAt" > NOW()
ORDER BY upp."endsAt" DESC;
```

---

## Troubleshooting

### "Stripe is not configured"

→ Ustaw `STRIPE_SECRET_KEY` w `.env`

### "Webhook signature verification failed"

→ W trybie dev (bez `STRIPE_WEBHOOK_SECRET`) weryfikacja jest pomijana
→ W produkcji musisz ustawić `STRIPE_WEBHOOK_SECRET` z Stripe Dashboard

### "Event already processed"

→ To normalne! System jest idempotentny i nie przetwarza tego samego eventu dwa razy

### Webhook nie działa

1. Sprawdź czy API działa: `curl http://localhost:4000/health`
2. Sprawdź logi API
3. Sprawdź tabelę `payment_events`

---

## Pliki w projekcie

### Backend (API)

- `apps/api/src/lib/billing/` - serwisy billingowe
  - `stripe.service.ts` - klient Stripe + helpery
  - `user-plan.service.ts` - logika planów użytkownika
  - `event-sponsorship.service.ts` - logika sponsoringu eventów
  - `webhook-handler.service.ts` - obsługa webhooków
  - `constants.ts` - konfiguracja planów i cen
- `apps/api/src/graphql/resolvers/query/billing.ts` - query resolvers
- `apps/api/src/graphql/resolvers/mutation/billing.ts` - mutation resolvers
- `apps/api/src/plugins/stripe-webhook.ts` - endpoint webhooków

### Frontend (Web)

- `apps/web/src/lib/api/billing.tsx` - React Query hooks
- `apps/web/src/app/account/plans-and-bills/` - strona zarządzania planem użytkownika
- `apps/web/src/app/account/subscription/` - strona wyboru planu
- `apps/web/src/app/intent/[id]/manage/plans/` - strona sponsoringu eventu

### Contracts (Shared)

- `packages/contracts/graphql/schema.graphql` - schema GraphQL
- `packages/contracts/graphql/fragments/billing.graphql` - fragmenty
- `packages/contracts/graphql/operations/billing.graphql` - operacje

## Co dalej?

Po zaimplementowaniu backendu, następne kroki to:

1. ✅ **GraphQL Schema** - dodaj types i operations
2. ✅ **GraphQL Resolvers** - podepnij serwisy do GraphQL
3. ✅ **Frontend UI** - komponenty do zarządzania subskrypcją
4. ✅ **Cron Job** - automatyczne wygaszanie sponsoringów

Zobacz `BILLING_SYSTEM_DOCUMENTATION.md` dla pełnej dokumentacji.
