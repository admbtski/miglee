'use client';

import { useState, useCallback } from 'react';
import type { RoleFilterValue } from '@/features/events/components/role-filter';
import type { EventStatusFilterValue } from '@/features/events/components/event-status-filter';

export function useMyEventsFilters() {
  // Role filter (single selection)
  const [roleFilter, setRoleFilter] = useState<RoleFilterValue>('all');

  // Event status filter (multiple selection)
  // Default: upcoming + ongoing
  const [statusFilters, setStatusFilters] = useState<EventStatusFilterValue[]>([
    'upcoming',
    'ongoing',
  ]);

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
