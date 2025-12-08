'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  motion,
  AnimatePresence,
  easeInOut,
  type Transition,
} from 'framer-motion';
import { Check, ExternalLink, Sparkles } from 'lucide-react';
import { Modal } from '@/components/feedback/modal';
import { eventCreatedEditedConfetti } from './utils';

type Props = {
  open: boolean;
  onClose: () => void;
  onViewEvent?: () => void;
  title?: string;
  subtitle?: string;
  okLabel?: string;
  viewLabel?: string;
  /** Auto dismiss after X ms (0 = off). Default 5000 */
  autoCloseMs?: number;
};

export function SuccessEventModal({
  open,
  onClose,
  onViewEvent,
  title = 'Wydarzenie utworzone!',
  subtitle = 'Twoje wydarzenie jest już aktywne. Udostępnij je znajomym lub przejdź do zarządzania.',
  okLabel = 'Zamknij',
  viewLabel = 'Zobacz wydarzenie',
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

    if (!reducedMotion) void eventCreatedEditedConfetti();

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

  const pulseTransition: Transition = reducedMotion
    ? { duration: 0 }
    : { duration: 2.2, repeat: Infinity, ease: easeInOut };

  return (
    <Modal
      open
      onClose={onClose}
      variant="centered"
      density="none"
      size="sm"
      header={null}
      footer={null}
      ariaLabel={title}
      content={
        <div className="relative isolate overflow-hidden">
          {/* Decorative background */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 via-transparent to-indigo-50/50 dark:from-emerald-950/20 dark:to-indigo-950/20" />
            <CelebrationBG />
          </div>

          <div className="mx-auto flex max-w-md flex-col items-center px-4 py-8 text-center sm:px-6 sm:py-10">
            {/* Success Emblem */}
            <AnimatePresence>
              <motion.div {...emblemMotion} className="relative mb-6">
                {!reducedMotion && (
                  <motion.div
                    initial={{ scale: 0.92, opacity: 0.6 }}
                    animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.8, 0.5] }}
                    transition={pulseTransition}
                    className="pointer-events-none absolute -inset-3 rounded-full blur-xl"
                    style={{
                      background:
                        'conic-gradient(from 160deg, rgba(16,185,129,0.5), rgba(99,102,241,0.5), rgba(16,185,129,0.5))',
                    }}
                  />
                )}
                <div
                  className="relative grid h-20 w-20 place-items-center rounded-full
                             ring-1 ring-white/30
                             bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500
                             shadow-[0_12px_40px_rgba(16,185,129,0.4)]"
                >
                  <div className="pointer-events-none absolute inset-0 rounded-full shadow-[inset_0_0_20px_rgba(255,255,255,0.3)]" />
                  <Check className="h-10 w-10 text-white" strokeWidth={3} />
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Title */}
            <motion.h3
              initial={{ y: reducedMotion ? 0 : 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="text-2xl font-bold text-zinc-900 dark:text-zinc-50"
            >
              {title}
            </motion.h3>

            {/* Subtitle */}
            <motion.p
              initial={{ y: reducedMotion ? 0 : 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.3 }}
              className="mt-3 max-w-sm text-sm leading-relaxed text-zinc-600 dark:text-zinc-300"
            >
              {subtitle}
            </motion.p>

            {/* Actions */}
            <motion.div
              initial={{ y: reducedMotion ? 0 : 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center"
            >
              {onViewEvent && (
                <button
                  type="button"
                  onClick={onViewEvent}
                  className="group inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3
                             text-sm font-semibold text-white
                             bg-gradient-to-r from-emerald-600 to-teal-600
                             shadow-lg shadow-emerald-500/25
                             transition-all duration-200
                             hover:shadow-xl hover:shadow-emerald-500/30 hover:scale-[1.02]
                             focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70 focus-visible:ring-offset-2
                             dark:focus-visible:ring-offset-zinc-900"
                >
                  <Sparkles className="h-4 w-4" />
                  {viewLabel}
                  <ExternalLink className="h-3.5 w-3.5 opacity-70 transition-transform group-hover:translate-x-0.5" />
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-xl px-6 py-3
                           text-sm font-medium
                           border border-zinc-200 bg-white text-zinc-700
                           transition-all duration-200
                           hover:bg-zinc-50 hover:border-zinc-300
                           focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500/50 focus-visible:ring-offset-2
                           dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200
                           dark:hover:bg-zinc-700 dark:hover:border-zinc-600
                           dark:focus-visible:ring-offset-zinc-900"
              >
                {okLabel}
              </button>
            </motion.div>

            {/* Auto-close indicator */}
            {autoCloseMs && autoCloseMs > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-6 flex items-center gap-2"
              >
                <div className="h-1 w-24 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                  <motion.div
                    initial={{ width: '100%' }}
                    animate={{ width: '0%' }}
                    transition={{
                      duration: autoCloseMs / 1000,
                      ease: 'linear',
                    }}
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500"
                  />
                </div>
                <span className="text-xs text-zinc-400 dark:text-zinc-500">
                  {secondsLeft}s
                </span>
              </motion.div>
            )}
          </div>
        </div>
      }
    />
  );
}

/** Celebration background with subtle particles */
function CelebrationBG() {
  return (
    <svg
      className="h-full w-full opacity-30 dark:opacity-20"
      viewBox="0 0 400 300"
      fill="none"
    >
      {/* Scattered dots */}
      <g className="text-emerald-500">
        <circle cx="50" cy="40" r="3" fill="currentColor" opacity="0.6" />
        <circle cx="350" cy="60" r="2" fill="currentColor" opacity="0.4" />
        <circle cx="80" cy="250" r="2.5" fill="currentColor" opacity="0.5" />
        <circle cx="320" cy="220" r="3" fill="currentColor" opacity="0.6" />
      </g>
      <g className="text-indigo-500">
        <circle cx="180" cy="30" r="2" fill="currentColor" opacity="0.5" />
        <circle cx="280" cy="270" r="2.5" fill="currentColor" opacity="0.4" />
        <circle cx="30" cy="150" r="2" fill="currentColor" opacity="0.6" />
        <circle cx="380" cy="140" r="3" fill="currentColor" opacity="0.5" />
      </g>
      <g className="text-teal-500">
        <circle cx="120" cy="280" r="2" fill="currentColor" opacity="0.4" />
        <circle cx="250" cy="20" r="2.5" fill="currentColor" opacity="0.5" />
        <circle cx="370" cy="200" r="2" fill="currentColor" opacity="0.6" />
      </g>
      {/* Sparkle shapes */}
      <g className="text-amber-400" opacity="0.5">
        <path
          d="M100 80 L102 76 L104 80 L108 82 L104 84 L102 88 L100 84 L96 82 Z"
          fill="currentColor"
        />
        <path
          d="M300 100 L301.5 97 L303 100 L306 101.5 L303 103 L301.5 106 L300 103 L297 101.5 Z"
          fill="currentColor"
        />
        <path
          d="M200 240 L201.5 237 L203 240 L206 241.5 L203 243 L201.5 246 L200 243 L197 241.5 Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}
