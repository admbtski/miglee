/**
 * Plans and Bills Page
 * Displays user subscription status, plan details, and payment history
 *
 * Header is always visible immediately.
 * Plan details and payment history load with a single loader.
 */

'use client';

import { Suspense } from 'react';

// Icons
import { Loader2 } from 'lucide-react';

// i18n & Layout
import { useI18n } from '@/lib/i18n/provider-ssr';
import { AccountPageHeader } from '../_components';

// Local components
import { BillingContent } from './_components/billing-page-wrapper';
import { PaymentResultModal } from './_components/payment-result-modal';

// TODO: Add i18n for "Loading billing information..."
function BillingContentLoader() {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-10 h-10 mx-auto animate-spin text-indigo-600 dark:text-indigo-400" />
        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
          Loading billing information...
        </p>
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
