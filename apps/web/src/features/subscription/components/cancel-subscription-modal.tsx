/**
 * Cancel Subscription Modal
 * Confirmation dialog for cancelling user subscription
 */

// TODO: Add i18n for hardcoded strings:
// "Cancel Subscription", "Are you sure?", "If you cancel this subscription...",
// "After that date, you will lose access...", "Keep Subscription", "Yes, Cancel Subscription"

'use client';

import React from 'react';

// Icons
import { AlertTriangle, X } from 'lucide-react';

// Components
import { Modal } from '@/components/feedback/modal';

export function CancelSubscriptionModal({
  open,
  renewDate,
  onClose,
  onConfirm,
}: {
  open: boolean;
  renewDate: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      variant="centered"
      size="md"
      density="comfortable"
      header={
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Cancel Subscription
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      }
      content={
        <div className="space-y-4">
          {/* Warning Icon */}
          <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 ring-1 ring-amber-500/20">
            <AlertTriangle className="w-8 h-8 text-amber-500" strokeWidth={2} />
          </div>

          {/* Content */}
          <div className="space-y-3 text-center">
            <h3 className="text-xl font-bold tracking-[-0.02em] text-zinc-900 dark:text-zinc-50">
              Are you sure?
            </h3>
            <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 max-w-[45ch] mx-auto">
              If you cancel this subscription, it will still be available until
              the end of your billing period on{' '}
              <span className="font-semibold text-zinc-900 dark:text-zinc-200">
                {renewDate}
              </span>
              .
            </p>
            <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 max-w-[45ch] mx-auto">
              After that date, you will lose access to all premium features and
              your account will be downgraded to the Free plan.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium rounded-xl border-2 border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              Keep Subscription
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="px-4 py-2.5 text-sm font-semibold text-white rounded-xl bg-red-600 hover:bg-red-500 transition-colors"
            >
              Yes, Cancel Subscription
            </button>
          </div>
        </div>
      }
    />
  );
}
