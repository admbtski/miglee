/**
 * Desktop Search Bar - Top navigation search bar
 *
 * FLOW (JustJoin.it inspired):
 * - Click on Search → opens TopDrawer focused on search
 * - Click on Location → opens TopDrawer focused on location
 * - Click on Distance → opens TopDrawer focused on distance
 * - Click on Filters (desktop) → opens TopDrawer
 * - Click on Filters icon (mobile) → opens Right Drawer
 */

// TODO i18n: Placeholder texts need translation keys ("Search..", "Any", "Filters")

'use client';

import {
  Filter,
  MapPinIcon,
  Ruler as RulerIcon,
  Search,
  SearchIcon,
  SlidersHorizontal,
} from 'lucide-react';
import { twMerge } from 'tailwind-merge';

const DEFAULT_DISTANCE_KM = 30;

export type DesktopSearchBarProps = {
  q: string;
  city: string | null;
  distanceKm: number;
  activeFilters: number;
  // Callbacks for different sections
  onOpenSearch: () => void;
  onOpenLocation: () => void;
  onOpenDistance: () => void;
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
  onOpenSearch,
  onOpenLocation,
  onOpenDistance,
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
          {/* Search segment - opens TopDrawer focused on search */}
          <SearchSegment
            icon={<Search className="w-5 h-5 opacity-60" />}
            value={q}
            placeholder="Search.."
            className="flex-1"
            onClick={onOpenSearch}
          />
          <Divider />
          {/* Location segment - opens TopDrawer focused on location */}
          <SearchSegment
            icon={<MapPinIcon className="w-5 h-5 opacity-60" />}
            value={city}
            placeholder="Any"
            className="flex-1"
            onClick={onOpenLocation}
          />
          <Divider />
          {/* Distance segment - opens TopDrawer focused on distance */}
          <SearchSegment
            icon={<RulerIcon className="w-5 h-5 opacity-60" />}
            value={distanceDisplay}
            placeholder="30 km"
            onClick={onOpenDistance}
          />
          <Divider />
          {/* Desktop Filters button - opens Right Drawer with filters */}
          <FiltersButton activeCount={activeFilters} onClick={onOpenFilters} />
          {/* Mobile Filters button - opens Right Drawer */}
          <MobileFiltersButton
            activeCount={activeFilters}
            onClick={onOpenFilters}
          />
          {cta ?? <DefaultSearchButton onClick={onOpenSearch} />}
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
      className="hidden md:flex lg:hidden items-center gap-2 pr-2 shrink-0 hover:opacity-90"
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

type MobileFiltersButtonProps = {
  activeCount: number;
  onClick: () => void;
};

function MobileFiltersButton({
  activeCount,
  onClick,
}: MobileFiltersButtonProps) {
  const hasActiveFilters = activeCount > 0;

  return (
    <button
      onClick={onClick}
      className="flex md:hidden items-center gap-2 pr-2 shrink-0 hover:opacity-90"
      title="Open filters"
      aria-label="Open filters drawer"
    >
      <SlidersHorizontal className="w-5 h-5 opacity-60" />
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
