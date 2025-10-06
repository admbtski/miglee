'use client';

import { useMemo, useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

const buildUrl = (pathname: string, params: URLSearchParams) =>
  `${pathname}${params.toString() ? `?${params.toString()}` : ''}`;

export function useCommittedMapVisible() {
  const search = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // visible by default; hide if map=0 or map=false
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

  return { mapVisible, setVisible, toggle } as const;
}
