// src/lib/cors.ts
type Matcher = (origin: string) => boolean;

function toMatcher(pattern: string): Matcher {
  const p = pattern.trim();
  if (!p) return () => false;

  // wildcardy: https://*.your.app
  if (p.includes('*')) {
    // zamień * na [^.]+ (tylko jedna subdomena) lub .* (dowolny ciąg)
    const esc = p
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
      .replace(/\\\*\\\./g, '[^.]+\\.') // *.domain → jedna subdomena
      .replace(/\\\*/g, '.*'); // reszta * → dowolny ciąg
    const re = new RegExp(`^${esc}$`, 'i');
    return (origin: string) => re.test(origin);
  }

  // literal
  return (origin: string) => origin.toLowerCase() === p.toLowerCase();
}

export function buildCorsChecker(raw: string | undefined, devOpen = true) {
  const list = (raw ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const matchers = list.map(toMatcher);

  return (origin?: string | null) => {
    // brak origin → pozwól (curl/same-origin, SSR bez przeglądarki)
    if (!origin) return true;
    // normalizacja (bez trailing slash)
    const norm = origin.replace(/\/$/, '');
    if (matchers.length === 0) return devOpen; // dev fallback
    return matchers.some((m) => m(norm));
  };
}
