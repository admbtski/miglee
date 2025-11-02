'use client';

import React, {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
  type ElementType,
} from 'react';
import {
  AnimatePresence,
  motion,
  easeInOut,
  type Transition,
} from 'framer-motion';
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Info,
  OctagonAlert,
} from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { Modal } from '@/components/feedback/modal';

/** Visual variants for the notice */
export type NoticeVariant =
  | 'default'
  | 'info'
  | 'success'
  | 'warning'
  | 'error';
/** Spacing / sizing preset */
export type Density = 'comfortable' | 'compact';

type NoticeModalProps<T = unknown> = {
  open: boolean;
  onClose: () => void;

  onPrimary?: (payload: {
    context: T | undefined;
    dontShowAgain: boolean;
  }) => void;
  onSecondary?: () => void;
  context?: T;

  variant?: NoticeVariant;
  density?: Density;

  title?: string;
  subtitle?: ReactNode;
  children?: ReactNode;

  primaryLabel?: string;
  secondaryLabel?: string;
  primaryLoading?: boolean;
  primaryDisabled?: boolean;

  showDontShowAgain?: boolean;
  dontShowLabel?: string;
  defaultDontShowAgain?: boolean;
  persistPreferenceKey?: string;

  /** When the preference is set, instantly trigger primary action instead of opening */
  autoSkipIfHidden?: boolean;

  /** Auto-close after X ms. 0 = disabled */
  autoCloseMs?: number;
  autoCloseClassName?: string;

  /** Pause auto-close countdown on hover/focus */
  pauseOnHover?: boolean;

  /** Replace the emblem icon; accepts a Lucide component or a React node */
  iconOverride?: ElementType | ReactNode;

  /** A11y + forwarded to <Modal/> */
  ariaLabel?: string;
  labelledById?: string;
  describedById?: string;
  initialFocusRef?: RefObject<HTMLElement>;

  /** Forwarded to <Modal/> */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  modalVariant?: 'default' | 'centered';
  closeOnEsc?: boolean;
  closeOnBackdrop?: boolean;
  className?: string;
  backdropClassName?: string;
  actionClassName?: string;
};

/** Colors and icons per variant */
const VARIANT_CFG: Record<
  NoticeVariant,
  {
    icon: ElementType;
    bgFromTo: string;
    conic: string;
    glowShadow: string;
    textTitle: string;
    textSub: string;
    primaryBtn: string;
  }
> = {
  default: {
    icon: Bell,
    bgFromTo: 'bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500',
    conic:
      'conic-gradient(from 160deg, rgba(99,102,241,0.45), rgba(139,92,246,0.45), rgba(99,102,241,0.45))',
    glowShadow: 'shadow-[0_10px_30px_rgba(79,70,229,0.45)]',
    textTitle: 'text-zinc-900 dark:text-zinc-50',
    textSub: 'text-zinc-800 dark:text-zinc-200/95',
    primaryBtn:
      'bg-indigo-600 hover:bg-indigo-500 text-white focus-visible:ring-2 focus-visible:ring-indigo-500/70',
  },
  info: {
    icon: Info,
    bgFromTo: 'bg-gradient-to-br from-blue-600 via-sky-500 to-cyan-500',
    conic:
      'conic-gradient(from 160deg, rgba(59,130,246,0.50), rgba(14,165,233,0.50), rgba(59,130,246,0.50))',
    glowShadow: 'shadow-[0_10px_30px_rgba(37,99,235,0.45)]',
    textTitle: 'text-zinc-900 dark:text-zinc-50',
    textSub: 'text-zinc-800 dark:text-zinc-200/95',
    primaryBtn:
      'bg-sky-600 hover:bg-sky-500 text-white focus-visible:ring-2 focus-visible:ring-sky-500/70',
  },
  success: {
    icon: CheckCircle2,
    bgFromTo: 'bg-gradient-to-br from-emerald-600 via-green-600 to-lime-500',
    conic:
      'conic-gradient(from 160deg, rgba(16,185,129,0.55), rgba(34,197,94,0.55), rgba(16,185,129,0.55))',
    glowShadow: 'shadow-[0_10px_30px_rgba(5,150,105,0.45)]',
    textTitle: 'text-zinc-900 dark:text-zinc-50',
    textSub: 'text-zinc-800 dark:text-zinc-200/95',
    primaryBtn:
      'bg-emerald-600 hover:bg-emerald-500 text-white focus-visible:ring-2 focus-visible:ring-emerald-500/70',
  },
  warning: {
    icon: AlertTriangle,
    bgFromTo: 'bg-gradient-to-br from-amber-500 via-yellow-500 to-orange-500',
    conic:
      'conic-gradient(from 160deg, rgba(245,158,11,0.55), rgba(234,179,8,0.55), rgba(245,158,11,0.55))',
    glowShadow: 'shadow-[0_10px_30px_rgba(217,119,6,0.45)]',
    textTitle: 'text-zinc-900 dark:text-zinc-50',
    textSub: 'text-zinc-800 dark:text-zinc-200/95',
    primaryBtn:
      'bg-amber-600 hover:bg-amber-500 text-white focus-visible:ring-2 focus-visible:ring-amber-500/70',
  },
  error: {
    icon: OctagonAlert,
    bgFromTo: 'bg-gradient-to-br from-rose-600 via-red-600 to-orange-600',
    conic:
      'conic-gradient(from 160deg, rgba(244,63,94,0.55), rgba(239,68,68,0.55), rgba(244,63,94,0.55))',
    glowShadow: 'shadow-[0_10px_30px_rgba(225,29,72,0.45)]',
    textTitle: 'text-zinc-900 dark:text-zinc-50',
    textSub: 'text-zinc-800 dark:text-zinc-200/95',
    primaryBtn:
      'bg-rose-600 hover:bg-rose-500 text-white focus-visible:ring-2 focus-visible:ring-rose-500/70',
  },
};

/** Density presets */
const DENSITY: Record<
  Density,
  { p: string; text: string; icon: string; iconInner: string; button: string }
> = {
  comfortable: {
    p: 'px-6 py-6 sm:px-8 sm:py-8',
    text: 'text-[22px]',
    icon: 'h-20 w-20',
    iconInner: 'h-10 w-10',
    button: 'px-3 py-2 text-sm',
  },
  compact: {
    p: 'px-4 py-4 sm:px-6 sm:py-5',
    text: 'text-[18px]',
    icon: 'h-14 w-14',
    iconInner: 'h-7 w-7',
    button: 'px-2.5 py-1.5 text-[13px]',
  },
};

export function NoticeModal<T = unknown>(props: NoticeModalProps<T>) {
  const {
    open,
    onClose,
    onPrimary,
    onSecondary,
    context,
    variant = 'default',
    density = 'comfortable',
    title = 'Notice',
    subtitle,
    children,
    primaryLabel = 'OK',
    secondaryLabel = 'Cancel',
    primaryLoading = false,
    primaryDisabled = false,
    showDontShowAgain = false,
    dontShowLabel = "Don't show me this again",
    defaultDontShowAgain = false,
    persistPreferenceKey,
    autoSkipIfHidden = false,
    autoCloseMs = 0,
    autoCloseClassName,
    pauseOnHover = true,
    iconOverride,
    ariaLabel,
    labelledById,
    describedById,
    initialFocusRef,
    size = 'md',
    modalVariant = 'centered',
    closeOnEsc = true,
    closeOnBackdrop = true,
    className,
    backdropClassName,
    actionClassName,
  } = props;

  const cfg = VARIANT_CFG[variant];
  const dens = DENSITY[density];

  /** SSR-safe reduced-motion flag */
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReducedMotion(!!mq.matches);
    apply();
    mq.addEventListener?.('change', apply);
    return () => mq.removeEventListener?.('change', apply);
  }, []);

  /** A11y IDs */
  const subtitleId = useId();
  const bodyId = useId();
  const checkboxId = useId();
  const titleId = useId();

  /** "Don't show again" state */
  const [dontShowAgain, setDontShowAgain] = useState(defaultDontShowAgain);

  /** Timers and countdown */
  const intervalRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const deadlineRef = useRef<number | null>(null);
  const remainingRef = useRef<number>(0);
  const hoverPausedRef = useRef(false);
  const [secondsLeft, setSecondsLeft] = useState(
    autoCloseMs > 0 ? Math.ceil(autoCloseMs / 1000) : 0
  );

  const clearTimers = useCallback(() => {
    if (intervalRef.current) window.clearInterval(intervalRef.current);
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    intervalRef.current = null;
    timeoutRef.current = null;
  }, []);

  /** Load persisted preference each time we open */
  useEffect(() => {
    if (!open || !persistPreferenceKey) return;
    try {
      const raw = localStorage.getItem(persistPreferenceKey);
      if (raw != null) setDontShowAgain(raw === 'true');
    } catch {
      /* ignore */
    }
  }, [open, persistPreferenceKey]);

  /** Auto-skip (call onPrimary immediately when pref says hidden) */
  useEffect(() => {
    if (!open || !autoSkipIfHidden || !persistPreferenceKey || !onPrimary)
      return;
    try {
      if (localStorage.getItem(persistPreferenceKey) === 'true') {
        onPrimary({ context, dontShowAgain: true });
      }
    } catch {
      /* ignore */
    }
    // open + deps above are sufficient to trigger once per open
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, autoSkipIfHidden, persistPreferenceKey, onPrimary]);

  /** Auto-close countdown handling */
  useEffect(() => {
    if (!open || !autoCloseMs) return;

    const start = Date.now();
    deadlineRef.current = start + autoCloseMs;
    remainingRef.current = autoCloseMs;
    setSecondsLeft(Math.ceil(autoCloseMs / 1000));

    intervalRef.current = window.setInterval(() => {
      const leftMs = Math.max(0, (deadlineRef.current ?? 0) - Date.now());
      setSecondsLeft(Math.ceil(leftMs / 1000));
    }, 250);

    timeoutRef.current = window.setTimeout(() => {
      if (!hoverPausedRef.current) onClose();
    }, autoCloseMs);

    return clearTimers;
  }, [open, autoCloseMs, onClose, clearTimers]);

  /** Ensure timers are cleared on unmount */
  useEffect(() => clearTimers, [clearTimers]);

  /** Pause/resume on hover/focus */
  const pause = useCallback(() => {
    if (!pauseOnHover || !deadlineRef.current) return;
    hoverPausedRef.current = true;
    remainingRef.current = Math.max(0, deadlineRef.current - Date.now());
    clearTimers();
  }, [pauseOnHover, clearTimers]);

  const resume = useCallback(() => {
    if (!pauseOnHover || !open || !remainingRef.current) return;
    hoverPausedRef.current = false;
    deadlineRef.current = Date.now() + remainingRef.current;

    intervalRef.current = window.setInterval(() => {
      const leftMs = Math.max(0, (deadlineRef.current ?? 0) - Date.now());
      setSecondsLeft(Math.ceil(leftMs / 1000));
    }, 250);

    timeoutRef.current = window.setTimeout(() => {
      if (!hoverPausedRef.current) onClose();
    }, remainingRef.current);
  }, [pauseOnHover, open, onClose]);

  /** Persist preference helper */
  const persistPref = useCallback(
    (v: boolean) => {
      if (!persistPreferenceKey) return;
      try {
        localStorage.setItem(persistPreferenceKey, String(v));
      } catch {
        /* ignore */
      }
    },
    [persistPreferenceKey]
  );

  /** Primary action wrapper */
  const handlePrimary = useCallback(() => {
    persistPref(dontShowAgain);
    onPrimary?.({ context, dontShowAgain });
  }, [dontShowAgain, onPrimary, context, persistPref]);

  /** Compute aria-describedby from provided IDs and visible blocks */
  const described = useMemo(() => {
    const ids = [
      describedById,
      subtitle ? subtitleId : undefined,
      children ? bodyId : undefined,
    ].filter(Boolean) as string[];
    return ids.length ? ids.join(' ') : undefined;
  }, [describedById, subtitle, subtitleId, children, bodyId]);

  if (!open) return null;

  /** Emblem animation definitions */
  const emblemMotion = reducedMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { scale: 0.86, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        exit: { scale: 0.98, opacity: 0 },
        transition: {
          type: 'spring',
          stiffness: 260,
          damping: 20,
        } as Transition,
      };

  const pulseTransition: Transition = reducedMotion
    ? { duration: 0 }
    : { duration: 2, repeat: Infinity, ease: easeInOut };

  /** Render icon: prefer override (node or component), fallback to variant icon */
  const renderIcon = () => {
    if (!iconOverride) {
      const Comp = cfg.icon;
      return <Comp className={`${dens.iconInner} text-white`} aria-hidden />;
    }
    if (React.isValidElement(iconOverride)) return iconOverride;
    if (typeof iconOverride === 'function') {
      const C = iconOverride as ElementType;
      return <C className={`${dens.iconInner} text-white`} aria-hidden />;
    }
    return null;
  };

  return (
    <Modal
      open
      density="none"
      onClose={() => {
        clearTimers();
        onClose();
      }}
      header={null}
      footer={null}
      labelledById={labelledById ?? titleId}
      describedById={described}
      ariaLabel={ariaLabel}
      variant={modalVariant}
      size={size}
      closeOnEsc={closeOnEsc}
      closeOnBackdrop={closeOnBackdrop}
      initialFocusRef={initialFocusRef}
      className={className}
      backdropClassName={backdropClassName}
      content={
        <div
          className="relative isolate overflow-hidden"
          onMouseEnter={pause}
          onMouseLeave={resume}
          onFocus={pause}
          onBlur={resume}
        >
          {/* Subtle ambient halo */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10"
          >
            <div
              className="absolute -top-24 left-1/2 h-72 w-[42rem] -translate-x-1/2 rounded-full blur-3xl opacity-90"
              // style={{ background: cfg.conic }}
            />
          </div>

          <div
            className={twMerge(
              'mx-auto flex max-w-md flex-col items-center text-center',
              dens.p
            )}
          >
            {/* Emblem */}
            <AnimatePresence>
              <motion.div {...emblemMotion} className="relative mb-3 sm:mb-4">
                {!reducedMotion && (
                  <motion.div
                    initial={{ scale: 0.92, opacity: 0.6 }}
                    animate={{ scale: [1, 1.06, 1], opacity: [0.6, 0.9, 0.6] }}
                    transition={pulseTransition}
                    className="pointer-events-none absolute -inset-2 rounded-full blur-xl"
                    style={{ background: cfg.conic }}
                    aria-hidden
                  />
                )}
                <div
                  className={twMerge(
                    'relative grid place-items-center rounded-full ring-1 ring-white/20',
                    dens.icon,
                    cfg.bgFromTo,
                    cfg.glowShadow
                  )}
                  aria-hidden
                >
                  <div className="absolute inset-0 rounded-full shadow-[inset_0_0_22px_rgba(255,255,255,0.18)]" />
                  {renderIcon()}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Title */}
            <motion.h3
              id={labelledById ?? titleId}
              initial={{ y: reducedMotion ? 0 : 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.25 }}
              className={twMerge('font-semibold', dens.text, cfg.textTitle)}
            >
              {title}
            </motion.h3>

            {/* Subtitle */}
            {subtitle && (
              <motion.div
                id={subtitleId}
                initial={{ y: reducedMotion ? 0 : 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.04, duration: 0.25 }}
                className={twMerge(
                  'mt-2 max-w-sm text-sm leading-6',
                  cfg.textSub
                )}
              >
                {subtitle}
              </motion.div>
            )}

            {/* Body + actions + optional checkbox */}
            {(children || showDontShowAgain || onPrimary || onSecondary) && (
              <motion.div
                id={children ? bodyId : undefined}
                initial={{ y: reducedMotion ? 0 : 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.08, duration: 0.25 }}
                className="mt-5 w-full text-left"
              >
                {children}

                {/* "Don't show again" */}
                {showDontShowAgain && (
                  <label
                    htmlFor={checkboxId}
                    className="mt-3 flex cursor-pointer select-none items-center gap-2 px-1 text-sm text-zinc-700 dark:text-zinc-300"
                  >
                    <input
                      id={checkboxId}
                      type="checkbox"
                      checked={dontShowAgain}
                      onChange={(e) => setDontShowAgain(e.target.checked)}
                      className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 dark:border-zinc-600"
                    />
                    {dontShowLabel}
                  </label>
                )}

                {/* Actions */}
                {(onSecondary || onPrimary) && (
                  <div
                    className={twMerge(
                      'mt-4 flex items-center justify-end gap-2 px-1',
                      actionClassName
                    )}
                  >
                    {onSecondary && (
                      <button
                        type="button"
                        onClick={onSecondary}
                        className={twMerge(
                          'rounded-xl border text-zinc-800 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500/60',
                          'dark:text-zinc-200 dark:hover:bg-zinc-800',
                          'border-zinc-300 dark:border-zinc-700',
                          dens.button
                        )}
                      >
                        {secondaryLabel}
                      </button>
                    )}
                    {onPrimary && (
                      <button
                        type="button"
                        onClick={handlePrimary}
                        disabled={primaryDisabled || primaryLoading}
                        data-autofocus
                        className={twMerge(
                          'font-semibold rounded-xl disabled:opacity-60 disabled:cursor-not-allowed',
                          cfg.primaryBtn,
                          dens.button
                        )}
                      >
                        {primaryLoading ? 'Working…' : primaryLabel}
                      </button>
                    )}
                  </div>
                )}

                {/* Auto-close hint */}
                {!!autoCloseMs && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.9 }}
                    transition={{ delay: 0.12 }}
                    aria-live="polite"
                    className={twMerge(
                      'mt-3 px-1 text-xs text-zinc-500 dark:text-zinc-400',
                      autoCloseClassName
                    )}
                  >
                    Closing in {secondsLeft}s…
                  </motion.div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      }
    />
  );
}

/** Helper: check persisted preference before opening */
export function shouldSkipByPreference(key: string): boolean {
  try {
    return localStorage.getItem(key) === 'true';
  } catch {
    return false;
  }
}
