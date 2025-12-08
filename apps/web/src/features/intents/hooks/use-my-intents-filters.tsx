import { useState, useCallback } from 'react';
import type { RoleFilterValue } from '@/features/intents/components/role-filter';
import type { IntentStatusFilterValue } from '@/features/intents/components/intent-status-filter';

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
