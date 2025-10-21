'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import type { CategoryOption } from './types';

type TagSelectionContextValue = {
  selected: CategoryOption[];
  setSelected: (next: CategoryOption[]) => void;
  set: (opts: CategoryOption[]) => void;
  add: (opt: CategoryOption, maxCount?: number) => void;
  remove: (idOrSlug: string) => void;
  clear: () => void;
};

const TagSelectionContext = createContext<TagSelectionContextValue | null>(
  null
);

export function CategorySelectionProvider({
  children,
  initial = [],
}: {
  children: React.ReactNode;
  initial?: CategoryOption[];
}) {
  const [selected, setSelected] = useState<CategoryOption[]>(initial);

  const add = useCallback((opt: CategoryOption, maxCount = 3) => {
    setSelected((prev) => {
      if (prev.some((p) => p.id === opt.id || p.slug === opt.slug)) return prev;
      if (prev.length >= maxCount) return prev;
      return [...prev, opt];
    });
  }, []);

  const remove = useCallback((idOrSlug: string) => {
    setSelected((prev) =>
      prev.filter((p) => p.id !== idOrSlug && p.slug !== idOrSlug)
    );
  }, []);

  const set = useCallback((opts: CategoryOption[]) => {
    const seen = new Set<string>();
    const unique = [];
    for (const o of opts) {
      const key = o.id || o.slug;
      if (!key) continue;
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(o);
    }
    setSelected(unique);
  }, []);

  const clear = useCallback(() => setSelected([]), []);

  const value = useMemo(
    () => ({ selected, setSelected, add, remove, set, clear }),
    [selected, add, remove, set, clear]
  );

  return (
    <TagSelectionContext.Provider value={value}>
      {children}
    </TagSelectionContext.Provider>
  );
}

export function useTagSelection(): TagSelectionContextValue {
  const ctx = useContext(TagSelectionContext);
  if (!ctx) {
    throw new Error(
      'useTagSelection must be used within CategorySelectionProvider'
    );
  }
  return ctx;
}
