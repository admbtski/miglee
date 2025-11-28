/**
 * Intent Danger Zone Component
 * Cancel or permanently delete event
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocalePath } from '@/hooks/use-locale-path';
import { AlertTriangle, Ban, Trash2 } from 'lucide-react';
import { useIntentQuery } from '@/lib/api/intents';
import { IntentStatus } from '@/lib/api/__generated__/react-query-update';
import { CancelIntentModals } from '@/app/[locale]/account/intents/_components/cancel-intent-modals';
import { DeleteIntentModals } from '@/app/[locale]/account/intents/_components/delete-intent-modals';

interface IntentDangerZoneProps {
  intentId: string;
}

/**
 * Intent Danger Zone Component
 */
export function IntentDangerZone({ intentId }: IntentDangerZoneProps) {
  const router = useRouter();
  const { localePath } = useLocalePath();
  const { data, isLoading } = useIntentQuery({ id: intentId });
  const intent = data?.intent;

  const [cancelId, setCancelId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 mx-auto border-4 rounded-full animate-spin border-zinc-200 border-t-indigo-600 dark:border-zinc-700 dark:border-t-indigo-400" />
          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
            Loading...
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

  const isCancelled = intent.isCanceled;
  const isDeleted = intent.isDeleted;

  // Can cancel if event is Available (active), not already cancelled or deleted
  const canCancel =
    (intent.status === IntentStatus.Available ||
      intent.status === IntentStatus.Ongoing) &&
    !isCancelled &&
    !isDeleted;

  // Determine cancel disabled reason
  let cancelDisabledReason: string | null = null;
  if (isCancelled) {
    cancelDisabledReason = 'This event is already cancelled';
  } else if (isDeleted) {
    cancelDisabledReason = 'This event has been deleted';
  } else if (intent.status === IntentStatus.Past) {
    cancelDisabledReason = 'Cannot cancel past events';
  } else if (intent.status === IntentStatus.Canceled) {
    cancelDisabledReason = 'This event is already cancelled';
  } else if (!canCancel) {
    cancelDisabledReason = `Cannot cancel event with status: ${intent.status}`;
  }

  // Determine delete disabled reason (optional - you can add conditions)
  let deleteDisabledReason: string | null = null;
  if (isDeleted) {
    deleteDisabledReason = 'This event has already been deleted';
  }
  // Example: if you want to prevent deletion of events with many members
  // if (intent.joinedCount && intent.joinedCount > 50) {
  //   deleteDisabledReason = 'Cannot delete events with more than 50 members';
  // }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Danger Zone
          </h1>
          <p className="mt-1 text-base text-zinc-600 dark:text-zinc-400">
            Irreversible actions for your event
          </p>
        </div>

        {/* Warning Banner */}
        <div className="flex items-start gap-3 p-4 border border-red-200 rounded-xl bg-red-50 dark:border-red-900/50 dark:bg-red-950/20">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400" />
          <div className="text-sm text-red-900 dark:text-red-100">
            <p className="font-medium">Warning</p>
            <p className="mt-1 text-red-700 dark:text-red-300">
              Actions on this page are permanent and cannot be undone. Please
              proceed with caution.
            </p>
          </div>
        </div>

        {/* Event Info */}
        <div className="p-6 bg-white border rounded-xl border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Event Information
          </h2>
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                Title
              </span>
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {intent.title}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                Status
              </span>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  intent.status === IntentStatus.Available
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : intent.status === IntentStatus.Canceled || isCancelled
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      : intent.status === IntentStatus.Past
                        ? 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                }`}
              >
                {intent.status}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                Members
              </span>
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {intent.joinedCount || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Cancel Event - Always visible */}
        <div className="p-6 bg-white border border-orange-200 rounded-xl dark:border-orange-900/50 dark:bg-zinc-900">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-orange-100 rounded-lg dark:bg-orange-900/30">
              <Ban className="w-6 h-6 text-orange-600 dark:text-orange-400" />
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
                <p className="mt-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  ℹ️ {cancelDisabledReason}
                </p>
              )}
              <button
                onClick={() => !cancelDisabledReason && setCancelId(intentId)}
                disabled={!!cancelDisabledReason}
                className={`inline-flex items-center gap-2 px-4 py-2 mt-4 text-sm font-medium transition-colors border rounded-lg ${
                  cancelDisabledReason
                    ? 'cursor-not-allowed border-zinc-300 bg-zinc-100 text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-600'
                    : 'border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100 dark:border-orange-900/50 dark:bg-orange-950/30 dark:text-orange-400 dark:hover:bg-orange-950/50'
                }`}
              >
                <Ban className="w-4 h-4" />
                Cancel Event
              </button>
            </div>
          </div>
        </div>

        {/* Delete Event - Always visible */}
        <div className="p-6 bg-white border border-red-200 rounded-xl dark:border-red-900/50 dark:bg-zinc-900">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-red-100 rounded-lg dark:bg-red-900/30">
              <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
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
                <p className="mt-2 text-sm font-medium text-orange-600 dark:text-orange-400">
                  ⚠️ We recommend cancelling the event first to notify members
                  before deletion.
                </p>
              )}
              {deleteDisabledReason && (
                <p className="mt-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  ℹ️ {deleteDisabledReason}
                </p>
              )}
              <button
                onClick={() => !deleteDisabledReason && setDeleteId(intentId)}
                disabled={!!deleteDisabledReason}
                className={`inline-flex items-center gap-2 px-4 py-2 mt-4 text-sm font-medium transition-colors border rounded-lg ${
                  deleteDisabledReason
                    ? 'cursor-not-allowed border-zinc-300 bg-zinc-100 text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-600'
                    : 'border-red-300 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50'
                }`}
              >
                <Trash2 className="w-4 h-4" />
                Delete Event Permanently
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CancelIntentModals
        cancelId={cancelId}
        onClose={() => setCancelId(null)}
        onSuccess={() => {
          // Refresh the page to show updated status
          router.refresh();
        }}
        title="Cancel this event?"
        subtitle="Members will be notified and the event will be marked as cancelled. You can still view event details."
      />

      <DeleteIntentModals
        deleteId={deleteId}
        onClose={() => setDeleteId(null)}
        onSuccess={() => {
          // Redirect to account intents page after deletion
          router.push(localePath('/account/intents'));
        }}
        title="Delete this event permanently?"
        subtitle="This will permanently delete all event data including messages, comments, and reviews. This action cannot be undone."
      />
    </>
  );
}
