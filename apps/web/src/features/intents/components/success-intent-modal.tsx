'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  motion,
  AnimatePresence,
  easeInOut,
  type Transition,
} from 'framer-motion';
import { Check } from 'lucide-react';
import { Modal } from '@/components/feedback/modal';
import { intentCreatedEditedConfetti } from './utils';

type Props = {
  open: boolean;
  onClose: () => void;
  onViewIntent?: () => void;
  title?: string;
  subtitle?: string;
  okLabel?: string;
  viewLabel?: string;
  /** Auto dismiss after X ms (0 = off). Default 3000 */
  autoCloseMs?: number;
};

export function SuccessIntentModal({
  open,
  onClose,
  onViewIntent,
  title = 'Intent created!',
  subtitle = 'Your intent is now live — share it or jump in to manage details.',
  okLabel = 'OK',
  viewLabel = 'View intent',
  autoCloseMs = 5000,
}: Props) {
  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

  // Countdown state
  const initialSeconds = useMemo(
    () => (autoCloseMs && autoCloseMs > 0 ? Math.ceil(autoCloseMs / 1000) : 0),
    [autoCloseMs]
  );
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const intervalRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open) return;

    if (!reducedMotion) void intentCreatedEditedConfetti();

    if (autoCloseMs && autoCloseMs > 0) {
      setSecondsLeft(Math.ceil(autoCloseMs / 1000));
      intervalRef.current = window.setInterval(() => {
        setSecondsLeft((s) => Math.max(0, s - 1));
      }, 1000);
      timeoutRef.current = window.setTimeout(onClose, autoCloseMs);
    }

    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      intervalRef.current = null;
      timeoutRef.current = null;
    };
  }, [open, autoCloseMs, onClose, reducedMotion]);

  if (!open) return null;

  const emblemMotion = reducedMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { scale: 0.86, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        exit: { scale: 0.98, opacity: 0 },
        transition: {
          type: 'spring',
          stiffness: 220,
          damping: 18,
        } as Transition,
      };

  // ✅ typed transition with proper easing function
  const pulseTransition: Transition = reducedMotion
    ? { duration: 0 }
    : { duration: 2.2, repeat: Infinity, ease: easeInOut };

  return (
    <Modal
      open
      onClose={onClose}
      variant="centered"
      size="md"
      header={null}
      footer={null}
      ariaLabel={title}
      content={
        <div className="relative isolate overflow-hidden">
          {/* Soft gradient background */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10"
          >
            <div
              className="absolute -top-24 left-1/2 h-80 w-[42rem] -translate-x-1/2 rounded-full blur-3xl"
              style={{
                background:
                  'radial-gradient(closest-side, rgba(99,102,241,0.50), rgba(139,92,246,0.35), transparent 70%)',
              }}
            />
            <div
              className="absolute bottom-[-30%] right-[-10%] h-72 w-72 rounded-full blur-2xl"
              style={{
                background:
                  'radial-gradient(closest-side, rgba(236,72,153,0.35), transparent 70%)',
              }}
            />
          </div>

          {/* Decorative fireworks */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 opacity-25 dark:opacity-30"
          >
            <FireworksBG />
          </div>

          <div className="mx-auto flex max-w-md flex-col items-center py-6 text-center sm:py-8">
            {/* Emblem */}
            <AnimatePresence>
              <motion.div {...emblemMotion} className="relative mb-4 sm:mb-5">
                {!reducedMotion && (
                  <motion.div
                    initial={{ scale: 0.92, opacity: 0.6 }}
                    animate={{ scale: [1, 1.06, 1], opacity: [0.6, 0.9, 0.6] }}
                    transition={pulseTransition}
                    className="pointer-events-none absolute -inset-2 rounded-full blur-xl"
                    style={{
                      background:
                        'conic-gradient(from 160deg, rgba(99,102,241,0.55), rgba(139,92,246,0.55), rgba(99,102,241,0.55))',
                    }}
                  />
                )}
                <div
                  className="relative grid h-20 w-20 place-items-center rounded-full
                             ring-1 ring-white/20
                             bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500
                             shadow-[0_10px_30px_rgba(79,70,229,0.45)]"
                >
                  <div className="pointer-events-none absolute inset-0 rounded-full shadow-[inset_0_0_22px_rgba(255,255,255,0.25)]" />
                  <Check className="h-10 w-10 text-white" />
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Title */}
            <motion.h3
              initial={{ y: reducedMotion ? 0 : 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.25 }}
              className="text-[22px] font-semibold text-zinc-900 dark:text-zinc-50"
            >
              {title}
            </motion.h3>

            {/* Subtitle */}
            <motion.p
              initial={{ y: reducedMotion ? 0 : 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.04, duration: 0.25 }}
              className="mt-2 max-w-sm text-sm text-zinc-700 dark:text-zinc-200/95"
            >
              {subtitle}
            </motion.p>

            {/* Actions */}
            <motion.div
              initial={{ y: reducedMotion ? 0 : 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.08, duration: 0.25 }}
              className="mt-6 flex flex-wrap items-center justify-center gap-3"
            >
              {onViewIntent && (
                <button
                  type="button"
                  onClick={onViewIntent}
                  className="min-w-[112px] rounded-2xl px-4 py-2 text-sm font-medium text-white
                             bg-gradient-to-r from-indigo-600 to-violet-600
                             hover:opacity-95
                             focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/70"
                >
                  {viewLabel}
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="min-w-[84px] rounded-2xl border border-white/10 bg-white/5 px-4 py-2
                           text-sm font-medium text-zinc-900 backdrop-blur
                           hover:bg-white/10
                           focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/70
                           dark:text-zinc-100"
              >
                {okLabel}
              </button>
            </motion.div>

            {/* Auto-close hint */}
            {autoCloseMs && autoCloseMs > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.9 }}
                transition={{ delay: 0.12 }}
                aria-live="polite"
                className="mt-4 text-xs text-zinc-500 dark:text-zinc-400"
              >
                Closing in {secondsLeft}s…
              </motion.div>
            )}
          </div>
        </div>
      }
    />
  );
}

/** Subtle vector fireworks background */
function FireworksBG() {
  return (
    <svg className="h-full w-full" viewBox="0 0 800 400" fill="none">
      <g opacity="0.5" stroke="currentColor">
        <circle cx="120" cy="80" r="2" />
        <circle cx="160" cy="120" r="2" />
        <circle cx="200" cy="60" r="2" />
        <circle cx="260" cy="100" r="2" />
        <circle cx="320" cy="70" r="2" />
      </g>
      <g opacity="0.35" stroke="currentColor" strokeWidth="1">
        <path d="M640 90 l15 -28 l15 28 l-30 0z" />
        <path d="M710 150 l9 -16 l9 16 l-18 0z" />
        <path d="M560 130 l10 -18 l10 18 l-20 0z" />
      </g>
    </svg>
  );
}
