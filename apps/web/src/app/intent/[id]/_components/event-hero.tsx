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

type EventHeroProps = {
  event: EventDetailsData;
};

export function EventHero({ event }: EventHeroProps) {
  const startDate = new Date(event.startISO);
  const isCanceled = !!event.canceledAt;
  const isDeleted = !!event.deletedAt;
  const isHighlighted =
    event.sponsorship?.highlightOn && event.sponsorship.status === 'ACTIVE';

  return (
    <div className="relative rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-800">
      {/* Highlight Ribbon */}
      {isHighlighted && (
        <div className="absolute -right-2 -top-2 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 px-3 py-1 text-xs font-semibold text-white shadow-lg">
          <Sparkles className="inline h-4 w-4 mr-1" />
          Wyróżnione
        </div>
      )}

      {/* Canceled/Deleted Banner */}
      {isCanceled && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-red-900 dark:bg-red-950 dark:text-red-100">
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
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-gray-100 p-3 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
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
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
        {event.title}
      </h1>

      {/* Organizer */}
      <div className="mt-4 flex items-center gap-3">
        {event.organizer.avatarUrl ? (
          <img
            src={event.organizer.avatarUrl}
            alt={event.organizer.name}
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
            <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
              {event.organizer.name[0]?.toUpperCase()}
            </span>
          </div>
        )}
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Organizator
          </p>
          <div className="flex items-center gap-1">
            <p className="font-medium text-gray-900 dark:text-gray-100">
              {event.organizer.name}
            </p>
            {event.organizer.verifiedAt && (
              <ShieldCheck
                className="h-4 w-4 text-blue-500"
                title="Zweryfikowany"
              />
            )}
          </div>
        </div>
      </div>

      {/* Meta Info */}
      <div className="mt-6 flex flex-wrap gap-4">
        {/* Date */}
        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
          <Calendar className="h-5 w-5" />
          <span className="text-sm">
            {formatDate(startDate)} o {formatTime(startDate)}
          </span>
        </div>

        {/* Location */}
        {event.meetingKind !== 'ONLINE' && event.address && (
          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <MapPin className="h-5 w-5" />
            <span className="text-sm">{event.address}</span>
          </div>
        )}

        {/* Participants */}
        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
          <Users className="h-5 w-5" />
          <span className="text-sm">
            {event.joinedCount} / {event.max} uczestników
          </span>
        </div>
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
        {event.levels.map((level) => (
          <span
            key={level}
            className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-800 dark:bg-indigo-900 dark:text-indigo-100"
          >
            {level === 'BEGINNER'
              ? 'Początkujący'
              : level === 'INTERMEDIATE'
                ? 'Średniozaawansowany'
                : 'Zaawansowany'}
          </span>
        ))}
      </div>
    </div>
  );
}
