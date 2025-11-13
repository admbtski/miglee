'use client';

import { NoticeModal } from '@/components/feedback/notice-modal';
import {
  useCloseIntentJoinMutation,
  useReopenIntentJoinMutation,
} from '@/lib/api/intents';
import { useCallback, useState } from 'react';

type CloseJoinProps = {
  /** ID of intent to close join; when null, the confirm dialog is closed */
  intentId: string | null;
  /** Called when the confirm dialog should be closed (also after success/error) */
  onClose: () => void;
  /** Optional: callback fired after successful close (e.g., refetch/invalidate) */
  onSuccess?: () => void;
  /** Optional: reason for closing join */
  reason?: string;
  /** Optional: callback to set reason */
  onReasonChange?: (reason: string) => void;
};

/**
 * CloseJoinModal
 *
 * Encapsulates the "Close Join?" confirmation dialog with optional reason input
 * and follow-up success/error modals.
 */
export function CloseJoinModal({
  intentId,
  onClose,
  onSuccess,
  reason = '',
  onReasonChange,
}: CloseJoinProps) {
  const { mutateAsync: closeJoinMutateAsync } = useCloseIntentJoinMutation();

  const [loading, setLoading] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);

  const handlePrimary = useCallback(async () => {
    if (!intentId) return;
    try {
      setLoading(true);
      await closeJoinMutateAsync({
        intentId,
        reason: reason || undefined,
      });

      // Close confirm dialog first
      onClose();

      // Show success modal
      setSuccessOpen(true);

      // Let parent refresh its data if needed
      onSuccess?.();
    } catch (e) {
      // Close confirm dialog, then show error modal
      onClose();
      setErrorOpen(true);
      // eslint-disable-next-line no-console
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [intentId, reason, closeJoinMutateAsync, onClose, onSuccess]);

  return (
    <>
      {/* Confirm close join */}
      <NoticeModal
        closeOnBackdrop
        closeOnEsc
        autoSkipIfHidden
        open={!!intentId}
        variant="warning"
        size="sm"
        title="Zamknąć zapisy ręcznie?"
        subtitle="Użytkownicy nie będą mogli dołączyć do tego wydarzenia."
        secondaryLabel="Anuluj"
        primaryLabel={loading ? 'Zamykanie...' : 'Tak, zamknij zapisy'}
        actionClassName="justify-center"
        onClose={onClose}
        onSecondary={onClose}
        primaryLoading={loading}
        primaryDisabled={loading}
        onPrimary={handlePrimary}
      >
        <div className="mt-4">
          <label
            htmlFor="close-reason"
            className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
          >
            Powód zamknięcia (opcjonalnie)
          </label>
          <textarea
            id="close-reason"
            value={reason}
            onChange={(e) => onReasonChange?.(e.target.value)}
            placeholder="np. Osiągnięto maksymalną liczbę uczestników"
            rows={3}
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500 dark:focus:border-blue-400"
          />
        </div>
      </NoticeModal>

      {/* Success */}
      <NoticeModal
        closeOnBackdrop
        closeOnEsc
        autoSkipIfHidden
        open={successOpen}
        size="sm"
        variant="success"
        title="Zapisy zamknięte"
        subtitle="Zapisy do wydarzenia zostały pomyślnie zamknięte."
        actionClassName="justify-center"
        autoCloseClassName="text-center"
        autoCloseMs={3000}
        onClose={() => setSuccessOpen(false)}
        onPrimary={() => setSuccessOpen(false)}
      >
        <></>
      </NoticeModal>

      {/* Error */}
      <NoticeModal
        closeOnBackdrop
        closeOnEsc
        autoSkipIfHidden
        open={errorOpen}
        size="sm"
        variant="error"
        title="Nie udało się zamknąć zapisów"
        subtitle="Spróbuj ponownie później."
        actionClassName="justify-center"
        autoCloseClassName="text-center"
        autoCloseMs={3000}
        onClose={() => setErrorOpen(false)}
        onPrimary={() => setErrorOpen(false)}
      >
        <></>
      </NoticeModal>
    </>
  );
}

type ReopenJoinProps = {
  /** ID of intent to reopen join; when null, the confirm dialog is closed */
  intentId: string | null;
  /** Called when the confirm dialog should be closed (also after success/error) */
  onClose: () => void;
  /** Optional: callback fired after successful reopen (e.g., refetch/invalidate) */
  onSuccess?: () => void;
};

/**
 * ReopenJoinModal
 *
 * Encapsulates the "Reopen Join?" confirmation dialog
 * and follow-up success/error modals.
 */
export function ReopenJoinModal({
  intentId,
  onClose,
  onSuccess,
}: ReopenJoinProps) {
  const { mutateAsync: reopenJoinMutateAsync } = useReopenIntentJoinMutation();

  const [loading, setLoading] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);

  const handlePrimary = useCallback(async () => {
    if (!intentId) return;
    try {
      setLoading(true);
      await reopenJoinMutateAsync({ intentId });

      // Close confirm dialog first
      onClose();

      // Show success modal
      setSuccessOpen(true);

      // Let parent refresh its data if needed
      onSuccess?.();
    } catch (e) {
      // Close confirm dialog, then show error modal
      onClose();
      setErrorOpen(true);
      // eslint-disable-next-line no-console
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [intentId, reopenJoinMutateAsync, onClose, onSuccess]);

  return (
    <>
      {/* Confirm reopen join */}
      <NoticeModal
        closeOnBackdrop
        closeOnEsc
        autoSkipIfHidden
        open={!!intentId}
        variant="info"
        size="sm"
        title="Otworzyć zapisy ponownie?"
        subtitle="Użytkownicy będą mogli ponownie dołączyć do tego wydarzenia."
        secondaryLabel="Anuluj"
        primaryLabel={loading ? 'Otwieranie...' : 'Tak, otwórz zapisy'}
        actionClassName="justify-center"
        onClose={onClose}
        onSecondary={onClose}
        primaryLoading={loading}
        primaryDisabled={loading}
        onPrimary={handlePrimary}
      >
        <></>
      </NoticeModal>

      {/* Success */}
      <NoticeModal
        closeOnBackdrop
        closeOnEsc
        autoSkipIfHidden
        open={successOpen}
        size="sm"
        variant="success"
        title="Zapisy otwarte"
        subtitle="Zapisy do wydarzenia zostały pomyślnie otwarte."
        actionClassName="justify-center"
        autoCloseClassName="text-center"
        autoCloseMs={3000}
        onClose={() => setSuccessOpen(false)}
        onPrimary={() => setSuccessOpen(false)}
      >
        <></>
      </NoticeModal>

      {/* Error */}
      <NoticeModal
        closeOnBackdrop
        closeOnEsc
        autoSkipIfHidden
        open={errorOpen}
        size="sm"
        variant="error"
        title="Nie udało się otworzyć zapisów"
        subtitle="Spróbuj ponownie później."
        actionClassName="justify-center"
        autoCloseClassName="text-center"
        autoCloseMs={3000}
        onClose={() => setErrorOpen(false)}
        onPrimary={() => setErrorOpen(false)}
      >
        <></>
      </NoticeModal>
    </>
  );
}
