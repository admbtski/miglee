import clsx from 'clsx';
import { Folder, HashIcon } from 'lucide-react';
import React from 'react';

/* ───────────────────────────── Sizing & Variants (z istniejącego pliku) ───────────────────────────── */

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
  'bg-white/80 text-neutral-800 ring-neutral-200 dark:bg-neutral-900/60 dark:text-neutral-200 dark:ring-neutral-700';

/* ───────────────────────────── Reusable Pill (z istniejącego pliku) ───────────────────────────── */

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

/* ───────────────────────────── NEW: InlinePillsList (nie-stackowane) ───────────────────────────── */

export type InlinePillsListProps = {
  items: string[];
  icon?: React.ReactNode; // np. <HashIcon />
  size?: PillSize; // xs..xl
  variant?: PillVariant; // icon | iconText | text
  className?: string; // wrapper
  pillClassName?: string; // pojedyncza pigułka
  wrap?: boolean; // domyślnie true (zawijanie do nowego wiersza)
  maxItems?: number; // ile pokazać; reszta w "+N"
  ariaLabel?: string;
  maxLabelWidth?: string; // np. 'max-w-[10rem]'
};

export function InlinePillsList({
  items,
  icon,
  size = 'md',
  variant = 'iconText',
  className,
  pillClassName,
  wrap = true,
  maxItems,
  ariaLabel,
  maxLabelWidth,
}: InlinePillsListProps) {
  if (!items?.length) return null;

  const capped = typeof maxItems === 'number' && maxItems >= 0;
  const visible = capped ? items.slice(0, maxItems) : items;
  const overflow = capped ? Math.max(0, items.length - visible.length) : 0;

  const S = SIZE_STYLES[size];

  return (
    <div
      className={clsx(
        'inline-flex',
        wrap ? 'flex-wrap' : 'flex-nowrap overflow-hidden',
        'items-center gap-2',
        className
      )}
      aria-label={ariaLabel}
    >
      {visible.map((text, i) => {
        const title = text;
        if (variant === 'text') {
          return (
            <span
              key={`${text}-${i}`}
              className={clsx('inline-flex', S.text)}
              title={title}
            >
              <Pill
                size={size}
                className={pillClassName}
                title={title}
                as="span"
              >
                <span className={clsx('truncate', maxLabelWidth)}>{text}</span>
              </Pill>
            </span>
          );
        }

        if (variant === 'icon') {
          return (
            <Pill
              key={`${text}-${i}`}
              size={size}
              className={pillClassName}
              title={title}
              as="span"
            >
              {icon &&
                React.cloneElement(icon as any, {
                  className: clsx(S.icon, 'shrink-0'),
                  'aria-hidden': true,
                })}
            </Pill>
          );
        }

        // iconText
        return (
          <Pill
            key={`${text}-${i}`}
            size={size}
            className={pillClassName}
            title={title}
            as="span"
          >
            {icon &&
              React.cloneElement(icon as any, {
                className: clsx(S.icon, 'shrink-0'),
                'aria-hidden': true,
              })}
            <span className={clsx('truncate', S.text, maxLabelWidth)}>
              {text}
            </span>
          </Pill>
        );
      })}

      {overflow > 0 && (
        <Pill
          size={size}
          className={clsx(
            'tabular-nums',
            pillClassName,
            'bg-neutral-50 dark:bg-neutral-800/60 text-neutral-700 dark:text-neutral-300'
          )}
          title={items.slice(visible.length).join(', ')}
          as="span"
        >
          <span className={S.text}>+{overflow}</span>
        </Pill>
      )}
    </div>
  );
}

/* ────────────────────── Typed wrappers (nie-stackowane) ───────────────────── */

export function InlineTagPills(props: Omit<InlinePillsListProps, 'icon'>) {
  return <InlinePillsList {...props} icon={<HashIcon />} ariaLabel="Tagi" />;
}

export function InlineCategoryPills(props: Omit<InlinePillsListProps, 'icon'>) {
  return <InlinePillsList {...props} icon={<Folder />} ariaLabel="Kategorie" />;
}
