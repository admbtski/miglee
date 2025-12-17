/**
 * Filters Drawer - Slide-in drawer for filters
 * Slides from RIGHT (like JustJoin.it)
 * On mobile: replaces left sidebar
 * On desktop: opens when "Filters" button is clicked
 * Contains Meeting Type, Level, Join Mode, Verified (same as LeftFiltersPanel)
 */

'use client';

import { memo, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { LeftFiltersPanel } from './left-filters-panel';
import type { CommittedFilters } from '@/features/events';

export type MobileFiltersDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  filters: CommittedFilters;
  onFiltersChange: (next: Partial<CommittedFilters>) => void;
  isPending?: boolean;
};

export const MobileFiltersDrawer = memo(function MobileFiltersDrawer({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  isPending = false,
}: MobileFiltersDrawerProps) {
  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle filter changes
  const handleFiltersChange = useCallback(
    (next: Partial<CommittedFilters>) => {
      onFiltersChange(next);
    },
    [onFiltersChange]
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Drawer - slides from RIGHT */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-y-0 right-0 z-[101] w-[85vw] max-w-sm bg-white/95 backdrop-blur-xl dark:bg-zinc-950/95 shadow-2xl"
          >
            <LeftFiltersPanel
              filters={filters}
              onFiltersChange={handleFiltersChange}
              isDrawer={true}
              onClose={onClose}
              isPending={isPending}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});

export default MobileFiltersDrawer;
