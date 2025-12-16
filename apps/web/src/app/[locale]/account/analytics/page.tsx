/**
 * Analytics Page
 *
 * Coming soon - will display user analytics and statistics.
 * All text uses i18n via useI18n hook.
 */

'use client';

import { BarChart3 } from 'lucide-react';

import { useI18n } from '@/lib/i18n/provider-ssr';

import {
  AccountEmptyState,
  AccountPageHeader,
} from '@/features/account/components';

export default function AnalyticsPage() {
  const { t } = useI18n();

  return (
    <div className="space-y-8">
      <AccountPageHeader
        title={t.analytics.title}
        description={t.analytics.subtitle}
      />

      <AccountEmptyState
        illustration={
          <div className="flex items-center justify-center rounded-2xl bg-zinc-50 p-10 dark:bg-zinc-900">
            <BarChart3 className="h-28 w-28 text-indigo-600 dark:text-indigo-400" />
          </div>
        }
        title={t.analytics.comingSoon.title}
        description={t.analytics.comingSoon.description}
        action={
          <button
            type="button"
            disabled
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-500 shadow-sm cursor-not-allowed dark:border-zinc-700 dark:bg-zinc-900"
          >
            {t.analytics.comingSoon.button}
          </button>
        }
      />
    </div>
  );
}
