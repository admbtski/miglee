/**
 * Custom hook for managing draft filters (mobile modal)
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  IntentsSortBy,
  IntentStatus,
  MeetingKind,
  SortDir,
} from '@/lib/api/__generated__/react-query-update';

type DraftSort = {
  by: IntentsSortBy;
  dir: SortDir;
};

export function useIntentsDraftFilters(
  status: IntentStatus,
  kinds: MeetingKind[],
  sortBy: IntentsSortBy,
  sortDir: SortDir,
  filtersOpen: boolean
) {
  // Draft filters (used inside the modal)
  const [draftStatus, setDraftStatus] = useState<IntentStatus>(status);
  const [draftKinds, setDraftKinds] = useState<MeetingKind[]>(kinds);
  const [draftSort, setDraftSort] = useState<DraftSort>({
    by: sortBy,
    dir: sortDir,
  });

  // Sync drafts when modal opens
  useEffect(() => {
    if (!filtersOpen) return;
    setDraftStatus(status);
    setDraftKinds(kinds);
    setDraftSort({ by: sortBy, dir: sortDir });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersOpen]);

  // Clear drafts
  const clearDrafts = useCallback(() => {
    setDraftStatus(IntentStatus.Any);
    setDraftKinds([]);
    setDraftSort({ by: IntentsSortBy.StartAt, dir: SortDir.Asc });
  }, []);

  return {
    draftStatus,
    draftKinds,
    draftSort,
    setDraftStatus,
    setDraftKinds,
    setDraftSort,
    clearDrafts,
  };
}
