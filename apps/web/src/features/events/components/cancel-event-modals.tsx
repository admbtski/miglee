'use client';

import { NoticeModal } from '@/components/ui/notice-modal';
import { useCancelEventMutation } from '@/features/events';
import { useCallback, useState } from 'react';

type Props = {
  /** ID of event to cancel; when null, the confirm dialog is closed */
  cancelId: string | null;
  /** Called when the confirm dialog should be closed (also after success/error) */
  onClose: () => void;
  /** Optional: callback fired after successful cancel (e.g., refetch/invalidate) */
  onSuccess?: () => void;

  /** Optional copy overrides (titles, labels) */
  title?: string;
  subtitle?: string;
  successTitle?: string;
  successSubtitle?: string;
  errorTitle?: string;
  errorSubtitle?: string;
};

/**
 * CancelEventModals
 *
 * Encapsulates the "Cancel?" confirmation dialog and follow-up success/error modals.
 * Uses useDeleteEventMutation as the underlying operation (requested by user).
 */
export function CancelEventModals({
  cancelId,
  onClose,
  onSuccess,

  title = 'Cancel event?',
  subtitle = 'This action is permanent and cannot be undone.',
  successTitle = 'Event canceled',
  successSubtitle = 'The event has been successfully canceled.',
  errorTitle = 'Event not canceled',
  errorSubtitle = 'We could not cancel this event. Please try again later.',
}: Props) {
  const { mutateAsync: cancelEventMutateAsync } = useCancelEventMutation();

  const [loading, setLoading] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);

  const handlePrimary = useCallback(async () => {
    if (!cancelId) return;
    try {
      setLoading(true);
      await cancelEventMutateAsync({ id: cancelId });

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
  }, [cancelId, cancelEventMutateAsync, onClose, onSuccess]);

  return (
    <>
      {/* Confirm cancel */}
      <NoticeModal
        closeOnBackdrop
        closeOnEsc
        autoSkipIfHidden
        open={!!cancelId}
        variant="warning"
        size="sm"
        title={title}
        subtitle={subtitle}
        secondaryLabel="Cancel"
        primaryLabel={loading ? 'Canceling...' : 'Yes, cancel'}
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
        title={successTitle}
        subtitle={successSubtitle}
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
        title={errorTitle}
        subtitle={errorSubtitle}
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
