'use client';

import {
  Calendar,
  Clock,
  MapPin,
  WifiIcon,
  Users,
  Crown,
  Shield,
  User as UserIcon,
  BadgeCheck,
  X,
  Link as LinkIcon,
  Info,
  Tag as TagIcon,
  TicketIcon as CategoryIcon,
} from 'lucide-react';
import { useMemo } from 'react';
import { Modal } from '../modal/modal';
import { IntentMember } from '@/lib/graphql/__generated__/react-query-update';

export type ParticipantRole = 'OWNER' | 'MODERATOR' | 'PARTICIPANT';

type JoinStatus = {
  label: string;
  tone: 'ok' | 'warn' | 'error' | 'info';
  reason: 'OK' | 'LOCK' | 'STARTED' | 'ONGOING' | 'FULL';
};

type Props = {
  open?: boolean;
  onClose?: () => void;
  onJoin?: () => void | Promise<void>;
  data: {
    eventId?: string;
    eventTitle?: string;
    startISO: string;
    endISO: string;
    organizerName: string;
    avatarUrl: string;
    description: string;
    address?: string;
    onlineUrl?: string;
    categories: string[];
    tags: string[];
    min: number;
    max: number;
    joinedCount: number;
    verifiedAt?: string;
    status: JoinStatus;
    canJoin: boolean;
    members: IntentMember[];
  };
};

/* ───────────────────────────── Utils ───────────────────────────── */

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

const cx = (...c: Array<string | false | undefined>) =>
  c.filter(Boolean).join(' ');

function toneClasses(tone: JoinStatus['tone']) {
  switch (tone) {
    case 'ok':
      return 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:ring-emerald-800/50';
    case 'warn':
      return 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:ring-amber-800/50';
    case 'error':
      return 'bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:ring-rose-800/50';
    default:
      return 'bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-900/20 dark:text-sky-300 dark:ring-sky-800/50';
  }
}

function VerifiedPill({ verifiedAt }: { verifiedAt?: string }) {
  if (!verifiedAt) return null;
  const d = parseISO(verifiedAt);
  const text = isValidDate(d)
    ? `Zweryfikowany organizator (od ${pad2(d.getDate())} ${MONTHS_PL_SHORT[d.getMonth()]} ${d.getFullYear()})`
    : 'Zweryfikowany organizator';
  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full
                 bg-sky-50 text-sky-700 ring-1 ring-sky-200
                 dark:bg-sky-900/20 dark:text-sky-300 dark:ring-sky-800/60"
      title={text}
    >
      <BadgeCheck className="w-3.5 h-3.5" />
      Zweryfikowany
    </span>
  );
}

function RoleBadge({ role }: { role: ParticipantRole }) {
  if (role === 'OWNER') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
        <Crown className="w-3 h-3" /> Owner
      </span>
    );
  }
  if (role === 'MODERATOR') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">
        <Shield className="w-3 h-3" /> Moderator
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
      <UserIcon className="w-3 h-3" /> Uczestnik
    </span>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 p-3">
      <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
        <Icon className="w-4 h-4" />
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
        {value}
      </div>
    </div>
  );
}

/** ⬇️ Capacity bar ze zmiennym kolorem (zielony → żółty → czerwony) */
function CapacityBar({
  joinedCount,
  max,
}: {
  joinedCount: number;
  max: number;
}) {
  const pct = Math.min(100, Math.round((joinedCount / Math.max(1, max)) * 100));
  // HSL: 130° (zielony) → 0° (czerwony)
  const hue = Math.max(0, 130 - Math.round((130 * pct) / 100));
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
        <span>Zapełnienie</span>
        <span>{pct}%</span>
      </div>
      <div className="mt-1 h-2 w-full rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
        <div
          className="h-full w-0 rounded-full transition-[width,background-color] duration-500 ease-out"
          style={{
            width: `${pct}%`,
            backgroundColor: `hsl(${hue} 70% 45%)`,
          }}
        />
      </div>
    </div>
  );
}

/* ───────────────────────────── Modal ───────────────────────────── */

export function EventDetailsModal({ open, onClose, onJoin, data }: Props) {
  const {
    eventTitle,
    startISO,
    endISO,
    organizerName,
    avatarUrl,
    description,
    address,
    onlineUrl,
    categories,
    tags,
    min,
    max,
    joinedCount,
    verifiedAt,
    status,
    canJoin,
    members,
  } = data;

  const start = useMemo(() => parseISO(startISO), [startISO]);
  const end = useMemo(() => parseISO(endISO, start), [endISO, start]);

  if (!data) {
    return null;
  }

  const owners = members.filter((p) => p.role === 'OWNER');
  const mods = members.filter((p) => p.role === 'MODERATOR');
  const users = members.filter((p) => p.role === 'PARTICIPANT');

  // Tytuł: preferuj eventTitle, w innym wypadku weź 1. linię opisu (do ~80 znaków), fallback na zakres dat.
  const title =
    eventTitle?.trim() ||
    (description?.split('\n')[0] || '').slice(0, 80) ||
    `Wydarzenie • ${formatDateRange(start, end)}`;

  const header = (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        {/* Tytuł */}
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 truncate">
          {title}
        </h3>

        {/* Organizer + status + verified */}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
            <img
              src={avatarUrl}
              alt={organizerName}
              className="w-6 h-6 rounded-full object-cover border border-neutral-200 dark:border-neutral-700"
            />
            <span className="truncate">{organizerName}</span>
          </span>

          <VerifiedPill verifiedAt={verifiedAt} />

          <span
            className={cx(
              'inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ring-1',
              toneClasses(status.tone)
            )}
          >
            <Info className="w-3.5 h-3.5" />
            {status.label}
          </span>
        </div>
      </div>

      <button
        className="self-start inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
        onClick={onClose}
      >
        <X className="w-4 h-4" />
        Zamknij
      </button>
    </div>
  );

  const content = (
    <div className="space-y-6">
      {/* Statystyki i capacity */}
      <div className="rounded-3xl border border-neutral-200 dark:border-neutral-800 p-4 bg-gradient-to-br from-neutral-50 to-white dark:from-neutral-900 dark:to-neutral-900/60">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Stat
            icon={Calendar}
            label="Data"
            value={formatDateRange(start, end)}
          />
          <Stat
            icon={Clock}
            label="Czas trwania"
            value={`${Math.max(1, Math.ceil((+end - +start) / 3600000))} h`}
          />
          <Stat
            icon={Users}
            label="Uczestnicy"
            value={`${joinedCount} / ${min}-${max}`}
          />
        </div>

        <div className="mt-4">
          <CapacityBar joinedCount={joinedCount} max={max} />
        </div>
      </div>

      {/* Opis */}
      {!!description?.trim() && (
        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
            Opis
          </h3>
          <p className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap leading-6">
            {description}
          </p>
        </div>
      )}

      {/* Szczegóły (kompaktowy key–value) */}
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
          Szczegóły
        </h3>
        <dl className="grid grid-cols-1 gap-2">
          <DetailRow
            icon={<Calendar className="w-4 h-4" />}
            label="Termin"
            value={formatDateRange(start, end)}
          />
          <DetailRow
            icon={<Users className="w-4 h-4" />}
            label="Limit miejsc"
            value={`${min}-${max} osób`}
          />
          {address && (
            <DetailRow
              icon={<MapPin className="w-4 h-4" />}
              label="Lokalizacja"
              value={address}
            />
          )}
          {!address && (
            <DetailRow
              icon={<WifiIcon className="w-4 h-4" />}
              label="Tryb"
              value="Wydarzenie online"
            />
          )}
          {!!categories?.length && (
            <DetailRow
              icon={<CategoryIcon className="w-4 h-4" />}
              label="Kategorie"
              value={categories.join(', ')}
            />
          )}
          {!!tags?.length && (
            <DetailRow
              icon={<TagIcon className="w-4 h-4" />}
              label="Tagi"
              value={tags.join(', ')}
            />
          )}
          {onlineUrl && (
            <DetailRow
              icon={<LinkIcon className="w-4 h-4" />}
              label="Dostęp"
              value={
                <a
                  href={onlineUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:opacity-80"
                >
                  Otwórz link do spotkania
                </a>
              }
            />
          )}
        </dl>

        {/* Mini-mapa placeholder */}
        {address && (
          <div className="mt-3 h-40 w-full rounded-xl bg-[linear-gradient(135deg,#e5e7eb,#f5f5f5)] dark:bg-[linear-gradient(135deg,#0a0a0a,#171717)] flex items-center justify-center text-xs text-neutral-500 dark:text-neutral-400">
            Podgląd mapy
          </div>
        )}
      </div>

      {/* Uczestnicy – zawsze jedna kolumna */}
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
          Uczestnicy
        </h3>

        {!members?.length && (
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Brak uczestników.
          </p>
        )}

        {!!members?.length && (
          <div className="grid grid-cols-1 gap-6">
            <PeopleGroup title="Owner" people={owners} />
            <PeopleGroup title="Moderatorzy" people={mods} />
            <PeopleGroup title="Uczestnicy" people={users} />
          </div>
        )}
      </div>
    </div>
  );

  const footer = (
    <div className="flex items-center justify-between gap-3">
      <div className="text-xs text-neutral-500 dark:text-neutral-400">
        {status.label} • {joinedCount}/{min}-{max} osób
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onClose}
          className="px-3 py-2 text-sm rounded-xl bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
        >
          Zamknij
        </button>
        <button
          onClick={onJoin}
          disabled={!canJoin}
          className={cx(
            'px-3 py-2 text-sm rounded-xl font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60 transition',
            canJoin
              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 active:opacity-80'
              : 'bg-neutral-200 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-500 cursor-not-allowed'
          )}
          aria-disabled={!canJoin}
        >
          Dołącz
        </button>
      </div>
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      header={header}
      content={content}
      footer={footer}
    />
  );
}

/* ───────────────────────────── Pomocnicze bloki ───────────────────────────── */

function PeopleGroup({
  title,
  people,
}: {
  title: string;
  people: IntentMember[];
}) {
  if (!people?.length) {
    return (
      <div>
        <h4 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-2">
          {title}
        </h4>
        <div className="text-xs text-neutral-400 dark:text-neutral-600">—</div>
      </div>
    );
  }
  return (
    <div>
      <h4 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-2">
        {title} ({people.length})
      </h4>
      <ul className="space-y-2">
        {people.map((p) => (
          <li key={p.id} className="flex items-center gap-3">
            <img
              src={p.user.imageUrl ?? '/avatar.svg'}
              alt={p.user.name}
              className="w-8 h-8 rounded-full object-cover border border-neutral-200 dark:border-neutral-700"
              loading="lazy"
              decoding="async"
            />
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm text-neutral-800 dark:text-neutral-200 truncate">
                {p.user.name}
              </span>
              <RoleBadge role={p.role as ParticipantRole} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode | string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl px-2 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-900/40 transition">
      <div className="mt-0.5 text-neutral-500 dark:text-neutral-400">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
          {label}
        </div>
        <div className="text-sm text-neutral-800 dark:text-neutral-200 break-words">
          {value}
        </div>
      </div>
    </div>
  );
}
