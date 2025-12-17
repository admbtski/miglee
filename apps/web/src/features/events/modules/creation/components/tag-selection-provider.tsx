'use client';

import { TagOption } from '@/features/tags/types';
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

type TagSelectionContextValue = {
  selected: TagOption[];
  setSelected: (next: TagOption[]) => void;
  set: (opts: TagOption[], maxCount?: number) => void;
  add: (opt: TagOption, maxCount?: number) => void;
  remove: (idOrSlug: string) => void;
  clear: () => void;
};

const TagSelectionContext = createContext<TagSelectionContextValue | null>(
  null
);

export function TagSelectionProvider({
  children,
  initial = [],
}: {
  children: React.ReactNode;
  initial?: TagOption[];
}) {
  const [selected, setSelected] = useState<TagOption[]>(initial);

  const add = useCallback((opt: TagOption, maxCount = 3) => {
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

  const set = useCallback((opts: TagOption[], maxCount = 3) => {
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
    <TagSelectionContext.Provider value={value}>
      {children}
    </TagSelectionContext.Provider>
  );
}

export function useTagSelection(): TagSelectionContextValue {
  const ctx = useContext(TagSelectionContext);
  if (!ctx) {
    throw new Error('useTagSelection must be used within TagSelectionProvider');
  }
  return ctx;
}
