/**
 * Account Subscription Plans Page
 * Dedicated page for choosing and purchasing subscription plans
 */

import { SubscriptionPlansWrapper } from './_components/subscription-plans-wrapper';

export default function SubscriptionPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-[-0.02em] text-zinc-900 dark:text-zinc-50">
          Subscription Plans
        </h1>
        <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-[70ch]">
          Choose the perfect plan for your needs and upgrade your account
        </p>
      </div>

      {/* Plans */}
      <SubscriptionPlansWrapper />
    </div>
  );
}

export async function generateMetadata() {
  return {
    title: 'Subscription Plans | Miglee',
    description: 'Choose and purchase your subscription plan',
  };
}
