'use client';

import { CategoryOption } from '@/types/types';
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

type CategorySelectionContextValue = {
  selected: CategoryOption[];
  setSelected: (next: CategoryOption[]) => void;
  set: (opts: CategoryOption[], maxCount?: number) => void;
  add: (opt: CategoryOption, maxCount?: number) => void;
  remove: (idOrSlug: string) => void;
  clear: () => void;
};

const CategorySelectionContext =
  createContext<CategorySelectionContextValue | null>(null);

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

  const set = useCallback((opts: CategoryOption[], maxCount = 3) => {
    const seen = new Set<string>();
    const unique = [];
    for (const o of opts) {
      const key = o.id || o.slug;
      if (!key) continue;
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(o);
    }
    setSelected(unique.slice(0, maxCount));
  }, []);

  const clear = useCallback(() => setSelected([]), []);

  const value = useMemo(
    () => ({ selected, setSelected, add, remove, set, clear }),
    [selected, add, remove, set, clear]
  );

  return (
    <CategorySelectionContext.Provider value={value}>
      {children}
    </CategorySelectionContext.Provider>
  );
}

export function useCategorySelection(): CategorySelectionContextValue {
  const ctx = useContext(CategorySelectionContext);
  if (!ctx) {
    throw new Error(
      'useCategorySelection must be used within CategorySelectionProvider'
    );
  }
  return ctx;
}
