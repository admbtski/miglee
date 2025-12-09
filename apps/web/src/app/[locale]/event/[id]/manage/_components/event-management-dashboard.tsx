/**
 * Event Management Dashboard Component
 * Shows overview, stats, and quick actions
 * Modern, clean design with great UX
 */

// TODO i18n: All hardcoded strings need translation keys
// TODO i18n: date/time formatting should use user.timezone + locale

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format, formatDistanceToNow, isFuture, isPast } from 'date-fns';
import { pl } from 'date-fns/locale';
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Building,
  Calendar,
  CheckCircle2,
  Clock,
  Edit3,
  Eye,
  Globe,
  Heart,
  Link as LinkIcon,
  Lock,
  LockOpen,
  MapPin,
  MessageSquare,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  Video,
} from 'lucide-react';

// Components
import { BlurHashImage } from '@/components/ui/blurhash-image';

// Features
import { useEventQuery } from '@/features/events/api/events';
import {
  CloseJoinModal,
  EventCountdownTimer,
  ReopenJoinModal,
} from '@/features/events';
import { EventStatus } from '@/lib/api/__generated__/react-query-update';

// Hooks
import { useLocalePath } from '@/hooks/use-locale-path';

// Lib
import { buildEventCoverUrl } from '@/lib/media/url';
import { cn } from '@/lib/utils';

interface EventManagementDashboardProps {
  eventId: string;
}

/**
 * Event Management Dashboard Component
 */
export function EventManagementDashboard({
  eventId,
}: EventManagementDashboardProps) {
  const { data, isLoading, refetch } = useEventQuery({ id: eventId });
  const { localePath } = useLocalePath();
  const event = data?.event;

  // Modal states
  const [closeJoinId, setCloseJoinId] = useState<string | null>(null);
  const [reopenJoinId, setReopenJoinId] = useState<string | null>(null);
  const [closeJoinReason, setCloseJoinReason] = useState('');

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 mx-auto border-4 rounded-full animate-spin border-zinc-200 border-t-indigo-600 dark:border-zinc-700 dark:border-t-indigo-400" />
          {/* TODO i18n: loading text */}
          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
            <Calendar className="w-8 h-8 text-zinc-400" />
          </div>
          {/* TODO i18n: error message */}
          <p className="text-zinc-600 dark:text-zinc-400">Event not found</p>
        </div>
      </div>
    );
  }

  const startDate = new Date(event.startAt);
  const endDate = new Date(event.endAt);
  const isUpcoming = isFuture(startDate);
  const isOngoing = isPast(startDate) && isFuture(endDate);
  const isCompleted = isPast(endDate);

  const capacityPercentage = event.max
    ? Math.round(((event.joinedCount || 0) / event.max) * 100)
    : 0;

  // Status config
  const statusConfig: Record<
    EventStatus,
    { label: string; color: string; icon: typeof Clock }
  > = {
    [EventStatus.Upcoming]: {
      label: 'Upcoming',
      color:
        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      icon: Clock,
    },
    [EventStatus.Ongoing]: {
      label: 'Ongoing',
      color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      icon: Activity,
    },
    [EventStatus.Past]: {
      label: 'Completed',
      color: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400',
      icon: CheckCircle2,
    },
    [EventStatus.Canceled]: {
      label: 'Cancelled',
      color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      icon: Lock,
    },
    [EventStatus.Deleted]: {
      label: 'Deleted',
      color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      icon: Lock,
    },
    [EventStatus.Any]: {
      label: 'Any',
      color: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400',
      icon: Clock,
    },
  };

  const currentStatus =
    statusConfig[event.status] ?? statusConfig[EventStatus.Upcoming];
  const StatusIcon = currentStatus.icon;

  // Meeting kind config
  const meetingKindConfig = {
    ONSITE: {
      label: 'In Person',
      icon: Building,
      color: 'text-emerald-600 dark:text-emerald-400',
    },
    ONLINE: {
      label: 'Online',
      icon: Video,
      color: 'text-blue-600 dark:text-blue-400',
    },
    HYBRID: {
      label: 'Hybrid',
      icon: Globe,
      color: 'text-purple-600 dark:text-purple-400',
    },
  };

  const meetingKind =
    meetingKindConfig[event.meetingKind as keyof typeof meetingKindConfig] ||
    meetingKindConfig.ONSITE;
  const MeetingIcon = meetingKind.icon;

  return (
    <div className="max-w-[1400px] space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 p-8 text-white shadow-xl min-h-[200px]">
        {/* Background Cover Image */}
        {event.coverKey ? (
          <>
            <div className="absolute inset-0">
              <BlurHashImage
                src={buildEventCoverUrl(event.coverKey, 'detail') || ''}
                blurhash={event.coverBlurhash}
                alt={event.title}
                className="w-full h-full object-cover"
                width={1280}
                height={720}
              />
            </div>
            {/* Dark overlay for readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-black/70" />
          </>
        ) : (
          /* Fallback pattern when no cover */
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        )}

        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1 min-w-0">
              {/* Status Badge */}
              <div className="flex items-center gap-3 mb-4">
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold',
                    currentStatus.color
                  )}
                >
                  <StatusIcon className="w-3.5 h-3.5" />
                  {currentStatus.label}
                </span>
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium bg-white/20 text-white'
                  )}
                >
                  <MeetingIcon className="w-3.5 h-3.5" />
                  {meetingKind.label}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-3xl lg:text-4xl font-bold tracking-tight mb-3 line-clamp-2">
                {event.title}
              </h1>

              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-4 text-white/80 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{format(startDate, 'PPP', { locale: pl })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>
                    {format(startDate, 'HH:mm')} - {format(endDate, 'HH:mm')}
                  </span>
                </div>
                {event.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span className="truncate max-w-[200px]">
                      {event.address}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href={localePath(`/event/${eventId}`)}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-white text-indigo-700 hover:bg-white/90 transition-all shadow-lg"
              >
                <Eye className="w-4 h-4" />
                View Event
                <ArrowUpRight className="w-4 h-4" />
              </Link>
              <Link
                href={localePath(`/event/${eventId}/manage/edit/basics`)}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-white/20 text-white hover:bg-white/30 transition-all"
              >
                <Edit3 className="w-4 h-4" />
                Edit Event
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Capacity */}
        <div className="p-5 rounded-2xl bg-white border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Capacity
            </span>
            <Users className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="flex items-baseline gap-1 mb-3">
            <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              {event.joinedCount || 0}
            </span>
            <span className="text-lg text-zinc-400">/ {event.max || '∞'}</span>
          </div>
          <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                capacityPercentage >= 90
                  ? 'bg-gradient-to-r from-red-500 to-red-400'
                  : capacityPercentage >= 70
                    ? 'bg-gradient-to-r from-amber-500 to-amber-400'
                    : 'bg-gradient-to-r from-emerald-500 to-emerald-400'
              )}
              style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            {capacityPercentage}% filled
          </p>
        </div>

        {/* Time Status */}
        <div className="p-5 rounded-2xl bg-white border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {isUpcoming ? 'Starts In' : isOngoing ? 'Ends In' : 'Ended'}
            </span>
            <Clock className="w-4 h-4 text-zinc-400" />
          </div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {isUpcoming && formatDistanceToNow(startDate, { locale: pl })}
            {isOngoing && formatDistanceToNow(endDate, { locale: pl })}
            {isCompleted &&
              formatDistanceToNow(endDate, { addSuffix: true, locale: pl })}
          </p>
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            {format(isUpcoming ? startDate : endDate, 'PPP p', { locale: pl })}
          </p>
        </div>

        {/* Messages */}
        <Link
          href={localePath(`/event/${eventId}/manage/chat`)}
          className="p-5 rounded-2xl bg-white border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Messages
            </span>
            <MessageSquare className="w-4 h-4 text-zinc-400 group-hover:text-indigo-500 transition-colors" />
          </div>
          <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            {event.messagesCount || 0}
          </p>
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
            View chat
            <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </p>
        </Link>

        {/* Favourites */}
        <div className="p-5 rounded-2xl bg-white border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Favourites
            </span>
            <Heart className="w-4 h-4 text-zinc-400" />
          </div>
          <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            {event.savedCount || 0}
          </p>
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            People saved this event
          </p>
        </div>
      </div>

      {/* Registration Control + Countdown */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Registration Status Card */}
        {event.status !== EventStatus.Canceled &&
          event.status !== EventStatus.Past && (
            <div className="p-6 rounded-2xl bg-white border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800">
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    'flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center',
                    event.joinManuallyClosed
                      ? 'bg-amber-100 dark:bg-amber-900/30'
                      : 'bg-emerald-100 dark:bg-emerald-900/30'
                  )}
                >
                  {event.joinManuallyClosed ? (
                    <Lock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                  ) : (
                    <LockOpen className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                    Registration Status
                  </h3>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    {event.joinManuallyClosed
                      ? 'Registrations are closed. Users cannot join this event.'
                      : 'Registrations are open. Users can join this event.'}
                  </p>
                  <div className="mt-4">
                    {event.joinManuallyClosed ? (
                      <button
                        onClick={() => setReopenJoinId(eventId)}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 transition-colors"
                      >
                        <LockOpen className="w-4 h-4" />
                        Open Registrations
                      </button>
                    ) : (
                      <button
                        onClick={() => setCloseJoinId(eventId)}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-amber-600 text-white hover:bg-amber-500 transition-colors"
                      >
                        <Lock className="w-4 h-4" />
                        Close Registrations
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

        {/* Countdown Timer */}
        <div
          className={cn(
            event.status === EventStatus.Canceled ||
              event.status === EventStatus.Past
              ? 'lg:col-span-2'
              : ''
          )}
        >
          <EventCountdownTimer
            startAt={startDate}
            endAt={endDate}
            joinOpensMinutesBeforeStart={event.joinOpensMinutesBeforeStart}
            joinCutoffMinutesBeforeStart={event.joinCutoffMinutesBeforeStart}
            allowJoinLate={event.allowJoinLate}
            lateJoinCutoffMinutesAfterStart={
              event.lateJoinCutoffMinutesAfterStart
            }
            joinManuallyClosed={event.joinManuallyClosed}
            isCanceled={event.status === EventStatus.Canceled}
            isDeleted={false}
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href={localePath(`/event/${eventId}/manage/members`)}
            className="group p-5 rounded-2xl bg-white border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 hover:border-sky-300 dark:hover:border-sky-700 hover:shadow-md transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center mb-3">
              <Users className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            </div>
            <p className="font-medium text-zinc-900 dark:text-zinc-100">
              Members
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              {event.joinedCount || 0} participants
            </p>
          </Link>

          <Link
            href={localePath(`/event/${eventId}/manage/chat`)}
            className="group p-5 rounded-2xl bg-white border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-3">
              <MessageSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="font-medium text-zinc-900 dark:text-zinc-100">Chat</p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              {event.messagesCount || 0} messages
            </p>
          </Link>

          <Link
            href={localePath(`/event/${eventId}/manage/analytics`)}
            className="group p-5 rounded-2xl bg-white border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-md transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-3">
              <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="font-medium text-zinc-900 dark:text-zinc-100">
              Analytics
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              View insights
            </p>
          </Link>

          <Link
            href={localePath(`/event/${eventId}/manage/invite-links`)}
            className="group p-5 rounded-2xl bg-white border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 hover:border-orange-300 dark:hover:border-orange-700 hover:shadow-md transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-3">
              <LinkIcon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <p className="font-medium text-zinc-900 dark:text-zinc-100">
              Invite Links
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              Share event
            </p>
          </Link>
        </div>
      </div>

      {/* Event Details Card */}
      <div className="p-6 rounded-2xl bg-white border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Event Details
          </h2>
          <Link
            href={localePath(`/event/${eventId}/manage/edit/basics`)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Edit
          </Link>
        </div>

        {event.description && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed max-w-prose">
            {event.description}
          </p>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-4 h-4 text-zinc-500" />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Date & Time
              </p>
              <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {format(startDate, 'PPP', { locale: pl })}
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {format(startDate, 'HH:mm')} - {format(endDate, 'HH:mm')}
              </p>
            </div>
          </div>

          {event.address && (
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 text-zinc-500" />
              </div>
              <div>
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Location
                </p>
                <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {event.address}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
              <MeetingIcon className="w-4 h-4 text-zinc-500" />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Meeting Type
              </p>
              <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {meetingKind.label}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
              <Users className="w-4 h-4 text-zinc-500" />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Capacity
              </p>
              <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {event.joinedCount || 0} / {event.max || '∞'} members
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
              <Eye className="w-4 h-4 text-zinc-500" />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Visibility
              </p>
              <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {event.visibility === 'PUBLIC' ? 'Public' : 'Hidden'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-zinc-500" />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Join Mode
              </p>
              <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {event.joinMode === 'OPEN' ? 'Open' : 'Approval Required'}
              </p>
            </div>
          </div>
        </div>

        {/* Categories & Tags */}
        {((event.categories && event.categories.length > 0) ||
          (event.tags && event.tags.length > 0)) && (
          <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800">
            {event.categories && event.categories.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                  Categories
                </p>
                <div className="flex flex-wrap gap-2">
                  {event.categories.map((cat: any) => (
                    <span
                      key={cat.id}
                      className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                    >
                      {cat.names?.en || cat.slug}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {event.tags && event.tags.length > 0 && (
              <div>
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                  Tags
                </p>
                <div className="flex flex-wrap gap-2">
                  {event.tags.map((tag: any) => (
                    <span
                      key={tag.id}
                      className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                    >
                      {tag.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Engagement Stats */}
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
          Engagement
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href={localePath(`/event/${eventId}/manage/reviews`)}
            className="p-5 rounded-2xl bg-white border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 hover:border-amber-300 dark:hover:border-amber-700 transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <Star className="w-5 h-5 text-amber-500" />
              <ArrowRight className="w-4 h-4 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {(event as any).reviewsCount || 0}
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Reviews</p>
          </Link>

          <Link
            href={localePath(`/event/${eventId}/manage/comments`)}
            className="p-5 rounded-2xl bg-white border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-700 transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <MessageSquare className="w-5 h-5 text-blue-500" />
              <ArrowRight className="w-4 h-4 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {event.commentsCount || 0}
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Comments</p>
          </Link>

          <div className="p-5 rounded-2xl bg-white border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-2">
              <Eye className="w-5 h-5 text-zinc-400" />
            </div>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {(event as any).viewCount || 0}
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Views</p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {(event as any).viewCount && (event as any).viewCount > 0
                ? Math.round(
                    ((event.joinedCount || 0) / (event as any).viewCount) * 100
                  )
                : 0}
              %
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Conversion
            </p>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CloseJoinModal
        eventId={closeJoinId}
        onClose={() => {
          setCloseJoinId(null);
          setCloseJoinReason('');
        }}
        onSuccess={() => {
          refetch();
        }}
        reason={closeJoinReason}
        onReasonChange={setCloseJoinReason}
      />

      <ReopenJoinModal
        eventId={reopenJoinId}
        onClose={() => setReopenJoinId(null)}
        onSuccess={() => {
          refetch();
        }}
      />
    </div>
  );
}
