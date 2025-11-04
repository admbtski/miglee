import clsx from 'clsx';
import { BadgeCheck } from 'lucide-react';

// Opcjonalnie: użyj istniejącej u Ciebie funkcji.
// Jeśli jej nie masz w tym pliku, przekaż własny tytuł przez prop `title`.
declare function formatVerifiedTitle(iso?: string): string | null;

export type VerifiedBadgeSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type VerifiedBadgeVariant = 'icon' | 'iconText' | 'text';

const SIZE_STYLES: Record<
  VerifiedBadgeSize,
  { icon: string; text: string; container: string; gap: string }
> = {
  xs: {
    icon: 'w-3 h-3',
    text: 'text-[10px] leading-none',
    container: 'px-1.5 py-0.5 rounded-full',
    gap: 'gap-1',
  },
  sm: {
    icon: 'w-3.5 h-3.5',
    text: 'text-[11px] leading-none',
    container: 'px-2 py-0.5 rounded-full',
    gap: 'gap-1.5',
  },
  md: {
    icon: 'w-4 h-4',
    text: 'text-xs leading-none',
    container: 'px-2.5 py-0.5 rounded-full',
    gap: 'gap-1.5',
  },
  lg: {
    icon: 'w-5 h-5',
    text: 'text-sm leading-none',
    container: 'px-3 py-0.5 rounded-full',
    gap: 'gap-2',
  },
  xl: {
    icon: 'w-6 h-6',
    text: 'text-base leading-none',
    container: 'px-3.5 py-1 rounded-full',
    gap: 'gap-2',
  },
};

// Delikatny „verified” ton (sky)
const VERIFIED_TONE =
  'text-sky-700 ring-sky-200 bg-white/80 ' +
  'dark:text-sky-300 dark:ring-sky-800/50 dark:bg-neutral-900/60';

export function VerifiedBadge({
  verifiedAt,
  size = 'md',
  variant = 'icon', // backward-compatible default
  label = 'Zweryfikowany organizator',
  title,
  className,
  icon, // opcjonalny override ikony
}: {
  verifiedAt?: string;
  size?: VerifiedBadgeSize;
  variant?: VerifiedBadgeVariant;
  /** Tekst dla wariantów 'iconText' i 'text' */
  label?: string;
  /** Tooltip; jeśli nie podasz, spróbuje użyć formatVerifiedTitle(verifiedAt) */
  title?: string;
  className?: string;
  /** Nadpisanie ikony (np. <BadgeCheck /> z własnymi klasami) */
  icon?: React.ReactNode;
}) {
  if (!verifiedAt) return null;

  const S = SIZE_STYLES[size];
  const tooltip =
    title ??
    (typeof formatVerifiedTitle === 'function'
      ? (formatVerifiedTitle(verifiedAt) ?? label)
      : label);

  const IconNode = icon ?? (
    <BadgeCheck
      className={clsx(S.icon, 'shrink-0 text-sky-500 dark:text-sky-400')}
      aria-hidden
    />
  );

  // 1) Tylko ikona (jak dotąd)
  if (variant === 'icon') {
    return (
      <span
        role="img"
        aria-label={tooltip ?? undefined}
        title={tooltip ?? undefined}
      >
        {IconNode}
      </span>
    );
  }

  // 2) Tylko tekst (bez pigułki)
  if (variant === 'text') {
    return (
      <span
        className={clsx(
          'inline-flex items-center select-none',
          S.text,
          className
        )}
        title={tooltip ?? undefined}
        aria-label={tooltip ?? undefined}
      >
        {label}
      </span>
    );
  }

  // 3) Ikona + tekst w pigułce
  return (
    <span
      className={clsx(
        'inline-flex items-center ring-1 shadow-sm select-none',
        VERIFIED_TONE,
        S.container,
        S.gap,
        className
      )}
      title={tooltip ?? undefined}
      aria-label={tooltip ?? undefined}
      role="img"
    >
      {IconNode}
      <span className={clsx('font-medium truncate', S.text)}>{label}</span>
    </span>
  );
}
