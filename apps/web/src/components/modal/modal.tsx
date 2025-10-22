'use client';

import { ReactNode, useCallback, useEffect, useId, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

type Size = 'sm' | 'md' | 'lg' | 'xl';
type Variant = 'default' | 'centered';

type Props = {
  open?: boolean;
  onClose?: () => void;

  /** Default layout props (backwards compatible) */
  header?: ReactNode;
  content?: ReactNode;
  footer?: ReactNode;

  /** A11y */
  labelledById?: string;
  describedById?: string;
  /** If you don’t have a visible header, provide an aria-label */
  ariaLabel?: string;

  /** NEW: visual/behavior options */
  variant?: Variant; // 'default' (old look) | 'centered' (wow look)
  size?: Size; // panel width preset (centered variant)
  closeOnEsc?: boolean; // default true
  closeOnBackdrop?: boolean; // default true
  initialFocusRef?: React.RefObject<HTMLElement>; // focus on open
  className?: string; // extra class for panel
  backdropClassName?: string; // extra class for overlay
};

export function Modal({
  open,
  onClose,

  header,
  content,
  footer,

  labelledById,
  describedById,
  ariaLabel,

  variant = 'default',
  size = 'md',
  closeOnEsc = true,
  closeOnBackdrop = true,
  initialFocusRef,
  className,
  backdropClassName,
}: Props) {
  const internalTitleId = useId();
  const titleId = labelledById ?? internalTitleId;
  const panelRef = useRef<HTMLDivElement | null>(null);

  const handleOnClose = useCallback(() => onClose?.(), [onClose]);

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
    if (!open || !closeOnEsc) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleOnClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, closeOnEsc, handleOnClose]);

  // Focus management: move focus inside on open
  useEffect(() => {
    if (!open) return;
    const el =
      initialFocusRef?.current ??
      panelRef.current?.querySelector<HTMLElement>(
        '[data-autofocus],button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])'
      ) ??
      null;
    el?.focus?.();
  }, [open, initialFocusRef]);

  if (!open) return null;

  /** Sizes only for centered variant */
  const sizeCls: Record<Size, string> = {
    sm: 'w-[min(480px,92vw)]',
    md: 'w-[min(640px,92vw)]',
    lg: 'w-[min(760px,92vw)]',
    xl: 'w-[min(900px,92vw)]',
  };

  const basePanelCls =
    'bg-white border shadow-2xl rounded-3xl border-zinc-200 ring-1 ring-black/5 dark:border-zinc-800 dark:bg-zinc-900 dark:ring-white/10';

  const overlayMotion = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.18 },
  };

  const panelMotion =
    variant === 'centered'
      ? {
          initial: { opacity: 0, y: 12, scale: 0.98 },
          animate: { opacity: 1, y: 0, scale: 1 },
          exit: { opacity: 0, y: 10, scale: 0.98 },
          transition: {
            type: 'spring',
            stiffness: 280,
            damping: 22,
            mass: 0.7,
          },
        }
      : {
          initial: { opacity: 0, y: 10 },
          animate: { opacity: 1, y: 0 },
          exit: { opacity: 0, y: 10 },
          transition: { duration: 0.2 },
        };

  const component = (
    <div
      className="fixed inset-0 z-[100] text-red"
      role="dialog"
      aria-modal="true"
      aria-labelledby={ariaLabel ? undefined : titleId}
      aria-label={ariaLabel}
      aria-describedby={describedById}
    >
      <AnimatePresence>
        {/* Backdrop */}
        <motion.div
          key="overlay"
          {...overlayMotion}
          className={[
            'absolute inset-0 bg-black/50 backdrop-blur-sm',
            backdropClassName,
          ]
            .filter(Boolean)
            .join(' ')}
          onClick={closeOnBackdrop ? handleOnClose : undefined}
        />

        {/* DEFAULT VARIANT: your previous scrollable layout with sticky header/footer */}
        {variant === 'default' && (
          <motion.div
            key="sheet"
            {...panelMotion}
            className="absolute inset-0 overflow-y-auto"
            onClick={closeOnBackdrop ? handleOnClose : undefined}
          >
            <div className="mx-auto my-6 w-[min(760px,92vw)]">
              <div
                ref={panelRef}
                className={[basePanelCls, className].filter(Boolean).join(' ')}
                onClick={(e) => e.stopPropagation()}
              >
                {header && (
                  <div
                    id={titleId}
                    className="sticky top-0 z-10 px-4 py-4 border-b rounded-t-3xl border-zinc-200 bg-white/85 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/85"
                  >
                    {header}
                  </div>
                )}

                {content && <div className="p-4">{content}</div>}

                {footer && (
                  <div className="sticky bottom-0 z-10 p-4 border-t rounded-b-3xl border-zinc-200 bg-gradient-to-t from-white via-white/95 backdrop-blur dark:border-zinc-800 dark:from-zinc-900 dark:via-zinc-900/95">
                    {footer}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* CENTERED VARIANT: premium, fully centered & compact */}
        {variant === 'centered' && (
          <div
            key="center-wrap"
            className="absolute inset-0 grid place-items-center p-4"
            onClick={closeOnBackdrop ? handleOnClose : undefined}
          >
            <motion.div
              key="center-panel"
              {...panelMotion}
              ref={panelRef}
              onClick={(e) => e.stopPropagation()}
              className={[
                basePanelCls,
                sizeCls[size],
                'px-6 py-6 sm:px-8 sm:py-8',
                className,
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {/* In centered variant we don’t apply sticky bars.
                  Caller can pass header/content/footer as they like,
                  but we render them stacked for a premium look. */}
              {header && (
                <div id={titleId} className="mb-4">
                  {header}
                </div>
              )}
              {content && <div>{content}</div>}
              {footer && <div className="mt-6">{footer}</div>}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );

  return createPortal(
    component,
    document.getElementById('portal-root') ?? document.body
  );
}
