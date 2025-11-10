'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';

const buildUrl = (pathname: string, params: URLSearchParams) =>
  `${pathname}${params.toString() ? `?${params.toString()}` : ''}`;

export function useCommittedMapVisible() {
  const search = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const mapVisible = useMemo(() => {
    const v = search.get('map');
    return !(v === '0' || v === 'false');
  }, [search]);

  const setVisible = useCallback(
    (next: boolean) => {
      const params = new URLSearchParams(search);
      if (next) params.delete('map');
      else params.set('map', '0');
      router.replace(buildUrl(pathname, params), { scroll: false });
    },
    [pathname, router, search]
  );

  const toggle = useCallback(
    () => setVisible(!mapVisible),
    [setVisible, mapVisible]
  );

  return useMemo(
    () => ({ mapVisible, setVisible, toggle }),
    [mapVisible, setVisible, toggle]
  );
}
