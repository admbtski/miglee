'use client';

import * as React from 'react';
import { Megaphone, Check, Info } from 'lucide-react';
import { SponsorPlan } from '../../subscription/_components/subscription-panel-types';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

/** hierarchia dostępu subskrypcji -> pakiety sponsorowania */
function hasAccessBySubscription(
  subscription: SponsorPlan | 'None' | undefined,
  target: SponsorPlan
) {
  if (!subscription || subscription === 'None') return false;
  const weight: Record<SponsorPlan, number> = { Basic: 1, Plus: 2, Pro: 3 };
  return weight[subscription] >= weight[target];
}

interface PlanCardProps {
  plan: SponsorPlan;
  price: string;
  perks: Array<{ text: string; tooltip?: string }>;
  highlighted?: boolean;
  popular?: boolean;
  covered?: boolean;
  onPurchase?: () => void;
}

function PlanCard({
  plan,
  price,
  perks,
  highlighted = false,
  popular = false,
  covered = false,
  onPurchase,
}: PlanCardProps) {
  return (
    <motion.div
      whileHover={{ scale: covered ? 1 : 1.02, y: covered ? 0 : -4 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'relative flex flex-col rounded-2xl p-6 shadow-sm transition-all',
        highlighted
          ? 'border-2 border-indigo-200 bg-white dark:border-indigo-800 dark:bg-[#0f0f0f] shadow-lg ring-2 ring-indigo-500/20 dark:ring-indigo-400/20'
          : 'border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#0f0f0f]',
        !covered && 'hover:shadow-lg'
      )}
    >
      {/* Popular badge */}
      {popular && (
        <div className="absolute -translate-x-1/2 -top-3 left-1/2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-600 px-3 py-1 text-[10px] font-bold text-white shadow-md dark:bg-indigo-500">
            ⭐ Najpopularniejszy
          </span>
        </div>
      )}

      {/* Subscription badge */}
      {covered && (
        <div className="absolute -top-3 -right-3">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1 text-[10px] font-bold text-white shadow-md dark:bg-emerald-500">
            ✓ W subskrypcji
          </span>
        </div>
      )}

      {/* Plan name */}
      <h3
        className={cn(
          'text-lg font-bold uppercase tracking-wide',
          highlighted
            ? 'text-indigo-700 dark:text-indigo-400'
            : 'text-zinc-900 dark:text-zinc-100'
        )}
      >
        {plan}
      </h3>

      {/* Price */}
      <div className="mt-4 mb-6">
        <div className="flex items-baseline gap-2">
          <span
            className={cn(
              'text-5xl font-bold tracking-tight',
              highlighted
                ? 'text-zinc-900 dark:text-white'
                : 'text-zinc-900 dark:text-zinc-100'
            )}
          >
            {price.split(' ')[0]}
          </span>
          <span className="text-xl font-medium text-zinc-600 dark:text-zinc-400">
            zł
          </span>
        </div>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Jednorazowa opłata
        </p>
      </div>

      {/* Features */}
      <ul className="flex-1 mb-8 space-y-3">
        {perks.map((perk, idx) => (
          <li key={idx} className="flex items-start gap-3">
            <div
              className={cn(
                'mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full',
                highlighted
                  ? 'bg-indigo-600 dark:bg-indigo-500'
                  : 'bg-zinc-100 dark:bg-zinc-800'
              )}
            >
              <Check
                className={cn(
                  'h-3 w-3',
                  highlighted
                    ? 'text-white'
                    : 'text-zinc-700 dark:text-zinc-300'
                )}
                strokeWidth={3}
              />
            </div>
            <span className="flex-1 text-sm text-zinc-700 dark:text-zinc-300">
              {perk.text}
            </span>
            {perk.tooltip && (
              <button
                type="button"
                className="relative flex-shrink-0 group"
                aria-label="More info"
              >
                <Info className="w-4 h-4 text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300" />
                <span className="absolute right-0 hidden w-48 px-3 py-2 mb-2 text-xs text-white rounded-lg shadow-lg pointer-events-none bottom-full bg-zinc-900 group-hover:block dark:bg-zinc-100 dark:text-zinc-900">
                  {perk.tooltip}
                  <span className="absolute -mt-1 border-4 border-transparent top-full right-4 border-t-zinc-900 dark:border-t-zinc-100" />
                </span>
              </button>
            )}
          </li>
        ))}
      </ul>

      {/* CTA Button */}
      <button
        type="button"
        onClick={onPurchase}
        disabled={covered}
        className={cn(
          'w-full rounded-xl py-4 text-sm font-bold uppercase tracking-wide transition-all',
          covered
            ? 'cursor-not-allowed bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500'
            : highlighted
              ? 'bg-indigo-600 text-white shadow-md hover:bg-indigo-700 hover:shadow-lg dark:bg-indigo-500 dark:hover:bg-indigo-600'
              : 'bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100'
        )}
      >
        {covered ? 'W ramach subskrypcji' : `Wykup ${plan}`}
      </button>
    </motion.div>
  );
}

export function PlansPanel({
  intentId,
  onPurchase,
  subscriptionPlan = 'None',
}: {
  intentId: string;
  onPurchase?: (intentId: string, plan: SponsorPlan) => Promise<void> | void;
  /** aktywny plan subskrypcyjny użytkownika (nie dot. jednorazowych pakietów sponsorowania) */
  subscriptionPlan?: SponsorPlan | 'None';
}) {
  const plans: Array<{
    plan: SponsorPlan;
    price: string;
    perks: Array<{ text: string; tooltip?: string }>;
    highlighted?: boolean;
    popular?: boolean;
  }> = [
    {
      plan: 'Basic',
      price: '5 zł',
      perks: [
        {
          text: 'Wyróżnienie w listingu',
          tooltip: 'Twoje wydarzenie będzie wyświetlane na górze listy',
        },
        { text: 'Badge „Promowane"' },
        { text: 'Do 50 uczestników' },
        {
          text: 'Push lokalny 1x',
          tooltip: 'Powiadomienie push dla użytkowników w okolicy',
        },
        { text: 'Podbij 1x', tooltip: 'Przenieś wydarzenie na górę listy' },
      ],
    },
    {
      plan: 'Plus',
      price: '10 zł',
      highlighted: true,
      popular: true,
      perks: [
        { text: 'Zawiera Basic' },
        { text: 'Do 150 uczestników' },
        { text: 'Push lokalny 3x' },
        { text: 'Podbij 3x' },
      ],
    },
    {
      plan: 'Pro',
      price: '15 zł',
      perks: [
        { text: 'Zawiera Plus' },
        {
          text: 'Brak limitu uczestników',
          tooltip: 'Nieograniczona liczba uczestników',
        },
        {
          text: 'Statystyki i analityka',
          tooltip: 'Zaawansowane statystyki i raporty',
        },
        { text: 'Push lokalny 5x' },
        { text: 'Podbij 5x' },
      ],
    },
  ];

  return (
    <div className="space-y-8">
      {/* Info Banner */}
      <div className="rounded-2xl border-[0.5px] border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-[18px] font-semibold text-zinc-900 dark:text-zinc-100">
          Wyróżnij wydarzenie
        </h3>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 max-w-[70ch]">
          Wybierz pakiet sponsorowania. Po zakupie pojawi się zakładka{' '}
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
            „Pakiet (aktywny)"
          </span>{' '}
          z dodatkowymi akcjami.
        </p>
        <div className="p-4 mt-4 border border-indigo-200 rounded-xl bg-indigo-50 dark:border-indigo-800 dark:bg-indigo-900/20">
          <p className="text-sm text-indigo-900 dark:text-indigo-200">
            <span className="font-semibold">💡 Informacja:</span> Jeśli
            posiadasz aktywną subskrypcję, część lub wszystkie poniższe pakiety
            są już dla Ciebie dostępne automatycznie.
          </p>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid gap-8 md:grid-cols-3 md:gap-6">
        {plans.map(({ plan, price, perks, highlighted, popular }) => {
          const covered = hasAccessBySubscription(subscriptionPlan, plan);

          return (
            <PlanCard
              key={plan}
              plan={plan}
              price={price}
              perks={perks}
              highlighted={highlighted}
              popular={popular}
              covered={covered}
              onPurchase={async () => {
                if (covered) return;
                if (onPurchase) await onPurchase(intentId, plan);
                else console.info('[sponsor] purchase', { intentId, plan });
              }}
            />
          );
        })}
      </div>

      {/* Bottom Info */}
      <div className="p-5 border rounded-2xl border-indigo-300/40 bg-gradient-to-r from-indigo-50 to-purple-50 dark:border-indigo-700/40 dark:from-indigo-900/20 dark:to-purple-900/20">
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 bg-indigo-600 rounded-lg dark:bg-indigo-500">
            <Megaphone className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-indigo-900 dark:text-indigo-200">
              Po aktywacji planu otrzymasz:
            </p>
            <p className="mt-1 text-sm text-indigo-800 dark:text-indigo-300">
              Możliwość podbicia wydarzenia, wysyłki powiadomień lokalnych,
              specjalny badge i wiele innych funkcji...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
