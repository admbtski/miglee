/**
 * Custom hook for managing intents filters state
 */

'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  IntentsSortBy,
  IntentStatus,
  MeetingKind,
  SortDir,
} from '@/lib/api/__generated__/react-query-update';

export type IntentsFiltersState = {
  status: IntentStatus;
  kinds: MeetingKind[];
  sortBy: IntentsSortBy;
  sortDir: SortDir;
};

export type IntentsDraftFilters = IntentsFiltersState;

export function useIntentsFilters() {
  // Active filters (applied to queries)
  const [status, setStatus] = useState<IntentStatus>(IntentStatus.Any);
  const [kinds, setKinds] = useState<MeetingKind[]>([]);
  const [sortBy, setSortBy] = useState<IntentsSortBy>(IntentsSortBy.StartAt);
  const [sortDir, setSortDir] = useState<SortDir>(SortDir.Asc);

  // Check if any filter is active
  const anyFilterActive = useMemo(
    () =>
      status !== IntentStatus.Any ||
      kinds.length > 0 ||
      sortBy !== IntentsSortBy.StartAt ||
      sortDir !== SortDir.Asc,
    [status, kinds.length, sortBy, sortDir]
  );

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (status !== IntentStatus.Any) count += 1;
    if (kinds.length > 0) count += 1;
    if (sortBy !== IntentsSortBy.StartAt || sortDir !== SortDir.Asc) count += 1;
    return count;
  }, [status, kinds.length, sortBy, sortDir]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setStatus(IntentStatus.Any);
    setKinds([]);
    setSortBy(IntentsSortBy.StartAt);
    setSortDir(SortDir.Asc);
  }, []);

  return {
    // State
    status,
    kinds,
    sortBy,
    sortDir,
    // Setters
    setStatus,
    setKinds,
    setSortBy,
    setSortDir,
    // Computed
    anyFilterActive,
    activeFiltersCount,
    // Actions
    clearFilters,
  };
}
