// EventDetailsModal.tsx
'use client';

import Link from 'next/link';
import { Modal } from '@/components/feedback/modal';
import {
  CapacityProgressBar,
  getPct,
} from '@/components/ui/capacity-progress-bar';
import {
  InlineCategoryPills,
  InlineTagPills,
} from '@/components/ui/inline-category-tag-pill';
import { LevelBadge, sortLevels } from '@/components/ui/level-badge';
import { PlanBadge } from '@/components/ui/plan-badge';
import { RoleBadge } from '@/components/ui/role-badge';
import {
  StatusBadge,
  type JoinReason,
  type JoinTone,
} from '@/components/ui/status-badge';
import { VerifiedBadge } from '@/components/ui/verified-badge';
import {
  AddressVisibility,
  IntentMember,
  IntentMemberRole,
  Level,
  MembersVisibility,
} from '@/lib/api/__generated__/react-query-update';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import {
  Calendar,
  CalendarDays,
  Clock,
  ClockFading,
  Gauge,
  Info,
  Link as LinkIcon,
  ListChecks,
  Lock,
  MapPin,
  Rocket,
  Share2,
  Shield,
  Sprout,
  UserPlus,
  Users,
  Video,
  X,
} from 'lucide-react';
import { useMemo } from 'react';
import { twMerge } from 'tailwind-merge';

import { planTheme, type Plan } from '@/components/ui/plan-theme';
import { EventCountdownPill } from './event-countdown-pill';

/* ───────────────────────────── Typy ───────────────────────────── */

type JoinStatus = {
  label: string;
  tone: JoinTone;
  reason: JoinReason;
};

type Props = {
  open?: boolean;
  onClose?: () => void;
  onJoin?: () => void | Promise<void>;

  detailsHref?: string;

  data: {
    eventId?: string;
    title: string;
    startISO: string;
    endISO: string;
    organizerName: string;
    avatarUrl: string;
    description: string;
    address?: string;
    onlineUrl?: string;
    categories: string[];
    tags: string[];
    levels?: Level[];
    min: number;
    max: number;
    joinedCount: number;
    verifiedAt?: string;
    status: JoinStatus;
    canJoin: boolean;
    membersVisibility: MembersVisibility;
    members?: IntentMember[];
    addressVisibility: AddressVisibility;
    plan?: Plan;
    showSponsoredBadge?: boolean;
    // Join window settings
    joinOpensMinutesBeforeStart?: number | null;
    joinCutoffMinutesBeforeStart?: number | null;
    allowJoinLate?: boolean;
    lateJoinCutoffMinutesAfterStart?: number | null;
    joinManuallyClosed?: boolean;
    joinManuallyClosedAt?: string | null;
    joinManualCloseReason?: string | null;
    isDeleted?: boolean;
    isCanceled?: boolean;
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
    `${pad2(d.getDate())} ${MONTHS_PL_SHORT[d.getMonth()]}, ${pad2(
      d.getHours()
    )}:${pad2(d.getMinutes())}`;

  return sameDay
    ? `${fmt(start)} – ${pad2(end.getHours())}:${pad2(end.getMinutes())}`
    : `${fmt(start)} – ${fmt(end)}`;
}

function humanDuration(start: Date, end: Date) {
  const ms = Math.max(0, end.getTime() - start.getTime());
  const total = Math.round(ms / 60000);
  const days = Math.floor(total / (60 * 24));
  const hours = Math.floor((total - days * 24 * 60) / 60);
  const mins = total % 60;
  const parts: string[] = [];
  if (days > 0) parts.push(`${days} ${days === 1 ? 'dzień' : 'dni'}`);
  if (hours > 0) parts.push(`${hours} h`);
  if (mins > 0 && days === 0) parts.push(`${mins} min`);
  return parts.length ? parts.join(' ') : '< 1 min';
}

function meetingKind(address?: string, onlineUrl?: string) {
  if (address && onlineUrl) return { label: 'Hybrydowe', icon: Video };
  if (address) return { label: 'Stacjonarne', icon: MapPin };
  if (onlineUrl) return { label: 'Online', icon: Video };
  return { label: 'Rodzaj wydarzenia', icon: Shield };
}

function normalizeAddressVisibility(
  av: AddressVisibility
): 'PUBLIC' | 'AFTER_JOIN' | 'HIDDEN' {
  const s = String(av).toUpperCase();
  if (s.includes('PUBLIC')) return 'PUBLIC';
  if (s.includes('AFTER_JOIN')) return 'AFTER_JOIN';
  return 'HIDDEN';
}

function normalizeMembersVisibility(
  mv: MembersVisibility
): 'PUBLIC' | 'AFTER_JOIN' | 'HIDDEN' {
  const s = String(mv).toUpperCase();
  if (s.includes('PUBLIC')) return 'PUBLIC';
  if (s.includes('AFTER_JOIN')) return 'AFTER_JOIN';
  return 'HIDDEN';
}

const LEVEL_LABEL: Record<Level, string> = {
  [Level.Beginner]: 'Beginner',
  [Level.Intermediate]: 'Intermediate',
  [Level.Advanced]: 'Advanced',
};

/* ───────────────────────────── Komponenty atomowe ───────────────────────────── */

function Stat({
  icon: Icon,
  label,
  value,
  title,
  plan,
}: {
  icon: any;
  label: string;
  value: string;
  title?: string;
  plan?: Plan;
}) {
  return (
    <div
      className="relative rounded-2xl border border-neutral-200 dark:border-neutral-800 p-3 bg-white/70 dark:bg-neutral-900/40"
      title={title}
    >
      <div className="relative z-20 flex items-center gap-2 text-md text-neutral-500 dark:text-neutral-400">
        <Icon className="w-5 h-5" />
        {label}
      </div>
      <div className="relative z-20 mt-1 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
        {value}
      </div>
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
        <div className="text-md font-medium text-neutral-500 dark:text-neutral-400">
          {label}
        </div>
        <div className="text-lg text-neutral-800 dark:text-neutral-200 break-words">
          {value}
        </div>
      </div>
    </div>
  );
}

function MetaInfoSection({
  statusLabel,
  joinedCount,
  min,
  max,
  mk,
  av,
  mv,
  className,
  plan,
}: {
  statusLabel: string;
  joinedCount: number;
  min: number;
  max: number;
  mk: { label: string; icon: React.ComponentType<{ className?: string }> };
  av: 'PUBLIC' | 'AFTER_JOIN' | 'HIDDEN';
  mv: 'PUBLIC' | 'AFTER_JOIN' | 'HIDDEN';
  className?: string;
  plan?: Plan;
}) {
  return (
    <section
      className={clsx(
        'relative rounded-2xl border border-neutral-200 dark:border-neutral-800 p-3',
        className
      )}
    >
      <div className="relative z-20 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-[13px] text-neutral-700 dark:text-neutral-300 min-w-0">
        {/* ───────── Status + zajętość ───────── */}
        <span className="inline-flex items-center gap-1 truncate">
          <Info className="w-4 h-4 opacity-70" />
          {statusLabel} • {joinedCount}/{min}-{max} osób
        </span>

        <span className="opacity-30" aria-hidden>
          •
        </span>

        {/* ───────── Typ spotkania ───────── */}
        <span className="inline-flex items-center gap-1 truncate">
          <mk.icon className="w-4 h-4 opacity-70" />
          {mk.label}
        </span>

        <span className="opacity-30" aria-hidden>
          •
        </span>

        {/* ───────── Widoczność adresu ───────── */}
        <span className="inline-flex items-center gap-1 truncate">
          <MapPin className="w-4 h-4 opacity-70" />
          {av === 'PUBLIC'
            ? 'Adres publiczny'
            : av === 'AFTER_JOIN'
              ? 'Adres po dołączeniu'
              : 'Adres ukryty'}
        </span>

        <span className="opacity-30" aria-hidden>
          •
        </span>

        {/* ───────── Widoczność listy uczestników ───────── */}
        <span className="inline-flex items-center gap-1 truncate">
          <Users className="w-4 h-4 opacity-70" />
          {mv === 'PUBLIC'
            ? 'Lista publiczna'
            : mv === 'AFTER_JOIN'
              ? 'Lista po dołączeniu'
              : 'Lista ukryta'}
        </span>

        <span className="opacity-30" aria-hidden>
          •
        </span>

        {/* ───────── Szybkie podsumowanie terminu ───────── */}
        <span className="inline-flex items-center gap-1 truncate">
          <CalendarDays className="w-4 h-4 opacity-70" />
          {min}-{max} osób maksymalnie
        </span>

        <span className="opacity-30" aria-hidden>
          •
        </span>

        {/* ───────── Symboliczna lista / struktura ───────── */}
        <span className="inline-flex items-center gap-1 truncate">
          <ListChecks className="w-4 h-4 opacity-70" />
          Zasady uczestnictwa
        </span>
      </div>
    </section>
  );
}

function PeopleInline({
  members,
  max = 6,
}: {
  members: IntentMember[];
  max?: number;
}) {
  if (!members?.length) return null;
  const shown = members.slice(0, max);
  const rest = Math.max(0, members.length - shown.length);
  return (
    <div className="flex items-center -space-x-2">
      {shown.map((m) => {
        const displayName = (m.user as any).profile?.displayName || m.user.name;
        const profileUrl = `/u/${m.user.name}`;

        return (
          <Link key={m.id} href={profileUrl}>
            <img
              src={m.user.imageUrl ?? '/avatar.svg'}
              alt={displayName}
              className="w-10 h-10 rounded-full border border-white dark:border-neutral-900 object-cover transition-opacity hover:opacity-80"
              loading="lazy"
              decoding="async"
              title={displayName}
            />
          </Link>
        );
      })}
      {rest > 0 && (
        <div
          title={`+${rest} więcej`}
          className="w-10 h-10 rounded-full border border-white dark:border-neutral-900 bg-neutral-200 dark:bg-neutral-700 text-[11px] flex items-center justify-center font-medium text-neutral-700 dark:text-neutral-200"
        >
          +{rest}
        </div>
      )}
    </div>
  );
}

/* ───────────────────────────── Component ───────────────────────────── */

export function EventDetailsModal({
  open,
  onClose,
  onJoin,
  detailsHref,
  data,
}: Props) {
  if (!data) return null;

  const {
    eventId,
    title,
    startISO,
    endISO,
    organizerName,
    avatarUrl,
    description,
    address,
    onlineUrl,
    categories,
    tags,
    levels = [],
    min,
    max,
    joinedCount,
    verifiedAt,
    status,
    canJoin,
    members = [],
    membersVisibility,
    addressVisibility,
    plan = 'default',
    showSponsoredBadge = true,
    joinOpensMinutesBeforeStart,
    joinCutoffMinutesBeforeStart,
    allowJoinLate,
    lateJoinCutoffMinutesAfterStart,
    joinManuallyClosed,
    joinManuallyClosedAt,
    joinManualCloseReason,
    isDeleted,
    isCanceled,
  } = data;

  const theme = planTheme(plan);

  const start = useMemo(() => parseISO(startISO), [startISO]);
  const end = useMemo(() => parseISO(endISO, start), [endISO, start]);
  const sortedLevels = useMemo(() => sortLevels(levels), [levels]);

  const mv = normalizeMembersVisibility(membersVisibility);
  const av = normalizeAddressVisibility(addressVisibility);

  const owners = members.filter((p) => p.role === IntentMemberRole.Owner);
  const mods = members.filter((p) => p.role === IntentMemberRole.Moderator);
  const users = members.filter((p) => p.role === IntentMemberRole.Participant);

  const mk = meetingKind(address, onlineUrl);

  const pct = getPct({ joinedCount, max });

  const ctaDisabled = !canJoin;
  const ctaLabel = ctaDisabled ? 'Niedostępne' : 'Dołącz';

  // ⬇️ Nawigacja do detalu
  const computedHref =
    detailsHref ??
    (eventId ? `/intent/${encodeURIComponent(eventId)}` : undefined);

  // Nagłówek — mocniejszy gradient per plan + subtelna siatka
  const header = (
    <div className="relative z-40 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h3
          className={
            'text-2xl font-bold text-neutral-900 dark:text-neutral-50 truncate'
          }
        >
          {title}
        </h3>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 text-md text-neutral-700 dark:text-neutral-300">
            <Link href={`/u/${organizerName}`} className="flex-shrink-0">
              <img
                src={avatarUrl}
                alt={organizerName}
                className="w-9 h-9 rounded-full object-cover border border-neutral-200 transition-opacity hover:opacity-80 dark:border-neutral-700"
              />
            </Link>
            <Link
              href={`/u/${organizerName}`}
              className="truncate transition-colors hover:text-blue-600 dark:hover:text-blue-400"
            >
              {organizerName}
            </Link>
          </span>

          <VerifiedBadge variant="iconText" size="md" verifiedAt={verifiedAt} />

          <StatusBadge
            variant="iconText"
            tone={status.tone}
            label={status.label}
          />

          {showSponsoredBadge && plan && plan !== 'default' && (
            <PlanBadge plan={plan} variant="iconText" />
          )}

          {/* Countdown Timer Pill */}
          <EventCountdownPill
            isDeleted={isDeleted}
            isCanceled={isCanceled}
            startAt={start}
            endAt={end}
            joinOpensMinutesBeforeStart={joinOpensMinutesBeforeStart}
            joinCutoffMinutesBeforeStart={joinCutoffMinutesBeforeStart}
            allowJoinLate={allowJoinLate}
            lateJoinCutoffMinutesAfterStart={lateJoinCutoffMinutesAfterStart}
            joinManuallyClosed={joinManuallyClosed}
          />
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {!!onlineUrl && (
          <button
            onClick={() => {
              navigator.clipboard?.writeText(onlineUrl).catch(() => {});
            }}
            className="inline-flex items-center gap-1 px-2 py-1 text-sm rounded-lg bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
            title="Skopiuj link do spotkania"
          >
            <Share2 className="w-4 h-4" />
            Kopiuj link
          </button>
        )}
        <button
          className="inline-flex items-center gap-1 px-2 py-1 text-sm rounded-lg bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
          onClick={onClose}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  // Wrapper sekcji z tintem planu
  const Section: React.FC<{
    title?: string;
    className?: string;
    children: React.ReactNode;
  }> = ({ title, className, children }) => (
    <section
      className={clsx(
        theme.sectionBg,
        'relative rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4',
        className
      )}
    >
      {title && (
        <h3 className="relative z-20 text-md font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
          {title}
        </h3>
      )}
      <div className="relative z-20">{children}</div>
    </section>
  );

  // Treść
  const content = (
    <div className="space-y-6">
      {/* Statystyki */}
      <div
        className={clsx(
          'rounded-2xl border border-neutral-200 dark:border-neutral-800 p-3',
          theme.sectionBg
        )}
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Stat
            icon={Calendar}
            label="Termin"
            value={formatDateRange(start, end)}
            plan={plan}
          />
          <Stat
            icon={Clock}
            label="Czas trwania"
            value={humanDuration(start, end)}
            plan={plan}
          />
          <Stat
            icon={mk.icon}
            label="Rodzaj"
            value={
              av === 'PUBLIC'
                ? mk.label
                : mk.label +
                  (av === 'AFTER_JOIN'
                    ? ' • adres po dołączeniu'
                    : ' • adres ukryty')
            }
            title={address}
            plan={plan}
          />
        </div>
      </div>

      {/* Capacity */}
      <Section title="Capacity">
        <div className="flex flex-col gap-3">
          <div className="text-md text-neutral-700 dark:text-neutral-300">
            <span className="font-medium">{joinedCount}</span> zajętych miejsc z{' '}
            <span className="font-medium">{max}</span>
          </div>

          <div className="w-full">
            <div className="flex items-center justify-between text-sm text-neutral-500 dark:text-neutral-400">
              <span>Zapełnienie</span>
              <span>{pct}%</span>
            </div>

            <div className="mt-1">
              <CapacityProgressBar joinedCount={joinedCount} max={max} />
            </div>
          </div>

          {members?.length > 0 && mv === 'PUBLIC' && (
            <div className="flex items-center justify-between">
              <PeopleInline members={members} />
              <div className="text-sm text-neutral-500 dark:text-neutral-400">
                Min: {min} • Max: {max}
              </div>
            </div>
          )}

          {mv === 'AFTER_JOIN' && (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Lista uczestników będzie widoczna po dołączeniu.
            </p>
          )}
          {mv === 'HIDDEN' && (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Lista uczestników jest ukryta przez organizatora.
            </p>
          )}
        </div>
      </Section>

      {/* Poziomy + kategorie/tagi */}
      {(levels.length || categories.length || tags.length) && (
        <Section title="Kontekst">
          <div className="flex flex-wrap items-start gap-2">
            {sortedLevels.map((lv) => (
              <LevelBadge
                key={lv}
                level={lv}
                size="lg"
                variant="iconText"
                title={LEVEL_LABEL[lv]}
              />
            ))}
            {categories.length ? (
              <InlineCategoryPills size="lg" items={categories} />
            ) : null}
            {tags.length ? <InlineTagPills size="lg" items={tags} /> : null}
          </div>
        </Section>
      )}

      {/* Opis */}
      {!!description?.trim() && (
        <Section title="Opis">
          <p className="text-md text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap leading-6">
            {description}
          </p>
        </Section>
      )}

      {/* Szczegóły */}
      <Section title="Szczegóły">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <dl className="grid grid-cols-1 gap-2">
              <DetailRow
                icon={<Calendar className="w-5 h-5" />}
                label="Termin"
                value={formatDateRange(start, end)}
              />
              <DetailRow
                icon={<Users className="w-5 h-5" />}
                label="Limit miejsc"
                value={`${min}-${max} osób`}
              />
              {/* Adres / Online z respektowaniem addressVisibility */}
              {address && (
                <DetailRow
                  icon={<MapPin className="w-5 h-5" />}
                  label="Lokalizacja"
                  value={
                    av === 'PUBLIC'
                      ? address
                      : av === 'AFTER_JOIN'
                        ? 'Adres widoczny po dołączeniu'
                        : 'Adres ukryty'
                  }
                />
              )}
              {!address && onlineUrl && (
                <DetailRow
                  icon={<Video className="w-5 h-5" />}
                  label="Tryb"
                  value="Wydarzenie online"
                />
              )}
              {!!onlineUrl && (
                <DetailRow
                  icon={<LinkIcon className="w-5 h-5" />}
                  label="Dostęp online"
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
              <DetailRow
                icon={<Shield className="w-5 h-5" />}
                label="Organizator"
                value={
                  <Link
                    href={`/u/${organizerName}`}
                    className="inline-flex items-center gap-2 transition-colors hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    <img
                      src={avatarUrl}
                      alt={organizerName}
                      className="w-5 h-5 rounded-full object-cover border border-neutral-200 dark:border-neutral-700"
                    />
                    {organizerName}
                  </Link>
                }
              />
            </dl>
          </div>

          <div className="flex flex-col gap-3">
            {/* Mapa (placeholder) tylko gdy mamy adres i wolno go pokazać */}
            {address && av === 'PUBLIC' && (
              <div className="h-36 w-full rounded-xl bg-[linear-gradient(135deg,#e5e7eb,#f5f5f5)] dark:bg-[linear-gradient(135deg,#0a0a0a,#171717)] flex items-center justify-center text-sm text-neutral-500 dark:text-neutral-400">
                Podgląd mapy
              </div>
            )}
            {address && av !== 'PUBLIC' && (
              <div className="h-36 w-full rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 text-sm text-neutral-500 dark:text-neutral-400 grid place-items-center">
                Adres niepubliczny
              </div>
            )}
          </div>
        </div>
      </Section>

      {/* Join Window Settings */}
      {(joinOpensMinutesBeforeStart ||
        joinCutoffMinutesBeforeStart ||
        allowJoinLate ||
        lateJoinCutoffMinutesAfterStart ||
        joinManuallyClosed) && (
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4 dark:border-indigo-800 dark:bg-indigo-900/20">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">
            <Gauge className="h-4 w-4" />
            Ustawienia zapisów
          </div>
          <div className="space-y-2 text-sm text-indigo-900 dark:text-indigo-100">
            {joinOpensMinutesBeforeStart && (
              <div className="flex items-start gap-2">
                <Sprout className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>
                  Zapisy otwierają się{' '}
                  <strong className="font-semibold tabular-nums">
                    {joinOpensMinutesBeforeStart} min
                  </strong>{' '}
                  przed startem
                </span>
              </div>
            )}
            {joinCutoffMinutesBeforeStart && (
              <div className="flex items-start gap-2">
                <Rocket className="mt-0.5 h-4 w-4 flex-shrink-0 text-orange-600 dark:text-orange-400" />
                <span>
                  Zapisy zamykają się{' '}
                  <strong className="font-semibold tabular-nums">
                    {joinCutoffMinutesBeforeStart} min
                  </strong>{' '}
                  przed startem
                </span>
              </div>
            )}
            {allowJoinLate ? (
              <div className="flex items-start gap-2">
                <ClockFading className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-600 dark:text-rose-400" />
                <span>
                  Można dołączyć po starcie
                  {lateJoinCutoffMinutesAfterStart && (
                    <>
                      {' '}
                      (do{' '}
                      <strong className="font-semibold tabular-nums">
                        {lateJoinCutoffMinutesAfterStart} min
                      </strong>{' '}
                      po starcie)
                    </>
                  )}
                </span>
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <ClockFading className="mt-0.5 h-4 w-4 flex-shrink-0 text-zinc-500 dark:text-zinc-400" />
                <span className="text-indigo-700 dark:text-indigo-300">
                  Brak możliwości dołączenia po starcie
                </span>
              </div>
            )}
            {joinManuallyClosed && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-100/50 p-2 dark:border-amber-700 dark:bg-amber-900/30">
                <Lock className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-700 dark:text-amber-400" />
                <div>
                  <div className="font-semibold text-amber-900 dark:text-amber-200">
                    Zapisy ręcznie zamknięte
                  </div>
                  {joinManualCloseReason && (
                    <div className="mt-1 text-xs text-amber-800 dark:text-amber-300">
                      {joinManualCloseReason}
                    </div>
                  )}
                  {joinManuallyClosedAt && (
                    <div className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                      {new Date(joinManuallyClosedAt).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Uczestnicy */}
      <Section title="Uczestnicy">
        {mv === 'HIDDEN' && (
          <p className="text-md text-neutral-600 dark:text-neutral-400">
            Lista uczestników jest ukryta przez organizatora.
          </p>
        )}
        {mv === 'AFTER_JOIN' && (
          <p className="text-md text-neutral-600 dark:text-neutral-400">
            Lista uczestników będzie widoczna po dołączeniu.
          </p>
        )}

        {mv === 'PUBLIC' && !members?.length && (
          <p className="text-md text-neutral-600 dark:text-neutral-400">
            Brak uczestników.
          </p>
        )}

        {mv === 'PUBLIC' && !!members?.length && (
          <div className="grid grid-cols-1 gap-6">
            <PeopleGroup title="Owner" people={owners} />
            <PeopleGroup title="Moderatorzy" people={mods} />
            <PeopleGroup title="Uczestnicy" people={users} />
          </div>
        )}
      </Section>

      <MetaInfoSection
        className={theme.sectionBg}
        statusLabel={status.label}
        joinedCount={joinedCount}
        min={min}
        max={max}
        mk={mk}
        av={av}
        mv={mv}
        plan={plan}
      />
    </div>
  );

  const footer = (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm text-neutral-500 dark:text-neutral-400">
        {status.label} • {joinedCount}/{min}-{max} osób
      </div>

      <div className="flex w-full sm:w-auto items-stretch sm:items-center gap-2">
        {/* Secondary: Szczegóły */}
        <a
          href={computedHref ?? undefined}
          className={clsx(
            'inline-flex items-center justify-center gap-2 h-10 rounded-xl px-3 text-md transition outline-none',
            'ring-1 ring-neutral-200 dark:ring-neutral-800',
            computedHref
              ? 'bg-neutral-50 text-neutral-800 hover:bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700'
              : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800/80 dark:text-neutral-500 cursor-not-allowed'
          )}
          aria-disabled={!computedHref}
          title={
            computedHref ? 'Przejdź do szczegółów' : 'Brak adresu szczegółu'
          }
        >
          <Info className="w-4 h-4" />
          Szczegóły
        </a>

        {/* Separator tylko na desktopie */}
        <span
          aria-hidden
          className="hidden sm:block h-6 w-px bg-neutral-200 dark:bg-neutral-800 mx-1"
        />

        {/* Tertiary: Zamknij */}
        <button
          onClick={onClose}
          className={clsx(
            'inline-flex items-center justify-center gap-2 h-10 rounded-xl px-3 text-md transition outline-none',
            'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800',
            'focus-visible:ring-2 focus-visible:ring-sky-500/60'
          )}
        >
          <X className="w-4 h-4" />
          Zamknij
        </button>

        {/* Primary: Dołącz */}
        <button
          onClick={onJoin}
          disabled={ctaDisabled}
          className={clsx(
            'inline-flex items-center justify-center gap-2 h-10 rounded-xl px-4 text-md font-medium transition outline-none',
            'focus-visible:ring-2 focus-visible:ring-sky-500/60',
            !ctaDisabled
              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 active:opacity-80'
              : 'bg-neutral-200 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-500 cursor-not-allowed'
          )}
          aria-disabled={ctaDisabled}
        >
          <UserPlus className="w-4 h-4" />
          {ctaLabel}
        </button>
      </div>
    </div>
  );

  return (
    <Modal
      className={twMerge(theme.glow, 'backdrop-blur-[2px]')}
      headerClassName={theme.headerBg}
      density="compact"
      size="lg"
      open={open}
      onClose={onClose}
      header={header}
      content={content}
      footer={footer}
    />
  );
}

/* ───────────────────────────── Helpers ───────────────────────────── */

function PeopleGroup({
  title,
  people,
}: {
  title: string;
  people: IntentMember[];
}) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 mb-2">
        {title} {people?.length ? `(${people.length})` : ''}
      </h4>

      {!people?.length ? (
        <div className="text-sm text-neutral-400 dark:text-neutral-600">
          Brak
        </div>
      ) : (
        <ul className="space-y-3">
          {people.map((p) => {
            const displayName =
              (p.user as any).profile?.displayName || p.user.name;
            const profileUrl = `/u/${p.user.name}`;

            return (
              <li key={p.id} className="flex items-center gap-3">
                <Link href={profileUrl} className="flex-shrink-0">
                  <img
                    src={p.user.imageUrl ?? '/avatar.svg'}
                    alt={displayName}
                    className="w-11 h-11 rounded-full object-cover border border-neutral-200 transition-opacity hover:opacity-80 dark:border-neutral-700"
                    loading="lazy"
                    decoding="async"
                  />
                </Link>
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <Link
                      href={profileUrl}
                      className="text-md font-medium text-neutral-800 transition-colors hover:text-blue-600 dark:text-neutral-200 dark:hover:text-blue-400 truncate"
                    >
                      {displayName}
                    </Link>
                    <Link
                      href={profileUrl}
                      className="text-xs text-neutral-500 transition-colors hover:text-blue-600 dark:text-neutral-400 dark:hover:text-blue-400 truncate"
                    >
                      @{p.user.name}
                    </Link>
                  </div>
                  <RoleBadge role={p.role} size="md" />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
