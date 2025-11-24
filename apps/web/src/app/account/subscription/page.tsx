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
          Plany użytkownika
        </h1>
        <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-[70ch]">
          Wybierz idealny plan dla siebie i ulepsz swoje konto. Plan użytkownika
          określa dostępne funkcje dla{' '}
          <span className="font-semibold text-zinc-700 dark:text-zinc-300">
            nowo tworzonych wydarzeń
          </span>
          .
        </p>
      </div>

      {/* Plans */}
      <SubscriptionPlansWrapper />
    </div>
  );
}

export async function generateMetadata() {
  return {
    title: 'Plany użytkownika | Miglee',
    description: 'Wybierz i wykup swój plan subskrypcji',
  };
}
