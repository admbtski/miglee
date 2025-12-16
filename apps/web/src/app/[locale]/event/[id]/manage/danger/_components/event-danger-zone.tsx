/**
 * Event Danger Zone Component
 * Cancel or permanently delete event
 */

// TODO i18n: All hardcoded strings need translation

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Ban, Info, Trash2, Users } from 'lucide-react';

import { CancelEventModals } from '@/features/events/components/cancel-event-modals';
import { DeleteEventModals } from '@/features/events/components/delete-event-modals';
import { useEventDetailQuery } from '@/features/events/api/events';
import { useLocalePath } from '@/hooks/use-locale-path';
import { EventStatus } from '@/lib/api/__generated__/react-query-update';

interface EventDangerZoneProps {
  eventId: string;
}

/**
 * Event Danger Zone Component
 */
export function EventDangerZone({ eventId }: EventDangerZoneProps) {
  const router = useRouter();
  const { localePath } = useLocalePath();
  const { data, isLoading } = useEventDetailQuery({ id: eventId });
  const event = data?.event;

  const [cancelId, setCancelId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-zinc-200 border-t-red-600 dark:border-zinc-700 dark:border-t-red-400" />
          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-10 w-10 text-zinc-400 dark:text-zinc-500" />
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
            Event not found
          </p>
        </div>
      </div>
    );
  }

  const isCancelled = event.isCanceled;
  const isDeleted = event.isDeleted;

  // Can cancel if event is Upcoming or Ongoing, not already cancelled or deleted
  const canCancel =
    (event.status === EventStatus.Upcoming ||
      event.status === EventStatus.Ongoing) &&
    !isCancelled &&
    !isDeleted;

  // Determine cancel disabled reason
  let cancelDisabledReason: string | null = null;
  if (isCancelled) {
    cancelDisabledReason = 'This event is already cancelled';
  } else if (isDeleted) {
    cancelDisabledReason = 'This event has been deleted';
  } else if (event.status === EventStatus.Past) {
    cancelDisabledReason = 'Cannot cancel past events';
  } else if (event.status === EventStatus.Canceled) {
    cancelDisabledReason = 'This event is already cancelled';
  } else if (!canCancel) {
    cancelDisabledReason = `Cannot cancel event with status: ${event.status}`;
  }

  // Determine delete disabled reason
  let deleteDisabledReason: string | null = null;
  if (isDeleted) {
    deleteDisabledReason = 'This event has already been deleted';
  }

  const statusConfig = {
    [EventStatus.Upcoming]: {
      color: 'emerald',
      bg: 'bg-emerald-100 dark:bg-emerald-900/30',
      text: 'text-emerald-700 dark:text-emerald-400',
    },
    [EventStatus.Ongoing]: {
      color: 'blue',
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      text: 'text-blue-700 dark:text-blue-400',
    },
    [EventStatus.Past]: {
      color: 'zinc',
      bg: 'bg-zinc-100 dark:bg-zinc-800',
      text: 'text-zinc-700 dark:text-zinc-400',
    },
    [EventStatus.Canceled]: {
      color: 'red',
      bg: 'bg-red-100 dark:bg-red-900/30',
      text: 'text-red-700 dark:text-red-400',
    },
    [EventStatus.Any]: {
      color: 'zinc',
      bg: 'bg-zinc-100 dark:bg-zinc-800',
      text: 'text-zinc-700 dark:text-zinc-400',
    },
    [EventStatus.Deleted]: {
      color: 'red',
      bg: 'bg-red-100 dark:bg-red-900/30',
      text: 'text-red-700 dark:text-red-400',
    },
  };

  const currentStatus =
    statusConfig[event.status] || statusConfig[EventStatus.Any];

  return (
    <>
      <div className="space-y-6">
        {/* Warning Banner */}
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-800/50 dark:bg-red-950/30">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400" />
          <div className="text-sm text-red-900 dark:text-red-100">
            <p className="font-medium">Warning: Irreversible Actions</p>
            <p className="mt-1 text-red-700 dark:text-red-300">
              Actions on this page are permanent and cannot be undone. Please
              proceed with caution.
            </p>
          </div>
        </div>

        {/* Event Info Card */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
            Event Information
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                Title
              </span>
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {event.title}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                Status
              </span>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${currentStatus.bg} ${currentStatus.text}`}
              >
                {event.status}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                Members
              </span>
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {event.joinedCount || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Cancel Event Card */}
        <div className="rounded-2xl border border-amber-200 bg-white p-6 dark:border-amber-800/50 dark:bg-zinc-900">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
              <Ban className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Cancel Event
              </h3>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Cancel this event. Members will be notified and the event will
                be marked as cancelled. You can still view the event details,
                but no new members can join.
              </p>
              {cancelDisabledReason && (
                <div className="mt-3 flex items-start gap-2 rounded-xl bg-zinc-100 px-3 py-2 dark:bg-zinc-800">
                  <Info className="h-4 w-4 text-zinc-500 dark:text-zinc-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {cancelDisabledReason}
                  </p>
                </div>
              )}
              <button
                onClick={() => !cancelDisabledReason && setCancelId(eventId)}
                disabled={!!cancelDisabledReason}
                className={`mt-4 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-all ${
                  cancelDisabledReason
                    ? 'cursor-not-allowed border border-zinc-200 bg-zinc-100 text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-600'
                    : 'border-2 border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-400 dark:hover:bg-amber-950/50'
                }`}
              >
                <Ban className="h-4 w-4" />
                Cancel Event
              </button>
            </div>
          </div>
        </div>

        {/* Delete Event Card */}
        <div className="rounded-2xl border border-red-200 bg-white p-6 dark:border-red-800/50 dark:bg-zinc-900">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/30">
              <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Delete Event Permanently
              </h3>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Permanently delete this event and all associated data. This
                action cannot be undone. All members will lose access and all
                messages, comments, and reviews will be deleted.
              </p>
              {!isCancelled && !deleteDisabledReason && (
                <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2 dark:bg-amber-950/30">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    We recommend cancelling the event first to notify members
                    before deletion.
                  </p>
                </div>
              )}
              {deleteDisabledReason && (
                <div className="mt-3 flex items-start gap-2 rounded-xl bg-zinc-100 px-3 py-2 dark:bg-zinc-800">
                  <Info className="h-4 w-4 text-zinc-500 dark:text-zinc-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {deleteDisabledReason}
                  </p>
                </div>
              )}
              <button
                onClick={() => !deleteDisabledReason && setDeleteId(eventId)}
                disabled={!!deleteDisabledReason}
                className={`mt-4 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-all ${
                  deleteDisabledReason
                    ? 'cursor-not-allowed border border-zinc-200 bg-zinc-100 text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-600'
                    : 'border-2 border-red-300 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-700 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50'
                }`}
              >
                <Trash2 className="h-4 w-4" />
                Delete Event Permanently
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CancelEventModals
        cancelId={cancelId}
        onClose={() => setCancelId(null)}
        onSuccess={() => {
          router.refresh();
        }}
        title="Cancel this event?"
        subtitle="Members will be notified and the event will be marked as cancelled. You can still view event details."
      />

      <DeleteEventModals
        deleteId={deleteId}
        onClose={() => setDeleteId(null)}
        onSuccess={() => {
          router.push(localePath('/account/events'));
        }}
        title="Delete this event permanently?"
        subtitle="This will permanently delete all event data including messages, comments, and reviews. This action cannot be undone."
      />
    </>
  );
}
