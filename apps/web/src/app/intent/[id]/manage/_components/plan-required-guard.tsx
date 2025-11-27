/**
 * Plan Required Guard
 * Shows a message and upgrade CTA when feature requires a higher plan
 */

'use client';

import { Crown, Sparkles, ArrowRight, Lock } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PlanRequiredGuardProps {
  currentPlan: 'free' | 'plus' | 'pro';
  requiredPlan: 'plus' | 'pro';
  featureName: string;
  featureDescription?: string;
  intentId: string;
  children: React.ReactNode;
}

/**
 * Guards a feature behind a plan requirement
 * Shows children if user has access, otherwise shows upgrade prompt
 */
export function PlanRequiredGuard({
  currentPlan,
  requiredPlan,
  featureName,
  featureDescription,
  intentId,
  children,
}: PlanRequiredGuardProps) {
  // Check if user has access
  const hasAccess =
    currentPlan === 'pro' ||
    (currentPlan === 'plus' && requiredPlan === 'plus');

  if (hasAccess) {
    return <>{children}</>;
  }

  // User doesn't have access - show upgrade prompt
  const isPro = requiredPlan === 'pro';
  const needsUpgrade = currentPlan === 'plus' && requiredPlan === 'pro';

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-2xl"
      >
        {/* Lock Icon */}
        <div className="flex justify-center mb-6">
          <div
            className={cn(
              'inline-flex items-center justify-center w-20 h-20 rounded-full',
              isPro
                ? 'bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/30'
                : 'bg-gradient-to-br from-indigo-100 to-indigo-200 dark:from-indigo-900/30 dark:to-indigo-800/30'
            )}
          >
            <Lock
              className={cn(
                'w-10 h-10',
                isPro
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-indigo-600 dark:text-indigo-400'
              )}
              strokeWidth={2}
            />
          </div>
        </div>

        {/* Content Card */}
        <div className="overflow-hidden bg-white border rounded-3xl border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="p-8 text-center">
            {/* Badge */}
            <div className="flex justify-center mb-4">
              <span
                className={cn(
                  'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold',
                  isPro
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white'
                    : 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white'
                )}
              >
                {isPro ? (
                  <>
                    <Crown className="w-4 h-4" />
                    WYMAGA PRO
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    WYMAGA PLUS
                  </>
                )}
              </span>
            </div>

            {/* Title */}
            <h2 className="mb-3 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {featureName}
            </h2>

            {/* Description */}
            <p className="mb-6 text-base leading-relaxed text-zinc-600 dark:text-zinc-400 max-w-[50ch] mx-auto">
              {featureDescription ||
                `Ta funkcja jest dostępna tylko w planie ${isPro ? 'Pro' : 'Plus'}. ${needsUpgrade ? 'Ulepsz swój plan, aby uzyskać dostęp.' : 'Wykup plan, aby uzyskać dostęp do tej funkcji.'}`}
            </p>

            {/* Current Plan Info */}
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full bg-zinc-100 dark:bg-zinc-800">
              <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Aktualny plan:
              </span>
              <span className="text-sm font-bold uppercase text-zinc-900 dark:text-zinc-100">
                {currentPlan}
              </span>
            </div>

            {/* CTA Button */}
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href={`/intent/${intentId}/manage/plans`}
                className={cn(
                  'inline-flex items-center justify-center gap-2 rounded-2xl px-8 py-4 text-base font-bold transition-all shadow-md hover:shadow-lg',
                  isPro
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-400 hover:to-amber-500'
                    : 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white hover:from-indigo-500 hover:to-indigo-400'
                )}
              >
                {needsUpgrade
                  ? 'Ulepsz do Pro'
                  : `Wykup plan ${isPro ? 'Pro' : 'Plus'}`}
                <ArrowRight className="w-5 h-5" />
              </Link>

              <Link
                href={`/intent/${intentId}/manage`}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-medium transition-all border-2 rounded-2xl border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                Powrót do panelu
              </Link>
            </div>
          </div>

          {/* Feature Benefits */}
          <div className="px-8 py-6 border-t bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700">
            <p className="text-sm text-center text-zinc-600 dark:text-zinc-400">
              💡 <strong>Wskazówka:</strong> Plan sponsorowania wydarzenia jest
              aktywny przez cały jego cykl życia. Upgrade jest możliwy w
              dowolnym momencie.
            </p>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center">
          <Link
            href={`/intent/${intentId}/manage/subscription`}
            className="text-sm font-medium transition-colors text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Zobacz aktywną subskrypcję →
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
