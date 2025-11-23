'use client';

import * as React from 'react';
import { Check, Sparkles, Zap, Crown } from 'lucide-react';
import { SponsorPlan } from '../../subscription/_components/subscription-panel-types';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type PlanId = 'free' | 'plus' | 'pro';

interface PlanCardProps {
  id: PlanId;
  name: string;
  description: string;
  price: number;
  icon: React.ElementType;
  color: string;
  features: string[];
  highlighted?: boolean;
  popular?: boolean;
  isCurrent?: boolean;
  covered?: boolean;
  onPurchase?: () => void;
}

function PlanCard({
  name,
  description,
  price,
  icon: Icon,
  color,
  features,
  highlighted = false,
  popular = false,
  isCurrent = false,
  covered = false,
  onPurchase,
}: PlanCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className={cn(
        'relative rounded-[32px] border-2 bg-white dark:bg-[#10121a] p-8 shadow-sm transition-all hover:shadow-lg flex flex-col',
        highlighted
          ? 'border-indigo-200 dark:border-indigo-800 ring-2 ring-indigo-200 dark:ring-indigo-800 shadow-xl'
          : 'border-zinc-200/80 dark:border-white/5'
      )}
    >
      {/* Popular Badge */}
      {popular && (
        <div className="absolute top-0 z-20 -translate-x-1/2 -translate-y-1/2 left-1/2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-indigo-500 px-4 py-1.5 text-xs font-bold text-white shadow-lg whitespace-nowrap">
            <Sparkles className="w-3 h-3" />
            NAJPOPULARNIEJSZY
          </div>
        </div>
      )}

      {/* Subscription badge */}
      {covered && (
        <div className="absolute top-0 z-20 -translate-x-1/2 -translate-y-1/2 left-1/2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white shadow-lg whitespace-nowrap dark:bg-emerald-500">
            ✓ W SUBSKRYPCJI
          </div>
        </div>
      )}

      {/* Icon */}
      <div className="mb-6">
        <div
          className={cn(
            'inline-flex h-14 w-14 items-center justify-center rounded-2xl',
            color === 'zinc' &&
              'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400',
            color === 'indigo' &&
              'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
            color === 'amber' &&
              'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
          )}
        >
          <Icon className="h-7 w-7" strokeWidth={2} />
        </div>
      </div>

      {/* Name & Description */}
      <div className="mb-6">
        <h3 className="mb-2 text-2xl font-bold tracking-[-0.02em] text-zinc-900 dark:text-zinc-50">
          {name}
        </h3>
        <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          {description}
        </p>
      </div>

      {/* Price */}
      <div className="mb-6">
        <div className="flex items-baseline gap-2">
          <span className="text-5xl font-bold tracking-[-0.02em] text-zinc-900 dark:text-zinc-50">
            {price}
          </span>
          <span className="text-base text-zinc-600 dark:text-zinc-400">zł</span>
        </div>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Jednorazowa opłata
        </p>
      </div>

      {/* CTA Button */}
      <button
        type="button"
        onClick={onPurchase}
        disabled={isCurrent || covered}
        className={cn(
          'mb-8 w-full rounded-2xl px-6 py-3.5 text-sm font-bold transition-all',
          isCurrent || covered
            ? 'cursor-not-allowed border-2 border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-500'
            : highlighted
              ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md hover:from-indigo-500 hover:to-indigo-400 hover:shadow-lg'
              : 'border-2 border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
        )}
      >
        {isCurrent
          ? 'Current Plan'
          : covered
            ? 'W ramach subskrypcji'
            : 'Wykup teraz'}
      </button>

      {/* Features */}
      <div className="space-y-3">
        <p className="text-xs font-semibold tracking-wider uppercase text-zinc-500 dark:text-zinc-400">
          Co zawiera
        </p>
        <ul className="space-y-3">
          {features.map((feature, i) => (
            <li
              key={i}
              className="flex items-start gap-3 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300"
            >
              <Check
                className={cn(
                  'h-5 w-5 shrink-0 mt-0.5',
                  highlighted
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                )}
                strokeWidth={2.5}
              />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}

/** hierarchia dostępu subskrypcji -> pakiety sponsorowania */
function hasAccessBySubscription(
  subscription: SponsorPlan | 'None' | undefined,
  target: PlanId
) {
  if (!subscription || subscription === 'None') return false;
  const subscriptionWeight: Record<SponsorPlan, number> = {
    Basic: 1,
    Plus: 2,
    Pro: 3,
  };
  const targetWeight: Record<PlanId, number> = { free: 0, plus: 2, pro: 3 };
  return subscriptionWeight[subscription] >= targetWeight[target];
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
  const PLANS = [
    {
      id: 'free' as PlanId,
      name: 'Free',
      description: 'Podstawowe funkcje dla wszystkich',
      price: 0,
      icon: Sparkles,
      color: 'zinc',
      features: [
        'Tworzenie wydarzeń',
        'Podstawowe zarządzanie',
        'Do 20 uczestników',
        'Wsparcie społeczności',
      ],
    },
    {
      id: 'plus' as PlanId,
      name: 'Plus',
      description: 'Dla aktywnych organizatorów',
      price: 10,
      icon: Zap,
      color: 'indigo',
      popular: true,
      highlighted: true,
      features: [
        'Wyróżnienie w listingu',
        'Badge „Promowane"',
        'Do 150 uczestników',
        'Push lokalny 3x',
        'Podbij 3x',
      ],
    },
    {
      id: 'pro' as PlanId,
      name: 'Pro',
      description: 'Dla profesjonalnych organizatorów',
      price: 15,
      icon: Crown,
      color: 'amber',
      features: [
        'Wszystko z Plus',
        'Brak limitu uczestników',
        'Statystyki i analityka',
        'Push lokalny 5x',
        'Podbij 5x',
      ],
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4 text-center">
        <h2 className="text-2xl font-bold tracking-[-0.02em] text-zinc-900 dark:text-zinc-50">
          Wyróżnij wydarzenie
        </h2>
        <p className="text-base text-zinc-600 dark:text-zinc-400 max-w-[60ch] mx-auto leading-relaxed">
          Wybierz pakiet sponsorowania, aby zwiększyć widoczność swojego
          wydarzenia
        </p>
      </div>

      {/* Plans Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {PLANS.map((plan) => {
          const isCurrent = plan.id === 'free';
          const covered = hasAccessBySubscription(subscriptionPlan, plan.id);
          const sponsorPlanMap: Record<PlanId, SponsorPlan | null> = {
            free: null,
            plus: 'Plus',
            pro: 'Pro',
          };

          return (
            <PlanCard
              key={plan.id}
              id={plan.id}
              name={plan.name}
              description={plan.description}
              price={plan.price}
              icon={plan.icon}
              color={plan.color}
              features={plan.features}
              highlighted={plan.highlighted}
              popular={plan.popular}
              isCurrent={isCurrent}
              covered={covered}
              onPurchase={async () => {
                if (isCurrent || covered) return;
                const sponsorPlan = sponsorPlanMap[plan.id];
                if (sponsorPlan && onPurchase) {
                  await onPurchase(intentId, sponsorPlan);
                } else {
                  console.info('[sponsor] purchase', {
                    intentId,
                    plan: sponsorPlan,
                  });
                }
              }}
            />
          );
        })}
      </div>

      {/* Info Banner */}
      <div className="rounded-[24px] border border-zinc-200/80 dark:border-white/5 bg-zinc-50 dark:bg-zinc-900/50 p-6 text-center">
        <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          {subscriptionPlan && subscriptionPlan !== 'None'
            ? '✓ Posiadasz aktywną subskrypcję. Niektóre pakiety są już dla Ciebie dostępne automatycznie.'
            : 'Po zakupie pakietu pojawi się zakładka „Pakiet (aktywny)" z dodatkowymi akcjami.'}
        </p>
      </div>
    </div>
  );
}
