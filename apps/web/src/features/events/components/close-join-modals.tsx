'use client';

import { NoticeModal } from '@/components/feedback/notice-modal';
import {
  useCloseEventJoinMutation,
  useReopenEventJoinMutation,
} from '@/features/events/api/events';
import { useCallback, useState } from 'react';

type CloseJoinProps = {
  /** ID of event to close join; when null, the confirm dialog is closed */
  eventId: string | null;
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
  eventId,
  onClose,
  onSuccess,
  reason = '',
  onReasonChange,
}: CloseJoinProps) {
  const { mutateAsync: closeJoinMutateAsync } = useCloseEventJoinMutation();

  const [loading, setLoading] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);

  const handlePrimary = useCallback(async () => {
    if (!eventId) return;
    try {
      setLoading(true);
      await closeJoinMutateAsync({
        eventId,
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
  }, [eventId, reason, closeJoinMutateAsync, onClose, onSuccess]);

  return (
    <>
      {/* Confirm close join */}
      <NoticeModal
        closeOnBackdrop
        closeOnEsc
        autoSkipIfHidden
        open={!!eventId}
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
            className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Powód zamknięcia (opcjonalnie)
          </label>
          <textarea
            id="close-reason"
            value={reason}
            onChange={(e) => onReasonChange?.(e.target.value)}
            placeholder="np. Osiągnięto maksymalną liczbę uczestników"
            rows={3}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-blue-400"
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
  /** ID of event to reopen join; when null, the confirm dialog is closed */
  eventId: string | null;
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
  eventId,
  onClose,
  onSuccess,
}: ReopenJoinProps) {
  const { mutateAsync: reopenJoinMutateAsync } = useReopenEventJoinMutation();

  const [loading, setLoading] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);

  const handlePrimary = useCallback(async () => {
    if (!eventId) return;
    try {
      setLoading(true);
      await reopenJoinMutateAsync({ eventId });

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
  }, [eventId, reopenJoinMutateAsync, onClose, onSuccess]);

  return (
    <>
      {/* Confirm reopen join */}
      <NoticeModal
        closeOnBackdrop
        closeOnEsc
        autoSkipIfHidden
        open={!!eventId}
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
