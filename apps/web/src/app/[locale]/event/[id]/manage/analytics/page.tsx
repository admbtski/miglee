/**
 * Event Analytics Page
 * View event analytics and statistics
 */

// TODO i18n: metadata title and description

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { BarChart3, Eye, TrendingUp, Users } from 'lucide-react';

import { AnalyticsPanelWrapper } from './_components/analytics-panel-wrapper';
import { ManagementPageLayout } from '@/features/event-management/components/management-page-layout';

// =============================================================================
// Types
// =============================================================================

type PageProps = {
  params: Promise<{ id: string }>;
};

// =============================================================================
// Loading Skeleton
// =============================================================================

function AnalyticsLoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Stats Cards Skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-zinc-200 dark:bg-zinc-700" />
              <div>
                <div className="h-7 w-12 rounded bg-zinc-200 dark:bg-zinc-700 mb-2" />
                <div className="h-4 w-24 rounded bg-zinc-200 dark:bg-zinc-700" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart Skeleton */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="h-5 w-40 rounded bg-zinc-200 dark:bg-zinc-700 mb-6" />
        <div className="h-64 rounded-xl bg-zinc-100 dark:bg-zinc-800" />
      </div>
    </div>
  );
}

// =============================================================================
// Analytics Coming Soon Component
// =============================================================================

function AnalyticsComingSoon() {
  type ColorKey = 'indigo' | 'emerald' | 'amber' | 'purple';

  const stats: Array<{
    label: string;
    value: string;
    icon: typeof Eye;
    color: ColorKey;
  }> = [
    { label: 'Wyświetlenia', value: '—', icon: Eye, color: 'indigo' },
    {
      label: 'Unikalni użytkownicy',
      value: '—',
      icon: Users,
      color: 'emerald',
    },
    { label: 'Konwersja', value: '—', icon: TrendingUp, color: 'amber' },
    { label: 'Zaangażowanie', value: '—', icon: BarChart3, color: 'purple' },
  ];

  const colorClasses = {
    indigo: {
      bg: 'bg-indigo-50 dark:bg-indigo-900/30',
      icon: 'text-indigo-600 dark:text-indigo-400',
    },
    emerald: {
      bg: 'bg-emerald-50 dark:bg-emerald-900/30',
      icon: 'text-emerald-600 dark:text-emerald-400',
    },
    amber: {
      bg: 'bg-amber-50 dark:bg-amber-900/30',
      icon: 'text-amber-600 dark:text-amber-400',
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-900/30',
      icon: 'text-purple-600 dark:text-purple-400',
    },
  } as const;

  return (
    <div className="space-y-6">
      {/* Stats Preview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const colors = colorClasses[stat.color] || colorClasses.indigo;
          return (
            <div
              key={stat.label}
              className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors.bg}`}
                >
                  <stat.icon className={`h-5 w-5 ${colors.icon}`} />
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
          );
        })}
      </div>

      {/* Coming Soon Message */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-900/30">
          <BarChart3 className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
        </div>
        {/* TODO i18n */}
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Analityka wkrótce
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500 dark:text-zinc-400">
          Pracujemy nad zaawansowaną analityką, która pomoże Ci zrozumieć wyniki
          Twojego wydarzenia. Śledź wyświetlenia, zaangażowanie i konwersję.
        </p>
        <div className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500" />
          </span>
          W trakcie rozwoju
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Page Component
// =============================================================================

export default async function EventAnalyticsPage({ params }: PageProps) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  return (
    <ManagementPageLayout
      // TODO i18n
      title="Analityka"
      description="Śledź wyniki i zaangażowanie uczestników"
    >
      <Suspense fallback={<AnalyticsLoadingSkeleton />}>
        <AnalyticsPanelWrapper eventId={id}>
          <AnalyticsComingSoon />
        </AnalyticsPanelWrapper>
      </Suspense>
    </ManagementPageLayout>
  );
}

// =============================================================================
// Metadata
// =============================================================================

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  await params;

  return {
    // TODO i18n
    title: 'Analityka | Miglee',
    description: 'Przeglądaj analitykę wydarzenia',
  };
}
