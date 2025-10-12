'use client';

import { ReactNode, useCallback, useEffect } from 'react';

type Props = {
  open?: boolean;
  onClose?: () => void;
  header?: ReactNode;
  content?: ReactNode;
  footer?: ReactNode;
};

export function Modal({ content, footer, header, onClose, open }: Props) {
  const handleOnClose = useCallback(() => {
    onClose?.();
  }, []);

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

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleOnClose();
    };

    window.addEventListener('keydown', onKey, { passive: false });
    return () => window.removeEventListener('keydown', onKey);
  }, [open, handleOnClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-intent-title"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleOnClose}
      />

      <div className="absolute inset-0 overflow-y-auto">
        <div className="mx-auto my-6 w-[min(760px,92vw)]">
          <div className="rounded-3xl border border-zinc-200 bg-white shadow-2xl ring-1 ring-black/5 dark:border-zinc-800 dark:bg-zinc-900 dark:ring-white/10">
            {header && (
              <div className="sticky top-0 z-10 rounded-t-3xl border-b border-zinc-200 bg-white/85 px-4 py-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/85">
                {header}
              </div>
            )}
            {/* body */}
            {content && <div className="p-4">{content}</div>}

            {/* footer */}
            <div className="sticky z-10 bottom-0 rounded-b-3xl border-t border-zinc-200 bg-gradient-to-t from-white via-white/95 p-4 backdrop-blur dark:border-zinc-800 dark:from-zinc-900 dark:via-zinc-900/95">
              {footer}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
