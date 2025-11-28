import { AccountPageHeader, AccountEmptyState } from '../_components';
import { BarChart3 } from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <div className="space-y-8">
      <AccountPageHeader
        title="Analytics"
        description="Track your event performance and engagement"
      />

      <AccountEmptyState
        illustration={
          <div className="flex items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 p-12 dark:from-indigo-900/20 dark:to-violet-900/20">
            <BarChart3 className="h-32 w-32 text-indigo-600 dark:text-indigo-400" />
          </div>
        }
        title="Analytics coming soon"
        description="We're working on bringing you detailed analytics for your events. Track views, engagement, and more."
        action={
          <button
            type="button"
            disabled
            className="inline-flex items-center gap-2 rounded-lg bg-zinc-200 px-6 py-3 text-base font-semibold text-zinc-500 cursor-not-allowed"
          >
            Coming Soon
          </button>
        }
      />
    </div>
  );
}
