'use client';

import { ReactNode, useCallback, useEffect } from 'react';

type Props = {
  open?: boolean;
  onClose?: () => void;
  header?: ReactNode;
  content?: ReactNode;
  footer?: ReactNode;
  labelledById?: string;
  describedById?: string;
};

export function Modal({
  content,
  footer,
  header,
  onClose,
  open,
  labelledById,
  describedById,
}: Props) {
  const handleOnClose = useCallback(() => {
    onClose?.();
  }, [onClose]);

  // Scroll lock + compensation
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;
    const sbw = window.innerWidth - document.documentElement.clientWidth;
    if (sbw > 0) document.body.style.paddingRight = `${sbw}px`;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPaddingRight;
    };
  }, [open]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleOnClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, handleOnClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100]"
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledById}
      aria-describedby={describedById}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleOnClose}
      />

      {/* Scrollable container */}
      <div className="absolute inset-0 overflow-y-auto">
        <div className="mx-auto my-6 w-[min(760px,92vw)]">
          <div
            className="bg-white border shadow-2xl rounded-3xl border-zinc-200 ring-1 ring-black/5 dark:border-zinc-800 dark:bg-zinc-900 dark:ring-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            {header && (
              <div className="sticky top-0 z-10 px-4 py-4 border-b rounded-t-3xl border-zinc-200 bg-white/85 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/85">
                {header}
              </div>
            )}

            {/* Body */}
            {content && <div className="p-4">{content}</div>}

            {/* Footer */}
            {footer && (
              <div className="sticky bottom-0 z-10 p-4 border-t rounded-b-3xl border-zinc-200 bg-gradient-to-t from-white via-white/95 backdrop-blur dark:border-zinc-800 dark:from-zinc-900 dark:via-zinc-900/95">
                {footer}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
