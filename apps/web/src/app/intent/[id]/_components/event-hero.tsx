import type { EventDetailsData } from '@/types/event-details';
import { formatDate, formatTime } from '@/lib/utils/date-format';
import {
  MapPin,
  Calendar,
  Users,
  ShieldCheck,
  Sparkles,
  XCircle,
  Trash2,
} from 'lucide-react';
import { LevelBadge, sortLevels } from '@/components/ui/level-badge';
import { Level } from '@/lib/api/__generated__/react-query-update';
import { useMemo } from 'react';
import { VerifiedBadge } from '@/components/ui/verified-badge';

type EventHeroProps = {
  event: EventDetailsData;
};

export function EventHero({ event }: EventHeroProps) {
  const startDate = new Date(event.startISO);
  const isCanceled = !!event.canceledAt;
  const isDeleted = !!event.deletedAt;
  const isHighlighted =
    event.sponsorship?.highlightOn && event.sponsorship.status === 'ACTIVE';

  const sortedLevels = useMemo(() => sortLevels(event.levels), [event.levels]);

  return (
    <div className="relative rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/40">
      {/* Highlight Ribbon */}
      {isHighlighted && (
        <div className="absolute -right-2 -top-2 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 px-3 py-1 text-xs font-semibold text-white shadow-lg">
          <Sparkles className="inline h-4 w-4 mr-1" />
          Wyróżnione
        </div>
      )}

      {/* Canceled/Deleted Banner */}
      {isCanceled && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-red-900 dark:bg-red-950 dark:text-red-100">
          <XCircle className="h-5 w-5 flex-shrink-0" />
          <div>
            <p className="font-semibold">Wydarzenie anulowane</p>
            {event.cancelReason && (
              <p className="text-sm">{event.cancelReason}</p>
            )}
          </div>
        </div>
      )}

      {isDeleted && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-neutral-100 p-3 text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100">
          <Trash2 className="h-5 w-5 flex-shrink-0" />
          <div>
            <p className="font-semibold">Wydarzenie usunięte</p>
            {event.deleteReason && (
              <p className="text-sm">{event.deleteReason}</p>
            )}
          </div>
        </div>
      )}

      {/* Title */}
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
        {event.title}
      </h1>

      {/* Organizer */}
      <div className="mt-3 flex items-center gap-3">
        {event.organizer.avatarUrl ? (
          <img
            src={event.organizer.avatarUrl}
            alt={event.organizer.name}
            className="h-9 w-9 rounded-full border border-neutral-200 object-cover dark:border-neutral-700"
          />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-neutral-200 dark:border-neutral-700 dark:bg-neutral-700">
            <span className="text-sm font-semibold text-neutral-600 dark:text-neutral-300">
              {event.organizer.name[0]?.toUpperCase()}
            </span>
          </div>
        )}
        <div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Organizator
          </p>
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
              {event.organizer.name}
            </p>
            {event.organizer.verifiedAt && (
              <VerifiedBadge
                title="Zweryfikowany"
                size="sm"
                variant="icon"
                verifiedAt={event.organizer.verifiedAt}
              />
            )}
          </div>
        </div>
      </div>

      {/* Meta Info */}
      <div className="mt-4 flex flex-wrap gap-3 text-[13px] text-neutral-700 dark:text-neutral-300">
        {/* Date */}
        <span className="inline-flex items-center gap-1.5">
          <Calendar className="h-4 w-4 opacity-70" />
          {formatDate(startDate)} o {formatTime(startDate)}
        </span>

        <span className="opacity-30" aria-hidden>
          •
        </span>

        {/* Location */}
        {event.meetingKind !== 'ONLINE' && event.address && (
          <>
            <span className="inline-flex items-center gap-1.5 truncate">
              <MapPin className="h-4 w-4 opacity-70" />
              {event.address}
            </span>
            <span className="opacity-30" aria-hidden>
              •
            </span>
          </>
        )}

        {/* Participants */}
        <span className="inline-flex items-center gap-1.5">
          <Users className="h-4 w-4 opacity-70" />
          {event.joinedCount} / {event.max} uczestników
        </span>
      </div>

      {/* Badges */}
      <div className="mt-4 flex flex-wrap gap-2">
        {/* Join Mode Badge */}
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            event.joinMode === 'OPEN'
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
              : event.joinMode === 'REQUEST'
                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
                : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100'
          }`}
        >
          {event.joinMode === 'OPEN'
            ? 'Otwarte'
            : event.joinMode === 'REQUEST'
              ? 'Na prośbę'
              : 'Tylko zaproszenie'}
        </span>

        {/* Visibility Badge */}
        {event.visibility === 'HIDDEN' && (
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-200">
            Nieindeksowane
          </span>
        )}

        {/* Meeting Kind Badge */}
        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-100">
          {event.meetingKind === 'ONSITE'
            ? 'Stacjonarne'
            : event.meetingKind === 'ONLINE'
              ? 'Online'
              : 'Hybrydowe'}
        </span>

        {/* Levels */}
        {sortedLevels.map((level) => (
          <LevelBadge
            key={level}
            level={level as Level}
            size="md"
            variant="iconText"
          />
        ))}
      </div>
    </div>
  );
}
