/**
 * Plan Upgrade Banner
 * Shows upgrade message with preview of disabled feature content
 */

'use client';

import { Lock, Sparkles, Crown, ArrowRight, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export type SponsorshipPlan = 'FREE' | 'PLUS' | 'PRO' | null | undefined;

interface PlanUpgradeBannerProps {
  /** Current plan of the intent */
  currentPlan: SponsorshipPlan;
  /** Minimum required plan for this feature */
  requiredPlan: 'PLUS' | 'PRO';
  /** Name of the feature being locked */
  featureName: string;
  /** Description of what the feature does */
  featureDescription: string;
  /** Intent ID for navigation */
  intentId: string;
  /** Children to render as disabled preview */
  children: React.ReactNode;
}

/**
 * Checks if user has access to the feature based on their plan
 */
function hasAccess(
  currentPlan: SponsorshipPlan,
  requiredPlan: 'PLUS' | 'PRO'
): boolean {
  if (!currentPlan || currentPlan === 'FREE') return false;
  if (currentPlan === 'PRO') return true;
  if (currentPlan === 'PLUS' && requiredPlan === 'PLUS') return true;
  return false;
}

/**
 * Shows a banner for upgrading plan with disabled preview of the feature
 */
export function PlanUpgradeBanner({
  currentPlan,
  requiredPlan,
  featureName,
  featureDescription,
  intentId,
  children,
}: PlanUpgradeBannerProps) {
  const userHasAccess = hasAccess(currentPlan, requiredPlan);

  // If user has access, just render children
  if (userHasAccess) {
    return <>{children}</>;
  }

  const isPro = requiredPlan === 'PRO';
  const planLabel = isPro ? 'Pro' : 'Plus';

  return (
    <div className="space-y-6">
      {/* Upgrade Banner */}
      <div
        className={cn(
          'relative overflow-hidden rounded-2xl border p-6 shadow-sm',
          isPro
            ? 'border-amber-200/80 dark:border-amber-800/50 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-900/20 dark:via-orange-900/15 dark:to-yellow-900/10'
            : 'border-indigo-200/80 dark:border-indigo-800/50 bg-gradient-to-br from-indigo-50 via-violet-50 to-purple-50 dark:from-indigo-900/20 dark:via-violet-900/15 dark:to-purple-900/10'
        )}
      >
        {/* Background decoration */}
        <div
          className={cn(
            'absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-20 blur-2xl',
            isPro ? 'bg-amber-400' : 'bg-indigo-400'
          )}
        />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          {/* Left: Icon + Content */}
          <div className="flex items-start gap-4">
            <div
              className={cn(
                'flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl',
                isPro
                  ? 'bg-amber-100 dark:bg-amber-900/40'
                  : 'bg-indigo-100 dark:bg-indigo-900/40'
              )}
            >
              <Lock
                className={cn(
                  'h-6 w-6',
                  isPro
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-indigo-600 dark:text-indigo-400'
                )}
              />
            </div>
            <div className="flex-1">
              {/* Badge */}
              <div className="mb-2 flex items-center gap-2">
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold',
                    isPro
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                      : 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white'
                  )}
                >
                  {isPro ? (
                    <Crown className="h-3 w-3" />
                  ) : (
                    <Sparkles className="h-3 w-3" />
                  )}
                  {planLabel.toUpperCase()}
                </span>
              </div>

              {/* Title */}
              <h3
                className={cn(
                  'text-lg font-semibold',
                  isPro
                    ? 'text-amber-900 dark:text-amber-100'
                    : 'text-indigo-900 dark:text-indigo-100'
                )}
              >
                {featureName}
              </h3>

              {/* Description */}
              <p
                className={cn(
                  'mt-1.5 text-sm leading-relaxed max-w-[55ch]',
                  isPro
                    ? 'text-amber-800 dark:text-amber-200'
                    : 'text-indigo-800 dark:text-indigo-200'
                )}
              >
                {featureDescription}
              </p>

              {/* Upgrade options info */}
              <div
                className={cn(
                  'mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs',
                  isPro
                    ? 'text-amber-700 dark:text-amber-300'
                    : 'text-indigo-700 dark:text-indigo-300'
                )}
              >
                <span className="flex items-center gap-1.5">
                  <span className="font-medium">💡</span>
                  Możesz wykupić plan tylko dla tego wydarzenia
                </span>
                <span className="hidden lg:inline">•</span>
                <span className="flex items-center gap-1.5">
                  <span className="font-medium">✨</span>
                  Lub ulepsz konto — nowe wydarzenia automatycznie otrzymają
                  plan
                </span>
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex flex-shrink-0 flex-col gap-2 lg:items-end">
            <Link
              href={`/intent/${intentId}/manage/plans`}
              className={cn(
                'inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg',
                isPro
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400'
                  : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500'
              )}
            >
              Ulepsz to wydarzenie
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/account/subscription"
              className={cn(
                'inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-colors',
                isPro
                  ? 'text-amber-700 hover:text-amber-900 dark:text-amber-300 dark:hover:text-amber-100'
                  : 'text-indigo-700 hover:text-indigo-900 dark:text-indigo-300 dark:hover:text-indigo-100'
              )}
            >
              Ulepsz konto
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Disabled Preview */}
      <div className="relative">
        {/* Overlay gradient at top */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-8 bg-gradient-to-b from-white dark:from-zinc-950" />

        {/* Disabled content */}
        <div
          className="pointer-events-none select-none opacity-40 grayscale"
          aria-hidden="true"
        >
          {children}
        </div>

        {/* Overlay gradient at bottom */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-16 bg-gradient-to-t from-white dark:from-zinc-950" />
      </div>
    </div>
  );
}
