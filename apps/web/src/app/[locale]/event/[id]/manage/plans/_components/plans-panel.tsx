'use client';

import * as React from 'react';
import { Check, Sparkles, Zap, Crown, Info } from 'lucide-react';
import { SponsorPlan } from '@/features/events/types/sponsorship';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  EVENT_PLAN_PRICES,
  EVENT_PLAN_FEATURES,
  EVENT_PLAN_DESCRIPTIONS,
  EVENT_SPONSORSHIP_LIFETIME_NOTICE,
  ACTIONS_NEVER_EXPIRE,
} from '@/features/billing/constants/billing-constants';

type PlanId = 'free' | 'plus' | 'pro';

interface PlanCardProps {
  id: PlanId;
  name: string;
  description: string;
  price: number;
  icon: React.ElementType;
  color: string;
  features: readonly string[];
  highlighted?: boolean;
  popular?: boolean;
  currentPlan?: PlanId | null;
  onAction?: () => void;
  actionLabel?: string;
  disabled?: boolean;
  badge?: string;
  badgeColor?: string;
  subtext?: string;
  tooltip?: string;
}

function PlanCard({
  id,
  name,
  description,
  price,
  icon: Icon,
  color,
  features,
  highlighted = false,
  popular = false,
  currentPlan,
  onAction,
  actionLabel,
  disabled = false,
  badge,
  badgeColor,
  subtext,
  tooltip,
}: PlanCardProps) {
  const isCurrent = currentPlan === id;
  const isDowngrade = currentPlan === 'pro' && id === 'plus';
  const isDisabled =
    disabled ||
    (currentPlan && currentPlan !== 'free' && id === 'free') ||
    isDowngrade;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className={cn(
        'relative rounded-[32px] border-2 bg-white dark:bg-[#10121a] p-8 shadow-sm transition-all flex flex-col',
        highlighted && !isDisabled
          ? 'border-indigo-200 dark:border-indigo-800 ring-2 ring-indigo-200 dark:ring-indigo-800 shadow-xl'
          : 'border-zinc-200/80 dark:border-white/5',
        isDisabled && 'opacity-60'
      )}
    >
      {/* Popular Badge */}
      {popular && !isDisabled && (
        <div className="absolute top-0 z-20 -translate-x-1/2 -translate-y-1/2 left-1/2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-indigo-500 px-4 py-1.5 text-xs font-bold text-white shadow-lg whitespace-nowrap">
            <Sparkles className="w-3 h-3" />
            NAJPOPULARNIEJSZY
          </div>
        </div>
      )}

      {/* Status Badge */}
      {badge && (
        <div className="absolute top-0 z-20 -translate-x-1/2 -translate-y-1/2 left-1/2">
          <div
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold shadow-lg whitespace-nowrap',
              badgeColor === 'green' &&
                'bg-emerald-600 text-white dark:bg-emerald-500',
              badgeColor === 'gold' &&
                'bg-gradient-to-r from-amber-500 to-amber-600 text-white',
              badgeColor === 'gray' && 'bg-zinc-600 text-white dark:bg-zinc-500'
            )}
          >
            {badge}
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
        <p className="text-sm leading-relaxed truncate text-zinc-600 dark:text-zinc-400">
          {description}
        </p>
      </div>

      {/* Price */}
      <div className="mb-6">
        <div className="flex items-baseline gap-2">
          <span className="text-5xl font-bold tracking-[-0.02em] text-zinc-900 dark:text-zinc-50">
            {price.toFixed(2)}
          </span>
          <span className="text-base text-zinc-600 dark:text-zinc-400">zł</span>
        </div>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Jednorazowa opłata
        </p>
        {subtext && (
          <p className="mt-2 text-sm font-medium line-clamp-2 text-zinc-700 dark:text-zinc-300">
            {subtext}
          </p>
        )}
      </div>

      {/* CTA Button */}
      <div className="mb-8">
        <button
          type="button"
          onClick={onAction}
          disabled={isDisabled}
          title={tooltip}
          className={cn(
            'w-full rounded-2xl px-6 py-3.5 text-sm font-bold transition-all',
            isDisabled
              ? 'cursor-not-allowed border-2 border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-500'
              : isCurrent
                ? 'border-2 border-emerald-500 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/30'
                : highlighted
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md hover:from-indigo-500 hover:to-indigo-400 hover:shadow-lg'
                  : 'border-2 border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
          )}
        >
          {actionLabel || 'Wykup teraz'}
        </button>
        {isDisabled && tooltip && (
          <p className="mt-2 text-xs text-center text-zinc-500 dark:text-zinc-400">
            {tooltip}
          </p>
        )}
      </div>

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
                  highlighted && !isDisabled
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

export function PlansPanel({
  eventId,
  onPurchase,
  currentPlan = null,
}: {
  eventId: string;
  onPurchase?: (
    eventId: string,
    plan: SponsorPlan,
    action: 'new' | 'upgrade'
  ) => Promise<void> | void;
  currentPlan?: 'free' | 'plus' | 'pro' | null;
}) {
  // Use shared constants for plan definitions
  const PLANS = [
    {
      id: 'free' as PlanId,
      name: 'Free',
      description: EVENT_PLAN_DESCRIPTIONS.FREE,
      price: EVENT_PLAN_PRICES.free,
      icon: Sparkles,
      color: 'zinc',
      features: EVENT_PLAN_FEATURES.FREE,
    },
    {
      id: 'plus' as PlanId,
      name: 'Plus',
      description: EVENT_PLAN_DESCRIPTIONS.PLUS,
      price: EVENT_PLAN_PRICES.plus,
      icon: Zap,
      color: 'indigo',
      popular: !currentPlan || currentPlan === 'free',
      highlighted: true,
      features: EVENT_PLAN_FEATURES.PLUS,
    },
    {
      id: 'pro' as PlanId,
      name: 'Pro',
      description: EVENT_PLAN_DESCRIPTIONS.PRO,
      price: EVENT_PLAN_PRICES.pro,
      icon: Crown,
      color: 'amber',
      features: EVENT_PLAN_FEATURES.PRO,
    },
  ];

  const getPlanCardProps = (plan: (typeof PLANS)[number]) => {
    const isCurrent = currentPlan === plan.id;
    const canUpgrade = currentPlan === 'plus' && plan.id === 'pro';
    const isLocked =
      currentPlan && currentPlan !== 'free' && plan.id === 'free';
    const isDowngrade = currentPlan === 'pro' && plan.id === 'plus';

    let badge = '';
    let badgeColor = '';
    let actionLabel = '';
    let subtext = '';
    let tooltip = '';

    if (isCurrent) {
      badge = '✓ Aktywny plan';
      badgeColor = 'green';
      if (plan.id !== 'free') {
        actionLabel = 'Aktywny';
        subtext =
          'Ten plan jest aktywny. Możesz dokupić akcje w zakładce Subskrypcja.';
      }
    } else if (canUpgrade) {
      badge = '⬆ Upgrade dostępny';
      badgeColor = 'gold';
      actionLabel = 'Ulepsz do Pro';
      subtext = 'Zyskaj więcej podbić, pushy, analitykę i masowe wiadomości.';
    } else if (isLocked) {
      badge = 'Plan nieaktywny';
      badgeColor = 'gray';
      actionLabel = 'Niedostępny';
      subtext =
        'Ten event posiada aktywny płatny plan. Downgrade nie jest możliwy.';
      tooltip = 'Downgrade nie jest możliwy.';
    } else if (isDowngrade) {
      actionLabel = 'Niedostępny';
      tooltip = 'Nie możesz cofnąć planu. Downgrade nie jest możliwy.';
    } else {
      actionLabel = 'Wykup teraz';
    }

    const handleAction = async () => {
      if (canUpgrade && onPurchase) {
        await onPurchase(eventId, 'Pro', 'upgrade');
      } else if (!isCurrent && !isLocked && !isDowngrade && onPurchase) {
        const sponsorPlan =
          plan.id === 'plus' ? 'Plus' : plan.id === 'pro' ? 'Pro' : null;
        if (sponsorPlan) {
          await onPurchase(eventId, sponsorPlan, 'new');
        }
      }
    };

    return {
      ...plan,
      currentPlan,
      onAction: isCurrent && plan.id !== 'free' ? undefined : handleAction,
      actionLabel,
      badge,
      badgeColor,
      subtext,
      tooltip,
      disabled: isLocked || isDowngrade || (isCurrent && plan.id !== 'free'),
    };
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4 text-center">
        <h2 className="text-2xl font-bold tracking-[-0.02em] text-zinc-900 dark:text-zinc-50">
          Plany sponsorowania wydarzenia
        </h2>
        <p className="text-base text-zinc-600 dark:text-zinc-400 max-w-[60ch] mx-auto leading-relaxed">
          Plan sponsorowania jest aktywny przez cały cykl życia wydarzenia.
          Upgrade jest możliwy. Dokupienie akcji dostępne w zakładce
          Subskrypcja.
        </p>
      </div>

      {/* Plans Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {PLANS.map((plan) => (
          <PlanCard key={plan.id} {...getPlanCardProps(plan)} />
        ))}
      </div>

      {/* Info Banners */}
      <div className="space-y-4">
        {/* Stackowanie akcji */}
        <div className="rounded-[24px] border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20 p-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <p className="mb-1 text-sm font-semibold text-indigo-900 dark:text-indigo-100">
                {EVENT_SPONSORSHIP_LIFETIME_NOTICE}
              </p>
              <p className="text-sm leading-relaxed text-indigo-800 dark:text-indigo-200">
                {ACTIONS_NEVER_EXPIRE}
              </p>
            </div>
          </div>
        </div>

        {/* Info note */}
        {currentPlan && currentPlan !== 'free' && (
          <div className="rounded-[24px] border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-6 text-center">
            <p className="text-sm leading-relaxed text-emerald-800 dark:text-emerald-200">
              💡 <strong>Wskazówka:</strong> Dokupienie akcji dostępne jest w
              zakładce Subskrypcja → Doładuj akcje
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
