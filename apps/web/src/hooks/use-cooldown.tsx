import { useCallback, useEffect, useState } from 'react';

export function useCooldown() {
  const [remaining, setRemaining] = useState<Record<string, number>>({});

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining((prev) => {
        const next: Record<string, number> = {};
        let changed = false;
        for (const k of Object.keys(prev)) {
          const v = Math.max(0, prev[k]! - 1);
          if (v > 0) next[k] = v;
          if (v !== prev[k]) changed = true;
        }
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const start = useCallback((key: string, seconds = 10) => {
    setRemaining((prev) => ({ ...prev, [key]: seconds }));
  }, []);

  const get = useCallback((key: string) => remaining[key] ?? 0, [remaining]);
  const isCooling = useCallback(
    (key: string) => (remaining[key] ?? 0) > 0,
    [remaining]
  );

  return { start, get, isCooling };
}
