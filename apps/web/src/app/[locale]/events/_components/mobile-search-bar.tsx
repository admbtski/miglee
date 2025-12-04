/**
 * Mobile Search Bar - Compact search bar for mobile devices
 * Contains: readonly search input (opens TopDrawer) + filter button (opens RightDrawer)
 * Fixed below navbar, hides on scroll down, shows on scroll up
 */

'use client';

import { memo, useRef, useState, useEffect } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';

export type MobileSearchBarProps = {
  q: string;
  city: string | null;
  activeFiltersCount: number;
  onOpenSearch: () => void;
  onOpenFilters: () => void;
};

const translations = {
  pl: {
    searchPlaceholder: 'Szukaj wydarzeń...',
    filters: 'Filtry',
  },
  en: {
    searchPlaceholder: 'Search events...',
    filters: 'Filters',
  },
};

export const MobileSearchBar = memo(function MobileSearchBar({
  q,
  city,
  activeFiltersCount,
  onOpenSearch,
  onOpenFilters,
}: MobileSearchBarProps) {
  const t = translations.pl;
  const displayText = q || city || '';

  return (
    <div className="flex items-center gap-2 w-full">
      {/* Search Input (readonly, opens TopDrawer) */}
      <button
        type="button"
        onClick={onOpenSearch}
        className="flex-1 flex items-center gap-2 px-3 py-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 text-left transition-colors active:bg-zinc-200 dark:active:bg-zinc-700"
      >
        <Search className="w-4 h-4 text-zinc-400 shrink-0" />
        <span
          className={`text-sm truncate ${
            displayText
              ? 'text-zinc-900 dark:text-zinc-100'
              : 'text-zinc-500 dark:text-zinc-400'
          }`}
        >
          {displayText || t.searchPlaceholder}
        </span>
      </button>

      {/* Filter Button (opens RightDrawer) */}
      <button
        type="button"
        onClick={onOpenFilters}
        className="relative flex items-center justify-center p-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 transition-colors active:bg-zinc-200 dark:active:bg-zinc-700"
        aria-label={t.filters}
      >
        <SlidersHorizontal className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
        {activeFiltersCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-indigo-600 rounded-full">
            {activeFiltersCount}
          </span>
        )}
      </button>
    </div>
  );
});

/**
 * Sticky wrapper for MobileSearchBar
 * Fixed position below navbar
 * Hides on scroll down, shows on scroll up
 */
export type StickyMobileSearchBarProps = MobileSearchBarProps;

const SEARCH_BAR_HEIGHT = 56; // Height of the search bar container

export const StickyMobileSearchBar = memo(function StickyMobileSearchBar(
  props: StickyMobileSearchBarProps
) {
  const [isVisible, setIsVisible] = useState(true);
  const [navHeight, setNavHeight] = useState(0);
  const lastScrollY = useRef(0);

  // Get navbar height on mount and resize
  useEffect(() => {
    const updateNavHeight = () => {
      const nav = document.querySelector('nav');
      if (nav) {
        setNavHeight(nav.getBoundingClientRect().height);
      }
    };

    updateNavHeight();
    window.addEventListener('resize', updateNavHeight);
    return () => window.removeEventListener('resize', updateNavHeight);
  }, []);

  // Handle scroll to show/hide
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const diff = currentScrollY - lastScrollY.current;

      // Only trigger hide/show after scrolling more than 5px
      if (Math.abs(diff) < 5) return;

      // At top of page - always show
      if (currentScrollY < 30) {
        setIsVisible(true);
      } else if (diff > 0) {
        // Scrolling down - hide
        setIsVisible(false);
      } else {
        // Scrolling up - show
        setIsVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Spacer to prevent content jump */}
      <div className="h-14 md:hidden" />

      {/* Fixed search bar */}
      <motion.div
        animate={{
          y: isVisible ? 0 : -(SEARCH_BAR_HEIGHT + 10),
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30,
        }}
        className="fixed left-0 right-0 z-30 px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 md:hidden"
        style={{ top: navHeight }}
      >
        <MobileSearchBar {...props} />
      </motion.div>
    </>
  );
});

export default MobileSearchBar;
