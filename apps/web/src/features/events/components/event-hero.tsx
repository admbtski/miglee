'use client';

import { BlurHashImage } from '@/components/ui/blurhash-image';
import { LevelBadge, sortLevels } from '@/components/ui/level-badge';
import { VerifiedBadge } from '@/components/ui/verified-badge';
import { Level } from '@/lib/api/__generated__/react-query-update';
import { buildAvatarUrl } from '@/lib/media/url';
import { formatDate, formatTime } from '@/features/events';
import type { EventDetailsData } from '@/features/events';
import { formatParticipantsShort } from '@/features/events';
import {
  Calendar,
  MapPin,
  MapPinned,
  Trash2,
  Users,
  Video,
  Wifi,
  XCircle,
  Sparkles,
  Clock,
} from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState, useEffect } from 'react';

type EventHeroProps = {
  event: EventDetailsData;
};

export function EventHero({ event }: EventHeroProps) {
  const startDate = new Date(event.startISO);
  const isCanceled = !!event.canceledAt;
  const isDeleted = !!event.deletedAt;

  // Check if boost is active (within 24 hours)
  const isBoosted = useMemo(() => {
    if (!event.boostedAt) return false;
    const boostedTime = new Date(event.boostedAt).getTime();
    const now = Date.now();
    const elapsed = now - boostedTime;
    return elapsed < 24 * 60 * 60 * 1000; // 24 hours in ms
  }, [event.boostedAt]);

  // Calculate remaining time for boost (24h countdown)
  const [boostTimeLeft, setBoostTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!event.boostedAt || !isBoosted) {
      setBoostTimeLeft(null);
      return;
    }

    const updateTimeLeft = () => {
      const boostedTime = new Date(event.boostedAt!).getTime();
      const now = Date.now();
      const elapsed = now - boostedTime;
      const remaining = 24 * 60 * 60 * 1000 - elapsed; // 24 hours in ms

      if (remaining <= 0) {
        setBoostTimeLeft(null);
      } else {
        setBoostTimeLeft(remaining);
      }
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [event.boostedAt, isBoosted]);

  // Format remaining time for display
  const formatTimeLeft = (ms: number): string => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const sortedLevels = useMemo(
    () => sortLevels(event.levels as Level[]),
    [event.levels]
  );

  // Determine event size category
  const eventSize = useMemo(() => {
    if (event.mode === 'ONE_TO_ONE') {
      return { label: 'Indywidualne', description: 'Spotkanie indywidualne' };
    }
    if (event.max === null || event.max === undefined) {
      return { label: 'Bez limitu', description: 'Wydarzenie bez limitu' };
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
    <div className="relative rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40 transition-all duration-300">
      {/* Canceled/Deleted Banner */}
      {isCanceled && (
        <div className="flex items-center gap-2 p-3 mb-4 text-red-900 rounded-xl bg-red-50 dark:bg-red-950 dark:text-red-100">
          <XCircle className="flex-shrink-0 w-5 h-5" />
          <div>
            <p className="font-semibold">Wydarzenie anulowane</p>
            {event.cancelReason && (
              <p className="text-sm">{event.cancelReason}</p>
            )}
          </div>
        </div>
      )}

      {isDeleted && (
        <div className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-zinc-100 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
          <Trash2 className="flex-shrink-0 w-5 h-5" />
          <div>
            <p className="font-semibold">Wydarzenie usunięte</p>
            {event.deleteReason && (
              <p className="text-sm">{event.deleteReason}</p>
            )}
          </div>
        </div>
      )}

      {/* Promoted Badge with Countdown */}
      {isBoosted && boostTimeLeft !== null && (
        <div className="flex items-center justify-between gap-3 p-4 mb-4 border rounded-xl bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200 dark:from-yellow-900/20 dark:to-orange-900/20 dark:border-yellow-800/50">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500">
              <Sparkles className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-sm font-bold text-yellow-900 dark:text-yellow-100">
                🔥 Wydarzenie promowane
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-300">
                Wyróżnione wyżej w listingu wydarzeń
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/60 dark:bg-black/20">
            <Clock className="w-4 h-4 text-yellow-700 dark:text-yellow-300" />
            <div className="text-right">
              <p className="text-xs font-medium text-yellow-600 dark:text-yellow-400">
                Pozostało
              </p>
              <p className="text-sm font-bold font-mono text-yellow-900 dark:text-yellow-100">
                {formatTimeLeft(boostTimeLeft)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Title */}
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        {event.title}
      </h1>

      {/* Organizer */}
      <div className="flex items-center gap-3 mt-3">
        <Link
          href={`/u/${event.organizer.name}`}
          className="flex-shrink-0"
          data-u-id={event.organizer.id}
        >
          {event.organizer.avatarKey ? (
            <BlurHashImage
              src={buildAvatarUrl(event.organizer.avatarKey, 'sm') || ''}
              blurhash={event.organizer.avatarBlurhash}
              alt={event.organizer.displayName || event.organizer.name}
              width={36}
              height={36}
              className="object-cover transition-opacity border rounded-full h-9 w-9 border-zinc-200 hover:opacity-80 dark:border-zinc-700"
            />
          ) : (
            <div className="flex items-center justify-center transition-opacity border rounded-full h-9 w-9 border-zinc-200 bg-zinc-200 hover:opacity-80 dark:border-zinc-700 dark:bg-zinc-700">
              <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">
                {(event.organizer.displayName ||
                  event.organizer.name)[0]?.toUpperCase()}
              </span>
            </div>
          )}
        </Link>
        <div className="min-w-0">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Organizator
          </p>
          <div className="flex items-center gap-1.5">
            <Link
              href={`/u/${event.organizer.name}`}
              className="text-sm font-medium transition-colors text-zinc-800 hover:text-blue-600 dark:text-zinc-200 dark:hover:text-blue-400"
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
            className="text-xs transition-colors text-zinc-500 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400"
          >
            @{event.organizer.name}
          </Link>
        </div>
      </div>

      {/* Meta Info */}
      <div className="mt-4 space-y-2">
        {/* Primary Info Row */}
        <div className="flex flex-wrap gap-3 text-[13px] text-zinc-700 dark:text-zinc-300">
          {/* Date */}
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="w-4 h-4 opacity-70" />
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
            <Users className="w-4 h-4 opacity-70" />
            {formatParticipantsShort(
              event.joinedCount,
              event.min,
              event.max,
              event.mode as 'ONE_TO_ONE' | 'GROUP' | 'CUSTOM'
            )}
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              ({eventSize.label})
            </span>
          </span>
        </div>

        {/* Location & Online Info Row */}
        <div className="flex flex-wrap gap-3 text-[13px]">
          {/* Physical Location - only if visible */}
          {canSeeLocation && (
            <span className="inline-flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
              <MapPinned className="w-4 h-4 text-blue-600 opacity-70 dark:text-blue-400" />
              <span className="truncate max-w-[300px]">{event.address}</span>
            </span>
          )}

          {/* Hidden location indicator */}
          {!canSeeLocation &&
            event.meetingKind !== 'ONLINE' &&
            event.address && (
              <span className="inline-flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
                <MapPin className="w-4 h-4 opacity-70" />
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
                  <Video className="w-4 h-4" />
                ) : (
                  <Wifi className="w-4 h-4" />
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
      <div className="flex flex-wrap gap-2 mt-4">
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
          <span className="px-3 py-1 text-xs font-medium text-gray-800 bg-gray-100 rounded-full dark:bg-gray-700 dark:text-gray-200">
            Nieindeksowane
          </span>
        )}

        {/* Meeting Kind Badge */}
        <span className="px-3 py-1 text-xs font-medium text-blue-800 bg-blue-100 rounded-full dark:bg-blue-900 dark:text-blue-100">
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
