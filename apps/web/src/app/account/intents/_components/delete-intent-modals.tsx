'use client';

import { useState, useCallback } from 'react';
import { NoticeModal } from '@/components/feedback/notice-modal';
import { useDeleteIntentMutation } from '@/lib/api/intents';

type Props = {
  /** ID of intent to delete; when null, the confirm dialog is closed */
  deleteId: string | null;
  /** Called when the confirm dialog should be closed (also after success/error) */
  onClose: () => void;
  /** Optional: callback fired after successful delete (e.g., invalidate/refetch list) */
  onSuccess?: () => void;

  /** Optional copy overrides */
  title?: string;
  subtitle?: string;
  successTitle?: string;
  successSubtitle?: string;
  errorTitle?: string;
  errorSubtitle?: string;
};

/**
 * DeleteIntentModals
 *
 * Encapsulates the "Delete?" confirmation dialog and the follow-up success/error modals.
 * Uses useDeleteIntentMutation under the hood.
 */
export function DeleteIntentModals({
  deleteId,
  onClose,
  onSuccess,

  title = 'Delete intent?',
  subtitle = 'This action is permanent and cannot be undone.',
  successTitle = 'Intent deleted',
  successSubtitle = 'The intent has been permanently deleted.',
  errorTitle = 'Intent not deleted',
  errorSubtitle = 'We could not delete this intent. Please try again later.',
}: Props) {
  const { mutateAsync: deleteIntentMutateAsync } = useDeleteIntentMutation();

  const [loading, setLoading] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);

  const handlePrimary = useCallback(async () => {
    if (!deleteId) return;
    try {
      setLoading(true);
      await deleteIntentMutateAsync({ id: deleteId });

      // Close confirm first to avoid stacked dialogs
      onClose();

      // Show success confirmation
      setSuccessOpen(true);

      // Let parent refresh if needed
      onSuccess?.();
    } catch (e) {
      onClose();
      setErrorOpen(true);
      // eslint-disable-next-line no-console
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [deleteId, deleteIntentMutateAsync, onClose, onSuccess]);

  return (
    <>
      {/* Confirm delete */}
      <NoticeModal
        closeOnBackdrop
        closeOnEsc
        autoSkipIfHidden
        open={!!deleteId}
        size="sm"
        variant="error"
        title={title}
        subtitle={subtitle}
        secondaryLabel="Cancel"
        primaryLabel={loading ? 'Deleting...' : 'Yes, delete'}
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
        size="sm"
        autoSkipIfHidden
        open={successOpen}
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
