/**
 * Plans and Bills Page
 * Displays user subscription status, plan details, and payment history
 *
 * Header is always visible immediately.
 * Plan details and payment history load with a single loader.
 */

'use client';

import { Suspense } from 'react';

// i18n & Layout
import { useI18n } from '@/lib/i18n/provider-ssr';
import { AccountPageHeader } from '../_components';

// Local components
import { BillingContent } from './_components/billing-page-wrapper';
import { PaymentResultModal } from './_components/payment-result-modal';

/**
 * Skeleton loader for billing page
 * Matches the structure of Current Plan Card and Payment History
 */
function BillingContentLoader() {
  return (
    <div className="space-y-8">
      {/* Current Plan Card Skeleton */}
      <div className="rounded-[32px] border-2 border-zinc-200/80 dark:border-white/5 bg-white dark:bg-[#10121a] p-6 md:p-8 shadow-sm">
        <div className="flex flex-col justify-between gap-6 mb-6 md:flex-row md:items-start">
          {/* Left side - Icon + Plan name */}
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="h-8 w-24 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                <div className="h-6 w-16 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
              </div>
              <div className="h-4 w-48 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            </div>
          </div>
          {/* Right side - Price */}
          <div className="text-left md:text-right space-y-2">
            <div className="h-10 w-32 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            <div className="h-4 w-20 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          </div>
        </div>

        {/* Progress bar skeleton */}
        <div className="mb-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-4 w-32 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            <div className="h-4 w-24 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          </div>
          <div className="h-2 w-full rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          <div className="h-3 w-40 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
        </div>

        {/* Plan Details skeleton */}
        <div className="mb-6 p-4 rounded-2xl bg-zinc-50 dark:bg-[#0a0b12] border border-zinc-200 dark:border-white/5">
          <div className="h-4 w-24 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse mb-3" />
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-16 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                <div className="h-4 w-20 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* Actions skeleton */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="h-10 w-32 rounded-2xl bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          <div className="h-10 w-28 rounded-2xl bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
        </div>
      </div>

      {/* Payment History Skeleton */}
      <div className="rounded-[32px] border-2 border-zinc-200/80 dark:border-white/5 bg-white dark:bg-[#10121a] shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 py-6 border-b md:px-8 border-zinc-200 dark:border-white/5">
          <div className="h-6 w-40 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse mb-2" />
          <div className="h-4 w-64 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
        </div>

        {/* Table skeleton */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-200 dark:divide-white/5">
            <thead>
              <tr className="text-sm text-left bg-zinc-50 dark:bg-[#0a0b12]">
                {[1, 2, 3, 4, 5].map((i) => (
                  <th key={i} className="px-4 py-3">
                    <div className="h-4 w-16 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-white/5">
              {[1, 2, 3].map((i) => (
                <tr key={i} className="text-sm">
                  {[1, 2, 3, 4, 5].map((j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 w-24 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function BillingPage() {
  const { t } = useI18n();

  return (
    <div className="space-y-8">
      {/* Header - always visible immediately */}
      <AccountPageHeader
        title={t.plansAndBills.title}
        description={t.plansAndBills.subtitle}
      />

      {/* Billing content - loads with single loader */}
      <Suspense fallback={<BillingContentLoader />}>
        <BillingContent />
      </Suspense>

      {/* Payment result modal */}
      <Suspense fallback={null}>
        <PaymentResultModal context="account" />
      </Suspense>
    </div>
  );
}
