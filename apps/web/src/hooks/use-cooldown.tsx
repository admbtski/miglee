/**
 * Custom hook for managing cooldown timers
 *
 * @description
 * Provides a simple cooldown timer system for rate-limiting user actions.
 * Tracks multiple cooldowns by key, automatically decrements every second.
 * Useful for preventing spam, rate-limiting API calls, or implementing
 * time-based restrictions.
 *
 * Features:
 * - Multiple cooldowns tracked by key
 * - Automatic countdown (1 second intervals)
 * - Check if action is cooling down
 * - Get remaining time
 *
 * @example
 * ```tsx
 * const { start, get, isCooling } = useCooldown();
 *
 * const handleAction = () => {
 *   if (isCooling('myAction')) {
 *     alert(`Wait ${get('myAction')} seconds`);
 *     return;
 *   }
 *
 *   // Perform action
 *   doSomething();
 *
 *   // Start 10 second cooldown
 *   start('myAction', 10);
 * };
 *
 * return (
 *   <button onClick={handleAction} disabled={isCooling('myAction')}>
 *     {isCooling('myAction') ? `Wait ${get('myAction')}s` : 'Click me'}
 *   </button>
 * );
 * ```
 */

'use client';

import { useCallback, useEffect, useState } from 'react';

// =============================================================================
// Hook
// =============================================================================

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
