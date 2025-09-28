import { useMemo, useId } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Users, Lock, MapPin } from 'lucide-react';

export interface EventCardProps {
  startISO: string;
  endISO: string;
  avatarUrl: string;
  organizerName: string;
  description: string;
  location: string;
  joined: number;
  min: number;
  max: number;
  tags?: string[];
  lockHoursBeforeStart?: number;
  inline?: boolean;
  onJoin?: () => void;
  className?: string;
}

// =============================
// Utils (czyste, bez side‑effectów)
// =============================
const MONTHS_PL_SHORT = [
  'sty',
  'lut',
  'mar',
  'kwi',
  'maj',
  'cze',
  'lip',
  'sie',
  'wrz',
  'paź',
  'lis',
  'gru',
] as const;

const pad2 = (n: number) => (n < 10 ? `0${n}` : String(n));

const isValidDate = (d: Date) =>
  d instanceof Date && !Number.isNaN(d.getTime());

const parseISO = (iso: string, fallback: Date = new Date()) => {
  const d = new Date(iso);
  return isValidDate(d) ? d : fallback;
};

function formatDateRange(start: Date, end: Date) {
  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();

  const fmt = (d: Date) =>
    `${pad2(d.getDate())} ${MONTHS_PL_SHORT[d.getMonth()]}, ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;

  return sameDay
    ? `${fmt(start)} – ${pad2(end.getHours())}:${pad2(end.getMinutes())}`
    : `${fmt(start)} – ${fmt(end)}`;
}

const plural = (n: number, forms: [string, string, string]) => {
  const mod10 = n % 10,
    mod100 = n % 100;
  if (n === 1) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14))
    return forms[1];
  return forms[2];
};

function humanDuration(start: Date, end: Date) {
  const ms = Math.max(0, end.getTime() - start.getTime());
  const total = Math.round(ms / 60000);
  const days = Math.floor(total / (60 * 24));
  const hours = Math.floor((total - days * 24 * 60) / 60);
  const mins = total % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days} ${plural(days, ['dzień', 'dni', 'dni'])}`);
  if (hours > 0) parts.push(`${hours} h`);
  if (mins > 0 && days === 0)
    parts.push(`${mins} ${plural(mins, ['minuta', 'minuty', 'minut'])}`);
  return parts.length ? parts.join(' ') : '< 1 min';
}

const hoursUntil = (date: Date) => (date.getTime() - Date.now()) / 3_600_000;

const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));

const cx = (...classes: Array<string | undefined | false>) =>
  classes.filter(Boolean).join(' ');

// =============================
// State-machine joinowania (deterministyczna)
// =============================
function computeJoinState(
  now: Date,
  start: Date,
  end: Date,
  joined: number,
  max: number,
  lockHrs = 0
) {
  const hasStarted = now >= start;
  const isOngoing = now >= start && now <= end;
  const isFull = max > 0 && joined >= max;
  const withinLock = !hasStarted && hoursUntil(start) <= lockHrs;
  const canJoin = !isFull && !hasStarted && !withinLock;

  if (isOngoing)
    return {
      canJoin,
      status: {
        label: 'Trwa teraz',
        tone: 'info' as const,
        reason: 'ONGOING' as const,
      },
      isOngoing,
      hasStarted,
      isFull,
      withinLock,
    };
  if (hasStarted)
    return {
      canJoin,
      status: {
        label: 'Rozpoczęte – dołączenie zablokowane',
        tone: 'error' as const,
        reason: 'STARTED' as const,
      },
      isOngoing,
      hasStarted,
      isFull,
      withinLock,
    };
  if (isFull)
    return {
      canJoin,
      status: {
        label: 'Brak miejsc',
        tone: 'error' as const,
        reason: 'FULL' as const,
      },
      isOngoing,
      hasStarted,
      isFull,
      withinLock,
    };
  if (withinLock) {
    const hrs = Math.max(0, Math.ceil(hoursUntil(start)));
    return {
      canJoin,
      status: {
        label: `Start za ${hrs} h – zapisy zamknięte`,
        tone: 'warn' as const,
        reason: 'LOCK' as const,
      },
      isOngoing,
      hasStarted,
      isFull,
      withinLock,
    };
  }
  return {
    canJoin,
    status: { label: 'Dostępne', tone: 'ok' as const, reason: 'OK' as const },
    isOngoing,
    hasStarted,
    isFull,
    withinLock,
  };
}

// =============================
// Prezentacyjne helpers
// =============================
const badgeToneClass = (tone: 'ok' | 'warn' | 'error' | 'info') =>
  tone === 'error'
    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
    : tone === 'warn'
      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
      : tone === 'info'
        ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300'
        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';

const progressColorClass = (active: boolean) =>
  active
    ? 'bg-neutral-900 dark:bg-white'
    : 'bg-neutral-400 dark:bg-neutral-600';

const capacityLabel = (joined: number, min: number, max: number) =>
  `${joined} / ${min}-${max} osób`;

// Małe komponenty w tym samym pliku (brak głębokiego zagnieżdżania)
function StatusBadge({
  tone,
  reason,
  label,
}: {
  tone: 'ok' | 'warn' | 'error' | 'info';
  reason?: string;
  label: string;
}) {
  return (
    <span
      className={cx(
        'text-xs px-2 py-1 rounded-full inline-flex items-center gap-1',
        badgeToneClass(tone)
      )}
      aria-live="polite"
    >
      {(reason === 'LOCK' || reason === 'STARTED') && (
        <Lock className="w-3.5 h-3.5" aria-hidden />
      )}
      {label}
    </span>
  );
}

function ProgressBar({
  value,
  active,
  labelledBy,
}: {
  value: number;
  active: boolean;
  labelledBy: string;
}) {
  return (
    <div
      className="h-1.5 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      aria-labelledby={labelledBy}
    >
      <div
        id={labelledBy}
        className={cx('h-full', progressColorClass(active))}
        style={{ width: `${value}%` }}
        aria-hidden
      />
    </div>
  );
}

function Avatar({ url, alt }: { url: string; alt: string }) {
  return (
    <img
      src={url}
      alt={alt}
      className="w-12 h-12 rounded-full object-cover border border-neutral-200 dark:border-neutral-700"
      loading="lazy"
      decoding="async"
    />
  );
}

// =============================
// Komponent główny
// =============================
export function EventCard({
  startISO,
  endISO,
  avatarUrl,
  organizerName,
  description,
  location,
  joined,
  min,
  max,
  tags = [],
  lockHoursBeforeStart = 0,
  inline = false,
  onJoin,
  className,
}: EventCardProps) {
  const start = useMemo(() => parseISO(startISO), [startISO]);
  const end = useMemo(() => parseISO(endISO, start), [endISO, start]);
  const now = new Date();

  const { canJoin, status } = useMemo(
    () => computeJoinState(now, start, end, joined, max, lockHoursBeforeStart),
    [
      now.getTime(),
      start.getTime(),
      end.getTime(),
      joined,
      max,
      lockHoursBeforeStart,
    ]
  );

  const fill = Math.min(100, Math.round((joined / Math.max(1, max)) * 100));
  const progressId = useId();

  // ============ Inline wariant ============
  if (inline) {
    return (
      <div
        className={cx(
          'flex items-center gap-4 px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 text-sm',
          className
        )}
      >
        <Avatar url={avatarUrl} alt={`Organizator: ${organizerName}`} />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate">
            {description}
          </p>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 truncate">
            {organizerName} • {formatDateRange(start, end)} •{' '}
            {humanDuration(start, end)} • {location}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge
            tone={status.tone}
            reason={status.reason}
            label={status.label}
          />
          <span className="text-xs text-neutral-600 dark:text-neutral-400">
            {capacityLabel(joined, min, max)}
          </span>
          <button
            type="button"
            disabled={!canJoin}
            onClick={canJoin ? onJoin : undefined}
            className={cx(
              'cursor-pointer px-3 py-1.5 rounded-lg text-xs font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60',
              canJoin
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 active:opacity-80'
                : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400 cursor-not-allowed'
            )}
            aria-disabled={!canJoin}
            aria-label={canJoin ? 'Dołącz' : 'Zamknięte'}
          >
            {canJoin ? 'Dołącz' : 'Zamknięte'}
          </button>
        </div>
      </div>
    );
  }

  // ============ Tile wariant ============
  return (
    <motion.div
      layout="size"
      whileHover={{ y: canJoin ? -2 : 0, scale: canJoin ? 1.01 : 1 }}
      transition={{
        type: 'spring',
        stiffness: 600,
        damping: 20,
      }}
      className={cx(
        'w-full rounded-2xl p-4 flex flex-col gap-2 shadow-sm ring-1 ring-neutral-200/70 dark:ring-neutral-800',
        canJoin
          ? 'bg-white dark:bg-neutral-900'
          : 'bg-neutral-50 dark:bg-neutral-950',
        className
      )}
      role="group"
      aria-label={`Wydarzenie: ${organizerName}`}
    >
      {/* Range + duration */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 overflow-hidden">
          <Calendar className="w-4 h-4 shrink-0" />
          <span
            className="font-medium text-neutral-800 dark:text-neutral-200 truncate whitespace-nowrap"
            title={formatDateRange(start, end)}
          >
            {formatDateRange(start, end)}
          </span>
        </div>
        <div className="shrink-0 flex items-center gap-1 text-sm text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
          <Clock className="w-4 h-4" />
          <span>{humanDuration(start, end)}</span>
        </div>
      </div>

      {/* Organizer & description + location */}
      <div className="flex items-start gap-3 mt-1 min-w-0">
        <img
          src={avatarUrl}
          alt="Organizer"
          className="w-12 h-12 rounded-full object-cover border border-neutral-200 dark:border-neutral-700 shrink-0"
        />
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate"
            title={organizerName}
          >
            {organizerName}
          </p>

          <p
            className="text-sm text-neutral-800 dark:text-neutral-200 leading-5 line-clamp-2"
            title={description}
          >
            {description}
          </p>

          <p className="flex items-center gap-1 text-xs text-neutral-600 dark:text-neutral-400 mt-1 min-w-0">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate whitespace-nowrap" title={location}>
              {location}
            </span>
          </p>
        </div>
      </div>

      {/* Capacity + status */}
      <div className="flex items-center justify-between gap-3">
        <div className="shrink-0 flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
          <Users className="w-4 h-4" aria-hidden />
          <span>{capacityLabel(joined, min, max)}</span>
        </div>
        <div className="shrink-0">
          <StatusBadge
            tone={status.tone}
            reason={status.reason}
            label={status.label}
          />
        </div>
      </div>

      {/* Progress bar */}
      <ProgressBar value={fill} active={canJoin} labelledBy={progressId} />

      {/* CTA */}
      <button
        type="button"
        disabled={!canJoin}
        onClick={canJoin ? onJoin : undefined}
        className={cx(
          'cursor-pointer w-full mt-1 text-sm font-medium px-3 py-2 rounded-xl ring-1 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60',
          canJoin
            ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 ring-neutral-900/10 dark:ring-white/10 hover:opacity-90 active:opacity-80'
            : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400 ring-transparent cursor-not-allowed'
        )}
        aria-disabled={!canJoin}
        aria-label={
          status.reason === 'ONGOING'
            ? 'Dołącz – tylko obserwacja'
            : canJoin
              ? 'Dołącz'
              : 'Zapisy zamknięte'
        }
      >
        {status.reason === 'ONGOING'
          ? 'Dołącz (tylko obserwacja)'
          : canJoin
            ? 'Dołącz'
            : 'Zapisy zamknięte'}
      </button>

      {/* tagi – mogą się łamać (to jedyny blok, który może wrapować) */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-1" aria-label="Tagi">
          {tags.slice(0, 5).map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-lg"
              title={`#${tag}`}
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// =============================
// Eksport utils (łatwe testowanie)
// =============================
export const _utils = {
  formatDateRange,
  humanDuration,
  hoursUntil,
  clamp,
  parseISO,
  plural,
  badgeToneClass,
  progressColorClass,
  capacityLabel,
  computeJoinState,
  cx,
};
