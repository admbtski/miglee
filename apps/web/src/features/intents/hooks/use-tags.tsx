'use client';

import { useEffect, useMemo, useState } from 'react';
import { useGetTagsQuery } from '@/lib/api/tags';

export type TagOption = {
  id: string;
  slug: string;
  label: string;
};

export const getUseTagsLimitData = () => 25;

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
