'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Check } from 'lucide-react';

type Step = { key: string; label: string };

export function Stepper({
  steps,
  currentIndex, // 0-based
}: {
  steps: Step[];
  currentIndex: number;
}) {
  const r = useReducedMotion();

  return (
    <nav aria-label="Progress">
      <ol className="flex items-center gap-3">
        {steps.map((s, idx) => {
          const isActive = idx === currentIndex;
          const isDone = idx < currentIndex;
          const isLast = idx === steps.length - 1;

          return (
            <li key={s.key} className="flex items-center gap-3 min-w-0 flex-1">
              {/* Dot */}
              <span
                className={[
                  'grid size-7 shrink-0 place-items-center rounded-full border text-[13px] font-semibold',
                  isDone
                    ? // done → solid indigo + white check
                      'border-transparent bg-indigo-600 text-white dark:bg-indigo-500'
                    : isActive
                      ? // active → solid indigo + white number
                        'border-transparent bg-indigo-600 text-white dark:bg-indigo-500'
                      : // upcoming → neutral circle
                        'border-zinc-300 bg-zinc-200 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
                ].join(' ')}
                aria-current={isActive ? 'step' : undefined}
                aria-label={`${s.label}${isActive ? ', current step' : isDone ? ', completed' : ''}`}
              >
                {isDone ? <Check className="h-4 w-4" aria-hidden /> : idx + 1}
              </span>

              {/* Label */}
              <span
                className={[
                  'truncate text-sm',
                  isActive
                    ? 'text-zinc-900 dark:text-zinc-100'
                    : isDone
                      ? 'text-zinc-700 dark:text-zinc-300'
                      : 'text-zinc-500 dark:text-zinc-400',
                ].join(' ')}
                title={s.label}
              >
                {s.label}
              </span>

              {/* Connector (between steps) */}
              {!isLast && (
                <div className="relative mx-2 hidden h-[2px] flex-1 overflow-hidden rounded-full md:block">
                  {/* base track */}
                  <div className="absolute inset-0 bg-zinc-200 dark:bg-zinc-800" />
                  {/* progress fill */}
                  {isDone ? (
                    <motion.div
                      className="absolute inset-y-0 left-0 bg-indigo-600 dark:bg-indigo-500"
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: r ? 0 : 0.35 }}
                    />
                  ) : isActive ? (
                    <motion.div
                      className="absolute inset-y-0 left-0 bg-indigo-600 dark:bg-indigo-500"
                      initial={{ width: 0 }}
                      animate={{ width: '60%' }} // lekki akcent do następnego kroku
                      transition={{ duration: r ? 0 : 0.35 }}
                    />
                  ) : null}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
