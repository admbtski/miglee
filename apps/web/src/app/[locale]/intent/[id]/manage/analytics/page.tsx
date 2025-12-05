/**
 * Intent Analytics Page
 * View event analytics and statistics
 */

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { ManagementPageLayout } from '../_components/management-page-layout';
import { AnalyticsPanelWrapper } from './_components/analytics-panel-wrapper';
import { BarChart3, TrendingUp, Users, Eye } from 'lucide-react';

type PageProps = {
  params: Promise<{ id: string }>;
};

function AnalyticsComingSoon() {
  return (
    <div className="space-y-6">
      {/* Stats Preview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Views', value: '—', icon: Eye, color: 'indigo' },
          { label: 'Unique Visitors', value: '—', icon: Users, color: 'emerald' },
          { label: 'Conversion Rate', value: '—', icon: TrendingUp, color: 'amber' },
          { label: 'Engagement', value: '—', icon: BarChart3, color: 'purple' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl bg-${stat.color}-50 dark:bg-${stat.color}-900/30`}
              >
                <stat.icon
                  className={`h-5 w-5 text-${stat.color}-600 dark:text-${stat.color}-400`}
                />
              </div>
              <div>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {stat.value}
                </p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {stat.label}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Coming Soon Message */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-900/30">
          <BarChart3 className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Analytics Coming Soon
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500 dark:text-zinc-400">
          We're building powerful analytics to help you understand your event's
          performance. Track views, engagement, and conversion rates.
        </p>
        <div className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500" />
          </span>
          In Development
        </div>
      </div>
    </div>
  );
}

export default async function IntentAnalyticsPage({ params }: PageProps) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  return (
    <ManagementPageLayout
      title="Analytics"
      description="Track your event's performance and engagement"
    >
      <Suspense
        fallback={
          <div className="flex min-h-[300px] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-zinc-200 border-t-indigo-600 dark:border-zinc-700 dark:border-t-indigo-400" />
              <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
                Loading analytics...
              </p>
            </div>
          </div>
        }
      >
        <AnalyticsPanelWrapper intentId={id}>
          <AnalyticsComingSoon />
        </AnalyticsPanelWrapper>
      </Suspense>
    </ManagementPageLayout>
  );
}

export async function generateMetadata({ params }: PageProps) {
  await params;

  return {
    title: 'Analytics | Miglee',
    description: 'View event analytics',
  };
}
