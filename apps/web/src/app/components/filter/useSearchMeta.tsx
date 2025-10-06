'use client';

import { useEffect, useRef, useState } from 'react';
import { fetchSearchMeta } from './mockSearchMeta';

export type SearchMeta = {
  tags: string[];
  keywords: string[];
  categories: string[];
};

export function useSearchMeta(query: string) {
  const [data, setData] = useState<SearchMeta>({
    tags: [],
    keywords: [],
    categories: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const cache = useRef(new Map<string, SearchMeta>());
  const reqId = useRef(0);

  useEffect(() => {
    let alive = true;
    const q = query.trim().toLowerCase();

    const run = async (myId: number) => {
      try {
        // serve cached immediately if exists
        if (cache.current.has(q)) {
          setData(cache.current.get(q)!);
        } else {
          setLoading(true);
        }

        const res = await fetchSearchMeta(q);
        if (!alive || myId !== reqId.current) return; // only latest wins

        cache.current.set(q, res);
        setData(res);
        setLoading(false);
        setError(null);
      } catch (e) {
        if (!alive || myId !== reqId.current) return;
        setError(e);
        setLoading(false);
      }
    };

    const id = ++reqId.current;
    const t = setTimeout(() => run(id), 300); // debounce 300ms
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [query]);

  return { data, loading, error };
}
