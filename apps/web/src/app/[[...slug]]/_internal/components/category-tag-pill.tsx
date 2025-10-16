import React, { JSX, useEffect, useRef, useState } from 'react';
import { ChevronDown, HashIcon, Folder } from 'lucide-react';

/* ───────────────────────────── Utils ───────────────────────────── */

/** Close when clicking outside or pressing ESC. */
function useOutsideClose<T extends HTMLElement>(
  open: boolean,
  onClose: () => void
) {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);
  return ref;
}

const cx = (...classes: Array<string | false | undefined>) =>
  classes.filter(Boolean).join(' ');

/* ───────────────────────────── Pill ───────────────────────────── */

type PillVariant = 'solid' | 'ghost';

export function Pill({
  children,
  className,
  title,
  as = 'span',
  variant = 'solid',
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
  as?: 'span' | 'div' | 'li';
  variant?: PillVariant;
}) {
  const Comp = as as any;
  const base =
    variant === 'solid'
      ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
      : 'bg-transparent text-neutral-700 dark:text-neutral-300';
  return (
    <Comp
      className={cx('px-2 py-1 text-xs rounded-lg', base, className)}
      title={typeof title === 'string' ? title : undefined}
    >
      {children}
    </Comp>
  );
}

/* ─────────────────────────── OverflowPills ─────────────────────────── */
/**
 * Shows the first item as a pill. When there are more items, it shows "+N" and a caret.
 * Clicking the pill toggles an informational dropdown listing the remaining items.
 */
export function OverflowPills({
  items,
  icon,
  ariaLabel,
  menuLabel,
  className,
}: {
  items: string[];
  icon?: React.ReactNode;
  ariaLabel: string;
  menuLabel: string;
  className?: string;
}): JSX.Element | null {
  const [open, setOpen] = useState(false);
  const menuId = useRef(`menu-${Math.random().toString(36).slice(2)}`).current;

  // Put the ref on the WRAPPER (button + menu) to avoid toggle race conditions.
  const wrapperRef = useOutsideClose<HTMLDivElement>(open, () =>
    setOpen(false)
  );

  const primary = items[0];
  const overflow = items.slice(1);
  const count = overflow.length;

  if (!primary) return null;

  const canToggle = count > 0;
  const toggle = () => {
    if (!canToggle) return;
    setOpen((v) => !v);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!canToggle) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggle();
    }
  };

  return (
    <div
      ref={wrapperRef}
      className={cx(
        'relative min-w-0 inline-flex items-center gap-2',
        className
      )}
      aria-label={ariaLabel}
    >
      {/* Primary pill (acts as toggle when there is overflow) */}
      <button
        type="button"
        className={cx(
          'min-w-0 cursor-pointer inline-flex items-center gap-1 px-2 py-1 text-xs rounded-lg',
          'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
        )}
        aria-haspopup={canToggle ? 'menu' : undefined}
        aria-expanded={canToggle ? open : undefined}
        aria-controls={canToggle ? menuId : undefined}
        onClick={toggle}
        onKeyDown={onKeyDown}
      >
        {icon && <span className="shrink-0">{icon}</span>}
        <span className="truncate max-w-[12rem]">{primary}</span>
        {count > 0 && (
          <>
            <span className="opacity-70">+{count}</span>
            <ChevronDown
              className={cx('w-3.5 h-3.5 transition', open && 'rotate-180')}
              aria-hidden
            />
          </>
        )}
      </button>

      {/* Informational dropdown (ghost pills, no hover highlight) */}
      {count > 0 && open && (
        <div
          id={menuId}
          role="menu"
          aria-label={menuLabel}
          className={cx(
            'absolute left-0 top-[calc(100%+8px)] z-50 w-64 p-2',
            'rounded-2xl border bg-white shadow-2xl ring-1 ring-black/5',
            'border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900'
          )}
        >
          <ul className="max-h-64 overflow-auto space-y-1">
            {overflow.map((it) => (
              <li key={it} role="presentation" className="flex">
                <Pill as="div" variant="ghost" className="w-full">
                  <span className="inline-flex items-center gap-1">
                    {icon && <span className="shrink-0">{icon}</span>}
                    <span className="truncate">{it}</span>
                  </span>
                </Pill>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
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
  if (!tags?.length) return null;
  return (
    <OverflowPills
      items={tags}
      icon={<HashIcon className="w-3.5 h-3.5" aria-hidden />}
      ariaLabel="Tagi"
      menuLabel="Pozostałe tagi"
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
  if (!categories?.length) return null;
  return (
    <OverflowPills
      items={categories}
      icon={<Folder className="w-3.5 h-3.5" aria-hidden />}
      ariaLabel="Kategorie"
      menuLabel="Pozostałe kategorie"
      className={className}
    />
  );
}
