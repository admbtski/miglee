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
  Star,
  Eye,
  Heart,
  UserPlus,
  Activity,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  Link as LinkIcon,
  UserCheck,
  Sparkles,
  BarChart3,
} from 'lucide-react';
import Link from 'next/link';

import { useIntentQuery } from '@/lib/api/intents';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow, isPast, isFuture } from 'date-fns';
import { pl } from 'date-fns/locale';
import { EventCountdownTimer } from '../../_components/event-countdown-timer';

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
  description?: string;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'pink';
}

function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  href,
  description,
  color = 'blue',
}: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400',
    green:
      'bg-green-50 text-green-600 dark:bg-green-950/50 dark:text-green-400',
    purple:
      'bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400',
    orange:
      'bg-orange-50 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400',
    pink: 'bg-pink-50 text-pink-600 dark:bg-pink-950/50 dark:text-pink-400',
  };

  const content = (
    <div
      className={cn(
        'group relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-6 transition-all dark:border-zinc-800 dark:bg-zinc-900',
        href &&
          'cursor-pointer hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-700'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            {title}
          </p>
          <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            {value}
          </p>
          {description && (
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
              {description}
            </p>
          )}
          {trend && (
            <p
              className={cn(
                'mt-2 flex items-center gap-1 text-sm font-medium',
                trend.positive
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              )}
            >
              <TrendingUp
                className={cn('h-4 w-4', !trend.positive && 'rotate-180')}
              />
              {trend.value}
            </p>
          )}
        </div>
        <div className={cn('rounded-lg p-3', colorClasses[color])}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      {href && (
        <div className="absolute bottom-0 right-0 p-4 transition-opacity opacity-0 group-hover:opacity-100">
          <ArrowRight className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        </div>
      )}
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
          <div className="w-8 h-8 mx-auto border-4 rounded-full animate-spin border-zinc-200 border-t-indigo-600 dark:border-zinc-700 dark:border-t-indigo-400" />
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

  const startDate = new Date(intent.startAt);
  const endDate = new Date(intent.endAt);
  const isUpcoming = isFuture(startDate);
  const isOngoing = isPast(startDate) && isFuture(endDate);
  const isCompleted = isPast(endDate);

  const capacityPercentage = intent.max
    ? Math.round(((intent.joinedCount || 0) / intent.max) * 100)
    : 0;

  // Calculate engagement metrics
  const totalEngagement =
    ((intent as any).messagesCount || 0) +
    (intent.commentsCount || 0) +
    ((intent as any).favouritesCount || 0);
  const engagementPerMember =
    intent.joinedCount && intent.joinedCount > 0
      ? (totalEngagement / intent.joinedCount).toFixed(1)
      : '0';

  const stats = [
    {
      title: 'Total Members',
      value: intent.joinedCount || 0,
      icon: Users,
      description: `${capacityPercentage}% capacity`,
      href: `/intent/${intentId}/manage/members`,
      color: 'blue' as const,
      trend:
        capacityPercentage >= 80
          ? { value: 'Almost full', positive: true }
          : undefined,
    },
    {
      title: 'Messages',
      value: (intent as any).messagesCount || 0,
      icon: MessageSquare,
      description: intent.joinedCount
        ? `${(((intent as any).messagesCount || 0) / (intent.joinedCount || 1)).toFixed(1)} per member`
        : undefined,
      href: `/intent/${intentId}/manage/chat`,
      color: 'green' as const,
    },
    {
      title: 'Engagement',
      value: totalEngagement,
      icon: Activity,
      description: `${engagementPerMember} per member`,
      color: 'purple' as const,
    },
    {
      title: 'Views',
      value: (intent as any).viewCount || 0,
      icon: Eye,
      description: 'Total impressions',
      href: `/intent/${intentId}/manage/analytics`,
      color: 'blue' as const,
    },
    {
      title: 'Favourites',
      value: (intent as any).favouritesCount || 0,
      icon: Heart,
      description:
        (intent as any).viewCount && (intent as any).viewCount > 0
          ? `${Math.round((((intent as any).favouritesCount || 0) / (intent as any).viewCount) * 100)}% conversion`
          : undefined,
      color: 'pink' as const,
    },
    {
      title: 'Reviews',
      value: (intent as any).reviewsCount || 0,
      icon: Star,
      description: (intent as any).averageRating
        ? `★ ${(intent as any).averageRating.toFixed(1)} average`
        : 'No reviews yet',
      href: `/intent/${intentId}/manage/reviews`,
      color: 'orange' as const,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header with Status Badge */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Dashboard
            </h1>
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium',
                (intent as any).status === 'ACTIVE'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  : (intent as any).status === 'CANCELLED'
                    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    : (intent as any).status === 'COMPLETED'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400'
              )}
            >
              {(intent as any).status === 'ACTIVE' && (
                <Activity className="w-3 h-3" />
              )}
              {(intent as any).status === 'CANCELLED' && (
                <XCircle className="w-3 h-3" />
              )}
              {(intent as any).status === 'COMPLETED' && (
                <CheckCircle2 className="w-3 h-3" />
              )}
              {(intent as any).status === 'DRAFT' && (
                <AlertCircle className="w-3 h-3" />
              )}
              {(intent as any).status}
            </span>
          </div>
          <p className="mt-1 text-base text-zinc-600 dark:text-zinc-400">
            Overview of your event management
          </p>
        </div>
        <Link
          href={`/intent/${intentId}`}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition-colors bg-indigo-600 rounded-lg hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
        >
          <Eye className="w-4 h-4" />
          View Event
        </Link>
      </div>

      {/* Countdown Timer */}
      <EventCountdownTimer
        startAt={startDate}
        endAt={endDate}
        joinOpensMinutesBeforeStart={intent.joinOpensMinutesBeforeStart}
        joinCutoffMinutesBeforeStart={intent.joinCutoffMinutesBeforeStart}
        allowJoinLate={intent.allowJoinLate}
        lateJoinCutoffMinutesAfterStart={intent.lateJoinCutoffMinutesAfterStart}
        joinManuallyClosed={intent.joinManuallyClosed}
        isCanceled={(intent as any).status === 'CANCELLED'}
        isDeleted={(intent as any).status === 'DELETED'}
      />

      {/* Quick Metrics Banner */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Capacity Status */}
        <div className="p-4 bg-white border rounded-xl border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Capacity
            </span>
            <Users className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {intent.joinedCount}
            </span>
            <span className="text-sm text-zinc-500">/ {intent.max}</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                capacityPercentage >= 90
                  ? 'bg-red-500'
                  : capacityPercentage >= 70
                    ? 'bg-orange-500'
                    : 'bg-green-500'
              )}
              style={{ width: `${capacityPercentage}%` }}
            />
          </div>
        </div>

        {/* Time Until Event */}
        <div className="p-4 bg-white border rounded-xl border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              {isUpcoming ? 'Starts In' : isOngoing ? 'Ends In' : 'Completed'}
            </span>
            <Calendar className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            {isUpcoming &&
              formatDistanceToNow(startDate, { addSuffix: false, locale: pl })}
            {isOngoing &&
              formatDistanceToNow(endDate, { addSuffix: false, locale: pl })}
            {isCompleted &&
              formatDistanceToNow(endDate, { addSuffix: true, locale: pl })}
          </div>
        </div>

        {/* Engagement Rate */}
        <div className="p-4 bg-white border rounded-xl border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Engagement
            </span>
            <Activity className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {engagementPerMember}
            </span>
            <span className="text-sm text-zinc-500">per member</span>
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="p-4 bg-white border rounded-xl border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Conversion
            </span>
            <TrendingUp className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {(intent as any).viewCount && (intent as any).viewCount > 0
                ? Math.round(
                    ((intent.joinedCount || 0) / (intent as any).viewCount) *
                      100
                  )
                : 0}
              %
            </span>
            <span className="text-sm text-zinc-500">join rate</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Event Info Card */}
      <div className="p-6 bg-white border rounded-xl border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Event Information
          </h2>
          <Link
            href={`/intent/${intentId}/manage/edit/basics`}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-indigo-600 transition-colors hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/30"
          >
            <Edit className="h-3.5 w-3.5" />
            Edit
          </Link>
        </div>
        <div className="space-y-4">
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
                  {format(startDate, 'PPP p', { locale: pl })}
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
                  {format(endDate, 'PPP p', { locale: pl })}
                </p>
              </div>
            </div>

            {intent.address && (
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 text-zinc-500 dark:text-zinc-400" />
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    Location
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {intent.address}
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
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      capacityPercentage >= 90
                        ? 'bg-red-500'
                        : capacityPercentage >= 70
                          ? 'bg-orange-500'
                          : 'bg-green-500'
                    )}
                    style={{ width: `${capacityPercentage}%` }}
                  />
                </div>
              </div>
            </div>

            {intent.mode && (
              <div className="flex items-start gap-3">
                <UserPlus className="mt-0.5 h-5 w-5 text-zinc-500 dark:text-zinc-400" />
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    Mode
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {intent.mode === 'ONE_TO_ONE' ? '1:1' : 'Group'}
                  </p>
                </div>
              </div>
            )}

            {intent.visibility && (
              <div className="flex items-start gap-3">
                <Eye className="mt-0.5 h-5 w-5 text-zinc-500 dark:text-zinc-400" />
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    Visibility
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {intent.visibility}
                  </p>
                </div>
              </div>
            )}

            {intent.joinMode && (
              <div className="flex items-start gap-3">
                <UserCheck className="mt-0.5 h-5 w-5 text-zinc-500 dark:text-zinc-400" />
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    Join Mode
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {intent.joinMode === 'OPEN'
                      ? 'Open'
                      : intent.joinMode === 'REQUEST'
                        ? 'Approval Required'
                        : intent.joinMode}
                  </p>
                </div>
              </div>
            )}

            {intent.meetingKind && (
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 text-zinc-500 dark:text-zinc-400" />
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    Meeting Type
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {intent.meetingKind === 'ONSITE'
                      ? 'In Person'
                      : intent.meetingKind === 'ONLINE'
                        ? 'Online'
                        : 'Hybrid'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Categories & Tags */}
          {(intent.categories && intent.categories.length > 0) ||
          (intent.tags && intent.tags.length > 0) ? (
            <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
              {intent.categories && intent.categories.length > 0 && (
                <div className="mb-3">
                  <p className="mb-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Categories
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {intent.categories.map((cat: any) => (
                      <span
                        key={cat.id}
                        className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                      >
                        {cat.names?.en || cat.slug}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {intent.tags && intent.tags.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Tags
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {intent.tags.map((tag: any) => (
                      <span
                        key={tag.id}
                        className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-lg bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                      >
                        {tag.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-6 bg-white border rounded-xl border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Quick Actions
          </h2>
          <Link
            href={`/intent/${intentId}/manage/edit/basics`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 transition-colors rounded-lg hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/30"
          >
            <Sparkles className="w-3.5 h-3.5" />
            View All
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Primary Actions */}
          <Link
            href={`/intent/${intentId}/manage/members`}
            className="relative flex flex-col gap-2 p-4 overflow-hidden transition-all border group rounded-xl border-zinc-200 hover:border-indigo-300 hover:shadow-md dark:border-zinc-800 dark:hover:border-indigo-700 dark:bg-zinc-900/50"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center justify-center w-10 h-10 bg-indigo-100 rounded-lg dark:bg-indigo-900/30">
                <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              {intent.joinedCount && intent.joinedCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                  {intent.joinedCount}
                </span>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Members
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Manage participants
              </p>
            </div>
          </Link>

          <Link
            href={`/intent/${intentId}/manage/chat`}
            className="relative flex flex-col gap-2 p-4 overflow-hidden transition-all border group rounded-xl border-zinc-200 hover:border-green-300 hover:shadow-md dark:border-zinc-800 dark:hover:border-green-700 dark:bg-zinc-900/50"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-lg dark:bg-green-900/30">
                <MessageSquare className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              {(intent as any).messagesCount &&
                (intent as any).messagesCount > 0 && (
                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                    {(intent as any).messagesCount}
                  </span>
                )}
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Chat
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                View messages
              </p>
            </div>
          </Link>

          <Link
            href={`/intent/${intentId}/manage/analytics`}
            className="relative flex flex-col gap-2 p-4 overflow-hidden transition-all border group rounded-xl border-zinc-200 hover:border-purple-300 hover:shadow-md dark:border-zinc-800 dark:hover:border-purple-700 dark:bg-zinc-900/50"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-lg dark:bg-purple-900/30">
                <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Analytics
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                View insights
              </p>
            </div>
          </Link>

          <Link
            href={`/intent/${intentId}/manage/invite-links`}
            className="relative flex flex-col gap-2 p-4 overflow-hidden transition-all border group rounded-xl border-zinc-200 hover:border-orange-300 hover:shadow-md dark:border-zinc-800 dark:hover:border-orange-700 dark:bg-zinc-900/50"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center justify-center w-10 h-10 bg-orange-100 rounded-lg dark:bg-orange-900/30">
                <LinkIcon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Invite Links
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Share event
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
