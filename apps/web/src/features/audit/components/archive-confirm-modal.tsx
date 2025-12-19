'use client';

/**
 * Archive Confirmation Modal
 *
 * Confirms manual audit log archiving with the user.
 */

import { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Archive, AlertTriangle, Loader2 } from 'lucide-react';

interface ArchiveConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  logCount: number;
}

export function ArchiveConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  logCount,
}: ArchiveConfirmModalProps) {
  // Handle escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    },
    [onClose, isLoading]
  );

  // Handle backdrop click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget && !isLoading) {
        onClose();
      }
    },
    [onClose, isLoading]
  );

  // Add/remove keyboard listener and body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="archive-modal-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Modal Panel */}
      <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
        {/* Icon */}
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
          <Archive className="h-7 w-7 text-amber-600 dark:text-amber-400" />
        </div>

        {/* Title */}
        <h2
          id="archive-modal-title"
          className="mt-4 text-center text-lg font-semibold text-zinc-900 dark:text-zinc-100"
        >
          Archive Audit Logs {/* TODO i18n */}
        </h2>

        {/* Description */}
        <div className="mt-3 text-center space-y-2">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            This will archive <strong>{logCount}</strong> audit log{' '}
            {logCount === 1 ? 'entry' : 'entries'} to cold storage and remove
            them from the active database. {/* TODO i18n */}
          </p>
          <div className="flex items-center justify-center gap-2 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">
              This action cannot be undone. {/* TODO i18n */}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
          >
            Cancel {/* TODO i18n */}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 rounded-xl bg-amber-600 hover:bg-amber-500 px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Archiving... {/* TODO i18n */}
              </>
            ) : (
              <>
                <Archive className="h-4 w-4" />
                Archive {/* TODO i18n */}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  // Use portal to render modal at document body level
  if (typeof document === 'undefined') return null;
  return createPortal(modalContent, document.body);
}

