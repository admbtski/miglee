// hooks/useCategories.ts
'use client';

import { useEffect, useRef, useState } from 'react';
import { fetchCategories } from '../../mockCategories';
import { CategoryOption } from '../../types';

export function useCategories(query: string, initial?: CategoryOption[]) {
  const [options, setOptions] = useState<CategoryOption[]>(initial ?? []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const cache = useRef(new Map<string, CategoryOption[]>());
  const reqId = useRef(0);

  useEffect(() => {
    const q = query.trim().toLowerCase();
    let alive = true;
    const id = ++reqId.current;

    const run = async () => {
      try {
        if (cache.current.has(q)) {
          setOptions(cache.current.get(q)!);
          return;
        }
        setLoading(true);
        const res = await fetchCategories(q);
        if (!alive || id !== reqId.current) return;
        cache.current.set(q, res);
        setOptions(res);
        setLoading(false);
        setError(null);
      } catch (e) {
        if (!alive || id !== reqId.current) return;
        setError(e);
        setLoading(false);
      }
    };

    const t = setTimeout(run, 300); // debounce
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [query]);

  return { options, loading, error };
}
