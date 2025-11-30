/**
 * Active filters chips component
 */

import type {
  IntentStatus,
  JoinMode,
  Level,
  MeetingKind,
} from '@/lib/api/__generated__/react-query-update';
import { X } from 'lucide-react';
import { useMemo } from 'react';
import type { SearchMeta } from '../../_hooks/use-search-meta';

export interface FilterActiveChipsProps {
  q: string;
  city: string | null;
  distanceKm: number;
  startISO: string | null;
  endISO: string | null;
  status: IntentStatus;
  kinds: MeetingKind[];
  levels: Level[];
  verifiedOnly: boolean;
  tags: SearchMeta['tags'];
  keywords: string[];
  categories: SearchMeta['categories'];
  joinModes: JoinMode[];
  onClearQ: () => void;
  onClearCity: () => void;
  onClearDistance: () => void;
  onClearStart: () => void;
  onClearEnd: () => void;
  onClearStatus: () => void;
  onClearKinds: () => void;
  onClearLevels: () => void;
  onClearVerified: () => void;
  onClearTags: () => void;
  onClearKeywords: () => void;
  onClearCategories: () => void;
  onClearJoinModes: () => void;
}

export function FilterActiveChips(props: FilterActiveChipsProps) {
  const {
    q,
    city,
    distanceKm,
    startISO,
    endISO,
    status,
    kinds,
    levels,
    verifiedOnly,
    tags,
    keywords,
    categories,
    joinModes,
    onClearQ,
    onClearCity,
    onClearDistance,
    onClearStart,
    onClearEnd,
    onClearStatus,
    onClearKinds,
    onClearLevels,
    onClearVerified,
    onClearTags,
    onClearKeywords,
    onClearCategories,
    onClearJoinModes,
  } = props;

  const DEFAULT_DISTANCE = 30;

  const chips = useMemo(() => {
    const arr: Array<{ key: string; label: string; onClear: () => void }> = [];
    const push = (key: string, label: string, onClear: () => void) =>
      arr.push({ key, label, onClear });

    // Helper to get readable status label
    const getStatusLabel = (st: IntentStatus) => {
      switch (st) {
        case 'UPCOMING':
          return 'Nadchodzące';
        case 'ONGOING':
          return 'W trakcie';
        case 'PAST':
          return 'Przeszłe';
        case 'ANY':
        default:
          return 'Dowolny';
      }
    };

    if (q) push('q', `Szukaj: "${q}"`, onClearQ);
    if (city) push('city', city, onClearCity);
    if (city && distanceKm !== DEFAULT_DISTANCE)
      push('distance', `${distanceKm} km`, onClearDistance);
    if (startISO)
      push('start', new Date(startISO).toLocaleString(), onClearStart);
    if (endISO) push('end', new Date(endISO).toLocaleString(), onClearEnd);
    if (status !== 'ANY')
      push('status', `Status: ${getStatusLabel(status)}`, onClearStatus);
    if (kinds.length) push('kinds', `Tryb: ${kinds.join(', ')}`, onClearKinds);
    if (levels.length)
      push('levels', `Poziom: ${levels.join(', ')}`, onClearLevels);
    if (verifiedOnly) push('verified', 'Zweryfikowani', onClearVerified);
    if (tags.length)
      push('tags', `Tagi: ${tags.map((t) => t.label).join(', ')}`, onClearTags);
    if (keywords.length)
      push(
        'keywords',
        `Słowa kluczowe: ${keywords.join(', ')}`,
        onClearKeywords
      );
    if (categories.length)
      push(
        'categories',
        `Kategorie: ${categories.map((c) => c.label).join(', ')}`,
        onClearCategories
      );
    if (joinModes.length) {
      const joinModeLabels = joinModes.map((jm) =>
        jm === 'OPEN'
          ? 'Otwarte'
          : jm === 'REQUEST'
            ? 'Na prośbę'
            : 'Tylko zaproszenia'
      );
      push(
        'joinModes',
        `Tryb dołączania: ${joinModeLabels.join(', ')}`,
        onClearJoinModes
      );
    }

    return arr;
  }, [
    q,
    city,
    distanceKm,
    startISO,
    endISO,
    status,
    kinds,
    levels,
    verifiedOnly,
    tags,
    keywords,
    categories,
    joinModes,
    onClearQ,
    onClearCity,
    onClearDistance,
    onClearStart,
    onClearEnd,
    onClearStatus,
    onClearKinds,
    onClearLevels,
    onClearVerified,
    onClearTags,
    onClearKeywords,
    onClearCategories,
    onClearJoinModes,
  ]);

  if (chips.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
      {chips.map((c) => (
        <button
          key={c.key}
          onClick={c.onClear}
          className="inline-flex items-center gap-2 px-3 py-1 text-sm border rounded-full border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-200"
          title="Usuń filtr"
        >
          <span className="truncate max-w-[14rem]">{c.label}</span>
          <X className="h-3.5 w-3.5 opacity-60" />
        </button>
      ))}
    </div>
  );
}
