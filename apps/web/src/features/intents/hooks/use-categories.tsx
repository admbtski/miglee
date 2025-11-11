/**
 * Custom hook for fetching and searching categories
 *
 * @description
 * Provides category search functionality with debouncing and fallback to initial values.
 * Automatically fetches categories from API based on search query with 300ms debounce.
 * Falls back to initial categories when no API results are available.
 *
 * Features:
 * - Automatic debouncing (300ms)
 * - Fallback to initial categories
 * - Loading and fetching states
 * - Error handling
 * - Limit of 25 results
 *
 * @example
 * ```tsx
 * const [searchQuery, setSearchQuery] = useState('');
 * const { options, isLoading, isFetching, error } = useCategories(
 *   searchQuery,
 *   initialCategories
 * );
 *
 * return (
 *   <div>
 *     <input
 *       value={searchQuery}
 *       onChange={(e) => setSearchQuery(e.target.value)}
 *       placeholder="Search categories..."
 *     />
 *     {isLoading ? (
 *       <LoadingSpinner />
 *     ) : (
 *       <CategoryList categories={options} />
 *     )}
 *   </div>
 * );
 * ```
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useGetCategoriesQuery } from '@/lib/api/categories';

// =============================================================================
// Types
// =============================================================================

export type CategoryOption = {
  /** Category ID */
  id: string;
  /** Category slug (URL-friendly identifier) */
  slug: string;
  /** Display label (localized name) */
  label: string;
};

// =============================================================================
// Constants
// =============================================================================

export const getUseCategoriesLimitData = () => 25;

// =============================================================================
// Hook
// =============================================================================

/**
 * Fetch and search categories with debouncing
 *
 * @param query - Search query string
 * @param initial - Initial/fallback categories
 * @returns Category options and loading states
 */
export function useCategories(query: string, initial?: CategoryOption[]) {
  const [debounced, setDebounced] = useState(() => query.trim());

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  const { data, isLoading, isFetching, error } = useGetCategoriesQuery(
    {
      limit: getUseCategoriesLimitData(),
      query: debounced || '',
    },
    {
      enabled: true,
      placeholderData: (prev) => prev,
    }
  );

  const optionsFromApi: CategoryOption[] = useMemo(() => {
    const categories = data?.categories ?? [];
    return categories.map((c) => ({
      id: c.id,
      slug: c.slug,
      label: pickCategoryName(c.names, c.slug),
    }));
  }, [data]);

  const options: CategoryOption[] = useMemo(() => {
    if (optionsFromApi.length > 0) return optionsFromApi;
    return initial && initial.length
      ? initial.slice(0, getUseCategoriesLimitData())
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

function pickCategoryName(
  names: Record<string, unknown> | null | undefined,
  slug?: string
): string {
  if (names && typeof names === 'object') {
    const order = ['pl', 'en', 'de'];
    for (const key of order) {
      const v = names[key];
      if (typeof v === 'string' && v.trim().length > 0) return v;
    }
  }
  return slug ?? '—';
}
