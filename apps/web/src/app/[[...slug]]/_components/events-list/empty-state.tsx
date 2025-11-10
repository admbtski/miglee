'use client';

import { memo } from 'react';
import { SearchX } from 'lucide-react';

export const EmptyState = memo(function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <SearchX className="w-16 h-16 mb-4 opacity-20" />
      <p className="text-sm opacity-70">Brak wyników dla wybranych filtrów.</p>
      <p className="mt-2 text-xs opacity-50">
        Spróbuj zmienić kryteria wyszukiwania
      </p>
    </div>
  );
});
