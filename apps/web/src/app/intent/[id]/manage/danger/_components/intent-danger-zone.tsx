/**
 * Intent Danger Zone Component
 * Cancel or permanently delete event
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Ban, Trash2 } from 'lucide-react';
import { useIntentQuery } from '@/lib/api/intents';
import { CancelIntentModals } from '@/app/account/intents/_components/cancel-intent-modals';
import { DeleteIntentModals } from '@/app/account/intents/_components/delete-intent-modals';

interface IntentDangerZoneProps {
  intentId: string;
}

/**
 * Intent Danger Zone Component
 */
export function IntentDangerZone({ intentId }: IntentDangerZoneProps) {
  const router = useRouter();
  const { data, isLoading } = useIntentQuery({ id: intentId });
  const intent = data?.intent;

  const [cancelId, setCancelId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-indigo-600 dark:border-zinc-700 dark:border-t-indigo-400" />
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

  const isCancelled = intent.status === 'CANCELLED';
  const canCancel = intent.status === 'ACTIVE' || intent.status === 'DRAFT';

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
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/20">
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
        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
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
                  intent.status === 'ACTIVE'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : intent.status === 'CANCELLED'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      : 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400'
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

        {/* Cancel Event */}
        {canCancel && (
          <div className="rounded-xl border border-orange-200 bg-white p-6 dark:border-orange-900/50 dark:bg-zinc-900">
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-orange-100 p-3 dark:bg-orange-900/30">
                <Ban className="h-6 w-6 text-orange-600 dark:text-orange-400" />
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
                <button
                  onClick={() => setCancelId(intentId)}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg border border-orange-300 bg-orange-50 px-4 py-2 text-sm font-medium text-orange-700 transition-colors hover:bg-orange-100 dark:border-orange-900/50 dark:bg-orange-950/30 dark:text-orange-400 dark:hover:bg-orange-950/50"
                >
                  <Ban className="h-4 w-4" />
                  Cancel Event
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Event */}
        <div className="rounded-xl border border-red-200 bg-white p-6 dark:border-red-900/50 dark:bg-zinc-900">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-red-100 p-3 dark:bg-red-900/30">
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
              {!isCancelled && (
                <p className="mt-2 text-sm font-medium text-orange-600 dark:text-orange-400">
                  ⚠️ We recommend cancelling the event first to notify members
                  before deletion.
                </p>
              )}
              <button
                onClick={() => setDeleteId(intentId)}
                className="mt-4 inline-flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50"
              >
                <Trash2 className="h-4 w-4" />
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
          router.push('/account/intents');
        }}
        title="Delete this event permanently?"
        subtitle="This will permanently delete all event data including messages, comments, and reviews. This action cannot be undone."
      />
    </>
  );
}
