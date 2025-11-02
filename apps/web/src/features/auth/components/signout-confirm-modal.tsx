'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { LogOut } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';

export function SignOutConfirmModal({
  open,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  // Lock scroll
  useEffect(() => {
    if (!open) return;
    const { documentElement, body } = document;
    const prevHtmlOverflow = documentElement.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    documentElement.style.overflow = 'hidden';
    // body.style.overflow = 'hidden';
    return () => {
      documentElement.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
    };
  }, [open]);

  // Esc zamyka
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCancel();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  const portalTarget = useMemo(
    () => (typeof window === 'undefined' ? null : document.body),
    []
  );
  if (!portalTarget) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(e) => e.currentTarget === e.target && onCancel()}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="signout-title"
            className="w-[92vw] max-w-md rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl ring-1 ring-black/5 dark:border-zinc-800 dark:bg-zinc-900"
            initial={{ y: 10, scale: 0.98 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-red-500/10 text-red-600 dark:bg-red-500/15 dark:text-red-400">
                <LogOut className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h2
                  id="signout-title"
                  className="text-lg font-semibold text-zinc-900 dark:text-zinc-100"
                >
                  Wylogować się?
                </h2>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  Zostaniesz wylogowany z konta w tej przeglądarce.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                onClick={onCancel}
                className="cursor-pointer rounded-xl border border-zinc-300 bg-white/80 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                Anuluj
              </button>
              <button
                onClick={onConfirm}
                className="cursor-pointer rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              >
                Wyloguj
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    portalTarget
  );
}
