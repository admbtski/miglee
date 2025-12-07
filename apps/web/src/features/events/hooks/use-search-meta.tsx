/**
 * Hook for searching categories and tags metadata
 * Provides debounced search results for filter autocomplete
 */

'use client';

import { appLanguage, appLanguageFallback } from '@/lib/config/language';
import { useGetCategoriesQuery } from '@/lib/api/categories';
import { useGetTagsQuery } from '@/lib/api/tags';
import { useEffect, useMemo, useState } from 'react';

const MIN_CHARS = 3;
const MAX_RESULTS = 10;

export type SearchMeta = {
  tags: {
    id: string;
    slug: string;
    label: string;
  }[];
  keywords: {
    id: string;
    slug: string;
    label: string;
  }[];
  categories: {
    id: string;
    slug: string;
    label: string;
  }[];
};

/**
 * Searches for categories and tags based on query string
 * Results are debounced (500ms) and only search when query >= 3 characters
 *
 * @param query - Search query string
 * @returns Object with:
 * - data: SearchMeta with tags, categories, and keywords arrays
 * - loading: True while fetching data
 * - error: Error object if request failed
 *
 * @example
 * ```tsx
 * const { data, loading, error } = useSearchMeta('yoga');
 * // data.categories: [{ id, slug, label }, ...]
 * // data.tags: [{ id, slug, label }, ...]
 * ```
 */
export function useSearchMeta(query: string) {
  const [debounced, setDebounced] = useState(query);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 500);
    return () => clearTimeout(t);
  }, [query]);

  const {
    data: categoriesData,
    isLoading: isCategoriesLoading,
    error: categoriesError,
  } = useGetCategoriesQuery(
    debounced
      ? { query: debounced, limit: MAX_RESULTS }
      : { limit: MAX_RESULTS },
    {
      placeholderData: (p) => p,
      enabled: debounced.length >= MIN_CHARS,
    }
  );

  const {
    data: tagsData,
    isLoading: isTagsLoading,
    error: tagsError,
  } = useGetTagsQuery(
    debounced
      ? { query: debounced, limit: MAX_RESULTS }
      : { limit: MAX_RESULTS },
    {
      placeholderData: (p) => p,
      enabled: debounced.length >= MIN_CHARS,
    }
  );

  const data: SearchMeta = useMemo(
    () => ({
      tags:
        tagsData?.tags.map((t) => ({
          id: t.id,
          label: t.label ?? t.slug ?? '-',
          slug: t.slug,
        })) ?? [],
      categories:
        categoriesData?.categories.map((c) => ({
          id: c.id,
          label:
            c.names[appLanguage] ??
            c.names[appLanguageFallback] ??
            c.slug ??
            '-',
          slug: c.slug,
        })) ?? [],
      keywords: [],
    }),
    [tagsData, categoriesData]
  );

  const loading = isCategoriesLoading || isTagsLoading;
  const error = categoriesError ?? tagsError ?? null;

  return { data, loading, error };
}
