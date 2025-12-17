'use client';

import { ArrowLeft, Clock, Loader2, Lock } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';
import { toast } from 'sonner';

import {
  PLAN_SCOPE_NOTICE,
  useCreateOneOffCheckout,
  useCreateSubscriptionCheckout,
  USER_PLAN_FEATURES,
} from '@/features/billing';
import { useI18n } from '@/lib/i18n/provider-ssr';

import {
  BillingPeriod,
  SubscriptionPlan,
} from '@/lib/api/__generated__/react-query-update';
import type { BillingType, PlanType } from './subscription-plans-wrapper';

interface AccountCheckoutPanelProps {
  selectedPlan: {
    id: PlanType;
    name: string;
    billingType: BillingType;
    price: number;
  };
  onBack: () => void;
}

export function AccountCheckoutPanel({
  selectedPlan,
  onBack,
}: AccountCheckoutPanelProps) {
  const { locale } = useI18n();
  const createSubscriptionCheckout = useCreateSubscriptionCheckout();
  const createOneOffCheckout = useCreateOneOffCheckout();

  const [isCreatingCheckout, setIsCreatingCheckout] = React.useState(false);
  const [agreeToTerms, setAgreeToTerms] = React.useState(false);

  const handleCreateCheckout = async () => {
    if (selectedPlan.id === 'free') {
      // TODO: Add i18n key for error message
      toast.error('Nie można zakupić planu FREE');
      onBack();
      return;
    }

    if (!agreeToTerms) {
      // TODO: Add i18n key for error message
      toast.error('Musisz zaakceptować regulamin i politykę prywatności');
      return;
    }

    setIsCreatingCheckout(true);

    try {
      const plan = selectedPlan.id.toUpperCase() as 'PLUS' | 'PRO';

      if (selectedPlan.billingType === 'monthly-subscription') {
        // Create subscription checkout (auto-renewable)
        const result = await createSubscriptionCheckout.mutateAsync({
          input: {
            plan: plan as SubscriptionPlan, // GraphQL enum
            billingPeriod: 'MONTHLY' as BillingPeriod, // GraphQL enum
            withTrial: false, // NO TRIAL - immediate payment
          },
        });

        // Redirect to Stripe Checkout
        window.location.href = result.createSubscriptionCheckout.checkoutUrl;
      } else {
        // Create one-off checkout
        const billingPeriod =
          selectedPlan.billingType === 'annual-onetime' ? 'YEARLY' : 'MONTHLY';

        const result = await createOneOffCheckout.mutateAsync({
          input: {
            plan: plan as any, // GraphQL enum
            billingPeriod: billingPeriod as any, // GraphQL enum
          },
        });

        // Redirect to Stripe Checkout
        window.location.href = result.createOneOffCheckout.checkoutUrl;
      }
    } catch (error: any) {
      console.error('Failed to create checkout:', error);
      // TODO: Add i18n key for error message
      toast.error(error.message || 'Nie udało się utworzyć sesji płatności');
      setIsCreatingCheckout(false);
    }
  };

  // TODO: Add i18n keys for billing type labels
  const getBillingTypeLabel = () => {
    switch (selectedPlan.billingType) {
      case 'monthly-subscription':
        return 'Subskrypcja miesięczna (automatyczne odnowienie)';
      case 'monthly-onetime':
        return 'Płatność jednorazowa miesięczna';
      case 'annual-onetime':
        return 'Płatność jednorazowa roczna';
    }
  };

  // TODO: Add i18n for date formatting - use date-fns with locale
  const getActiveUntilDate = () => {
    const days = selectedPlan.billingType === 'annual-onetime' ? 365 : 30;
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toLocaleDateString(
      locale === 'pl' ? 'pl-PL' : locale === 'de' ? 'de-DE' : 'en-US',
      { month: 'long', day: 'numeric', year: 'numeric' }
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back button */}
      <button
        onClick={onBack}
        disabled={isCreatingCheckout}
        className="inline-flex items-center gap-2 text-sm font-medium transition-colors text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100 disabled:opacity-50"
      >
        <ArrowLeft className="w-4 h-4" />
        {/* TODO: Add i18n key */}
        Powrót do planów
      </button>

      {/* Main checkout card */}
      <div className="rounded-[32px] bg-white dark:bg-[#10121a] border-2 border-zinc-200/80 dark:border-white/5 shadow-sm p-8 space-y-8">
        {/* Header */}
        <div>
          {/* TODO: Add i18n key */}
          <h2 className="text-2xl font-bold tracking-[-0.02em] text-zinc-900 dark:text-zinc-50 mb-2">
            Dokończ zakup
          </h2>
          {/* TODO: Add i18n key */}
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Przejrzyj swoje zamówienie przed przejściem do płatności
          </p>
        </div>

        {/* Order Summary */}
        <div className="rounded-2xl border border-zinc-200 dark:border-white/5 bg-white dark:bg-[#0a0b12] overflow-hidden">
          <div className="px-6 py-4 bg-zinc-50 dark:bg-[#050608] border-b border-zinc-200 dark:border-white/5">
            {/* TODO: Add i18n key */}
            <h3 className="text-xs font-bold tracking-[0.2em] text-zinc-500 dark:text-zinc-400 uppercase">
              Podsumowanie zamówienia
            </h3>
          </div>

          <div className="p-6 space-y-4">
            {/* Plan details */}
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-zinc-900 dark:text-zinc-50">
                  {selectedPlan.name} Plan
                </p>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {getBillingTypeLabel()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                  zł{selectedPlan.price.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Active until */}
            <div className="pt-4 border-t border-zinc-200 dark:border-white/5">
              <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                <Clock className="w-4 h-4" />
                {/* TODO: Add i18n key */}
                <span>
                  Twój plan będzie aktywny do:{' '}
                  <span className="font-medium text-zinc-900 dark:text-zinc-50">
                    {getActiveUntilDate()}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Features reminder */}
        <div className="p-6 border border-indigo-200 rounded-2xl dark:border-indigo-800/30 bg-indigo-50 dark:bg-indigo-900/10">
          {/* TODO: Add i18n key */}
          <h4 className="mb-3 text-sm font-semibold text-indigo-900 dark:text-indigo-100">
            Co zawiera plan {selectedPlan.name}:
          </h4>
          <ul className="space-y-2 text-sm text-indigo-800 dark:text-indigo-200">
            {selectedPlan.id === 'plus'
              ? USER_PLAN_FEATURES.PLUS.slice(0, 8).map((feature, i) => (
                  <li key={i}>✓ {feature}</li>
                ))
              : selectedPlan.id === 'pro'
                ? USER_PLAN_FEATURES.PRO.slice(0, 8).map((feature, i) => (
                    <li key={i}>✓ {feature}</li>
                  ))
                : null}
          </ul>
          <div className="pt-4 mt-4 border-t border-indigo-200 dark:border-indigo-800/30">
            <p className="text-xs text-indigo-700 dark:text-indigo-300">
              {PLAN_SCOPE_NOTICE}
            </p>
          </div>
        </div>

        {/* Terms checkbox */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
            <Lock className="w-4 h-4" />
            {/* TODO: Add i18n key */}
            <span className="font-medium">
              Wszystkie transakcje są bezpieczne i szyfrowane
            </span>
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreeToTerms}
              onChange={(e) => setAgreeToTerms(e.target.checked)}
              disabled={isCreatingCheckout}
              className="w-4 h-4 mt-1 text-indigo-600 rounded focus:ring-indigo-500 disabled:opacity-50"
            />
            {/* TODO: Add i18n key */}
            <span className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              Wyrażam zgodę na{' '}
              <Link
                href={`/${locale}/account/terms`}
                className="text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Regulamin
              </Link>{' '}
              i{' '}
              <Link
                href={`/${locale}/account/privacy`}
                className="text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Politykę Prywatności
              </Link>
              . Rozumiem, że zostanę przekierowany do Stripe w celu bezpiecznej
              realizacji płatności.
            </span>
          </label>
        </div>

        {/* Total & CTA */}
        <div className="pt-6 border-t border-zinc-200 dark:border-white/5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              {/* TODO: Add i18n key */}
              <p className="mb-1 text-sm text-zinc-500 dark:text-zinc-400">
                Suma całkowita
              </p>
              <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                zł{selectedPlan.price.toFixed(2)}
              </p>
            </div>
            <button
              type="button"
              onClick={handleCreateCheckout}
              disabled={!agreeToTerms || isCreatingCheckout}
              className="inline-flex items-center gap-2 px-8 py-4 text-lg font-bold text-white transition-colors rounded-2xl bg-zinc-900 dark:bg-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreatingCheckout ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {/* TODO: Add i18n key */}
                  Przetwarzanie...
                </>
              ) : (
                <>
                  {/* TODO: Add i18n key */}
                  Przejdź do płatności
                  <ArrowLeft className="w-5 h-5 rotate-180" />
                </>
              )}
            </button>
          </div>

          {/* Payment info */}
          <div className="pt-6 mt-6 border-t border-zinc-200 dark:border-white/5">
            {/* TODO: Add i18n key */}
            <p className="text-xs text-center text-zinc-500 dark:text-zinc-400">
              Obsługiwane przez{' '}
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                Stripe
              </span>
              . Zostaniesz przekierowany, aby bezpiecznie dokończyć płatność.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
