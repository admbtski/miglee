'use client';

import { useEffect, useMemo, useState } from 'react';
import { useGetTagsQuery } from './graphql/tags';

export type TagOption = {
  id: string;
  slug: string;
  label: string;
};

export const useTagsLimit = 25;

export function useTags(query: string, initial?: TagOption[]) {
  const [debounced, setDebounced] = useState(() => query.trim());

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  const { data, isLoading, isFetching, error } = useGetTagsQuery(
    {
      limit: useTagsLimit,
      query: debounced || '',
    },
    {
      enabled: true,
      placeholderData: (prev) => prev,
    }
  );

  const optionsFromApi: TagOption[] = useMemo(() => {
    const tags = data?.tags ?? [];
    return tags.slice(0, useTagsLimit).map((t) => ({
      id: t.id,
      slug: t.slug,
      label: t.label,
    }));
  }, [data]);

  const options: TagOption[] = useMemo(() => {
    if (optionsFromApi.length > 0) return optionsFromApi;
    return initial && initial.length ? initial.slice(0, useTagsLimit) : [];
  }, [optionsFromApi, initial]);

  return {
    options,
    isLoading,
    isFetching,
    error,
    debouncedQuery: debounced,
  };
}
