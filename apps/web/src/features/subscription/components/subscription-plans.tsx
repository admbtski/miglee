'use client';

import { motion } from 'framer-motion';
import { Check, Crown, Info, Sparkles, Zap } from 'lucide-react';
import { useState } from 'react';

import {
  PLAN_SCOPE_NOTICE_EXTENDED,
  USER_PLAN_DESCRIPTIONS,
  USER_PLAN_FEATURES,
  USER_PLAN_PRICES,
} from '@/features/billing/constants/billing-constants';
import { useI18n } from '@/lib/i18n/provider-ssr';
import { cn } from '@/lib/utils';

import type { BillingType, PlanType } from './subscription-plans-wrapper';

interface SubscriptionPlansProps {
  onPlanSelect?: (plan: {
    id: PlanType;
    name: string;
    billingType: BillingType;
    price: number;
  }) => void;
  currentPlan?: 'FREE' | 'PLUS' | 'PRO';
}

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    description: USER_PLAN_DESCRIPTIONS.FREE,
    priceMonthlySubscription: USER_PLAN_PRICES.free.monthlySubscription,
    priceMonthlyOnetime: USER_PLAN_PRICES.free.monthlyOnetime,
    priceAnnualOnetime: USER_PLAN_PRICES.free.annualOnetime,
    icon: Sparkles,
    color: 'zinc',
    features: USER_PLAN_FEATURES.FREE,
  },
  {
    id: 'plus',
    name: 'Plus',
    description: USER_PLAN_DESCRIPTIONS.PLUS,
    priceMonthlySubscription: USER_PLAN_PRICES.plus.monthlySubscription,
    priceMonthlyOnetime: USER_PLAN_PRICES.plus.monthlyOnetime,
    priceAnnualOnetime: USER_PLAN_PRICES.plus.annualOnetime,
    icon: Zap,
    color: 'indigo',
    popular: true,
    features: USER_PLAN_FEATURES.PLUS,
  },
  {
    id: 'pro',
    name: 'Pro',
    description: USER_PLAN_DESCRIPTIONS.PRO,
    priceMonthlySubscription: USER_PLAN_PRICES.pro.monthlySubscription,
    priceMonthlyOnetime: USER_PLAN_PRICES.pro.monthlyOnetime,
    priceAnnualOnetime: USER_PLAN_PRICES.pro.annualOnetime,
    icon: Crown,
    color: 'amber',
    popular: false,
    features: USER_PLAN_FEATURES.PRO,
  },
];

export function SubscriptionPlans({
  onPlanSelect,
  currentPlan = 'FREE',
}: SubscriptionPlansProps) {
  const { t } = useI18n();
  const [billingType, setBillingType] = useState<BillingType>(
    'monthly-subscription'
  );
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  const getPrice = (plan: (typeof PLANS)[0]) => {
    if (billingType === 'monthly-subscription')
      return plan.priceMonthlySubscription;
    if (billingType === 'monthly-onetime') return plan.priceMonthlyOnetime;
    return plan.priceAnnualOnetime;
  };

  const getPriceLabel = () => {
    if (billingType === 'monthly-subscription')
      return t.subscriptionPlans.priceLabels.perMonth;
    if (billingType === 'monthly-onetime')
      return t.subscriptionPlans.priceLabels.perMonth;
    return t.subscriptionPlans.priceLabels.perYear;
  };

  const getBadgeConfig = () => {
    if (billingType === 'monthly-subscription') {
      return {
        tooltipText: t.subscriptionPlans.tooltips.subscription,
        paymentType: t.subscriptionPlans.badges.autoRenewal,
      };
    }
    if (billingType === 'monthly-onetime') {
      return {
        tooltipText: t.subscriptionPlans.tooltips.monthly,
        paymentType: t.subscriptionPlans.badges.noSubscription,
      };
    }
    return {
      tooltipText: t.subscriptionPlans.tooltips.yearly,
      paymentType: t.subscriptionPlans.badges.oneTimeCharge,
    };
  };

  const getSavings = (plan: (typeof PLANS)[0]) => {
    if (billingType === 'annual-onetime' && plan.priceMonthlySubscription > 0) {
      const monthlyCost = plan.priceMonthlySubscription * 12;
      const annualCost = plan.priceAnnualOnetime;
      return monthlyCost - annualCost;
    }
    return 0;
  };

  const badgeConfig = getBadgeConfig();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4 text-center">
        <h2 className="text-2xl font-bold tracking-[-0.02em] text-zinc-900 dark:text-zinc-50">
          {t.subscriptionPlans.title}
        </h2>
        <p className="text-base text-zinc-600 dark:text-zinc-400 max-w-[60ch] mx-auto leading-relaxed">
          {t.subscriptionPlans.subtitle}
        </p>

        {/* Billing Type Selection */}
        <div className="inline-flex flex-col gap-3">
          <div className="inline-flex items-center gap-2 rounded-2xl border-2 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-1.5">
            <button
              type="button"
              onClick={() => setBillingType('monthly-subscription')}
              className={cn(
                'relative px-5 py-2.5 text-sm font-semibold rounded-xl transition-all whitespace-nowrap',
                billingType === 'monthly-subscription'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-md'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50'
              )}
            >
              {t.subscriptionPlans.billingTypes.subscription}
            </button>
            <button
              type="button"
              onClick={() => setBillingType('monthly-onetime')}
              className={cn(
                'relative px-5 py-2.5 text-sm font-semibold rounded-xl transition-all whitespace-nowrap',
                billingType === 'monthly-onetime'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-md'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50'
              )}
            >
              {t.subscriptionPlans.billingTypes.monthly}
            </button>
            <button
              type="button"
              onClick={() => setBillingType('annual-onetime')}
              className={cn(
                'relative px-5 py-2.5 text-sm font-semibold rounded-xl transition-all whitespace-nowrap',
                billingType === 'annual-onetime'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-md'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50'
              )}
            >
              <span>{t.subscriptionPlans.billingTypes.yearly}</span>
              <span className="ml-2 inline-flex items-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                {t.subscriptionPlans.billingTypes.save20}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {PLANS.map((plan, index) => {
          const Icon = plan.icon;
          const price = getPrice(plan);
          const savings = getSavings(plan);
          const isPopular = plan.popular;
          const isFree = plan.id === 'free';
          const isCurrent =
            (currentPlan === 'FREE' && plan.id === 'free') ||
            (currentPlan === 'PLUS' && plan.id === 'plus') ||
            (currentPlan === 'PRO' && plan.id === 'pro');

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                'relative rounded-[32px] border-2 bg-white dark:bg-[#10121a] p-8 shadow-sm transition-all hover:shadow-lg flex flex-col',
                isPopular
                  ? 'border-indigo-200 dark:border-indigo-800 ring-2 ring-indigo-200 dark:ring-indigo-800 shadow-xl'
                  : 'border-zinc-200/80 dark:border-white/5'
              )}
            >
              {/* Popular Badge */}
              {isPopular && !isCurrent && (
                <div className="absolute top-0 z-20 -translate-x-1/2 -translate-y-1/2 left-1/2">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-indigo-500 px-4 py-1.5 text-xs font-bold text-white shadow-lg whitespace-nowrap">
                    <Sparkles className="w-3 h-3" />
                    {t.subscriptionPlans.badges.mostPopular}
                  </div>
                </div>
              )}

              {/* Current Plan Badge */}
              {isCurrent && (
                <div className="absolute top-0 z-20 -translate-x-1/2 -translate-y-1/2 left-1/2">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-500 px-4 py-1.5 text-xs font-bold text-white shadow-lg whitespace-nowrap">
                    <Check className="w-3 h-3" strokeWidth={3} />
                    {t.subscriptionPlans.badges.activePlan}
                  </div>
                </div>
              )}

              {/* Tooltip in top right corner */}
              <div className="absolute z-20 top-4 right-4">
                <div className="relative group">
                  <button
                    type="button"
                    onMouseEnter={() => setShowTooltip(plan.id)}
                    onMouseLeave={() => setShowTooltip(null)}
                    className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300 transition-colors"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                  {showTooltip === plan.id && (
                    <div className="absolute right-0 z-50 w-64 px-3 py-2 mt-2 text-xs leading-relaxed text-white rounded-lg shadow-lg pointer-events-none top-full bg-zinc-900 dark:bg-zinc-800">
                      <div className="absolute top-0 -mt-2 border-4 border-transparent right-4 border-b-zinc-900 dark:border-b-zinc-800"></div>
                      {badgeConfig.tooltipText}
                    </div>
                  )}
                </div>
              </div>

              {/* Icon - Fixed height */}
              <div className="mb-6">
                <div
                  className={cn(
                    'inline-flex h-14 w-14 items-center justify-center rounded-2xl',
                    plan.color === 'zinc' &&
                      'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400',
                    plan.color === 'indigo' &&
                      'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
                    plan.color === 'amber' &&
                      'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
                    plan.color === 'violet' &&
                      'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400'
                  )}
                >
                  <Icon className="h-7 w-7" strokeWidth={2} />
                </div>
              </div>

              {/* Name & Description - Fixed height */}
              <div className="mb-6">
                <h3 className="mb-2 text-2xl font-bold tracking-[-0.02em] text-zinc-900 dark:text-zinc-50">
                  {plan.name}
                </h3>
                <p className="text-sm leading-relaxed truncate text-zinc-600 dark:text-zinc-400">
                  {plan.description}
                </p>
              </div>

              {/* Price - Fixed height */}
              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold tracking-[-0.02em] text-zinc-900 dark:text-zinc-50">
                    zł{price}
                  </span>
                  <span className="text-base truncate text-zinc-600 dark:text-zinc-400">
                    {getPriceLabel()}
                  </span>
                </div>

                {/* Savings */}
                {savings > 0 ? (
                  <p className="mt-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    {t.subscriptionPlans.priceLabels.saveYearly} zł
                    {savings.toFixed(2)}{' '}
                    {t.subscriptionPlans.priceLabels.yearly}
                  </p>
                ) : (
                  <p className="mt-2 text-sm font-medium text-transparent">
                    &nbsp;
                  </p>
                )}

                {/* Payment type label */}
                <div className="mt-2">
                  <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                    {badgeConfig.paymentType}
                  </span>
                </div>
              </div>

              {/* CTA Button */}
              <button
                type="button"
                onClick={() => {
                  if (!isFree && !isCurrent && onPlanSelect) {
                    onPlanSelect({
                      id: plan.id as PlanType,
                      name: plan.name,
                      billingType: billingType,
                      price: price,
                    });
                  }
                }}
                disabled={isFree || isCurrent}
                className={cn(
                  'mb-8 w-full rounded-2xl px-6 py-3.5 text-sm font-bold transition-all',
                  isFree || isCurrent
                    ? 'border-2 border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 cursor-not-allowed'
                    : isPopular
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md hover:from-indigo-500 hover:to-indigo-400 hover:shadow-lg'
                      : 'border-2 border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                )}
              >
                {isCurrent
                  ? t.subscriptionPlans.buttons.activePlan
                  : isFree
                    ? t.subscriptionPlans.buttons.freePlan
                    : t.subscriptionPlans.buttons.selectPlan}
              </button>

              {/* Features */}
              <div className="space-y-3">
                <p className="text-xs font-semibold tracking-wider uppercase text-zinc-500 dark:text-zinc-400">
                  {t.subscriptionPlans.features.included}
                </p>
                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300"
                    >
                      <Check
                        className={cn(
                          'h-5 w-5 shrink-0 mt-0.5',
                          isPopular
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
        })}
      </div>

      {/* Info Banner */}
      <div className="rounded-[24px] border border-zinc-200/80 dark:border-white/5 bg-zinc-50 dark:bg-zinc-900/50 p-6 space-y-3">
        <p className="text-sm leading-relaxed text-center text-zinc-600 dark:text-zinc-400">
          {billingType === 'monthly-subscription'
            ? t.subscriptionPlans.infoBanner.subscriptionNote
            : t.subscriptionPlans.infoBanner.onetimeNote}
        </p>
        <div className="pt-3 border-t border-zinc-200 dark:border-zinc-700">
          <p className="text-xs leading-relaxed text-center text-zinc-500 dark:text-zinc-400">
            💡 <strong>{t.subscriptionPlans.infoBanner.important}</strong>{' '}
            {PLAN_SCOPE_NOTICE_EXTENDED}
          </p>
        </div>
      </div>
    </div>
  );
}
