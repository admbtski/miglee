'use client';

/**
 * PublishPage - Manage event publication status
 */

// TODO: Add i18n for all hardcoded strings in this component

import { useState, useCallback } from 'react';
import {
  AlertTriangle,
  CalendarClock,
  Clock,
  EyeOff,
  FileEdit,
  Globe,
  Info,
  Loader2,
  Rocket,
  Send,
} from 'lucide-react';

// Features
import {
  useCancelScheduledPublicationMutation,
  usePublishEventMutation,
  useScheduleEventPublicationMutation,
  useUnpublishEventMutation,
} from '@/features/events/api/events';

// Utils
import { toast } from '@/lib/utils';

// Local components
import { useEventManagement } from '../_components/event-management-provider';
import { ManagementPageLayout } from '../_components/management-page-layout';

// Local enum until codegen runs
enum PublicationStatus {
  Draft = 'DRAFT',
  Published = 'PUBLISHED',
  Scheduled = 'SCHEDULED',
}

export default function PublishPage() {
  const { event, isLoading, refetch } = useEventManagement();

  const [scheduledDate, setScheduledDate] = useState<string>('');
  const [scheduledTime, setScheduledTime] = useState<string>('');

  const { mutateAsync: publishAsync, isPending: isPublishing } =
    usePublishEventMutation();
  const { mutateAsync: scheduleAsync, isPending: isScheduling } =
    useScheduleEventPublicationMutation();
  const { mutateAsync: cancelScheduleAsync, isPending: isCancellingSchedule } =
    useCancelScheduledPublicationMutation();
  const { mutateAsync: unpublishAsync, isPending: isUnpublishing } =
    useUnpublishEventMutation();

  const isMutating =
    isPublishing || isScheduling || isCancellingSchedule || isUnpublishing;

  // Get status from event data
  const eventAny = event as any;
  const status: PublicationStatus =
    (eventAny?.publicationStatus as PublicationStatus) ??
    PublicationStatus.Draft;

  const handlePublishNow = useCallback(async () => {
    if (!event?.id) return;
    try {
      await publishAsync({ id: event.id });
      toast.success('Event published successfully!');
      refetch();
    } catch (error: any) {
      toast.error('Failed to publish event', {
        description: error?.message ?? 'Please try again',
      });
    }
  }, [event?.id, publishAsync, refetch]);

  const handleSchedule = useCallback(async () => {
    if (!event?.id || !scheduledDate || !scheduledTime) return;

    const publishAt = new Date(`${scheduledDate}T${scheduledTime}`);

    try {
      await scheduleAsync({
        id: event.id,
        publishAt: publishAt.toISOString(),
      });
      toast.success('Publication scheduled!');
      setScheduledDate('');
      setScheduledTime('');
      refetch();
    } catch (error: any) {
      toast.error('Failed to schedule publication', {
        description: error?.message ?? 'Please try again',
      });
    }
  }, [event?.id, scheduledDate, scheduledTime, scheduleAsync, refetch]);

  const handleUnpublish = useCallback(async () => {
    if (!event?.id) return;
    try {
      await unpublishAsync({ id: event.id });
      toast.success('Event returned to draft');
      refetch();
    } catch (error: any) {
      toast.error('Failed to unpublish', {
        description: error?.message ?? 'Please try again',
      });
    }
  }, [event?.id, unpublishAsync, refetch]);

  const handleCancelSchedule = useCallback(async () => {
    if (!event?.id) return;
    try {
      await cancelScheduleAsync({ id: event.id });
      toast.success('Scheduled publication cancelled');
      setScheduledDate('');
      setScheduledTime('');
      refetch();
    } catch (error: any) {
      toast.error('Failed to cancel schedule', {
        description: error?.message ?? 'Please try again',
      });
    }
  }, [event?.id, cancelScheduleAsync, refetch]);

  if (isLoading) {
    return (
      <ManagementPageLayout
        title="Publish"
        description="Manage your event's publication status"
      >
        <div className="space-y-6 animate-pulse">
          <div className="h-32 rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-48 rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </ManagementPageLayout>
    );
  }

  // Get minimum date (now)
  const now = new Date();
  const minDate = now.toISOString().split('T')[0];

  // Format scheduled date for display
  const scheduledPublishAt = eventAny?.scheduledPublishAt
    ? new Date(eventAny.scheduledPublishAt)
    : null;
  const formattedScheduledDate = scheduledPublishAt
    ? scheduledPublishAt.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';
  const formattedScheduledTime = scheduledPublishAt
    ? scheduledPublishAt.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  const statusConfig = {
    [PublicationStatus.Draft]: {
      icon: FileEdit,
      label: 'Draft',
      description:
        'Your event is only visible to you and moderators. Publish it to make it visible to others.',
      bg: 'bg-zinc-100 dark:bg-zinc-800',
      iconBg: 'bg-zinc-200 dark:bg-zinc-700',
      iconColor: 'text-zinc-600 dark:text-zinc-400',
      badgeBg: 'bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300',
    },
    [PublicationStatus.Published]: {
      icon: Globe,
      label: 'Published',
      description:
        'Your event is visible to all users according to your privacy settings.',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      badgeBg:
        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    },
    [PublicationStatus.Scheduled]: {
      icon: CalendarClock,
      label: 'Scheduled',
      description: `Your event will be published on ${formattedScheduledDate} at ${formattedScheduledTime}.`,
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      iconBg: 'bg-amber-100 dark:bg-amber-900/40',
      iconColor: 'text-amber-600 dark:text-amber-400',
      badgeBg:
        'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    },
  };

  const currentStatus = statusConfig[status];
  const StatusIcon = currentStatus.icon;

  return (
    <ManagementPageLayout
      title="Publish"
      description="Manage your event's publication status"
    >
      <div className="space-y-6">
        {/* Current Status Card */}
        <div
          className={`rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 ${currentStatus.bg}`}
        >
          <div className="flex items-start gap-4">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl ${currentStatus.iconBg}`}
            >
              <StatusIcon className={`h-6 w-6 ${currentStatus.iconColor}`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  {currentStatus.label}
                </h2>
                <span
                  className={`px-2.5 py-1 text-xs font-medium rounded-full ${currentStatus.badgeBg}`}
                >
                  {status}
                </span>
              </div>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                {currentStatus.description}
              </p>
              {eventAny?.publishedAt &&
                status === PublicationStatus.Published && (
                  <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                    Published:{' '}
                    {new Date(eventAny.publishedAt).toLocaleString('en-US')}
                  </p>
                )}
            </div>
          </div>
        </div>

        {/* Draft Actions */}
        {status === PublicationStatus.Draft && (
          <div className="space-y-4">
            {/* Publish Now */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
                  <Rocket className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                    Publish Now
                  </h3>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    Your event will immediately become visible to users.
                  </p>
                  <button
                    type="button"
                    onClick={handlePublishNow}
                    disabled={isMutating}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:from-indigo-500 hover:to-violet-500 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isPublishing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Publishing...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Publish Event
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Schedule Publication */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
                  <CalendarClock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                    Schedule Publication
                  </h3>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    Set a date and time for your event to be automatically
                    published.
                  </p>

                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        Date
                      </label>
                      <input
                        type="date"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        min={minDate}
                        className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-zinc-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        Time
                      </label>
                      <input
                        type="time"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-zinc-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSchedule}
                    disabled={isMutating || !scheduledDate || !scheduledTime}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl border-2 border-amber-300 px-6 py-2.5 text-sm font-medium text-amber-700 transition-all hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/20"
                  >
                    {isScheduling ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Clock className="h-4 w-4" />
                    )}
                    Schedule Publication
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Published Actions */}
        {status === PublicationStatus.Published && (
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800">
                <EyeOff className="h-6 w-6 text-zinc-600 dark:text-zinc-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  Unpublish
                </h3>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  Return your event to draft status. It will no longer be
                  visible to other users.
                </p>
                <button
                  type="button"
                  onClick={handleUnpublish}
                  disabled={isMutating}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl border-2 border-zinc-300 px-6 py-2.5 text-sm font-medium text-zinc-700 transition-all hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  {isUnpublishing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                  Unpublish
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Scheduled Actions */}
        {status === PublicationStatus.Scheduled && (
          <div className="space-y-4">
            {/* Publish Now Option */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
                  <Rocket className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                    Publish Now
                  </h3>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    Don't want to wait? Publish your event immediately.
                  </p>
                  <button
                    type="button"
                    onClick={handlePublishNow}
                    disabled={isMutating}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:from-indigo-500 hover:to-violet-500 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isPublishing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Publish Now
                  </button>
                </div>
              </div>
            </div>

            {/* Cancel Schedule */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/30">
                  <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                    Cancel Scheduled Publication
                  </h3>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    Return your event to draft status. It will not be
                    automatically published.
                  </p>
                  <button
                    type="button"
                    onClick={handleCancelSchedule}
                    disabled={isMutating}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl border-2 border-red-300 px-6 py-2.5 text-sm font-medium text-red-700 transition-all hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/20"
                  >
                    {isCancellingSchedule ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <AlertTriangle className="h-4 w-4" />
                    )}
                    Cancel Schedule
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Visibility Info */}
        <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800/50 dark:bg-blue-950/30">
          <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
          <div>
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Who can see drafts?
            </p>
            <p className="mt-1 text-xs text-blue-800 dark:text-blue-200">
              Only you (owner), event moderators, and system administrators can
              see your event while it's in draft status.
            </p>
          </div>
        </div>
      </div>
    </ManagementPageLayout>
  );
}
