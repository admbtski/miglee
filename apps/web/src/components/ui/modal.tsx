'use client';

import clsx from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';
import React, {
  ReactNode,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
} from 'react';
import { createPortal } from 'react-dom';
import { twMerge } from 'tailwind-merge';

// ----- Types -----------------------------------------------------------------

type Size = 'sm' | 'md' | 'lg' | 'xl';
type Variant = 'default' | 'centered';
type Density = 'comfortable' | 'compact' | 'none';

type Props = {
  open?: boolean;
  onClose?: () => void;

  header?: ReactNode;
  content?: ReactNode;
  footer?: ReactNode;

  labelledById?: string;
  describedById?: string;
  ariaLabel?: string;

  variant?: Variant;
  size?: Size;
  density?: Density;

  closeOnEsc?: boolean;
  closeOnBackdrop?: boolean;
  initialFocusRef?: React.RefObject<HTMLElement>;

  /** Extra class for the panel */
  className?: string;
  /** Extra class for the header */
  headerClassName?: string;
  /** Extra class for the content */
  contentClassName?: string;
  /** Extra class for the footer */
  footerClassName?: string;
  /** Extra class for the backdrop */
  backdropClassName?: string;

  /** DOM node id to mount the portal into (falls back to body) */
  portalId?: string;
};

// ----- Constants --------------------------------------------------------------

/** Sizes are only used by the "centered" variant */
const SIZE_CLASS: Record<Size, string> = {
  sm: 'w-[min(480px,92vw)]',
  md: 'w-[min(640px,92vw)]',
  lg: 'w-[min(760px,92vw)]',
  xl: 'w-[min(900px,92vw)]',
};

const DENSITY_CLASS: Record<Density, string> = {
  comfortable: 'px-6 py-6 sm:px-8 sm:py-8',
  compact: 'px-4 py-4 sm:px-6 sm:py-5',
  none: 'p-0',
};

const BASE_PANEL_CLASS =
  'mx-auto bg-white border shadow-2xl rounded-3xl border-zinc-200 ring-1 ring-black/5 ' +
  'dark:border-zinc-800 dark:bg-zinc-900 dark:ring-white/10';

const OVERLAY_MOTION = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.18 },
} as const;

const PANEL_MOTION = {
  centered: {
    initial: { opacity: 0, y: 12, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: 10, scale: 0.98 },
    transition: { type: 'spring', stiffness: 280, damping: 22, mass: 0.7 },
  },
  default: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 10 },
    transition: { duration: 0.2 },
  },
} as const;

// ----- Component --------------------------------------------------------------

export function Modal({
  open = false,
  onClose,

  header,
  content,
  footer,

  labelledById,
  describedById,
  ariaLabel,

  variant = 'default',
  size = 'md',
  density = 'comfortable',

  closeOnEsc = true,
  closeOnBackdrop = true,
  initialFocusRef,

  className,
  headerClassName,
  contentClassName,
  footerClassName,
  backdropClassName,
  portalId = 'portal-root',
}: Props) {
  const internalTitleId = useId();
  const titleId = labelledById ?? internalTitleId;

  const panelRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  const handleOnClose = useCallback(() => {
    onClose?.();
  }, [onClose]);

  // Store the previously focused element and restore focus on unmount/close.
  useLayoutEffect(() => {
    if (!open) return;
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    return () => {
      // Restore focus to the element that had it before the modal opened.
      previouslyFocusedRef.current?.focus?.();
      previouslyFocusedRef.current = null;
    };
  }, [open]);

  // Scroll lock + scrollbar compensation while modal is open.
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;

    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPaddingRight;
    };
  }, [open]);

  // Close on Escape key if enabled.
  useEffect(() => {
    if (!open || !closeOnEsc) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        handleOnClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, closeOnEsc, handleOnClose]);

  // Initial focus: prefer provided ref, otherwise first focusable inside panel.
  useEffect(() => {
    if (!open) return;
    const el =
      initialFocusRef?.current ??
      panelRef.current?.querySelector<HTMLElement>(
        '[data-autofocus],button,[href],input,select,textarea,summary,' +
          '[tabindex]:not([tabindex="-1"])'
      );
    el?.focus?.();
  }, [open, initialFocusRef]);

  if (!open) return null;

  // Modal tree to be portaled.
  const tree = (
    <div
      className="fixed inset-0 z-[100]"
      role="dialog"
      aria-modal="true"
      // If ariaLabel is provided, aria-labelledby MUST NOT be set.
      aria-labelledby={ariaLabel ? undefined : titleId}
      aria-label={ariaLabel}
      aria-describedby={describedById}
    >
      <AnimatePresence>
        {/* Backdrop */}
        <motion.div
          key="overlay"
          {...OVERLAY_MOTION}
          className={clsx(
            'absolute inset-0 bg-black/50 backdrop-blur-sm',
            backdropClassName
          )}
          onClick={closeOnBackdrop ? handleOnClose : undefined}
        />

        {/* DEFAULT (sheet-like) VARIANT */}
        {variant === 'default' && (
          <motion.div
            key="sheet"
            {...PANEL_MOTION.default}
            className="absolute inset-0 overflow-y-auto"
            onClick={closeOnBackdrop ? handleOnClose : undefined}
          >
            <div
              ref={panelRef}
              className={clsx(
                'my-6',
                SIZE_CLASS[size],
                BASE_PANEL_CLASS,
                className
              )}
              // Stop propagation so clicking inside the panel does not close it.
              onClick={(e) => e.stopPropagation()}
            >
              {header && (
                <div
                  id={titleId}
                  className={twMerge(
                    'sticky top-0 z-10 px-4 py-4 border-b rounded-t-3xl border-zinc-200 bg-white/70 backdrop-blur-2xl dark:border-zinc-800 dark:bg-zinc-900/70',
                    headerClassName
                  )}
                >
                  {header}
                </div>
              )}

              {content && (
                <div className={clsx(DENSITY_CLASS[density], contentClassName)}>
                  {content}
                </div>
              )}

              {footer && (
                <div
                  className={clsx(
                    'sticky bottom-0 z-10 p-4 border-t rounded-b-3xl border-zinc-200 bg-gradient-to-t from-white/75 via-white/70 backdrop-blur-2xl dark:border-zinc-800 dark:from-zinc-900/75 dark:via-zinc-900/70',
                    footerClassName
                  )}
                >
                  {footer}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* CENTERED VARIANT */}
        {variant === 'centered' && (
          <div
            key="center-wrap"
            className="absolute inset-0 grid place-items-center p-4"
            onClick={closeOnBackdrop ? handleOnClose : undefined}
          >
            <motion.div
              key="center-panel"
              {...PANEL_MOTION.centered}
              ref={panelRef}
              onClick={(e) => e.stopPropagation()}
              className={clsx(
                BASE_PANEL_CLASS,
                SIZE_CLASS[size],
                DENSITY_CLASS[density],
                className
              )}
            >
              {header && (
                <div id={titleId} className="mb-4">
                  {header}
                </div>
              )}
              {content && <div className={contentClassName}>{content}</div>}
              {footer && <div className={footerClassName}>{footer}</div>}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );

  return createPortal(tree, document.getElementById(portalId) ?? document.body);
}
