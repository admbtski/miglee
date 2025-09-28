import { useMemo, useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

type CommittedFilters = { q: string; city: string | null; distanceKm: number };

const DEFAULT_DISTANCE = 30;

/**
 * URL is the single source of truth for filters.
 * - Reads derive from search params.
 * - Writes update only relevant params and preserve everything else.
 * - No local React state / effects.
 */
export function useCommittedFilters() {
  const search = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Stable primitive for memo deps
  const searchKey = search.toString();

  // Read current filters from the URL (with sane fallbacks)
  const { q, city, distanceKm } = useMemo<CommittedFilters>(() => {
    const q = search.get('q') ?? '';
    const cityParam = search.get('city');
    const distRaw = Number(search.get('distance'));
    const distanceKm =
      Number.isFinite(distRaw) && distRaw > 0 ? distRaw : DEFAULT_DISTANCE;

    return { q, city: cityParam || null, distanceKm };
  }, [searchKey, search]);

  /**
   * Build the next URL:
   * - If a field is `undefined`, keep the current value.
   * - If `city` becomes null/empty, drop both `city` and `distance`.
   * - Only include `q` when non-empty.
   * - Include `distance` only when `city` is present and distance ≠ default.
   */
  const buildUrl = useCallback(
    (next: Partial<CommittedFilters>) => {
      const current: CommittedFilters = { q, city, distanceKm };

      const merged: CommittedFilters = {
        q: next.q !== undefined ? next.q : current.q,
        city: next.city !== undefined ? next.city : current.city,
        distanceKm:
          next.distanceKm !== undefined ? next.distanceKm : current.distanceKm,
      };

      const params = new URLSearchParams(search);

      // Clean previous filter params first (avoid duplicates)
      params.delete('q');
      params.delete('city');
      params.delete('distance');

      // Apply new values
      if (merged.q) params.set('q', merged.q);

      if (merged.city) {
        params.set('city', merged.city);
        if (merged.distanceKm !== DEFAULT_DISTANCE) {
          params.set('distance', String(merged.distanceKm));
        }
      }
      // If no city: we intentionally keep both 'city' and 'distance' absent

      const qs = params.toString();
      return `${pathname}${qs ? `?${qs}` : ''}`;
    },
    [pathname, search, q, city, distanceKm]
  );

  // Public API: apply & reset simply replace the URL (no scroll jump)
  const apply = useCallback(
    (next: CommittedFilters) => {
      router.replace(buildUrl(next), { scroll: false });
    },
    [buildUrl, router]
  );

  const reset = useCallback(
    () =>
      router.replace(
        buildUrl({ q: '', city: null, distanceKm: DEFAULT_DISTANCE }),
        { scroll: false }
      ),
    [buildUrl, router]
  );

  return { q, city, distanceKm, apply, reset } as const;
}
