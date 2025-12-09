'use client';

// TODO i18n: All Polish strings need translation keys

import { SearchX, Plus, MapPin, Calendar } from 'lucide-react';
import { memo } from 'react';
import Link from 'next/link';
import { useLocalePath } from '@/hooks/use-locale-path';

type EmptyStateProps = {
  hasFilters?: boolean;
  onClearFilters?: () => void;
};

export const EmptyState = memo(function EmptyState({
  hasFilters = false,
  onClearFilters,
}: EmptyStateProps) {
  const { localePath } = useLocalePath();

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="relative mb-6">
        {/* Decorative background */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/20 dark:to-violet-900/20 blur-2xl opacity-50" />

        {/* Icon container */}
        <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl bg-white dark:bg-zinc-800 shadow-lg border border-zinc-200 dark:border-zinc-700">
          <SearchX className="w-10 h-10 text-zinc-400 dark:text-zinc-500" />
        </div>
      </div>

      <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
        {hasFilters ? 'Brak wyników' : 'Brak wydarzeń'}
      </h3>

      <p className="text-zinc-600 dark:text-zinc-400 max-w-md mb-6">
        {hasFilters
          ? 'Nie znaleziono wydarzeń dla wybranych filtrów. Spróbuj zmienić kryteria wyszukiwania.'
          : 'Nie ma jeszcze żadnych wydarzeń w Twojej okolicy. Bądź pierwszy i stwórz własne!'}
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        {hasFilters && onClearFilters && (
          <button
            onClick={onClearFilters}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
          >
            Wyczyść filtry
          </button>
        )}

        <Link
          href={localePath('/event/new')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors shadow-lg"
        >
          <Plus className="w-4 h-4" />
          Utwórz wydarzenie
        </Link>
      </div>

      {/* Suggestions */}
      {hasFilters && (
        <div className="mt-8 pt-8 border-t border-zinc-200 dark:border-zinc-800 w-full max-w-md">
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-4">
            Sugestie:
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
              <MapPin className="w-3.5 h-3.5" />
              Zwiększ zasięg
            </button>
            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
              <Calendar className="w-3.5 h-3.5" />
              Zmień datę
            </button>
          </div>
        </div>
      )}
    </div>
  );
});
