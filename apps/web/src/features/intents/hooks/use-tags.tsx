/**
 * Custom hook for fetching and searching tags
 *
 * @description
 * Provides tag search functionality with debouncing and fallback to initial values.
 * Automatically fetches tags from API based on search query with 300ms debounce.
 * Falls back to initial tags when no API results are available.
 *
 * Features:
 * - Automatic debouncing (300ms)
 * - Fallback to initial tags
 * - Loading and fetching states
 * - Error handling
 * - Limit of 25 results
 *
 * @example
 * ```tsx
 * const [searchQuery, setSearchQuery] = useState('');
 * const { options, isLoading, isFetching, error } = useTags(
 *   searchQuery,
 *   initialTags
 * );
 *
 * return (
 *   <div>
 *     <input
 *       value={searchQuery}
 *       onChange={(e) => setSearchQuery(e.target.value)}
 *       placeholder="Search tags..."
 *     />
 *     {isLoading ? (
 *       <LoadingSpinner />
 *     ) : (
 *       <TagList tags={options} />
 *     )}
 *   </div>
 * );
 * ```
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useGetTagsQuery } from '@/lib/api/tags';

// =============================================================================
// Types
// =============================================================================

export type TagOption = {
  /** Tag ID */
  id: string;
  /** Tag slug (URL-friendly identifier) */
  slug: string;
  /** Display label */
  label: string;
};

// =============================================================================
// Constants
// =============================================================================

export const getUseTagsLimitData = () => 25;

// =============================================================================
// Hook
// =============================================================================

/**
 * Fetch and search tags with debouncing
 *
 * @param query - Search query string
 * @param initial - Initial/fallback tags
 * @returns Tag options and loading states
 */
export function useTags(query: string, initial?: TagOption[]) {
  const [debounced, setDebounced] = useState(() => query.trim());

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  const { data, isLoading, isFetching, error } = useGetTagsQuery(
    {
      limit: getUseTagsLimitData(),
      query: debounced || '',
    },
    {
      enabled: true,
      placeholderData: (prev) => prev,
    }
  );

  const optionsFromApi: TagOption[] = useMemo(() => {
    const tags = data?.tags ?? [];
    return tags.map((t) => ({
      id: t.id,
      slug: t.slug,
      label: t.label,
    }));
  }, [data]);

  const options: TagOption[] = useMemo(() => {
    if (optionsFromApi.length > 0) return optionsFromApi;
    return initial && initial.length
      ? initial.slice(0, getUseTagsLimitData())
      : [];
  }, [optionsFromApi, initial]);

  return {
    options,
    isLoading,
    isFetching,
    error,
    debouncedQuery: debounced,
  };
}
