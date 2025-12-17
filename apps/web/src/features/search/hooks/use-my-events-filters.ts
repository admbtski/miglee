'use client';

import { useState, useCallback } from 'react';
import type { RoleFilterValue } from '@/features/search';
import type { EventStatusFilterValue } from '@/features/search';

export function useMyEventsFilters() {
  const [roleFilter, setRoleFilter] = useState<RoleFilterValue>('all');

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
