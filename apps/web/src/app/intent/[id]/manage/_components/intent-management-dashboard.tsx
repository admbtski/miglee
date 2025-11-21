/**
 * Intent Management Dashboard Component
 * Shows overview, stats, and quick actions
 */

'use client';

import {
  Users,
  MessageSquare,
  Calendar,
  TrendingUp,
  Clock,
  MapPin,
  Edit,
  Settings as SettingsIcon,
} from 'lucide-react';
import Link from 'next/link';

import { useIntentQuery } from '@/lib/api/intents';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface IntentManagementDashboardProps {
  intentId: string;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  trend?: {
    value: string;
    positive: boolean;
  };
  href?: string;
}

function StatCard({ title, value, icon: Icon, trend, href }: StatCardProps) {
  const content = (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            {title}
          </p>
          <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            {value}
          </p>
          {trend && (
            <p
              className={cn(
                'mt-2 text-sm font-medium',
                trend.positive
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              )}
            >
              {trend.value}
            </p>
          )}
        </div>
        <div className="rounded-lg bg-indigo-50 p-3 dark:bg-indigo-950/50">
          <Icon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
        </div>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

/**
 * Intent Management Dashboard Component
 */
export function IntentManagementDashboard({
  intentId,
}: IntentManagementDashboardProps) {
  const { data, isLoading } = useIntentQuery({ id: intentId });
  const intent = data?.intent;

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-indigo-600 dark:border-zinc-700 dark:border-t-indigo-400" />
          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (!intent) {
    return (
      <div className="text-center">
        <p className="text-zinc-600 dark:text-zinc-400">Event not found</p>
      </div>
    );
  }

  const stats = [
    {
      title: 'Total Members',
      value: intent.joinedCount || 0,
      icon: Users,
      trend: { value: '+12% this week', positive: true },
      href: `/intent/${intentId}/manage/members`,
    },
    {
      title: 'Messages',
      value: intent.messageCount || 0,
      icon: MessageSquare,
      href: `/intent/${intentId}/manage/chat`,
    },
    {
      title: 'Views',
      value: intent.viewCount || 0,
      icon: TrendingUp,
      trend: { value: '+8% this week', positive: true },
    },
    {
      title: 'Comments',
      value: intent.commentCount || 0,
      icon: MessageSquare,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Dashboard
          </h1>
          <p className="mt-1 text-base text-zinc-600 dark:text-zinc-400">
            Overview of your event management
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/intent/${intentId}/manage/settings`}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <SettingsIcon className="h-4 w-4" />
            Settings
          </Link>
          <Link
            href={`/intent/${intentId}`}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
          >
            <Edit className="h-4 w-4" />
            View Event
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Event Info Card */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Event Information
        </h2>
        <div className="mt-4 space-y-4">
          <div>
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {intent.title}
            </h3>
            {intent.description && (
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                {intent.description}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <Calendar className="mt-0.5 h-5 w-5 text-zinc-500 dark:text-zinc-400" />
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  Start Date
                </p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {format(new Date(intent.startAt), 'PPP p')}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="mt-0.5 h-5 w-5 text-zinc-500 dark:text-zinc-400" />
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  End Date
                </p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {format(new Date(intent.endAt), 'PPP p')}
                </p>
              </div>
            </div>

            {intent.location && (
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 text-zinc-500 dark:text-zinc-400" />
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    Location
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {intent.location.city}, {intent.location.country}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <Users className="mt-0.5 h-5 w-5 text-zinc-500 dark:text-zinc-400" />
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  Capacity
                </p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {intent.joinedCount} / {intent.max} members
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Quick Actions
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href={`/intent/${intentId}/manage/members`}
            className="flex items-center gap-3 rounded-lg border border-zinc-200 p-4 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"
          >
            <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Manage Members
            </span>
          </Link>
          <Link
            href={`/intent/${intentId}/manage/chat`}
            className="flex items-center gap-3 rounded-lg border border-zinc-200 p-4 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"
          >
            <MessageSquare className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              View Chat
            </span>
          </Link>
          <Link
            href={`/intent/${intentId}/manage/analytics`}
            className="flex items-center gap-3 rounded-lg border border-zinc-200 p-4 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"
          >
            <TrendingUp className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              View Analytics
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
