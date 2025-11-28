'use client';

import * as React from 'react';
import { ArrowLeft, Info, Loader2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SponsorPlan } from './subscription-panel-types';
import { motion } from 'framer-motion';
import { ACTIONS_NEVER_EXPIRE } from '@/lib/billing-constants';
import { useCreateEventSponsorshipCheckout } from '@/lib/api/billing';
import { IntentPlan } from '@/lib/api/__generated__/react-query-update';
import { toast } from 'sonner';

interface ReloadActionsPanelProps {
  intentId: string;
  currentPlan: SponsorPlan;
  onBack: () => void;
}

// Pakiety akcji - niezależne od planu
const ACTION_PACKAGES = [
  {
    id: 'small',
    actions: 1,
    price: 9.99,
    color: 'indigo',
    popular: false,
  },
  {
    id: 'medium',
    actions: 3,
    price: 24.99,
    color: 'purple',
    popular: true,
  },
  {
    id: 'large',
    actions: 5,
    price: 39.99,
    color: 'amber',
    popular: false,
  },
] as const;

export function ReloadActionsPanel({
  intentId,
  currentPlan,
  onBack,
}: ReloadActionsPanelProps) {
  const createCheckout = useCreateEventSponsorshipCheckout();
  const [selectedPackage, setSelectedPackage] =
    React.useState<string>('medium');
  const [agreeToTerms, setAgreeToTerms] = React.useState(false);

  const selectedPkg = ACTION_PACKAGES.find((p) => p.id === selectedPackage);

  const handlePurchase = async () => {
    if (!agreeToTerms) {
      toast.error('Musisz zaakceptować regulamin i politykę prywatności.');
      return;
    }

    if (!selectedPkg) return;

    try {
      const planMap: Record<SponsorPlan, IntentPlan> = {
        Free: IntentPlan.Free,
        Plus: IntentPlan.Plus,
        Pro: IntentPlan.Pro,
      };

      const result = await createCheckout.mutateAsync({
        input: {
          intentId,
          plan: planMap[currentPlan],
          actionType: 'reload',
          actionPackageSize: selectedPkg.actions,
        },
      });

      // Redirect to Stripe Checkout
      window.location.href = result.createEventSponsorshipCheckout.checkoutUrl;
    } catch (error: any) {
      console.error('Failed to create reload checkout:', error);
      toast.error(error.message || 'Nie udało się utworzyć sesji płatności.');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#05060a]">
      <div className="max-w-4xl px-6 py-10 mx-auto">
        {/* Back button */}
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 mb-6 text-sm font-medium transition-colors text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
        >
          <ArrowLeft className="w-4 h-4" />
          Powrót do zarządzania
        </button>

        {/* Main card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-[-0.02em] text-zinc-900 dark:text-zinc-50 mb-3">
              Dokup pakiet akcji
            </h2>
            <p className="text-base text-zinc-600 dark:text-zinc-400 max-w-[50ch] mx-auto leading-relaxed">
              Wybierz pakiet, który najlepiej odpowiada Twoim potrzebom
            </p>
          </div>

          {/* Packages Grid */}
          <div className="grid gap-6 md:grid-cols-3">
            {ACTION_PACKAGES.map((pkg) => (
              <button
                key={pkg.id}
                type="button"
                onClick={() => setSelectedPackage(pkg.id)}
                className={cn(
                  'relative rounded-[24px] border-2 p-6 transition-all text-left',
                  selectedPackage === pkg.id
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950 ring-2 ring-indigo-500 shadow-lg'
                    : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#10121a] hover:border-indigo-300 dark:hover:border-indigo-700'
                )}
              >
                {/* Popular badge */}
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <div className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-3 py-1 text-xs font-bold text-white shadow-lg">
                      ⭐ Najpopularniejszy
                    </div>
                  </div>
                )}

                {/* Selected indicator */}
                {selectedPackage === pkg.id && (
                  <div className="absolute top-4 right-4">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white">
                      <Check className="w-4 h-4" strokeWidth={3} />
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Actions count */}
                  <div>
                    <div className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
                      +{pkg.actions}
                    </div>
                    <div className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                      {pkg.actions === 1 ? 'akcja' : 'akcje'}
                    </div>
                  </div>

                  {/* Price */}
                  <div>
                    <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                      {pkg.price.toFixed(2)} PLN
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      {(pkg.price / pkg.actions).toFixed(2)} PLN / akcja
                    </div>
                  </div>

                  {/* Benefits */}
                  <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-600 dark:text-emerald-400">
                        ✓
                      </span>
                      {pkg.actions} podbić
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-600 dark:text-emerald-400">
                        ✓
                      </span>
                      {pkg.actions} push lokalnych
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Info box */}
          <div className="p-6 border rounded-2xl border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                  {ACTIONS_NEVER_EXPIRE}
                </p>
                <p className="text-sm leading-relaxed text-emerald-800 dark:text-emerald-200">
                  Wszystkie akcje dodają się do Twojego obecnego limitu i
                  pozostają aktywne do końca życia wydarzenia. Możesz dokupować
                  kolejne pakiety w dowolnym momencie.
                </p>
              </div>
            </div>
          </div>

          {/* Checkout section */}
          <div className="rounded-[24px] bg-white dark:bg-[#10121a] border border-zinc-200/50 dark:border-white/5 shadow-sm p-6 space-y-6">
            {/* Summary */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
              <div>
                <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">
                  Wybrano pakiet
                </div>
                <div className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                  +{selectedPkg?.actions}{' '}
                  {selectedPkg?.actions === 1 ? 'akcja' : 'akcje'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">
                  Suma
                </div>
                <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                  {selectedPkg?.price.toFixed(2)} PLN
                </div>
              </div>
            </div>

            {/* Terms checkbox */}
            <div className="space-y-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeToTerms}
                  onChange={(e) => setAgreeToTerms(e.target.checked)}
                  disabled={createCheckout.isPending}
                  className="w-4 h-4 mt-1 text-indigo-600 rounded focus:ring-indigo-500 disabled:opacity-50"
                />
                <span className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  Wyrażam zgodę na{' '}
                  <a
                    href="#"
                    className="text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Regulamin
                  </a>{' '}
                  i{' '}
                  <a
                    href="#"
                    className="text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Politykę Prywatności
                  </a>
                  . Rozumiem, że zostanę przekierowany do Stripe w celu
                  bezpiecznej realizacji płatności.
                </span>
              </label>
            </div>

            {/* CTA */}
            <button
              type="button"
              onClick={handlePurchase}
              disabled={!agreeToTerms || createCheckout.isPending}
              className={cn(
                'w-full inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-bold transition-colors rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed',
                'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md hover:shadow-lg hover:from-indigo-500 hover:to-purple-500'
              )}
            >
              {createCheckout.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Przekierowywanie...
                </>
              ) : (
                <>Przejdź do płatności</>
              )}
            </button>

            {/* Payment methods */}
            <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-zinc-200 dark:border-white/5">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Obsługiwane metody płatności:
              </p>
              {['BLIK', 'Visa', 'Mastercard', 'Google Pay', 'Apple Pay'].map(
                (logo) => (
                  <div
                    key={logo}
                    className="px-3 py-1 text-xs font-medium rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                  >
                    {logo}
                  </div>
                )
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
