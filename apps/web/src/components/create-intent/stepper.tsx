'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Check } from 'lucide-react';

export type Step = {
  key: string;
  label: string;
  /** optional icon for the dot */
  Icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

type Props = {
  steps: Step[];
  currentIndex: number; // 0-based
  size?: 'sm' | 'md';
  dense?: boolean;
  /** inline = label aside; stacked = label under the dot */
  layout?: 'inline' | 'stacked';
  className?: string;
  /**
   * number — force numbers
   * icon   — force icons
   * auto   — if Step.Icon exists, use it; otherwise number (default)
   */
  dotMode?: 'number' | 'icon' | 'auto';
};

export function Stepper({
  steps,
  currentIndex,
  size = 'sm',
  dense = true,
  layout = 'stacked',
  className,
  dotMode = 'auto',
}: Props) {
  const r = useReducedMotion();
  const isStacked = layout === 'stacked';

  const dotPx = size === 'sm' ? 24 : 28;
  const dotCls = size === 'sm' ? 'size-6' : 'size-7';
  const textCls = size === 'sm' ? 'text-[13px]' : 'text-sm';
  const iconCls = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';
  const gapItems = dense ? 'gap-2' : 'gap-3';
  const connectorH = dense ? 'h-px' : 'h-[2px]';

  return (
    <nav
      aria-label="Progress"
      className={className}
      style={{ ['--dot' as any]: `${dotPx}px` }}
    >
      <ol className={`flex items-stretch ${gapItems} overflow-x-auto`}>
        {steps.map((s, idx) => {
          const isActive = idx === currentIndex;
          const isDone = idx < currentIndex;
          const isLast = idx === steps.length - 1;
          const shouldUseIcon =
            dotMode === 'icon' || (dotMode === 'auto' && !!s.Icon);

          return (
            <React.Fragment key={s.key}>
              <li
                className={[
                  'min-w-0 flex-1',
                  isStacked
                    ? 'flex flex-col items-center'
                    : 'flex items-center gap-2',
                ].join(' ')}
              >
                <span
                  className={[
                    `grid shrink-0 place-items-center rounded-full border font-semibold ${dotCls}`,
                    isDone || isActive
                      ? 'border-transparent bg-indigo-600 text-white dark:bg-indigo-500'
                      : 'border-zinc-300 bg-zinc-200 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
                  ].join(' ')}
                  aria-current={isActive ? 'step' : undefined}
                  aria-label={`${s.label}${isActive ? ', current step' : isDone ? ', completed' : ''}`}
                >
                  {isDone ? (
                    <Check className={iconCls} aria-hidden />
                  ) : shouldUseIcon && s.Icon ? (
                    <s.Icon className={iconCls} aria-hidden />
                  ) : (
                    idx + 1
                  )}
                </span>

                <span
                  className={[
                    'truncate',
                    textCls,
                    isStacked ? 'mt-1 text-center' : '',
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
              </li>

              {!isLast && (
                <li
                  aria-hidden
                  className={[
                    'relative hidden flex-1 md:block',
                    !isStacked ? 'self-center' : '',
                  ].join(' ')}
                >
                  <div
                    className={[
                      'absolute left-0 right-0 rounded-full bg-zinc-200 dark:bg-zinc-800',
                      connectorH,
                      isStacked
                        ? 'top-[calc(var(--dot)/2)] -translate-y-1/2'
                        : 'top-1/2 -translate-y-1/2',
                    ].join(' ')}
                  />
                  <motion.div
                    className={[
                      'absolute left-0 right-0 rounded-full bg-indigo-600 dark:bg-indigo-500',
                      connectorH,
                      isStacked
                        ? 'top-[calc(var(--dot)/2)] -translate-y-1/2'
                        : 'top-1/2 -translate-y-1/2',
                    ].join(' ')}
                    initial={{ width: 0 }}
                    animate={{
                      width:
                        idx < currentIndex
                          ? '100%'
                          : idx === currentIndex
                            ? '55%'
                            : 0,
                    }}
                    transition={{ duration: r ? 0 : 0.3 }}
                  />
                </li>
              )}
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
