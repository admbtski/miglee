'use client';

import { Check, Sparkles, Zap, Crown, Rocket } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { cn } from '@/lib/utils';

type BillingCycle = 'monthly' | 'annual';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    description: 'Perfect for trying out miglee',
    monthlyPrice: 0,
    annualPrice: 0,
    icon: Sparkles,
    color: 'zinc',
    features: [
      'Create up to 3 events per month',
      'Basic event management',
      'Up to 20 participants per event',
      'Community support',
      'Mobile app access',
    ],
  },
  {
    id: 'plus',
    name: 'Plus',
    description: 'For active organizers',
    monthlyPrice: 15,
    annualPrice: 12, // -20% annually (15 * 12 = 180, 12 * 12 = 144)
    icon: Zap,
    color: 'indigo',
    features: [
      'Unlimited events',
      'Advanced analytics',
      'Up to 100 participants per event',
      'Priority support',
      'Custom branding',
      'Email notifications',
      'Event templates',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For professional organizers',
    monthlyPrice: 39,
    annualPrice: 31.2, // -20% annually (39 * 12 = 468, 31.2 * 12 = 374.4)
    icon: Crown,
    color: 'amber',
    popular: true,
    features: [
      'Everything in Plus',
      'Unlimited participants',
      'Advanced integrations',
      'API access',
      'White-label solution',
      'Dedicated account manager',
      'Custom domain',
      'Advanced reporting',
    ],
  },
  {
    id: 'ultra',
    name: 'Ultra',
    description: 'For enterprise organizations',
    monthlyPrice: 99,
    annualPrice: 79.2, // -20% annually (99 * 12 = 1188, 79.2 * 12 = 950.4)
    icon: Rocket,
    color: 'violet',
    features: [
      'Everything in Pro',
      'Unlimited everything',
      'Custom infrastructure',
      'SLA guarantee (99.9%)',
      'Dedicated server resources',
      'Advanced security features',
      'Custom integrations',
      'White-glove onboarding',
      '24/7 phone support',
    ],
  },
];

export function SubscriptionPlans() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');

  const getPrice = (plan: (typeof PLANS)[0]) => {
    return billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice;
  };

  const getSavings = (plan: (typeof PLANS)[0]) => {
    if (billingCycle === 'annual' && plan.monthlyPrice > 0) {
      const monthlyCost = plan.monthlyPrice * 12;
      const annualCost = plan.annualPrice * 12;
      return monthlyCost - annualCost;
    }
    return 0;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold tracking-[-0.02em] text-zinc-900 dark:text-zinc-50">
          Choose Your Plan
        </h2>
        <p className="text-base text-zinc-600 dark:text-zinc-400 max-w-[60ch] mx-auto leading-relaxed">
          Upgrade your account to unlock more features and grow your events
        </p>

        {/* Billing Cycle Toggle */}
        <div className="inline-flex items-center gap-3 rounded-2xl border-2 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-1.5">
          <button
            type="button"
            onClick={() => setBillingCycle('monthly')}
            className={cn(
              'relative px-6 py-2.5 text-sm font-semibold rounded-xl transition-all',
              billingCycle === 'monthly'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-md'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50'
            )}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle('annual')}
            className={cn(
              'relative px-6 py-2.5 text-sm font-semibold rounded-xl transition-all',
              billingCycle === 'annual'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-md'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50'
            )}
          >
            <span>Annual</span>
            <span className="ml-2 inline-flex items-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
              -20%
            </span>
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((plan, index) => {
          const Icon = plan.icon;
          const price = getPrice(plan);
          const savings = getSavings(plan);
          const isPopular = plan.popular;

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                'relative overflow-hidden rounded-[32px] border-2 bg-white dark:bg-[#10121a] p-8 shadow-sm transition-all hover:shadow-lg',
                isPopular
                  ? 'border-indigo-200 dark:border-indigo-800 ring-2 ring-indigo-200 dark:ring-indigo-800 shadow-xl'
                  : 'border-zinc-200/80 dark:border-white/5'
              )}
            >
              {/* Popular Badge */}
              {isPopular && (
                <div className="absolute top-0 right-8 -translate-y-1/2">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-indigo-500 px-4 py-1.5 text-xs font-bold text-white shadow-lg">
                    <Sparkles className="h-3 w-3" />
                    MOST POPULAR
                  </div>
                </div>
              )}

              {/* Icon */}
              <div
                className={cn(
                  'mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl',
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

              {/* Name & Description */}
              <div className="mb-6">
                <h3 className="mb-2 text-2xl font-bold tracking-[-0.02em] text-zinc-900 dark:text-zinc-50">
                  {plan.name}
                </h3>
                <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {plan.description}
                </p>
              </div>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold tracking-[-0.02em] text-zinc-900 dark:text-zinc-50">
                    ${price}
                  </span>
                  <span className="text-base text-zinc-600 dark:text-zinc-400">
                    /month
                  </span>
                </div>
                {savings > 0 && (
                  <p className="mt-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    Save ${savings.toFixed(0)}/year
                  </p>
                )}
                {billingCycle === 'annual' && plan.monthlyPrice > 0 && (
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    ${(price * 12).toFixed(0)} billed annually
                  </p>
                )}
              </div>

              {/* CTA Button */}
              <button
                type="button"
                className={cn(
                  'mb-8 w-full rounded-2xl px-6 py-3.5 text-sm font-bold transition-all',
                  isPopular
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md hover:from-indigo-500 hover:to-indigo-400 hover:shadow-lg'
                    : 'border-2 border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                )}
              >
                {plan.id === 'free' ? 'Current Plan' : 'Upgrade Now'}
              </button>

              {/* Features */}
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  What's Included
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
      <div className="rounded-[24px] border border-zinc-200/80 dark:border-white/5 bg-zinc-50 dark:bg-zinc-900/50 p-6 text-center">
        <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          All plans include a 14-day money-back guarantee. Cancel anytime, no
          questions asked.
        </p>
      </div>
    </div>
  );
}
