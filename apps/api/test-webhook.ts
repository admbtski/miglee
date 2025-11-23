/**
 * Test Stripe Webhooks Locally
 * Run: npx tsx test-webhook.ts
 */

const WEBHOOK_URL = 'http://localhost:4000/webhooks/stripe';

// Example: Checkout Session Completed (User Subscription)
const checkoutSessionCompleted = {
  id: 'evt_test_' + Date.now(),
  object: 'event',
  api_version: '2024-12-18.acacia',
  created: Math.floor(Date.now() / 1000),
  type: 'checkout.session.completed',
  data: {
    object: {
      id: 'cs_test_' + Date.now(),
      object: 'checkout.session',
      mode: 'subscription',
      customer: 'cus_test_123',
      subscription: 'sub_test_123',
      payment_status: 'paid',
      status: 'complete',
      metadata: {
        type: 'user_subscription',
        userId: 'user_test_123',
        plan: 'PLUS',
        billingPeriod: 'MONTHLY',
      },
      line_items: {
        data: [
          {
            price: {
              id: 'price_test_123',
            },
          },
        ],
      },
    },
  },
};

async function sendWebhook(event: any) {
  console.log('📤 Sending webhook:', event.type);

  const response = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'stripe-signature': 'FAKE_SIGNATURE_FOR_TESTING', // Will fail verification
    },
    body: JSON.stringify(event),
  });

  console.log('📥 Response:', response.status);
  const text = await response.text();
  console.log('Response body:', text);
}

// Run
sendWebhook(checkoutSessionCompleted).catch(console.error);
