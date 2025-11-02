'use client';

import { useState, useCallback } from 'react';
import { NoticeModal } from '@/components/feedback/notice-modal';

type Props = {
  /** ID of intent to leave; when null, the confirm dialog is closed */
  leaveId: string | null;
  /** Called when the confirm dialog should be closed (also after success/error) */
  onClose: () => void;
  /** The async action that performs the "leave" on the server */
  leaveAction: (id: string) => Promise<void>;
  /** Optional: callback fired after successful leave (e.g., invalidate/refetch list) */
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
 * LeaveIntentModals
 *
 * Encapsulates the "Leave?" confirmation dialog and the follow-up success/error modals.
 * The actual leave operation is injected via `leaveAction` to keep this component portable.
 */
export function LeaveIntentModals({
  leaveId,
  onClose,
  leaveAction,
  onSuccess,

  title = 'Leave intent?',
  subtitle = 'You will be removed from this intent and may need a new invite to re-join.',
  successTitle = 'Left the intent',
  successSubtitle = 'You have successfully left this intent.',
  errorTitle = 'Could not leave',
  errorSubtitle = 'We could not process your request. Please try again later.',
}: Props) {
  const [loading, setLoading] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);

  const handlePrimary = useCallback(async () => {
    if (!leaveId) return;
    try {
      setLoading(true);
      await leaveAction(leaveId);

      // Close confirm first
      onClose();

      // Show success confirmation
      setSuccessOpen(true);

      // Parent hook for invalidation/refetch
      onSuccess?.();
    } catch (e) {
      onClose();
      setErrorOpen(true);
      // eslint-disable-next-line no-console
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [leaveId, leaveAction, onClose, onSuccess]);

  return (
    <>
      {/* Confirm leave */}
      <NoticeModal
        closeOnBackdrop
        closeOnEsc
        autoSkipIfHidden
        open={!!leaveId}
        variant="warning"
        size="sm"
        title={title}
        subtitle={subtitle}
        secondaryLabel="Stay"
        primaryLabel={loading ? 'Leaving...' : 'Yes, leave'}
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
