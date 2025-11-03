import clsx from 'clsx';
import { Folder, HashIcon } from 'lucide-react';
import React from 'react';

/* ───────────────────────────── Reusable Pill ───────────────────────────── */

export function Pill({
  children,
  className,
  title,
  as = 'span',
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
  as?: 'span' | 'div' | 'li';
}) {
  const Comp = as as any;
  return (
    <Comp
      className={clsx(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px]',
        'ring-1 bg-white/80 text-neutral-800',
        'dark:bg-neutral-900/60 dark:text-neutral-200',
        'ring-neutral-200 dark:ring-neutral-700',
        className
      )}
      title={typeof title === 'string' ? title : undefined}
    >
      {children}
    </Comp>
  );
}

/* ───────────────────────────── Single stacked label ───────────────────────────── */

function SingleStackedPill({
  items,
  icon,
  ariaLabel,
  className,
  maxLabelWidth = 'max-w-[12rem]',
}: {
  items: string[];
  icon?: React.ReactNode;
  ariaLabel?: string;
  className?: string;
  maxLabelWidth?: string;
}) {
  if (!items || items.length === 0) return null;

  const primary = items[0];
  const overflow = items.length - 1;

  // Tekst pilla: "PRIMARY + N" (gdy są kolejne)
  const text = overflow > 0 ? `${primary} + ${overflow}` : primary;

  return (
    <Pill
      as="div"
      className={className}
      title={overflow > 0 ? items.join(', ') : primary}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span className={clsx('truncate', maxLabelWidth)}>{text}</span>
    </Pill>
  );
}

/* ────────────────────── Typed wrappers (Tags/Categories) ───────────────────── */

export function TagPills({
  tags,
  className,
}: {
  tags: string[];
  className?: string;
}) {
  return (
    <SingleStackedPill
      items={tags ?? []}
      icon={<HashIcon className="w-3.5 h-3.5" aria-hidden />}
      ariaLabel="Tagi"
      className={className}
    />
  );
}

export function CategoryPills({
  categories,
  className,
}: {
  categories: string[];
  className?: string;
}) {
  return (
    <SingleStackedPill
      items={categories ?? []}
      icon={<Folder className="w-3.5 h-3.5" aria-hidden />}
      ariaLabel="Kategorie"
      className={className}
    />
  );
}
