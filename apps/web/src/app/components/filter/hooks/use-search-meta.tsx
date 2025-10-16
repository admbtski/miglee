'use client';

import { useEffect, useMemo, useState } from 'react';
import { useGetCategoriesQuery } from '@/hooks/categories';
import { useGetTagsQuery } from '@/hooks/tags';

export type SearchMeta = {
  tags: string[];
  keywords: string[];
  categories: string[];
};

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
    debounced ? { query: debounced, limit: 10 } : { limit: 10 }
  );

  const {
    data: tagsData,
    isLoading: isTagsLoading,
    error: tagsError,
  } = useGetTagsQuery(
    debounced ? { query: debounced, limit: 10 } : { limit: 10 }
  );

  const categories = useMemo<string[]>(
    () => (categoriesData?.categories ?? []).map((c) => c.slug).filter(Boolean),
    [categoriesData]
  );

  const tags = useMemo<string[]>(
    () => (tagsData?.tags ?? []).map((t) => t.slug).filter(Boolean),
    [tagsData]
  );

  const data: SearchMeta = useMemo(
    () => ({ tags, categories, keywords: [] }),
    [tags, categories]
  );

  const loading = isCategoriesLoading || isTagsLoading;
  const error = (categoriesError as unknown) ?? (tagsError as unknown) ?? null;

  return { data, loading, error };
}
