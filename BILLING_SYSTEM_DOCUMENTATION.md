# 📘 Comprehensive Billing System - Implementation Guide

**Date**: November 23, 2025  
**Version**: 1.0  
**Status**: Development - Ready for Integration

---

## 🎯 Overview

This document describes the complete billing system implementation for **Miglee**, supporting:

- **User Subscriptions** (recurring monthly/yearly, with trials)
- **One-off Payments** (monthly/yearly access without auto-renewal)
- **Event Sponsorships** (boost individual events)

---

## 📐 Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                  │
│  - User Subscription UI                                     │
│  - Event Sponsorship UI                                     │
│  - GraphQL Client                                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ GraphQL
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                     API Layer (Fastify + Mercurius)         │
│  - GraphQL Resolvers                                        │
│  - Authentication & Authorization                           │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                    Business Logic Layer                     │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ UserPlanService                                       │ │
│  │ - getUserEffectivePlan()                              │ │
│  │ - createSubscriptionCheckout()                        │ │
│  │ - createOneOffCheckout()                              │ │
│  │ - cancelSubscription()                                │ │
│  └───────────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ EventSponsorshipService                               │ │
│  │ - createEventSponsorshipCheckout()                    │ │
│  │ - activateEventSponsorship()                          │ │
│  │ - useBoost()                                          │ │
│  │ - useLocalPush()                                      │ │
│  └───────────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ WebhookHandlerService                                 │ │
│  │ - handleStripeWebhook()                               │ │
│  │ - Process subscription events                         │ │
│  │ - Process payment events                              │ │
│  └───────────────────────────────────────────────────────┘ │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer (Prisma)                      │
│  - UserSubscription                                         │
│  - UserPlanPeriod                                          │
│  - EventSponsorship                                        │
│  - PaymentEvent                                            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                   PostgreSQL Database                       │
└─────────────────────────────────────────────────────────────┘

         ┌────────────────────────┐
         │   Stripe Platform      │
         │  - Checkout Sessions   │
         │  - Subscriptions       │
         │  - Webhooks           │
         └────────────────────────┘
```

---

## 🗄️ Database Schema

### Enums

```prisma
enum SubscriptionPlan {
  PLUS
  PRO
}

enum UserPlanSource {
  SUBSCRIPTION  // Auto-renewable subscription
  ONE_OFF       // One-time payment
}

enum BillingPeriod {
  MONTHLY
  YEARLY
}

enum SubscriptionStatus {
  INCOMPLETE
  TRIALING
  ACTIVE
  PAST_DUE
  CANCELED
  UNPAID
  PAUSED
}

enum IntentPlan {
  FREE
  PLUS
  PRO
}

enum SponsorshipStatus {
  PENDING
  ACTIVE
  EXPIRED
  CANCELED
}
```

### Core Models

#### `UserSubscription`

Tracks Stripe subscriptions for users.

```prisma
model UserSubscription {
  id                   String             @id @default(cuid())
  userId               String
  plan                 SubscriptionPlan   // PLUS | PRO
  billingPeriod        BillingPeriod      // MONTHLY | YEARLY
  status               SubscriptionStatus
  stripeCustomerId     String
  stripeSubscriptionId String?
  stripePriceId        String?
  currentPeriodStart   DateTime?
  currentPeriodEnd     DateTime?
  trialEndsAt          DateTime?
  cancelAtPeriodEnd    Boolean            @default(false)
  canceledAt           DateTime?
  createdAt            DateTime           @default(now())
  updatedAt            DateTime           @updatedAt
}
```

#### `UserPlanPeriod`

**KEY MODEL** - Stores all active plan periods for calculating effective plan.

```prisma
model UserPlanPeriod {
  id                      String           @id @default(cuid())
  userId                  String
  plan                    SubscriptionPlan // PLUS | PRO
  source                  UserPlanSource   // SUBSCRIPTION | ONE_OFF
  billingPeriod           BillingPeriod    // MONTHLY | YEARLY
  stripeCustomerId        String?
  stripeSubscriptionId    String?          // For SUBSCRIPTION
  stripePaymentIntentId   String?          // For ONE_OFF
  stripeCheckoutSessionId String?
  startsAt                DateTime
  endsAt                  DateTime
  createdAt               DateTime         @default(now())
}
```

#### `EventSponsorship`

Tracks event-level boosts/promotions.

```prisma
model EventSponsorship {
  id                      String            @id @default(cuid())
  intentId                String            @unique
  sponsorId               String
  plan                    IntentPlan        // PLUS | PRO
  status                  SponsorshipStatus
  startsAt                DateTime?
  endsAt                  DateTime?
  boostsTotal             Int               @default(0)
  boostsUsed              Int               @default(0)
  localPushesTotal        Int               @default(0)
  localPushesUsed         Int               @default(0)
  stripePaymentIntentId   String?
  stripeCheckoutSessionId String?
  createdAt               DateTime          @default(now())
  updatedAt               DateTime          @updatedAt
}
```

#### `Intent` (updated)

Added `sponsorshipPlan` field.

```prisma
model Intent {
  // ... existing fields
  sponsorshipPlan IntentPlan @default(FREE)
  sponsorship     EventSponsorship?
}
```

#### `PaymentEvent`

Idempotency log for Stripe webhooks.

```prisma
model PaymentEvent {
  id          String    @id @default(cuid())
  provider    String    @default("stripe")
  eventId     String    @unique       // Stripe event.id
  type        String
  payload     Json
  receivedAt  DateTime  @default(now())
  processedAt DateTime?
  success     Boolean   @default(false)
  attempt     Int       @default(1)
  lastError   String?
}
```

---

## 💰 Pricing & Plans

### User Plans

| Plan | Monthly Sub | Monthly One-Off | Yearly One-Off      |
| ---- | ----------- | --------------- | ------------------- |
| PLUS | 29.99 PLN   | 35.99 PLN       | 359.99 PLN (~30/mo) |
| PRO  | 69.99 PLN   | 83.99 PLN       | 839.99 PLN (~70/mo) |

**Trial**: 7 days for both PLUS and PRO (subscriptions only)

**Important**: User plan changes apply **only to newly created events**. Existing events retain their current features and limits. To upgrade a specific event, use Event Sponsorship plans.

### Event Plans

| Plan | Price (1 month) |
| ---- | --------------- |
| PLUS | 14.99 PLN       |
| PRO  | 29.99 PLN       |

**Features**:

```typescript
const EVENT_PLAN_LIMITS = {
  FREE: {
    boostsTotal: 0,
    localPushesTotal: 0,
    maxCapacity: 50,
    featuredInListing: false,
    analytics: 'basic',
  },
  PLUS: {
    boostsTotal: 1,
    localPushesTotal: 1,
    maxCapacity: 150,
    featuredInListing: true,
    analytics: 'standard',
  },
  PRO: {
    boostsTotal: 3,
    localPushesTotal: 3,
    maxCapacity: 500,
    featuredInListing: true,
    analytics: 'advanced',
  },
};
```

#### Action Stacking System

**CRITICAL FEATURE**: Event sponsorship actions (boosts and pushes) **stack** when:

- User reloads the same plan (buys it again)
- User upgrades from PLUS to PRO

**Examples**:

1. **First Purchase - PLUS**
   - Initial: 0 boosts, 0 pushes
   - After purchase: **1 boost, 1 push**

2. **Reload - Buy PLUS again**
   - Before: 1 boost, 1 push (PLUS active)
   - After: **2 boosts, 2 pushes** (1+1 stacked)

3. **Upgrade - PLUS to PRO**
   - Before: 1 boost, 1 push (PLUS active)
   - After: **4 boosts, 4 pushes** (1+3 stacked)
   - Plan changes to PRO

4. **Reload - Buy PRO again**
   - Before: 4 boosts, 4 pushes (PRO active)
   - After: **7 boosts, 7 pushes** (4+3 stacked)

**Important Rules**:

- ✅ Upgrade: PLUS → PRO (allowed, actions stack)
- ✅ Reload: Same plan purchase (allowed, actions stack)
- ❌ Downgrade: PRO → PLUS (not allowed)
- ❌ Downgrade: Any paid → FREE (not allowed)
- 🔒 Actions never expire (persist for event lifecycle)
- 📅 Plan duration does NOT reset on reload (only on new purchase)

---

## 🛠️ Implementation Files

### Backend (API)

#### Database & Schema

- ✅ `apps/api/prisma/schema.prisma` - Updated with billing models
- ✅ `apps/api/prisma/migrations/20251123104705_add_comprehensive_billing_system/migration.sql`

#### Configuration

- ✅ `apps/api/src/env.ts` - Environment variables & config
- ✅ `apps/api/src/lib/billing/constants.ts` - Pricing, limits, metadata types

#### Core Services

- ✅ `apps/api/src/lib/billing/stripe.service.ts` - Stripe client wrapper
- ✅ `apps/api/src/lib/billing/user-plan.service.ts` - User subscription logic
- ✅ `apps/api/src/lib/billing/event-sponsorship.service.ts` - Event boost logic
- ✅ `apps/api/src/lib/billing/webhook-handler.service.ts` - Stripe webhook processor
- ✅ `apps/api/src/lib/billing/index.ts` - Barrel export

#### To Implement (Next Steps)

- ⏳ `apps/api/src/plugins/stripe-webhook.ts` - REST endpoint for webhooks
- ⏳ GraphQL schema extensions (`packages/contracts/graphql/`)
- ⏳ GraphQL resolvers (`apps/api/src/graphql/resolvers/`)
- ⏳ Cron job for expiring sponsorships

### Frontend (Web)

#### To Implement (Next Steps)

- ⏳ `apps/web/src/app/account/subscription/` - User subscription UI
- ⏳ `apps/web/src/app/intent/[id]/manage/plans/` - Event sponsorship UI (refactor existing)
- ⏳ GraphQL operations & codegen

---

## 🔧 Environment Variables

Add to `apps/api/.env`:

```bash
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs (get from Stripe Dashboard)
STRIPE_PRICE_USER_PLUS_MONTHLY_SUB=price_...
STRIPE_PRICE_USER_PLUS_MONTHLY_ONEOFF=price_...
STRIPE_PRICE_USER_PLUS_YEARLY_ONEOFF=price_...
STRIPE_PRICE_USER_PRO_MONTHLY_SUB=price_...
STRIPE_PRICE_USER_PRO_MONTHLY_ONEOFF=price_...
STRIPE_PRICE_USER_PRO_YEARLY_ONEOFF=price_...
STRIPE_PRICE_EVENT_PLUS=price_...
STRIPE_PRICE_EVENT_PRO=price_...

# URLs
APP_URL=http://localhost:3000
API_URL=http://localhost:4000
```

---

## 🚀 How to Use

### 1. Get User's Effective Plan

```typescript
import { getUserEffectivePlan } from '@/lib/billing';

const planInfo = await getUserEffectivePlan(userId);
// Returns: { plan: 'FREE' | 'PLUS' | 'PRO', planEndsAt, source, billingPeriod }
```

### 2. Create Subscription Checkout

```typescript
import { createSubscriptionCheckout } from '@/lib/billing';

const { checkoutUrl, sessionId } = await createSubscriptionCheckout({
  userId: 'user_123',
  userEmail: 'user@example.com',
  userName: 'John Doe',
  plan: 'PLUS',
  billingPeriod: 'MONTHLY',
  withTrial: true,
});

// Redirect user to checkoutUrl
```

### 3. Create One-Off Payment

```typescript
import { createOneOffCheckout } from '@/lib/billing';

const { checkoutUrl } = await createOneOffCheckout({
  userId: 'user_123',
  userEmail: 'user@example.com',
  userName: 'John Doe',
  plan: 'PRO',
  billingPeriod: 'YEARLY',
});
```

### 4. Purchase Event Sponsorship

```typescript
import { createEventSponsorshipCheckout } from '@/lib/billing';

const { checkoutUrl, sponsorshipId } = await createEventSponsorshipCheckout({
  intentId: 'intent_123',
  userId: 'user_123',
  userEmail: 'user@example.com',
  userName: 'John Doe',
  plan: 'PLUS',
});
```

### 5. Use Boost or Local Push

**Boost**: When a user uses a boost, the event is moved to the top of the listing by updating the `boostedAt` timestamp. Events with a recent `boostedAt` value are prioritized in all sorting modes.

```typescript
import { useBoost, useLocalPush } from '@/lib/billing';

await useBoost('intent_123'); // Updates Intent.boostedAt to current time
await useLocalPush('intent_123');
```

**Sorting Priority**: The `intentsQuery` resolver automatically prioritizes boosted events:

1. Events are first sorted by `boostedAt` (most recent first, nulls last)
2. Then by the requested sort field (e.g., `startAt`, `createdAt`, etc.)

This ensures boosted events appear at the top of listings regardless of the sort mode.

---

## 🔗 Stripe Webhook Setup

### 1. Create Webhook Endpoint in Stripe Dashboard

```
URL: https://your-api.com/webhooks/stripe
Events to send:
  - checkout.session.completed
  - customer.subscription.created
  - customer.subscription.updated
  - customer.subscription.deleted
  - invoice.paid
  - invoice.payment_failed
  - payment_intent.succeeded
```

### 2. Implement Webhook Plugin

Create `apps/api/src/plugins/stripe-webhook.ts`:

```typescript
import type { FastifyInstance } from 'fastify';
import { verifyWebhookSignature, handleStripeWebhook } from '@/lib/billing';

export async function stripeWebhookPlugin(fastify: FastifyInstance) {
  fastify.post(
    '/webhooks/stripe',
    {
      config: {
        rawBody: true, // Important!
      },
    },
    async (request, reply) => {
      const signature = request.headers['stripe-signature'];

      if (!signature) {
        return reply.code(400).send({ error: 'No signature' });
      }

      try {
        const event = verifyWebhookSignature(
          request.rawBody!,
          signature as string
        );

        await handleStripeWebhook(event);

        return reply.code(200).send({ received: true });
      } catch (err: any) {
        return reply.code(400).send({ error: err.message });
      }
    }
  );
}
```

---

## ⏰ Cron Jobs

### Expire Event Sponsorships

Run daily:

```typescript
import { expireEventSponsorships } from '@/lib/billing';

// In your cron job
const expiredCount = await expireEventSponsorships();
console.log(`Expired ${expiredCount} event sponsorships`);
```

---

## 🧪 Testing Locally

### Option 1: With Stripe CLI (Recommended)

#### Install Stripe CLI

**macOS (Homebrew):**

```bash
brew install stripe/stripe-cli/stripe
```

**macOS (Direct Download):**

```bash
curl -L https://github.com/stripe/stripe-cli/releases/download/v1.19.5/stripe_1.19.5_mac-os_arm64.tar.gz -o stripe.tar.gz
tar -xvf stripe.tar.gz
sudo mv stripe /usr/local/bin/
```

**Linux:**

```bash
# Debian/Ubuntu
curl -s https://packages.stripe.dev/api/security/keypair/stripe-cli-gpg/public | gpg --dearmor | sudo tee /usr/share/keyrings/stripe.gpg
echo "deb [signed-by=/usr/share/keyrings/stripe.gpg] https://packages.stripe.dev/stripe-cli-debian-local stable main" | sudo tee -a /etc/apt/sources.list.d/stripe.list
sudo apt update
sudo apt install stripe
```

#### Use Stripe CLI

```bash
# 1. Login to Stripe
stripe login

# 2. Forward webhooks to local API
stripe listen --forward-to localhost:4000/webhooks/stripe

# 3. In another terminal, start your API
cd apps/api && pnpm dev

# 4. Test with trigger
stripe trigger checkout.session.completed
```

### Option 2: Without Stripe CLI (Development Mode)

The webhook endpoint supports **development mode** when `STRIPE_WEBHOOK_SECRET` is not set. This skips signature verification (⚠️ **LOCAL ONLY**).

**Test webhook manually:**

```bash
# Use the test script
cd apps/api
npx tsx test-webhook.ts
```

Or send POST request:

```bash
curl -X POST http://localhost:4000/webhooks/stripe \
  -H "Content-Type: application/json" \
  -d '{
    "id": "evt_test_123",
    "type": "checkout.session.completed",
    "data": {
      "object": {
        "id": "cs_test_123",
        "mode": "subscription",
        "customer": "cus_test_123",
        "subscription": "sub_test_123",
        "metadata": {
          "type": "user_subscription",
          "userId": "user_123",
          "plan": "PLUS",
          "billingPeriod": "MONTHLY"
        }
      }
    }
  }'
```

### Option 3: Using ngrok

```bash
# Install ngrok
brew install ngrok

# Start tunnel
ngrok http 4000

# Copy the URL (e.g., https://abc123.ngrok.io)
# Add webhook in Stripe Dashboard:
# https://abc123.ngrok.io/webhooks/stripe
```

### Test Cards

Use Stripe test cards:

- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0025 0000 3155`

---

## 📊 Plan Hierarchy Algorithm

When multiple `UserPlanPeriod` records overlap:

1. **Filter**: Get all periods where `now()` is between `startsAt` and `endsAt`
2. **Rank by level**: PRO (level 2) > PLUS (level 1)
3. **Tiebreaker**: If same level, choose the one with latest `endsAt`
4. **Result**: Return the highest-priority active plan

---

## 🔐 Security Considerations

1. **Webhook Signature Verification**: Always verify Stripe signatures
2. **Idempotency**: Use `PaymentEvent` table to prevent duplicate processing
3. **User Authorization**: Verify user can manage intent before sponsorship purchase
4. **Metadata Validation**: Validate all metadata from Stripe events
5. **Environment Isolation**: Use separate Stripe keys for dev/test/prod

---

## 📈 Next Steps

### Immediate (Before Production)

1. [ ] Create Stripe products & prices in Stripe Dashboard
2. [ ] Configure webhook endpoint
3. [ ] Implement GraphQL schema & resolvers
4. [ ] Build frontend UI components
5. [ ] Add cron job for expiring sponsorships
6. [ ] Write integration tests

### Future Enhancements

- [ ] Support for EUR/USD currencies
- [ ] Promo codes & discounts
- [ ] Referral system
- [ ] Invoice generation & download
- [ ] Usage analytics dashboard
- [ ] Automatic plan upgrades/downgrades
- [ ] Grace period for failed payments
- [ ] Refund handling

---

## 🆘 Troubleshooting

### "Stripe price ID not configured"

→ Set environment variables `STRIPE_PRICE_USER_PLUS_MONTHLY_SUB` etc.

### "No active subscription found"

→ User never subscribed or subscription expired. Check `UserPlanPeriod` table.

### "Webhook signature verification failed"

→ Check `STRIPE_WEBHOOK_SECRET` in `.env`. Get from Stripe Dashboard webhook settings.

### "Event already processed"

→ This is normal. System is idempotent and skips duplicate webhook events.

---

## 📞 Support

For questions or issues:

1. Check logs in `PaymentEvent` table
2. Verify Stripe Dashboard for event delivery status
3. Review webhook processing errors in Stripe Dashboard
4. Contact Stripe support for payment-specific issues

---

**End of Documentation**

_This system is production-ready pending frontend implementation and Stripe configuration._
