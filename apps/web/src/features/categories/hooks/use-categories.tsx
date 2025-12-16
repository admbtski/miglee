'use client';

import { CategoryOption, useGetCategoriesQuery } from '@/features/categories';
import { Locale, useI18n } from '@/lib/i18n/provider-ssr';
import { useEffect, useMemo, useState } from 'react';

export const getUseCategoriesLimitData = () => 25;

export function useCategories(query: string, initial?: CategoryOption[]) {
  const [debounced, setDebounced] = useState(() => query.trim());
  const { locale } = useI18n();

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
      label: pickCategoryName(c.names, c.slug, locale),
    }));
  }, [data, locale]);

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
  slug?: string,
  locale?: Locale
): string {
  if (names && typeof names === 'object') {
    const v = names[locale || 'en'];
    if (typeof v === 'string' && v.trim().length > 0) return v;
  }
  return slug ?? '—';
}
