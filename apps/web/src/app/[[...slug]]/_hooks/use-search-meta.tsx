'use client';

import { appLanguage, appLanguageFallback } from '@/const/language';
import { useGetCategoriesQuery } from '@/hooks/graphql/categories';
import { useGetTagsQuery } from '@/hooks/graphql/tags';
import { useEffect, useMemo, useState } from 'react';

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
    debounced ? { query: debounced, limit: 10 } : { limit: 10 },
    {
      placeholderData: (p) => p,
    }
  );

  const {
    data: tagsData,
    isLoading: isTagsLoading,
    error: tagsError,
  } = useGetTagsQuery(
    debounced ? { query: debounced, limit: 10 } : { limit: 10 },
    {
      placeholderData: (p) => p,
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
