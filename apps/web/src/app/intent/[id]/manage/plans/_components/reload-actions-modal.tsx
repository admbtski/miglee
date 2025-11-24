'use client';

import * as React from 'react';
import { ArrowLeft, Zap, Crown, Info } from 'lucide-react';
import { SponsorPlan } from '../../subscription/_components/subscription-panel-types';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ReloadActionsModalProps {
  intentId: string;
  currentPlan: SponsorPlan;
  onBack: () => void;
  onProceedToCheckout: () => void;
}

export function ReloadActionsModal({
  currentPlan,
  onBack,
  onProceedToCheckout,
}: ReloadActionsModalProps) {
  const isPro = currentPlan === 'Pro';
  const icon = isPro ? Crown : Zap;
  const Icon = icon;

  const planDetails = {
    Plus: {
      boosts: 3,
      pushes: 3,
      price: 14.99,
      color: 'indigo',
    },
    Pro: {
      boosts: 5,
      pushes: 5,
      price: 29.99,
      color: 'amber',
    },
    Basic: {
      boosts: 0,
      pushes: 0,
      price: 0,
      color: 'zinc',
    },
  };

  const details = planDetails[currentPlan];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#05060a]">
      <div className="max-w-3xl px-6 py-10 mx-auto">
        {/* Back button */}
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 mb-6 text-sm font-medium transition-colors text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
        >
          <ArrowLeft className="w-4 h-4" />
          Powrót do planów
        </button>

        {/* Main card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-[32px] bg-white dark:bg-[#10121a] border border-zinc-200/50 dark:border-white/5 shadow-sm p-8 space-y-8"
        >
          {/* Header */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600">
              <Icon className="w-8 h-8 text-white" strokeWidth={2} />
            </div>
            <h2 className="text-3xl font-bold tracking-[-0.02em] text-zinc-900 dark:text-zinc-50 mb-3">
              Doładuj akcje wydarzenia {isPro ? '(Pro)' : ''}
            </h2>
            <p className="text-base text-zinc-600 dark:text-zinc-400 max-w-[50ch] mx-auto leading-relaxed">
              Każdy dodatkowy pakiet {currentPlan} dla tego wydarzenia doda:
            </p>
          </div>

          {/* Benefits */}
          <div className="rounded-2xl border border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-[#0a0b12] p-6">
            <ul className="space-y-4">
              <li className="flex items-center gap-4">
                <div
                  className={cn(
                    'flex items-center justify-center w-10 h-10 rounded-xl',
                    isPro
                      ? 'bg-amber-100 dark:bg-amber-900/30'
                      : 'bg-indigo-100 dark:bg-indigo-900/30'
                  )}
                >
                  <span className="text-2xl">🚀</span>
                </div>
                <div className="flex-1">
                  <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                    +{details.boosts} podbicia
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Wyniesienie wydarzenia w górę listingu
                  </p>
                </div>
              </li>
              <li className="flex items-center gap-4">
                <div
                  className={cn(
                    'flex items-center justify-center w-10 h-10 rounded-xl',
                    isPro
                      ? 'bg-amber-100 dark:bg-amber-900/30'
                      : 'bg-indigo-100 dark:bg-indigo-900/30'
                  )}
                >
                  <span className="text-2xl">📢</span>
                </div>
                <div className="flex-1">
                  <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                    +{details.pushes} lokalnych powiadomień push
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Powiadomienia dla użytkowników w okolicy
                  </p>
                </div>
              </li>
            </ul>
          </div>

          {/* Info box */}
          <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-6">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                  Akcje się sumują i nigdy nie wygasają
                </p>
                <p className="text-sm text-emerald-800 dark:text-emerald-200 leading-relaxed">
                  Wszystkie akcje pozostają aktywne do końca życia wydarzenia.
                  Możesz dokupować kolejne pakiety w dowolnym momencie.
                </p>
              </div>
            </div>
          </div>

          {/* Price and CTA */}
          <div className="pt-6 border-t border-zinc-200 dark:border-white/5">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">
                  Cena pakietu
                </p>
                <p className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
                  {details.price.toFixed(2)}{' '}
                  <span className="text-2xl">PLN</span>
                </p>
              </div>
              <button
                type="button"
                onClick={onProceedToCheckout}
                className={cn(
                  'inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-bold transition-colors rounded-2xl',
                  'bg-gradient-to-r text-white shadow-md hover:shadow-lg',
                  isPro
                    ? 'from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400'
                    : 'from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400'
                )}
              >
                Kup pakiet {currentPlan}
              </button>
            </div>

            {/* Payment methods */}
            <div className="flex flex-wrap items-center gap-3 pt-6 border-t border-zinc-200 dark:border-white/5">
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
