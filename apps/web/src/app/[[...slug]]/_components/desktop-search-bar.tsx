'use client';

import {
  Filter,
  MapPinIcon,
  Ruler as RulerIcon,
  Search,
  SearchIcon,
} from 'lucide-react';
import { twMerge } from 'tailwind-merge';

export type DesktopSearchBarProps = {
  q: string;
  city: string | null;
  distanceKm: number;
  activeFilters: number;
  onOpenFilters: () => void;
  /** Optional custom CTA element shown as the last circular button on the right */
  cta?: React.ReactNode;
  className?: string;
};

/** Desktop-only search bar used in the navbar. Fully controlled via props. */
export function DesktopSearchBar({
  q,
  city,
  distanceKm,
  activeFilters,
  onOpenFilters,
  cta,
  className,
}: DesktopSearchBarProps) {
  return (
    <div className={twMerge('relative', className)}>
      {/* Soft conic glow */}
      <div className="pointer-events-none absolute inset-0 -z-10 rounded-full opacity-80 blur-xl [background:conic-gradient(from_200deg,theme(colors.orange.200),theme(colors.pink.300),theme(colors.indigo.300),theme(colors.cyan.300))]" />
      {/* Gradient border ring */}
      <div className="rounded-full bg-[linear-gradient(90deg,theme(colors.orange.200),theme(colors.pink.300),theme(colors.indigo.300),theme(colors.cyan.300))] p-[2px] shadow-[0_8px_30px_rgba(99,102,241,0.25)]">
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
            value={distanceKm !== 30 ? `${distanceKm} km` : ''}
            placeholder="30 km"
            onClick={onOpenFilters}
          />
          <Divider />

          {/* Filters button */}
          <button
            onClick={onOpenFilters}
            className="flex items-center gap-2 pr-2 shrink-0 hover:opacity-90"
          >
            <Filter className="w-5 h-5 opacity-60" />
            <span className={activeFilters ? '' : 'opacity-60'}>Filters</span>
            {activeFilters > 0 && (
              <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-indigo-600 px-1.5 text-[12px] text-white shadow-sm ring-1 ring-black/5">
                {activeFilters}
              </span>
            )}
          </button>

          {/* CTA */}
          {cta ?? (
            <button
              onClick={onOpenFilters}
              className="grid w-8 h-8 text-white rounded-full shadow-lg place-items-center bg-gradient-to-tr from-pink-500 to-violet-600 hover:brightness-110"
              aria-label="Search"
            >
              <SearchIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---- small internals ---- */

function SearchSegment({
  icon,
  value,
  placeholder,
  className,
  onClick,
}: {
  icon: React.ReactNode;
  value?: string | null;
  placeholder: string;
  className?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={twMerge('flex items-center gap-2 hover:opacity-90', className)}
    >
      {icon}
      <span className={`truncate ${value ? '' : 'opacity-60'}`}>
        {value || placeholder}
      </span>
    </button>
  );
}

function Divider() {
  return <div className="w-px h-5 mx-3 bg-zinc-300/70 dark:bg-zinc-700/70" />;
}
