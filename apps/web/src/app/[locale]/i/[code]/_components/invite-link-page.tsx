'use client';

import { format, pl } from '@/lib/date';
import clsx from 'clsx';
import {
  AlertCircle,
  Calendar,
  Check,
  Loader2,
  MapPin,
  Users,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';

// Components
import { Avatar } from '@/components/ui/avatar';

// Features
import {
  useJoinByInviteLinkMutation,
  useValidateInviteLinkQuery,
} from '@/features/invite-links';

// Utils
import { buildAvatarUrl } from '@/lib/media/url';
import { useLocalePath } from '@/hooks/use-locale-path';

// TODO i18n: All hardcoded Polish strings need translation keys
// TODO i18n: Date formatting should be locale-aware (currently using pl locale hardcoded)

interface InviteLinkPageProps {
  code: string;
}

// ============================================================================
// Shared Styles
// ============================================================================

const SCREEN_CONTAINER_BASE =
  'flex min-h-screen items-center justify-center p-4';
const CARD_BASE =
  'w-full max-w-md rounded-2xl border bg-white p-8 text-center shadow-xl dark:bg-zinc-900';
const ICON_WRAPPER_BASE =
  'mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full';
const BUTTON_PRIMARY =
  'w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-medium text-white hover:bg-indigo-500';
const BUTTON_SECONDARY =
  'w-full rounded-xl border border-zinc-300 bg-white px-6 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700';

// ============================================================================
// Sub-Components
// ============================================================================

function LoadingState() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900">
      <div className="text-center">
        <Loader2 className="mx-auto h-12 w-12 animate-spin text-indigo-600" />
        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
          {/* TODO i18n */}
          Sprawdzanie zaproszenia...
        </p>
      </div>
    </div>
  );
}

interface ErrorStateProps {
  onGoHome: () => void;
}

function ErrorState({ onGoHome }: ErrorStateProps) {
  return (
    <div
      className={clsx(
        SCREEN_CONTAINER_BASE,
        'bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900'
      )}
    >
      <div className={clsx(CARD_BASE, 'border-red-200 dark:border-red-900/30')}>
        <div
          className={clsx(ICON_WRAPPER_BASE, 'bg-red-100 dark:bg-red-900/30')}
        >
          <X className="h-8 w-8 text-red-600 dark:text-red-400" />
        </div>
        {/* TODO i18n */}
        <h1 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          Nieprawidłowy link
        </h1>
        <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
          Ten link zaproszeniowy jest nieprawidłowy lub wygasł.
        </p>
        <button onClick={onGoHome} className={BUTTON_PRIMARY}>
          Wróć do strony głównej
        </button>
      </div>
    </div>
  );
}

interface InvalidLinkStateProps {
  reason?: string | null;
  eventId?: string | null;
  onViewEvent: () => void;
  onGoHome: () => void;
}

function InvalidLinkState({
  reason,
  eventId,
  onViewEvent,
  onGoHome,
}: InvalidLinkStateProps) {
  return (
    <div
      className={clsx(
        SCREEN_CONTAINER_BASE,
        'bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900'
      )}
    >
      <div
        className={clsx(CARD_BASE, 'border-amber-200 dark:border-amber-900/30')}
      >
        <div
          className={clsx(
            ICON_WRAPPER_BASE,
            'bg-amber-100 dark:bg-amber-900/30'
          )}
        >
          <AlertCircle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
        </div>
        {/* TODO i18n */}
        <h1 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          Link niedostępny
        </h1>
        <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
          {reason}
        </p>
        {eventId && (
          <button
            onClick={onViewEvent}
            className={clsx(BUTTON_PRIMARY, 'mb-3')}
          >
            Zobacz wydarzenie
          </button>
        )}
        <button onClick={onGoHome} className={BUTTON_SECONDARY}>
          Wróć do strony głównej
        </button>
      </div>
    </div>
  );
}

interface EventDateInfoProps {
  startAt: string;
  endAt: string;
}

function EventDateInfo({ startAt, endAt }: EventDateInfoProps) {
  return (
    <div className="flex items-start gap-3">
      <Calendar className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600 dark:text-indigo-400" />
      <div className="text-sm">
        {/* TODO i18n: date format should use user locale */}
        <div className="font-medium text-zinc-900 dark:text-zinc-100">
          {format(new Date(startAt), 'EEEE, d MMMM yyyy', { locale: pl })}
        </div>
        <div className="text-zinc-600 dark:text-zinc-400">
          {format(new Date(startAt), 'HH:mm', { locale: pl })} -{' '}
          {format(new Date(endAt), 'HH:mm', { locale: pl })}
        </div>
      </div>
    </div>
  );
}

interface EventLocationInfoProps {
  address: string;
}

function EventLocationInfo({ address }: EventLocationInfoProps) {
  return (
    <div className="flex items-start gap-3">
      <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600 dark:text-indigo-400" />
      <div className="text-sm text-zinc-700 dark:text-zinc-300">{address}</div>
    </div>
  );
}

interface EventParticipantsInfoProps {
  joinedCount: number;
  max: number;
  isFull: boolean;
}

function EventParticipantsInfo({
  joinedCount,
  max,
  isFull,
}: EventParticipantsInfoProps) {
  return (
    <div className="flex items-start gap-3">
      <Users className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600 dark:text-indigo-400" />
      <div className="text-sm">
        <span className="font-medium text-zinc-900 dark:text-zinc-100">
          {joinedCount} / {max}
        </span>
        {/* TODO i18n */}
        <span className="ml-1 text-zinc-600 dark:text-zinc-400">
          uczestników
        </span>
        {isFull && (
          <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            {/* TODO i18n */}
            Pełne
          </span>
        )}
      </div>
    </div>
  );
}

interface EventOrganizerInfoProps {
  owner: {
    name: string;
    avatarKey?: string | null;
    avatarBlurhash?: string | null;
  };
}

function EventOrganizerInfo({ owner }: EventOrganizerInfoProps) {
  return (
    <div className="flex items-center gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
      {owner.avatarKey && (
        <Avatar
          url={buildAvatarUrl(owner.avatarKey, 'md')}
          blurhash={owner.avatarBlurhash}
          alt={owner.name}
          size={40}
          className="opacity-90 transition-opacity group-hover:opacity-100"
        />
      )}
      <div className="text-sm">
        {/* TODO i18n */}
        <div className="text-zinc-600 dark:text-zinc-400">Organizator</div>
        <div className="font-medium text-zinc-900 dark:text-zinc-100">
          {owner.name}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function getJoinButtonClasses(isFull: boolean): string {
  return clsx(
    'w-full rounded-xl px-6 py-4 text-base font-semibold text-white shadow-lg transition-all',
    isFull
      ? 'cursor-not-allowed bg-zinc-400 dark:bg-zinc-700'
      : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 hover:shadow-xl'
  );
}

function getJoinButtonContent(
  isPending: boolean,
  isFull: boolean
): React.ReactNode {
  // TODO i18n: button texts
  if (isPending) {
    return (
      <span className="flex items-center justify-center gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        Dołączanie...
      </span>
    );
  }

  if (isFull) {
    return 'Wydarzenie jest pełne';
  }

  return 'Dołącz do wydarzenia';
}

// ============================================================================
// Main Component
// ============================================================================

export function InviteLinkPage({ code }: InviteLinkPageProps) {
  const router = useRouter();
  const { localePath } = useLocalePath();
  const { data, isLoading, error } = useValidateInviteLinkQuery({ code });
  const joinMutation = useJoinByInviteLinkMutation();

  const validation = data?.validateInviteLink;

  const handleJoin = async () => {
    try {
      const result = await joinMutation.mutateAsync({ code });
      router.push(localePath(`/events/${result.joinByInviteLink.id}`));
    } catch (err) {
      console.error('Failed to join:', err);
    }
  };

  const handleGoHome = () => {
    router.push(localePath('/'));
  };

  const handleViewEvent = () => {
    if (validation?.event?.id) {
      router.push(localePath(`/events/${validation.event.id}`));
    }
  };

  if (isLoading) {
    return <LoadingState />;
  }

  if (error || !validation) {
    return <ErrorState onGoHome={handleGoHome} />;
  }

  if (!validation.valid) {
    return (
      <InvalidLinkState
        reason={validation.reason}
        eventId={validation.event?.id}
        onViewEvent={handleViewEvent}
        onGoHome={handleGoHome}
      />
    );
  }

  const { event } = validation;

  if (!event) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 dark:from-zinc-950 dark:via-indigo-950/20 dark:to-purple-950/20">
      <div className="w-full max-w-2xl">
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg">
            <Check className="h-10 w-10 text-white" />
          </div>
        </div>

        <div className="rounded-3xl border border-white/20 bg-white/80 p-8 shadow-2xl backdrop-blur-xl dark:border-zinc-800/50 dark:bg-zinc-900/80">
          <div className="mb-6 text-center">
            {/* TODO i18n */}
            <h1 className="mb-2 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              Zostałeś zaproszony!
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Kliknij poniżej, aby dołączyć do wydarzenia
            </p>
          </div>

          <div className="mb-8 space-y-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900/50">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {event.title}
            </h2>

            {event.description && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {event.description}
              </p>
            )}

            <div className="space-y-3 pt-4">
              <EventDateInfo startAt={event.startAt} endAt={event.endAt} />

              {event.address && <EventLocationInfo address={event.address} />}

              <EventParticipantsInfo
                joinedCount={event.joinedCount}
                max={event.max ?? 0}
                isFull={event.isFull}
              />

              {event.owner && <EventOrganizerInfo owner={event.owner} />}
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleJoin}
              disabled={joinMutation.isPending || event.isFull}
              className={getJoinButtonClasses(event.isFull)}
            >
              {getJoinButtonContent(joinMutation.isPending, event.isFull)}
            </button>

            <button
              onClick={() => router.push(localePath(`/events/${event.id}`))}
              className={BUTTON_SECONDARY}
            >
              {/* TODO i18n */}
              Zobacz szczegóły wydarzenia
            </button>
          </div>

          {joinMutation.isError && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/30 dark:bg-red-950/20">
              {/* TODO i18n */}
              <p className="text-sm text-red-700 dark:text-red-400">
                Wystąpił błąd podczas dołączania do wydarzenia. Spróbuj ponownie
                później.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
