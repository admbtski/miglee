import { useMemo, useRef } from 'react';

export function useThrottled(fn: (...a: any[]) => void, ms = 300) {
  const fnRef = useRef(fn);
  const tRef = useRef<number | null>(null);
  const lastRef = useRef(0);
  fnRef.current = fn;

  // identyczna referencja między renderami
  return useMemo(
    () =>
      (...args: any[]) => {
        const now = performance.now();
        const remain = ms - (now - lastRef.current);
        if (remain <= 0) {
          lastRef.current = now;
          fnRef.current(...args);
        } else if (tRef.current == null) {
          tRef.current = window.setTimeout(() => {
            tRef.current = null;
            lastRef.current = performance.now();
            fnRef.current(...args);
          }, remain) as unknown as number;
        }
      },
    [ms]
  );
}
