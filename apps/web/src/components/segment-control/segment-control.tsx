'use client';

import { motion, useReducedMotion } from 'framer-motion';
import * as React from 'react';
import { twMerge } from 'tailwind-merge';

export type SegmentedOption<T extends string | number> = {
  value: T;
  label: React.ReactNode;
  Icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  disabled?: boolean;
  visuallyHiddenLabel?: boolean;
  ariaLabel?: string;
};

export type SegmentedControlProps<T extends string | number> = {
  value: T;
  onChange: (next: T) => void;
  options: SegmentedOption<T>[];

  name?: string;
  id?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;

  className?: string;
  buttonClassName?: string;
  activeClassName?: string;
  inactiveClassName?: string;
  pillClassName?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;

  withPill?: boolean;
  animated?: boolean;
  transition?: { type?: 'spring' | 'tween'; [k: string]: any };

  direction?: 'ltr' | 'rtl';
};

const cn = (...xs: Array<string | false | null | undefined>) =>
  twMerge(xs.filter(Boolean).join(' '));

function sizeCfg(sz: NonNullable<SegmentedControlProps<any>['size']>) {
  switch (sz) {
    case 'sm':
      return {
        pad: 'px-2 py-1.5',
        text: 'text-[13px]',
        icon: 'h-4 w-4',
        pillRadius: 'rounded-xl',
      };
    case 'md':
      return {
        pad: 'px-3 py-2',
        text: 'text-sm',
        icon: 'h-5 w-5',
        pillRadius: 'rounded-xl',
      };
    case 'lg':
      return {
        pad: 'px-4 py-2.5',
        text: 'text-base',
        icon: 'h-5 w-5',
        pillRadius: 'rounded-2xl',
      };
    case 'xl':
      return {
        pad: 'px-5 py-3',
        text: 'text-lg',
        icon: 'h-6 w-6',
        pillRadius: 'rounded-2xl',
      };
  }
}

export function SegmentedControl<T extends string | number>({
  value,
  onChange,
  options,
  className,
  buttonClassName,
  activeClassName,
  inactiveClassName,
  pillClassName,
  size = 'md',
  fullWidth = false,
  withPill = true,
  animated = true,
  transition,
  id,
  name,
  direction = 'ltr',
  ...aria
}: SegmentedControlProps<T>) {
  const cfg = sizeCfg(size);
  const prefersReducedMotion = useReducedMotion();
  const cols = Math.max(2, options.length);
  const layoutId = React.useId();

  const spring =
    transition ??
    (prefersReducedMotion || !animated
      ? { duration: 0 }
      : { type: 'spring', stiffness: 420, damping: 36, mass: 0.6 });

  const activeIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value)
  );

  const btnRefs = React.useRef<Array<HTMLButtonElement | null>>([]);

  const focusAt = (i: number) => {
    const el = btnRefs.current[i];
    if (el) el.focus();
  };

  const onKeyDownGroup = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const key = e.key;
    const focused = btnRefs.current.findIndex(
      (el) => el === document.activeElement
    );
    const cur = focused >= 0 ? focused : activeIndex;
    const max = options.length - 1;
    const next = (n: number) => Math.min(max, Math.max(0, n));

    if (key === 'ArrowRight' || key === 'ArrowLeft') {
      e.preventDefault();
      const dir = key === 'ArrowRight' ? 1 : -1;
      const sign = direction === 'rtl' ? -1 : 1;
      const i = next(cur + dir * sign);
      focusAt(i);
    } else if (key === 'Home') {
      e.preventDefault();
      focusAt(0);
    } else if (key === 'End') {
      e.preventDefault();
      focusAt(max);
    } else if (key === ' ' || key === 'Enter') {
      const el = btnRefs.current[cur];
      if (el) {
        e.preventDefault();
        const opt = options[cur];
        if (!opt?.disabled && opt?.value) onChange(opt.value);
      }
    }
  };

  return (
    <div
      id={id}
      role="radiogroup"
      aria-orientation="horizontal"
      data-segmented
      className={cn(
        'relative isolate inline-grid gap-1 rounded-2xl border border-zinc-300 bg-white p-1',
        'dark:border-zinc-800 dark:bg-zinc-900/60',
        'focus-within:ring-2 focus-within:ring-indigo-500/40 focus-within:border-zinc-400 dark:focus-within:border-zinc-700',
        fullWidth && 'w-full',
        className
      )}
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}
      onKeyDown={onKeyDownGroup}
      {...aria}
    >
      {options.map((opt, i) => {
        const active = i === activeIndex;
        const Icon = opt.Icon;
        const isDisabled = !!opt.disabled;

        return (
          <motion.button
            key={String(opt.value)}
            ref={(el) => (btnRefs.current[i] = el as any)}
            type="button"
            role="radio"
            aria-checked={active}
            aria-pressed={active}
            aria-label={opt.visuallyHiddenLabel ? opt.ariaLabel : undefined}
            disabled={isDisabled}
            tabIndex={active ? 0 : -1}
            data-active={active ? '' : undefined}
            data-disabled={isDisabled ? '' : undefined}
            onClick={() => !isDisabled && onChange(opt.value)}
            whileTap={
              prefersReducedMotion || !animated ? undefined : { scale: 0.98 }
            }
            className={cn(
              'relative z-0 flex w-full items-center justify-center gap-2 rounded-xl transition',
              cfg.pad,
              cfg.text,
              isDisabled && 'opacity-50 cursor-not-allowed',
              !isDisabled &&
                (active
                  ? 'text-white'
                  : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800'),
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40',
              buttonClassName,
              active && activeClassName,
              !active && inactiveClassName
            )}
          >
            {withPill && active && (
              <motion.span
                layoutId={`seg-pill-${layoutId}`}
                transition={spring}
                aria-hidden
                className={cn(
                  'pointer-events-none absolute inset-0 z-[-1] bg-zinc-900 dark:bg-indigo-600',
                  cfg.pillRadius,
                  pillClassName
                )}
              />
            )}

            {Icon ? <Icon className={cfg.icon} aria-hidden /> : null}

            <span
              className={cn(
                'whitespace-nowrap',
                opt.visuallyHiddenLabel && 'sr-only'
              )}
            >
              {opt.label}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
