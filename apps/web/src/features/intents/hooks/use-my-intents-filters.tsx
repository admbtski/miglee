import { useState, useCallback } from 'react';
import type { RoleFilterValue } from '@/app/[locale]/account/intents/_components/role-filter';
import type { IntentStatusFilterValue } from '@/app/[locale]/account/intents/_components/intent-status-filter';

export function useMyIntentsFilters() {
  // Role filter (single selection)
  const [roleFilter, setRoleFilter] = useState<RoleFilterValue>('all');

  // Intent status filter (multiple selection)
  // Default: upcoming + ongoing
  const [statusFilters, setStatusFilters] = useState<IntentStatusFilterValue[]>(
    ['upcoming', 'ongoing']
  );

  const clearFilters = useCallback(() => {
    setRoleFilter('all');
    setStatusFilters(['upcoming', 'ongoing']);
  }, []);

  const hasActiveFilters =
    roleFilter !== 'all' ||
    statusFilters.length !== 2 ||
    !statusFilters.includes('upcoming') ||
    !statusFilters.includes('ongoing');

  return {
    roleFilter,
    statusFilters,
    setRoleFilter,
    setStatusFilters,
    clearFilters,
    hasActiveFilters,
  };
}
