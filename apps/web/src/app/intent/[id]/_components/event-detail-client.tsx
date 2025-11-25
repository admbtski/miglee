'use client';

import { FavouriteButton } from '@/components/ui/favourite-button';
import { ShareButton } from '@/components/ui/share-button';
import { ShareModal } from '@/components/ui/share-modal';
import { useIntentDetailQuery } from '@/lib/api/intents';
import { useMeQuery } from '@/lib/api/auth';
import { computeJoinState } from '@/lib/utils/intent-join-state';
import type { EventDetailsData } from '@/types/event-details';
import {
  Calendar,
  Clock,
  MapPin,
  MapPinned,
  Users,
  Video,
  Wifi,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { EventActions } from './event-actions';
import { EventAdminPanel } from './event-admin-panel';
import { EventComments } from './event-comments';
import { EventCountdownTimer } from './event-countdown-timer';
import { EventDetailSkeleton } from './event-detail-skeleton';
import { EventDetails } from './event-details';
import { EventEngagementStats } from './event-engagement-stats';
import { EventHero } from './event-hero';
import { EventJoinSection } from './event-join-section';
import { EventLocationMap } from './event-location-map';
import { EventMetadata } from './event-metadata';
import { EventParticipants } from './event-participants';
import { EventReviews } from './event-reviews';
import { StickyJoinButton } from './sticky-join-button';
import { CancelIntentModals } from '@/app/account/intents/_components/cancel-intent-modals';
import {
  CloseJoinModal,
  ReopenJoinModal,
} from '@/app/account/intents/_components/close-join-modals';
import { DeleteIntentModals } from '@/app/account/intents/_components/delete-intent-modals';
import { BlurHashImage } from '@/components/ui/blurhash-image';
import { buildIntentCoverUrl } from '@/lib/media/url';
import {
  isBoostActive,
  getHighlightBackgroundStyle,
} from '@/lib/utils/is-boost-active';
import { EventHighlightProvider } from './event-highlight-context';

type EventDetailClientProps = {
  intentId: string;
};

export function EventDetailClient({ intentId }: EventDetailClientProps) {
  const { data, isLoading, error, refetch } = useIntentDetailQuery({
    id: intentId,
  });

  const { data: authData } = useMeQuery();

  const [cancelId, setCancelId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [closeJoinId, setCloseJoinId] = useState<string | null>(null);
  const [reopenJoinId, setReopenJoinId] = useState<string | null>(null);
  const [closeJoinReason, setCloseJoinReason] = useState('');
  const [shareOpen, setShareOpen] = useState(false);

  // Get intent and user data (safe to access after hooks)
  // Type assertion needed due to GraphQL codegen type inference issues
  const intent = data?.intent as typeof data extends { intent: infer T }
    ? T
    : any;
  const currentUserId = authData?.me?.id;

  // Check user membership status - must be declared before early returns
  const userMembership = useMemo(() => {
    if (!currentUserId || !intent?.members) return null;
    return intent.members.find((m: any) => m.user?.id === currentUserId);
  }, [currentUserId, intent?.members]);

  const isOwner = userMembership?.role === 'OWNER';
  const isModerator = userMembership?.role === 'MODERATOR';
  const isJoined = userMembership?.status === 'JOINED';
  const isPending = userMembership?.status === 'PENDING';
  const isInvited = userMembership?.status === 'INVITED';
  const isRejected = userMembership?.status === 'REJECTED';
  const isBanned = userMembership?.status === 'BANNED';
  const isWaitlisted = userMembership?.status === 'WAITLIST';

  // Check if boost is active (must be before early returns)
  const isBoosted = useMemo(
    () => isBoostActive(intent?.boostedAt),
    [intent?.boostedAt]
  );

  // Get subtle highlight background for page (must be before early returns)
  const subtleHighlightStyle = useMemo(
    () =>
      getHighlightBackgroundStyle(intent?.highlightColor, isBoosted, 'medium'),
    [intent?.highlightColor, isBoosted]
  );

  // Get medium highlight for navbar (must be before early returns)
  const navbarHighlightStyle = useMemo(
    () =>
      getHighlightBackgroundStyle(intent?.highlightColor, isBoosted, 'subtle'),
    [intent?.highlightColor, isBoosted]
  );

  // Determine if user can see members based on visibility settings
  const canSeeMembers = useMemo(() => {
    if (!intent) {
      return false;
    }

    if (intent.membersVisibility === 'PUBLIC') return true;
    if (intent.membersVisibility === 'AFTER_JOIN')
      return isJoined || isOwner || isModerator;
    return isOwner || isModerator; // HIDDEN
  }, [intent, isJoined, isOwner, isModerator]);

  // NOW we can do early returns after all hooks are declared
  if (isLoading) {
    return <EventDetailSkeleton />;
  }

  if (error || !intent) {
    return (
      <div className="container px-4 py-8 mx-auto">
        <div className="p-6 text-center border border-red-200 rounded-lg bg-red-50 dark:border-red-800 dark:bg-red-950">
          <h2 className="text-xl font-semibold text-red-900 dark:text-red-100">
            Nie znaleziono wydarzenia
          </h2>
          <p className="mt-2 text-red-700 dark:text-red-300">
            Wydarzenie o podanym ID nie istnieje lub zostało usunięte.
          </p>
        </div>
      </div>
    );
  }

  // Transform GraphQL data to EventDetailsData
  const eventData: EventDetailsData = {
    id: intent.id,
    title: intent.title,
    organizer: {
      id: intent.owner?.id ?? '',
      name: intent.owner?.name ?? 'Nieznany',
      avatarKey: intent.owner?.avatarKey,
      avatarBlurhash: intent.owner?.avatarBlurhash,
      verifiedAt: intent.owner?.verifiedAt,
    },
    coverKey: intent.coverKey,
    coverBlurhash: intent.coverBlurhash,
    startISO: intent.startAt,
    endISO: intent.endAt,
    tz: intent.owner?.tz,
    meetingKind: intent.meetingKind as any,
    address: intent.address,
    placeId: intent.placeId,
    lat: intent.lat,
    lng: intent.lng,
    radiusKm: intent.radiusKm,
    onlineUrl: intent.onlineUrl,
    visibility: intent.visibility as any,
    addressVisibility: intent.addressVisibility as any,
    membersVisibility: intent.membersVisibility as any,
    joinMode: intent.joinMode as any,
    mode: intent.mode as any,
    min: intent.min,
    max: intent.max,
    joinedCount: intent.joinedCount,
    joinOpensMinutesBeforeStart: intent.joinOpensMinutesBeforeStart,
    joinCutoffMinutesBeforeStart: intent.joinCutoffMinutesBeforeStart,
    allowJoinLate: intent.allowJoinLate,
    lateJoinCutoffMinutesAfterStart: intent.lateJoinCutoffMinutesAfterStart,
    joinManuallyClosed: intent.joinManuallyClosed,
    joinManuallyClosedAt: intent.joinManuallyClosedAt,
    joinManualCloseReason: intent.joinManualCloseReason,
    description: intent.description,
    notes: intent.notes,
    levels: intent.levels as any[],
    categories: intent.categories.map((cat: any) => ({
      slug: cat.slug,
      name: (cat.names as any)?.pl ?? cat.slug,
    })),
    tags: intent.tags.map((tag: any) => ({
      slug: tag.slug,
      label: tag.label,
    })),
    canceledAt: intent.canceledAt,
    cancelReason: intent.cancelReason,
    deletedAt: intent.deletedAt,
    deleteReason: intent.deleteReason,
    members: intent.members?.map((m: any) => ({
      id: m.id,
      role: m.role as any,
      status: m.status as any,
      user: {
        id: m.user.id,
        name: m.user.name,
        avatarKey: m.user.avatarKey,
        avatarBlurhash: m.user.avatarBlurhash,
        verifiedAt: m.user.verifiedAt,
      },
      note: m.note,
      joinedAt: m.joinedAt,
    })),
    commentsCount: intent.commentsCount,
    messagesCount: intent.messagesCount,
    isFavourite: intent.isFavourite,
    savedCount: intent.savedCount,
    // Sponsorship (now available in GraphQL)
    sponsorship: intent.sponsorship
      ? {
          plan: intent.sponsorship.plan as any,
          status: intent.sponsorship.status as any,
          sponsor: intent.sponsorship.sponsor
            ? {
                id: intent.sponsorship.sponsor.id,
                name: intent.sponsorship.sponsor.name || 'Unknown',
              }
            : { id: '', name: 'Unknown' },
          startsAt: intent.sponsorship.startsAt,
          endsAt: intent.sponsorship.endsAt,
          boostsTotal: intent.sponsorship.boostsTotal,
          boostsUsed: intent.sponsorship.boostsUsed,
          localPushesTotal: intent.sponsorship.localPushesTotal,
          localPushesUsed: intent.sponsorship.localPushesUsed,
        }
      : undefined,
    // Highlight and boost
    highlightColor: intent.highlightColor,
    boostedAt: intent.boostedAt,
    // TODO: inviteLinks field not in GraphQL fragment yet
    // inviteLinks: intent.inviteLinks?.map((link: any) => ({
    //   code: link.code,
    //   maxUses: link.maxUses ?? null,
    //   usedCount: link.usedCount,
    //   expiresAt: link.expiresAt ?? null,
    // })),
    joinState: computeJoinState(new Date(), {
      startAt: new Date(intent.startAt),
      endAt: new Date(intent.endAt),
      joinOpensMinutesBeforeStart: intent.joinOpensMinutesBeforeStart,
      joinCutoffMinutesBeforeStart: intent.joinCutoffMinutesBeforeStart,
      allowJoinLate: intent.allowJoinLate,
      lateJoinCutoffMinutesAfterStart: intent.lateJoinCutoffMinutesAfterStart,
      joinManuallyClosed: intent.joinManuallyClosed,
      min: intent.min,
      max: intent.max,
      joinedCount: intent.joinedCount,
      joinMode: intent.joinMode as any,
    }),
    userMembership: currentUserId
      ? {
          isOwner,
          isModerator,
          isJoined,
          isPending,
          isInvited,
          isRejected,
          isBanned,
          isWaitlisted,
          canSeeMembers,
          rejectReason: isRejected
            ? (userMembership?.note ?? undefined)
            : undefined,
          banReason: isBanned ? (userMembership?.note ?? undefined) : undefined,
        }
      : undefined,
    createdAt: intent.createdAt,
    updatedAt: intent.updatedAt,
  };

  return (
    <div
      className="min-h-screen pb-20 transition-colors duration-500 bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100"
      style={isBoosted ? subtleHighlightStyle : undefined}
    >
      {/* Back Navigation */}
      <div
        className="transition-colors duration-500 border-b border-zinc-200 backdrop-blur dark:border-zinc-800"
        style={isBoosted ? navbarHighlightStyle : undefined}
      >
        <div className="container max-w-6xl px-4 py-3 mx-auto">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            ← Powrót do listy wydarzeń
          </a>
        </div>
      </div>

      {/* 
        Event Hero Cover - Magazine Style
        Refined layout with elegant gradient, proper spacing, and integrated metadata
      */}
      <div className="container max-w-6xl px-4 py-6 mx-auto">
        <div className="mb-6">
          <div className="relative h-[220px] md:h-[340px] overflow-hidden rounded-[20px] bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900 shadow-[0_8px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.2)]">
            {/* Background Image */}
            {eventData.coverKey ? (
              <BlurHashImage
                src={buildIntentCoverUrl(eventData.coverKey, 'detail') || ''}
                blurhash={eventData.coverBlurhash}
                alt={eventData.title}
                className="absolute inset-0 object-cover w-full h-full"
                width={1280}
                height={720}
              />
            ) : (
              <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/20 dark:to-violet-900/20" />
            )}

            {/* Gradient Overlay - Subtle, magazine-style */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/15 to-black/55" />

            {/* Action Buttons - Top Right Corner */}
            <div className="absolute z-10 flex items-center gap-2 top-4 right-4 md:top-6 md:right-6">
              <ShareButton onClick={() => setShareOpen(true)} size="md" />
              <FavouriteButton
                intentId={eventData.id}
                isFavourite={eventData.isFavourite ?? false}
                size="md"
              />
            </div>

            {/* Bottom Content Container */}
            <div className="absolute inset-x-0 bottom-0 px-4 pb-5 md:px-8 md:pb-7">
              <div className="max-w-6xl mx-auto">
                {/* Category Tags Row */}
                {eventData.categories.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {eventData.categories.slice(0, 2).map((cat) => (
                      <span
                        key={cat.slug}
                        className="inline-flex items-center px-3 py-1 text-xs font-medium text-white rounded-full backdrop-blur-sm"
                        style={
                          isBoosted && intent?.highlightColor
                            ? {
                                backgroundColor: intent.highlightColor,
                                opacity: 0.95,
                              }
                            : { backgroundColor: 'rgba(0, 0, 0, 0.4)' }
                        }
                      >
                        {cat.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Event Title (H1) */}
                <h1 className="text-2xl font-semibold leading-tight tracking-tight text-white md:text-[32px] md:leading-tight line-clamp-3">
                  {eventData.title}
                </h1>

                {/* Metadata Row - Date, Time, Participants */}
                <div className="flex flex-wrap items-center mt-2 text-sm gap-x-4 gap-y-2 text-white/80">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 opacity-80" />
                    <span>
                      {new Date(eventData.startISO).toLocaleDateString(
                        'pl-PL',
                        {
                          day: 'numeric',
                          month: 'long',
                        }
                      )}
                    </span>
                  </div>
                  <span className="text-white/40">·</span>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 opacity-80" />
                    <span>
                      {new Date(eventData.startISO).toLocaleTimeString(
                        'pl-PL',
                        {
                          hour: '2-digit',
                          minute: '2-digit',
                        }
                      )}
                    </span>
                  </div>
                  <span className="text-white/40">·</span>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 opacity-80" />
                    <span>
                      {eventData.joinedCount} / {eventData.max}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Extended Metadata Card - Integrated below hero */}
        <div className="mb-6">
          <div className="relative p-4 overflow-hidden border rounded-xl border-zinc-200 bg-white/70 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/40">
            <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-700 dark:text-zinc-300">
              {/* Event Size Category */}
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 opacity-70" />
                <span className="font-medium">
                  {eventData.mode === 'ONE_TO_ONE' || eventData.max <= 2
                    ? 'Indywidualne'
                    : eventData.max <= 10
                      ? 'Kameralne'
                      : eventData.max <= 50
                        ? 'Grupowe'
                        : 'Masowe'}
                </span>
              </div>

              <span className="opacity-30">·</span>

              {/* Physical Location - Conditional visibility */}
              {eventData.meetingKind !== 'ONLINE' &&
                eventData.address &&
                (eventData.addressVisibility === 'PUBLIC' ||
                  (eventData.addressVisibility === 'AFTER_JOIN' &&
                    (isJoined || isOwner || isModerator))) && (
                  <>
                    <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                      <MapPinned className="w-4 h-4" />
                      <span className="truncate max-w-[300px] font-medium">
                        {eventData.address.split(',')[0]}
                      </span>
                    </div>
                    <span className="opacity-30">·</span>
                  </>
                )}

              {/* Hidden Location Indicator */}
              {eventData.meetingKind !== 'ONLINE' &&
                eventData.address &&
                !(
                  eventData.addressVisibility === 'PUBLIC' ||
                  (eventData.addressVisibility === 'AFTER_JOIN' &&
                    (isJoined || isOwner || isModerator))
                ) && (
                  <>
                    <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
                      <MapPin className="w-4 h-4" />
                      <span className="text-xs">
                        Lokalizacja{' '}
                        {eventData.addressVisibility === 'AFTER_JOIN'
                          ? 'widoczna po dołączeniu'
                          : 'ukryta'}
                      </span>
                    </div>
                    <span className="opacity-30">·</span>
                  </>
                )}

              {/* Online/Hybrid Meeting Badge */}
              {(eventData.meetingKind === 'ONLINE' ||
                eventData.meetingKind === 'HYBRID') && (
                <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                  {eventData.meetingKind === 'ONLINE' ? (
                    <Video className="w-4 h-4" />
                  ) : (
                    <Wifi className="w-4 h-4" />
                  )}
                  <span className="font-medium">
                    {eventData.meetingKind === 'ONLINE'
                      ? 'Spotkanie online'
                      : 'Dostępne online'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <div className="mb-6">
          <EventHero event={eventData} />
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* Left Column - Main Content */}
          <div className="min-w-0 space-y-6">
            <EventDetails event={eventData} />

            {/* Location Map - only show if coordinates are available and address visibility allows */}
            {eventData.lat != null &&
              eventData.lng != null &&
              eventData.meetingKind !== 'ONLINE' &&
              (eventData.addressVisibility === 'PUBLIC' ||
                (eventData.addressVisibility === 'AFTER_JOIN' &&
                  (isJoined || isOwner || isModerator))) && (
                <div className="p-6 border rounded-2xl border-zinc-200 bg-white/70 dark:border-zinc-800 dark:bg-zinc-900/40">
                  <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                    📍 Lokalizacja
                  </h2>
                  <EventLocationMap
                    lat={eventData.lat}
                    lng={eventData.lng}
                    title={eventData.title}
                    address={eventData.address ?? undefined}
                    height="h-[260px]"
                  />
                  {eventData.address && (
                    <div className="flex items-start gap-3 px-2 py-2 mt-4 transition rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900/40">
                      <svg
                        className="mt-0.5 h-5 w-5 flex-shrink-0 text-zinc-500 dark:text-zinc-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                          Adres
                        </p>
                        <p className="break-words text-md text-zinc-800 dark:text-zinc-200">
                          {eventData.address}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

            <EventParticipants event={eventData} />
            <EventReviews event={eventData} />
            <EventComments event={eventData} />

            {/* Metadata at the bottom */}
            <EventMetadata event={eventData} />
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Admin Panel - tylko dla właściciela i moderatorów */}
            <EventAdminPanel
              event={eventData}
              onCancel={() => setCancelId(intentId)}
              onDelete={() => setDeleteId(intentId)}
              onCloseJoin={() => setCloseJoinId(intentId)}
              onReopenJoin={() => setReopenJoinId(intentId)}
            />

            {/* Countdown Timer */}
            <EventCountdownTimer
              startAt={new Date(intent.startAt)}
              endAt={new Date(intent.endAt)}
              joinOpensMinutesBeforeStart={intent.joinOpensMinutesBeforeStart}
              joinCutoffMinutesBeforeStart={intent.joinCutoffMinutesBeforeStart}
              allowJoinLate={intent.allowJoinLate}
              lateJoinCutoffMinutesAfterStart={
                intent.lateJoinCutoffMinutesAfterStart
              }
              joinManuallyClosed={intent.joinManuallyClosed}
              isCanceled={!!intent.canceledAt}
              isDeleted={!!intent.deletedAt}
            />

            <EventJoinSection event={eventData} />

            {/* Engagement Stats */}
            <EventEngagementStats event={eventData} />

            <EventActions event={eventData} />
          </div>
        </div>
      </div>

      {/* Modals */}
      <CancelIntentModals
        cancelId={cancelId}
        onClose={() => setCancelId(null)}
        onSuccess={() => {
          refetch();
        }}
        title="Anulować wydarzenie?"
        subtitle="Uczestnicy zostaną powiadomieni o anulowaniu. Ta akcja jest odwracalna."
        successTitle="Wydarzenie anulowane"
        successSubtitle="Wydarzenie zostało pomyślnie anulowane."
      />

      <DeleteIntentModals
        deleteId={deleteId}
        onClose={() => setDeleteId(null)}
        onSuccess={() => {
          refetch();
        }}
        title="Usunąć wydarzenie?"
        subtitle="Ta akcja jest nieodwracalna. Wszystkie dane zostaną trwale usunięte."
        successTitle="Wydarzenie usunięte"
        successSubtitle="Wydarzenie zostało trwale usunięte."
      />

      <CloseJoinModal
        intentId={closeJoinId}
        onClose={() => {
          setCloseJoinId(null);
          setCloseJoinReason('');
        }}
        onSuccess={() => {
          refetch();
        }}
        reason={closeJoinReason}
        onReasonChange={setCloseJoinReason}
      />

      <ReopenJoinModal
        intentId={reopenJoinId}
        onClose={() => setReopenJoinId(null)}
        onSuccess={() => {
          refetch();
        }}
      />

      {/* Share Modal */}
      <ShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        url={typeof window !== 'undefined' ? window.location.href : ''}
        title={eventData.title}
        description={eventData.description || undefined}
      />

      {/* Sticky Join Button at Bottom */}
      <StickyJoinButton event={eventData} />
    </div>
  );
}
