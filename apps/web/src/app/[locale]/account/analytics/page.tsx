/**
 * Analytics Page
 * Coming soon - will display user analytics and statistics
 */

'use client';

// Icons
import { BarChart3 } from 'lucide-react';

// i18n & Layout
import { useI18n } from '@/lib/i18n/provider-ssr';
import { AccountEmptyState, AccountPageHeader } from '../_components';

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
          <div className="flex items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 p-12 dark:from-indigo-900/20 dark:to-violet-900/20">
            <BarChart3 className="h-32 w-32 text-indigo-600 dark:text-indigo-400" />
          </div>
        }
        title={t.analytics.comingSoon.title}
        description={t.analytics.comingSoon.description}
        action={
          <button
            type="button"
            disabled
            className="inline-flex items-center gap-2 rounded-lg bg-zinc-200 px-6 py-3 text-base font-semibold text-zinc-500 cursor-not-allowed"
          >
            {t.analytics.comingSoon.button}
          </button>
        }
      />
    </div>
  );
}
