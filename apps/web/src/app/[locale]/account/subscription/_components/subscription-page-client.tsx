'use client';

import { useI18n } from '@/lib/i18n/provider-ssr';

import { SubscriptionPlansWrapper } from './subscription-plans-wrapper';

export function SubscriptionPageClient() {
  const _i18n = useI18n(); // TODO: Use t for i18n when keys are added
  void _i18n;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        {/* TODO: Add i18n key for t.subscription.title */}
        <h1 className="text-3xl font-bold tracking-[-0.02em] text-zinc-900 dark:text-zinc-50">
          Plany użytkownika
        </h1>
        {/* TODO: Add i18n key for t.subscription.description */}
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
