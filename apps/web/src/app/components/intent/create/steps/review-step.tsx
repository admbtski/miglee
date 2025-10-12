'use client';

import { MapPreview } from '@/app/components/location/map-preview';
import { IntentFormValues, IntentSuggestion } from '../../types';
import { SuggestionCard } from '../components/suggestion-card';
import {
  CalendarDays,
  Clock,
  MapPin,
  Users,
  User,
  Eye,
  EyeOff,
  Ruler,
  NotebookText,
  Tag,
} from 'lucide-react';
import { useMemo } from 'react';

/* ---------- tiny UI primitives ---------- */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <h4 className="text-sm font-semibold tracking-tight">{children}</h4>
    </div>
  );
}

function Chip({
  children,
  tone = 'zinc',
  icon,
}: {
  children: React.ReactNode;
  tone?: 'zinc' | 'indigo' | 'emerald' | 'amber' | 'rose' | 'violet' | 'blue';
  icon?: React.ReactNode;
}) {
  const toneMap: Record<string, string> = {
    zinc: 'bg-zinc-100 text-zinc-700 ring-zinc-200 dark:bg-zinc-800/60 dark:text-zinc-200 dark:ring-zinc-700',
    indigo:
      'bg-indigo-100 text-indigo-700 ring-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-200 dark:ring-indigo-500/25',
    emerald:
      'bg-emerald-100 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-200 dark:ring-emerald-500/25',
    amber:
      'bg-amber-100 text-amber-800 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-200 dark:ring-amber-500/25',
    rose: 'bg-rose-100 text-rose-700 ring-rose-200 dark:bg-rose-500/15 dark:text-rose-200 dark:ring-rose-500/25',
    violet:
      'bg-violet-100 text-violet-700 ring-violet-200 dark:bg-violet-500/15 dark:text-violet-200 dark:ring-violet-500/25',
    blue: 'bg-blue-100 text-blue-700 ring-blue-200 dark:bg-blue-500/15 dark:text-blue-200 dark:ring-blue-500/25',
  };
  return (
    <span
      className={[
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1',
        toneMap[tone],
      ].join(' ')}
    >
      {icon}
      {children}
    </span>
  );
}

function Kvp({
  icon,
  label,
  value,
  mono = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="grid grid-cols-[28px_1fr] items-start gap-3">
      <div className="grid h-7 w-7 place-items-center rounded-md bg-zinc-100 text-zinc-700 ring-1 ring-zinc-200 dark:bg-zinc-800/60 dark:text-zinc-200 dark:ring-zinc-700">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {label}
        </div>
        <div
          className={[
            'text-sm text-zinc-900 dark:text-zinc-100',
            mono ? 'font-mono tabular-nums' : '',
          ].join(' ')}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

/* ---------- helpers ---------- */

function useFormattedTime(start: Date, end: Date) {
  return useMemo(() => {
    try {
      const dDate = new Intl.DateTimeFormat(undefined, {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        weekday: 'short',
      }).format(start);

      const t = new Intl.DateTimeFormat(undefined, {
        hour: '2-digit',
        minute: '2-digit',
      });

      const startT = t.format(start);
      const endT = t.format(end);

      return { dDate, startT, endT };
    } catch {
      return {
        dDate: start.toLocaleDateString(),
        startT: start.toLocaleTimeString(),
        endT: end.toLocaleTimeString(),
      };
    }
  }, [start, end]);
}

function Coordinates({ lat, lng }: { lat: number; lng: number }) {
  return (
    <span className="font-mono tabular-nums text-xs opacity-80">
      ({lat.toFixed(4)}, {lng.toFixed(4)})
    </span>
  );
}

/* ---------- main component ---------- */

export function ReviewStep({
  values,
  suggestions,
  selectedId,
  onSelect,
  showMapPreview = false,
  mapId,
  /** opcjonalnie lista kategorii do zmapowania id -> name */
  interests,
}: {
  values: IntentFormValues;
  suggestions: IntentSuggestion[];
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  showMapPreview?: boolean;
  mapId?: string;
  interests?: Array<{ id: string; name: string }>;
}) {
  const { dDate, startT, endT } = useFormattedTime(
    values.startAt,
    values.endAt
  );

  // --- resolve interest names (multi) ---
  const interestNames = useMemo(() => {
    const map =
      interests?.reduce<Record<string, string>>((acc, it) => {
        acc[it.id] = it.name;
        return acc;
      }, {}) ?? {};
    const ids = Array.isArray(values.interestIds) ? values.interestIds : [];
    return ids.map((id) => map[id] ?? id);
  }, [interests, values.interestIds]);

  const modeChip =
    values.mode === 'ONE_TO_ONE' ? (
      <Chip tone="violet" icon={<User className="h-3.5 w-3.5" />}>
        1:1
      </Chip>
    ) : (
      <Chip tone="indigo" icon={<Users className="h-3.5 w-3.5" />}>
        Group {values.min}–{values.max}
      </Chip>
    );

  const visChip =
    values.visibility === 'PUBLIC' ? (
      <Chip tone="emerald" icon={<Eye className="h-3.5 w-3.5" />}>
        Public
      </Chip>
    ) : (
      <Chip tone="amber" icon={<EyeOff className="h-3.5 w-3.5" />}>
        Hidden
      </Chip>
    );

  const hasCoords =
    typeof values.location?.lat === 'number' &&
    typeof values.location?.lng === 'number';

  const where =
    values.location.address && values.location.address.trim().length > 0 ? (
      <>
        <span className="break-words">{values.location.address}</span>{' '}
        {hasCoords && (
          <Coordinates lat={values.location.lat} lng={values.location.lng} />
        )}
      </>
    ) : hasCoords ? (
      <Coordinates lat={values.location.lat} lng={values.location.lng} />
    ) : (
      '—'
    );

  const center = hasCoords
    ? { lat: values.location.lat, lng: values.location.lng }
    : null;

  const radiusMeters =
    typeof values.location?.radiusKm === 'number' &&
    values.location.radiusKm > 0
      ? values.location.radiusKm * 1000
      : null;

  return (
    <div className="grid gap-5 md:grid-cols-2">
      {/* LEFT: Summary card */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-lg font-semibold tracking-tight">
                {values.title || 'Untitled'}
              </h3>

              {/* chips: mode, visibility, interests[], allowJoinLate */}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {modeChip}
                {visChip}

                {interestNames.map((name) => (
                  <Chip
                    key={name}
                    tone="zinc"
                    icon={<Tag className="h-3.5 w-3.5" />}
                  >
                    {name}
                  </Chip>
                ))}

                {values.allowJoinLate && (
                  <Chip tone="rose">Allow late join</Chip>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="grid gap-4">
          <Kvp
            icon={<CalendarDays className="h-4 w-4" />}
            label="Date"
            value={dDate}
          />
          <Kvp
            icon={<Clock className="h-4 w-4" />}
            label="Time"
            value={
              <span className="tabular-nums">
                {startT} – {endT}
              </span>
            }
          />
          <Kvp
            icon={<MapPin className="h-4 w-4" />}
            label="Where"
            value={where}
          />

          {values.mode === 'GROUP' && (
            <Kvp
              icon={<Users className="h-4 w-4" />}
              label="Capacity"
              value={
                <span className="tabular-nums">
                  {values.min} – {values.max}
                </span>
              }
              mono
            />
          )}

          {/* Mini map (optional) */}
          {showMapPreview && (
            <div className="mt-1">
              <MapPreview
                center={center}
                zoom={center ? 15 : 6}
                radiusMeters={radiusMeters}
                draggableMarker={false}
                clickToPlace={false}
                className="w-full border border-zinc-200 dark:border-zinc-800"
                mapId={mapId}
              />
            </div>
          )}
          {!!values.location.radiusKm && values.location.radiusKm > 0 && (
            <Kvp
              icon={<Ruler className="h-4 w-4" />}
              label="Radius"
              value={
                <span className="tabular-nums">
                  {values.location.radiusKm} km
                </span>
              }
              mono
            />
          )}

          {values.notes && values.notes.trim().length > 0 && (
            <div className="rounded-xl border border-dashed border-zinc-300 p-3 text-sm text-zinc-700 dark:border-zinc-700 dark:text-zinc-200">
              <span className="mr-2 font-medium">Logistics:</span>
              <span className="whitespace-pre-wrap">{values.notes}</span>
            </div>
          )}

          {values.description && values.description.trim().length > 0 && (
            <div className="mt-1 rounded-xl border border-zinc-200/70 bg-white/70 p-3 dark:border-zinc-800 dark:bg-zinc-900/60">
              <div className="mb-1 flex items-center gap-2 text-[11px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                <NotebookText className="h-3.5 w-3.5" />
                Description
              </div>
              <div className="whitespace-pre-wrap text-sm text-zinc-800 dark:text-zinc-200">
                {values.description}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Anti-duplication */}
      <div className="space-y-3">
        <SectionTitle>Instead of creating new, you could join…</SectionTitle>

        {suggestions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 p-4 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
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
