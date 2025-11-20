'use client';

import {
  Filter,
  MapPinIcon,
  Ruler as RulerIcon,
  Search,
  SearchIcon,
} from 'lucide-react';
import { twMerge } from 'tailwind-merge';

const DEFAULT_DISTANCE_KM = 30;

export type DesktopSearchBarProps = {
  q: string;
  city: string | null;
  distanceKm: number;
  activeFilters: number;
  onOpenFilters: () => void;
  cta?: React.ReactNode;
  className?: string;
};

/**
 * Desktop-only search bar used in the navbar. Fully controlled via props.
 */
export function DesktopSearchBar({
  q,
  city,
  distanceKm,
  activeFilters,
  onOpenFilters,
  cta,
  className,
}: DesktopSearchBarProps) {
  const distanceDisplay =
    distanceKm !== DEFAULT_DISTANCE_KM ? `${distanceKm} km` : '';

  return (
    <div className={twMerge('relative', className)}>
      <GlowEffect />
      <GradientBorder>
        <div className="flex items-center py-2 pl-4 pr-1 text-sm rounded-full bg-white/90 text-zinc-800 dark:bg-zinc-950/90 dark:text-zinc-100">
          <SearchSegment
            icon={<Search className="w-5 h-5 opacity-60" />}
            value={q}
            placeholder="Search.."
            className="flex-1"
            onClick={onOpenFilters}
          />
          <Divider />
          <SearchSegment
            icon={<MapPinIcon className="w-5 h-5 opacity-60" />}
            value={city}
            placeholder="Any"
            className="flex-1"
            onClick={onOpenFilters}
          />
          <Divider />
          <SearchSegment
            icon={<RulerIcon className="w-5 h-5 opacity-60" />}
            value={distanceDisplay}
            placeholder="30 km"
            onClick={onOpenFilters}
          />
          <Divider />
          <FiltersButton activeCount={activeFilters} onClick={onOpenFilters} />
          {cta ?? <DefaultSearchButton onClick={onOpenFilters} />}
        </div>
      </GradientBorder>
    </div>
  );
}

function GlowEffect() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 rounded-full opacity-80 blur-xl [background:conic-gradient(from_200deg,theme(colors.orange.200),theme(colors.pink.300),theme(colors.indigo.300),theme(colors.cyan.300))]" />
  );
}

function GradientBorder({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-full bg-[linear-gradient(90deg,theme(colors.orange.200),theme(colors.pink.300),theme(colors.indigo.300),theme(colors.cyan.300))] p-[2px] shadow-[0_8px_30px_rgba(99,102,241,0.25)]">
      {children}
    </div>
  );
}

type SearchSegmentProps = {
  icon: React.ReactNode;
  value?: string | null;
  placeholder: string;
  className?: string;
  onClick: () => void;
};

function SearchSegment({
  icon,
  value,
  placeholder,
  className,
  onClick,
}: SearchSegmentProps) {
  const hasValue = Boolean(value);

  return (
    <button
      onClick={onClick}
      className={twMerge('flex items-center gap-2 hover:opacity-90', className)}
    >
      {icon}
      <span className={twMerge('truncate', !hasValue && 'opacity-60')}>
        {value || placeholder}
      </span>
    </button>
  );
}

function Divider() {
  return <div className="w-px h-5 mx-3 bg-zinc-300/70 dark:bg-zinc-700/70" />;
}

type FiltersButtonProps = {
  activeCount: number;
  onClick: () => void;
};

function FiltersButton({ activeCount, onClick }: FiltersButtonProps) {
  const hasActiveFilters = activeCount > 0;

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 pr-2 shrink-0 hover:opacity-90"
    >
      <Filter className="w-5 h-5 opacity-60" />
      <span className={hasActiveFilters ? '' : 'opacity-60'}>Filters</span>
      {hasActiveFilters && (
        <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-indigo-600 px-1.5 text-[12px] text-white shadow-sm ring-1 ring-black/5">
          {activeCount}
        </span>
      )}
    </button>
  );
}

function DefaultSearchButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="grid w-8 h-8 text-white rounded-full shadow-lg place-items-center bg-gradient-to-tr from-pink-500 to-violet-600 hover:brightness-110"
      aria-label="Search"
    >
      <SearchIcon className="w-4 h-4" />
    </button>
  );
}
