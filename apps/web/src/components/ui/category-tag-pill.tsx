import clsx from 'clsx';
import { Folder, HashIcon } from 'lucide-react';
import React from 'react';

/* ───────────────────────────── Sizing & Variants ───────────────────────────── */

export type PillSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type PillVariant = 'icon' | 'iconText' | 'text';

const SIZE_STYLES: Record<
  PillSize,
  { container: string; icon: string; text: string; gap: string }
> = {
  xs: {
    container: 'px-1.5 py-0.5 rounded-full ring-1',
    icon: 'w-3 h-3',
    text: 'text-[10px] leading-none',
    gap: 'gap-1',
  },
  sm: {
    container: 'px-2 py-0.5 rounded-full ring-1',
    icon: 'w-3.5 h-3.5',
    text: 'text-[11px] leading-none',
    gap: 'gap-1.5',
  },
  md: {
    container: 'px-2.5 py-0.5 rounded-full ring-1',
    icon: 'w-4 h-4',
    text: 'text-xs leading-none',
    gap: 'gap-1.5',
  },
  lg: {
    container: 'px-3 py-0.5 rounded-full ring-1',
    icon: 'w-5 h-5',
    text: 'text-sm leading-none',
    gap: 'gap-2',
  },
  xl: {
    container: 'px-3.5 py-1 rounded-full ring-1',
    icon: 'w-6 h-6',
    text: 'text-base leading-none',
    gap: 'gap-2',
  },
};

const BASE_TONE =
  'bg-white/80 text-zinc-800 ring-zinc-200 dark:bg-zinc-900/60 dark:text-zinc-200 dark:ring-zinc-700';

/* ───────────────────────────── Reusable Pill ───────────────────────────── */

export function Pill({
  children,
  className,
  title,
  as = 'span',
  size = 'md',
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
  as?: 'span' | 'div' | 'li';
  size?: PillSize;
}) {
  const Comp = as as any;
  const S = SIZE_STYLES[size];
  return (
    <Comp
      className={clsx(
        'inline-flex items-center',
        S.gap,
        S.container,
        BASE_TONE,
        className
      )}
      title={typeof title === 'string' ? title : undefined}
    >
      {children}
    </Comp>
  );
}

/* ───────────────────────────── Single stacked label ───────────────────────────── */
/** Pokazuje: `pierwszy + N` (wszystko w jednym pillu). */

function SingleStackedPill({
  items,
  icon,
  ariaLabel,
  className,
  maxLabelWidth = 'max-w-[12rem]',
  size = 'md',
  variant = 'iconText',
}: {
  items: string[];
  icon?: React.ReactNode;
  ariaLabel?: string;
  className?: string;
  maxLabelWidth?: string;
  size?: PillSize;
  variant?: PillVariant; // 'icon' | 'iconText' | 'text'
}) {
  if (!items || items.length === 0) return null;

  const primary = items[0];
  const overflow = Math.max(0, items.length - 1);
  const text = overflow > 0 ? `${primary} + ${overflow}` : primary;
  const S = SIZE_STYLES[size];

  const title = overflow > 0 ? items.join(', ') : primary;

  if (variant === 'text') {
    return (
      <span
        className={clsx(
          'inline-flex items-center select-none',
          S.text,
          className
        )}
        title={title}
        aria-label={ariaLabel}
      >
        <span className={clsx('truncate', maxLabelWidth)}>{text}</span>
      </span>
    );
  }

  if (variant === 'icon') {
    return (
      <Pill size={size} className={className} title={title} as="div">
        {icon && (
          <span className="shrink-0">
            {React.cloneElement(icon as any, { className: clsx(S.icon) })}
          </span>
        )}
      </Pill>
    );
  }

  // iconText (default)
  return (
    <Pill size={size} className={className} title={title} as="div">
      {icon && (
        <span className="shrink-0">
          {React.cloneElement(icon as any, { className: clsx(S.icon) })}
        </span>
      )}
      <span
        className={clsx('truncate', S.text, maxLabelWidth)}
        aria-label={ariaLabel}
      >
        {text}
      </span>
    </Pill>
  );
}

/* ────────────────────── Typed wrappers (Tags/Categories) ───────────────────── */

export function TagPills({
  tags,
  className,
  size = 'md',
  variant = 'iconText',
  maxLabelWidth,
}: {
  tags: string[];
  className?: string;
  size?: PillSize;
  variant?: PillVariant;
  maxLabelWidth?: string;
}) {
  return (
    <SingleStackedPill
      items={tags ?? []}
      icon={<HashIcon aria-hidden />}
      ariaLabel="Tagi"
      className={className}
      size={size}
      variant={variant}
      maxLabelWidth={maxLabelWidth}
    />
  );
}

export function CategoryPills({
  categories,
  className,
  size = 'md',
  variant = 'iconText',
  maxLabelWidth,
}: {
  categories: string[];
  className?: string;
  size?: PillSize;
  variant?: PillVariant;
  maxLabelWidth?: string;
}) {
  return (
    <SingleStackedPill
      items={categories ?? []}
      icon={<Folder aria-hidden />}
      ariaLabel="Kategorie"
      className={className}
      size={size}
      variant={variant}
      maxLabelWidth={maxLabelWidth}
    />
  );
}
