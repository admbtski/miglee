'use client';

import { useEffect, useMemo, useState } from 'react';
import { useGetCategoriesQuery } from '@/hooks/graphql/categories';

export type CategoryOption = {
  id: string;
  slug: string;
  label: string;
};

export const useCategoriesLimit = 25;

export function useCategories(query: string, initial?: CategoryOption[]) {
  const [debounced, setDebounced] = useState(() => query.trim());

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  const { data, isLoading, isFetching, error } = useGetCategoriesQuery(
    {
      limit: useCategoriesLimit,
      query: debounced || '',
    },
    {
      enabled: true,
      placeholderData: (prev) => prev,
    }
  );

  const optionsFromApi: CategoryOption[] = useMemo(() => {
    const categories = data?.categories ?? [];
    return categories.slice(0, useCategoriesLimit).map((c) => ({
      id: c.id,
      slug: c.slug,
      label: pickCategoryName(c.names, c.slug),
    }));
  }, [data]);

  const options: CategoryOption[] = useMemo(() => {
    if (optionsFromApi.length > 0) return optionsFromApi;
    return initial && initial.length
      ? initial.slice(0, useCategoriesLimit)
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
