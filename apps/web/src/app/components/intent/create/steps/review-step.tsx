'use client';

import { IntentFormValues, IntentSuggestion } from '../../types';
import { SuggestionCard } from '../components/suggestion-card';

export function ReviewStep({
  values,
  suggestions,
  selectedId,
  onSelect,
}: {
  values: IntentFormValues;
  suggestions: IntentSuggestion[];
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
}) {
  const time = `${values.startAt.toLocaleString()} – ${values.endAt.toLocaleTimeString()}`;
  const location = values.location.address
    ? `${values.location.address} (${values.location.lat.toFixed(4)}, ${values.location.lng.toFixed(4)})`
    : `${values.location.lat.toFixed(4)}, ${values.location.lng.toFixed(4)}`;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Summary (left column) */}
      <div
        className="space-y-3 rounded-2xl border p-4
                      border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60"
      >
        <h4 className="text-sm font-semibold">Summary</h4>
        <div className="text-sm">
          <div>
            <span className="font-medium">Name:</span> {values.title}
          </div>
          <div>
            <span className="font-medium">Category:</span>{' '}
            {values.interestId || '—'}
          </div>
          <div>
            <span className="font-medium">Mode:</span>{' '}
            {values.mode === 'ONE_TO_ONE' ? '1:1' : 'Group'}
          </div>
          <div>
            <span className="font-medium">Capacity:</span> {values.capacity}
          </div>
          <div>
            <span className="font-medium">When:</span> {time}
          </div>
          <div>
            <span className="font-medium">Join late:</span>{' '}
            {values.allowJoinLate ? 'Yes' : 'No'}
          </div>
          <div>
            <span className="font-medium">Where:</span> {location}
          </div>
          {!!values.location.radiusKm && (
            <div>
              <span className="font-medium">Radius:</span>{' '}
              {values.location.radiusKm} km
            </div>
          )}
          <div>
            <span className="font-medium">Visibility:</span> {values.visibility}
          </div>
          {values.notes && (
            <div>
              <span className="font-medium">Notes:</span> {values.notes}
            </div>
          )}
          {values.description && (
            <div className="mt-2 whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">
              {values.description}
            </div>
          )}
        </div>
      </div>

      {/* Anti-duplication (right column) */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold">
          Instead of creating new, you could join…
        </h4>
        {suggestions.length === 0 ? (
          <div
            className="rounded-2xl border border-dashed p-4 text-sm
                          border-zinc-300 text-zinc-600
                          dark:border-zinc-800 dark:text-zinc-400"
          >
            No similar initiatives found — go ahead and create a new one!
          </div>
        ) : (
          <div className="space-y-2">
            {suggestions.map((s) => (
              <SuggestionCard
                key={s.id}
                s={s}
                selected={selectedId === s.id}
                onSelect={() => onSelect?.(selectedId === s.id ? null : s.id)}
              />
            ))}
          </div>
        )}
        {!!selectedId && (
          <div className="text-xs text-indigo-600 dark:text-indigo-400">
            Tip: click the same card again to unselect.
          </div>
        )}
      </div>
    </div>
  );
}
