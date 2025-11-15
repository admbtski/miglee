import type { EventDetailsData } from '@/types/event-details';
import { formatDate, formatTime } from '@/lib/utils/date-format';
import Link from 'next/link';
import {
  MapPin,
  Calendar,
  Users,
  Sparkles,
  XCircle,
  Trash2,
  Wifi,
  Video,
  MapPinned,
} from 'lucide-react';
import { LevelBadge, sortLevels } from '@/components/ui/level-badge';
import { PlanBadge } from '@/components/ui/plan-badge';
import { planAnimationConfig } from '@/components/ui/plan-animations';
import { Level } from '@/lib/api/__generated__/react-query-update';
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { VerifiedBadge } from '@/components/ui/verified-badge';
import { FavouriteButton } from '@/components/ui/favourite-button';

type EventHeroProps = {
  event: EventDetailsData;
};

export function EventHero({ event }: EventHeroProps) {
  const startDate = new Date(event.startISO);
  const isCanceled = !!event.canceledAt;
  const isDeleted = !!event.deletedAt;
  const isHighlighted =
    event.sponsorship?.highlightOn && event.sponsorship.status === 'ACTIVE';
  const plan = event.sponsorship?.plan;

  const sortedLevels = useMemo(
    () => sortLevels(event.levels as Level[]),
    [event.levels]
  );

  // Determine event size category
  const eventSize = useMemo(() => {
    if (event.mode === 'ONE_TO_ONE') {
      return { label: 'Indywidualne', description: 'Spotkanie indywidualne' };
    }
    if (event.max <= 2) {
      return { label: 'Indywidualne', description: 'Spotkanie indywidualne' };
    }
    if (event.max <= 10) {
      return { label: 'Kameralne', description: 'Kameralne wydarzenie' };
    }
    if (event.max <= 50) {
      return { label: 'Grupowe', description: 'Wydarzenie grupowe' };
    }
    return { label: 'Masowe', description: 'Masowe wydarzenie' };
  }, [event.mode, event.max]);

  // Check if location should be visible
  const canSeeLocation = useMemo(() => {
    if (event.meetingKind === 'ONLINE') return false;
    if (!event.address) return false;

    if (event.addressVisibility === 'PUBLIC') return true;
    if (event.addressVisibility === 'AFTER_JOIN') {
      return (
        event.userMembership?.isJoined ||
        event.userMembership?.isOwner ||
        event.userMembership?.isModerator
      );
    }
    return false; // HIDDEN
  }, [
    event.meetingKind,
    event.address,
    event.addressVisibility,
    event.userMembership,
  ]);

  return (
    <div className="relative rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/40">
      {/* Top Right Corner - Favourite Button & Plan Badge */}
      <div className="absolute -top-2 -right-2 z-10 flex items-start gap-1">
        {/* Favourite Button */}
        <FavouriteButton
          intentId={event.id}
          isFavourite={event.isFavourite ?? false}
          size="md"
        />

        {/* Plan Badge with continuous pulse animation */}
        {plan && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{
              scale: planAnimationConfig.badge.scaleRange,
              rotate: planAnimationConfig.badge.rotateRange,
            }}
            transition={{
              scale: {
                duration: planAnimationConfig.badge.duration,
                repeat: Infinity,
                repeatDelay: planAnimationConfig.badge.repeatDelay,
                ease: planAnimationConfig.badge.easing,
              },
              rotate: {
                duration: planAnimationConfig.badge.duration,
                repeat: Infinity,
                repeatDelay: planAnimationConfig.badge.repeatDelay,
                ease: planAnimationConfig.badge.easing,
              },
            }}
            whileHover={{
              scale: planAnimationConfig.badge.hoverScale,
              rotate: planAnimationConfig.badge.hoverRotateRange,
              transition: { duration: planAnimationConfig.badge.hoverDuration },
            }}
          >
            <PlanBadge plan={plan as any} size="md" variant="iconText" />
          </motion.div>
        )}
      </div>

      {/* Highlight Ribbon */}
      {isHighlighted && (
        <div className="absolute -right-2 -top-14 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 px-3 py-1 text-xs font-semibold text-white shadow-lg">
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
        <Link
          href={`/u/${event.organizer.name}`}
          className="flex-shrink-0"
          data-u-id={event.organizer.id}
        >
          {event.organizer.avatarUrl ? (
            <img
              src={event.organizer.avatarUrl}
              alt={event.organizer.displayName || event.organizer.name}
              className="h-9 w-9 rounded-full border border-neutral-200 object-cover transition-opacity hover:opacity-80 dark:border-neutral-700"
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-neutral-200 transition-opacity hover:opacity-80 dark:border-neutral-700 dark:bg-neutral-700">
              <span className="text-sm font-semibold text-neutral-600 dark:text-neutral-300">
                {(event.organizer.displayName ||
                  event.organizer.name)[0]?.toUpperCase()}
              </span>
            </div>
          )}
        </Link>
        <div className="min-w-0">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Organizator
          </p>
          <div className="flex items-center gap-1.5">
            <Link
              href={`/u/${event.organizer.name}`}
              className="text-sm font-medium text-neutral-800 transition-colors hover:text-blue-600 dark:text-neutral-200 dark:hover:text-blue-400"
            >
              {event.organizer.displayName || event.organizer.name}
            </Link>
            {event.organizer.verifiedAt && (
              <VerifiedBadge
                title="Zweryfikowany"
                size="sm"
                variant="icon"
                verifiedAt={event.organizer.verifiedAt}
              />
            )}
          </div>
          <Link
            href={`/u/${event.organizer.name}`}
            className="text-xs text-neutral-500 transition-colors hover:text-blue-600 dark:text-neutral-400 dark:hover:text-blue-400"
          >
            @{event.organizer.name}
          </Link>
        </div>
      </div>

      {/* Meta Info */}
      <div className="mt-4 space-y-2">
        {/* Primary Info Row */}
        <div className="flex flex-wrap gap-3 text-[13px] text-neutral-700 dark:text-neutral-300">
          {/* Date */}
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-4 w-4 opacity-70" />
            {formatDate(startDate)} o {formatTime(startDate)}
          </span>

          <span className="opacity-30" aria-hidden>
            •
          </span>

          {/* Participants with size indicator */}
          <span
            className="inline-flex items-center gap-1.5"
            title={eventSize.description}
          >
            <Users className="h-4 w-4 opacity-70" />
            {event.joinedCount} / {event.max} uczestników
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
              ({eventSize.label})
            </span>
          </span>
        </div>

        {/* Location & Online Info Row */}
        <div className="flex flex-wrap gap-3 text-[13px]">
          {/* Physical Location - only if visible */}
          {canSeeLocation && (
            <span className="inline-flex items-center gap-1.5 text-neutral-700 dark:text-neutral-300">
              <MapPinned className="h-4 w-4 opacity-70 text-blue-600 dark:text-blue-400" />
              <span className="truncate max-w-[300px]">{event.address}</span>
            </span>
          )}

          {/* Hidden location indicator */}
          {!canSeeLocation &&
            event.meetingKind !== 'ONLINE' &&
            event.address && (
              <span className="inline-flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400">
                <MapPin className="h-4 w-4 opacity-70" />
                <span className="text-xs">
                  Lokalizacja{' '}
                  {event.addressVisibility === 'AFTER_JOIN'
                    ? 'widoczna po dołączeniu'
                    : 'ukryta'}
                </span>
              </span>
            )}

          {/* Online Meeting Info */}
          {(event.meetingKind === 'ONLINE' ||
            event.meetingKind === 'HYBRID') && (
            <>
              {canSeeLocation && event.meetingKind === 'HYBRID' && (
                <span className="opacity-30" aria-hidden>
                  •
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 text-green-700 dark:text-green-400">
                {event.meetingKind === 'ONLINE' ? (
                  <Video className="h-4 w-4" />
                ) : (
                  <Wifi className="h-4 w-4" />
                )}
                <span className="font-medium">
                  {event.meetingKind === 'ONLINE'
                    ? 'Spotkanie online'
                    : 'Dostępne online'}
                </span>
              </span>
            </>
          )}
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
