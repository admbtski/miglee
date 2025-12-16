'use client';

/**
 * Delete Account Modal
 *
 * Confirmation dialog for account deletion with:
 * - Reason input (optional)
 * - Confirmation text input
 * - Grace period info (soft delete)
 */

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

import { useI18n } from '@/lib/i18n/provider-ssr';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  isDeleting: boolean;
}

export function DeleteAccountModal({
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
}: DeleteAccountModalProps) {
  const { t, locale } = useI18n();
  const [reason, setReason] = useState('');
  const [confirmation, setConfirmation] = useState('');

  const confirmText =
    locale === 'pl' ? 'USUŃ' : locale === 'de' ? 'LÖSCHEN' : 'DELETE';
  const isValid = confirmation === confirmText;

  const handleConfirm = async () => {
    if (!isValid) return;

    await onConfirm(reason);
    // Reset form
    setReason('');
    setConfirmation('');
  };

  const handleClose = () => {
    if (isDeleting) return;
    setReason('');
    setConfirmation('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl max-w-md w-full border border-zinc-200 dark:border-zinc-800"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30">
                    <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                    {t.settings.deleteAccount.modal.title}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isDeleting}
                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {t.settings.deleteAccount.modal.description}
                </p>

                {/* TODO: Add i18n for this info box */}
                <div className="p-4 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-900/50">
                  <p className="text-sm text-indigo-800 dark:text-indigo-300">
                    ℹ️ <strong>Soft Delete (Grace Period):</strong> Your account
                    will be deactivated, not permanently deleted. You can
                    restore it within 30 days by visiting{' '}
                    <span className="font-mono text-xs bg-indigo-100 dark:bg-indigo-950/50 px-1 py-0.5 rounded">
                      /restore-account
                    </span>{' '}
                    and requesting a restoration link via email.
                  </p>
                </div>

                {/* Reason Input */}
                <div>
                  <label
                    htmlFor="reason"
                    className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2"
                  >
                    {t.settings.deleteAccount.modal.reasonLabel}
                  </label>
                  <textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder={
                      t.settings.deleteAccount.modal.reasonPlaceholder
                    }
                    rows={3}
                    className="w-full px-4 py-2.5 bg-white border border-zinc-300 rounded-lg text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                    disabled={isDeleting}
                  />
                </div>

                {/* Confirmation Input */}
                <div>
                  <label
                    htmlFor="confirmation"
                    className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2"
                  >
                    {t.settings.deleteAccount.modal.confirmLabel}
                  </label>
                  <input
                    type="text"
                    id="confirmation"
                    value={confirmation}
                    onChange={(e) => setConfirmation(e.target.value)}
                    placeholder={confirmText}
                    className={`w-full px-4 py-2.5 bg-white border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:border-transparent dark:bg-zinc-800 ${
                      confirmation && !isValid
                        ? 'border-red-300 focus:ring-red-500 dark:border-red-700'
                        : 'border-zinc-300 focus:ring-red-500 dark:border-zinc-700'
                    } text-zinc-900 placeholder:text-zinc-400 dark:text-zinc-100 dark:placeholder:text-zinc-500`}
                    disabled={isDeleting}
                  />
                  {confirmation && !isValid && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                      {t.settings.deleteAccount.modal.invalidConfirmation}
                    </p>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100 transition-colors disabled:opacity-50"
                >
                  {t.settings.deleteAccount.modal.cancel}
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={!isValid || isDeleting}
                  className="px-6 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors dark:focus:ring-offset-zinc-900"
                >
                  {isDeleting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{t.common.loading}</span>
                    </div>
                  ) : (
                    t.settings.deleteAccount.modal.confirm
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
