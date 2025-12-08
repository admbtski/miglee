'use client';

import { FavouriteButton } from '@/components/ui/favourite-button';
import { ShareButton } from '@/components/ui/share-button';
import { ReportButton } from '@/components/ui/report-button';
import { ShareModal } from '@/components/ui/share-modal';
import { useEventDetailQuery } from '@/features/events/api/events';
import { useMeQuery } from '@/features/auth/hooks/auth';
import { computeJoinState } from '@/features/events/utils/event-join-state';
import { formatParticipantsShort } from '@/features/events/utils/capacity-formatter';
import type { EventDetailsData } from '@/features/events/types/event-details';
import {
  Calendar,
  Clock,
  MapPin,
  MapPinned,
  Users,
  Video,
  Wifi,
  MessageCircle,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { EventActions } from './event-actions';
import { EventAdminPanel } from './event-admin-panel';
import { EventChatModal } from './event-chat-modal';
import { EventComments } from './event-comments';
import { EventCountdownTimer } from './event-countdown-timer';
import { EventDetailSkeleton } from './event-detail-skeleton';
import { EventDetails } from './event-details';
import { EventEngagementStats } from './event-engagement-stats';
import { EventFaq } from './event-faq';
import { EventHero } from './event-hero';
import { EventJoinSection } from './event-join-section';
import { EventLocationMap } from './event-location-map';
import { EventMetadata } from './event-metadata';
import { EventParticipants } from './event-participants';
import { EventReviews } from './event-reviews';
import { StickyJoinButton } from './sticky-join-button';
import { ReportEventModal } from './report-event-modal';
import { CancelEventModals } from '@/features/events/components/cancel-event-modals';
import {
  CloseJoinModal,
  ReopenJoinModal,
} from '@/features/events/components/close-join-modals';
import { DeleteEventModals } from '@/features/events/components/delete-event-modals';
import { BlurHashImage } from '@/components/ui/blurhash-image';
import { buildEventCoverUrl } from '@/lib/media/url';

type EventDetailClientProps = {
  eventId: string;
};

export function EventDetailClient({ eventId }: EventDetailClientProps) {
  const { data, isLoading, error, refetch } = useEventDetailQuery({
    id: eventId,
  });

  const { data: authData } = useMeQuery();

  const [cancelId, setCancelId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [closeJoinId, setCloseJoinId] = useState<string | null>(null);
  const [reopenJoinId, setReopenJoinId] = useState<string | null>(null);
  const [closeJoinReason, setCloseJoinReason] = useState('');
  const [shareOpen, setShareOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  // Get event and user data (safe to access after hooks)
  // Type assertion needed due to GraphQL codegen type inference issues
  const event = data?.event as typeof data extends { event: infer T } ? T : any;
  const currentUserId = authData?.me?.id;

  // Check user membership status - must be declared before early returns
  const userMembership = useMemo(() => {
    if (!currentUserId || !event?.members) return null;
    return event.members.find((m: any) => m.user?.id === currentUserId);
  }, [currentUserId, event?.members]);

  const isOwner = userMembership?.role === 'OWNER';
  const isModerator = userMembership?.role === 'MODERATOR';
  const isJoined = userMembership?.status === 'JOINED';
  const isPending = userMembership?.status === 'PENDING';
  const isInvited = userMembership?.status === 'INVITED';
  const isRejected = userMembership?.status === 'REJECTED';
  const isBanned = userMembership?.status === 'BANNED';
  const isWaitlisted = userMembership?.status === 'WAITLIST';

  // Determine if user can see members based on visibility settings
  const canSeeMembers = useMemo(() => {
    if (!event) {
      return false;
    }

    if (event.membersVisibility === 'PUBLIC') return true;
    if (event.membersVisibility === 'AFTER_JOIN')
      return isJoined || isOwner || isModerator;
    return isOwner || isModerator; // HIDDEN
  }, [event, isJoined, isOwner, isModerator]);

  // NOW we can do early returns after all hooks are declared
  if (isLoading) {
    return <EventDetailSkeleton />;
  }

  if (error || !event) {
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
    id: event.id,
    title: event.title,
    organizer: {
      id: event.owner?.id ?? '',
      name: event.owner?.name ?? 'Nieznany',
      avatarKey: event.owner?.avatarKey,
      avatarBlurhash: event.owner?.avatarBlurhash,
      verifiedAt: event.owner?.verifiedAt,
    },
    coverKey: event.coverKey,
    coverBlurhash: event.coverBlurhash,
    startISO: event.startAt,
    endISO: event.endAt,
    timezone: event.owner?.timezone,
    meetingKind: event.meetingKind as any,
    address: event.address,
    placeId: event.placeId,
    lat: event.lat,
    lng: event.lng,
    radiusKm: event.radiusKm,
    onlineUrl: event.onlineUrl,
    visibility: event.visibility as any,
    addressVisibility: event.addressVisibility as any,
    membersVisibility: event.membersVisibility as any,
    joinMode: event.joinMode as any,
    mode: event.mode as any,
    min: event.min,
    max: event.max,
    joinedCount: event.joinedCount,
    joinOpensMinutesBeforeStart: event.joinOpensMinutesBeforeStart,
    joinCutoffMinutesBeforeStart: event.joinCutoffMinutesBeforeStart,
    allowJoinLate: event.allowJoinLate,
    lateJoinCutoffMinutesAfterStart: event.lateJoinCutoffMinutesAfterStart,
    joinManuallyClosed: event.joinManuallyClosed,
    joinManuallyClosedAt: event.joinManuallyClosedAt,
    joinManualCloseReason: event.joinManualCloseReason,
    description: event.description,
    notes: event.notes,
    levels: event.levels as any[],
    categories: event.categories.map((cat: any) => ({
      slug: cat.slug,
      name: (cat.names as any)?.pl ?? cat.slug,
    })),
    tags: event.tags.map((tag: any) => ({
      slug: tag.slug,
      label: tag.label,
    })),
    canceledAt: event.canceledAt,
    cancelReason: event.cancelReason,
    deletedAt: event.deletedAt,
    deleteReason: event.deleteReason,
    members: event.members?.map((m: any) => ({
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
    commentsCount: event.commentsCount,
    messagesCount: event.messagesCount,
    isFavourite: event.isFavourite,
    savedCount: event.savedCount,
    // Sponsorship (now available in GraphQL)
    sponsorship: event.sponsorship
      ? {
          plan: event.sponsorship.plan as any,
          status: event.sponsorship.status as any,
          sponsor: event.sponsorship.sponsor
            ? {
                id: event.sponsorship.sponsor.id,
                name: event.sponsorship.sponsor.name || 'Unknown',
              }
            : { id: '', name: 'Unknown' },
          startsAt: event.sponsorship.startsAt,
          endsAt: event.sponsorship.endsAt,
          boostsTotal: event.sponsorship.boostsTotal,
          boostsUsed: event.sponsorship.boostsUsed,
          localPushesTotal: event.sponsorship.localPushesTotal,
          localPushesUsed: event.sponsorship.localPushesUsed,
        }
      : undefined,
    // Boost
    boostedAt: event.boostedAt,
    // TODO: inviteLinks field not in GraphQL fragment yet
    // inviteLinks: event.inviteLinks?.map((link: any) => ({
    //   code: link.code,
    //   maxUses: link.maxUses ?? null,
    //   usedCount: link.usedCount,
    //   expiresAt: link.expiresAt ?? null,
    // })),
    joinState: computeJoinState(new Date(), {
      startAt: new Date(event.startAt),
      endAt: new Date(event.endAt),
      joinOpensMinutesBeforeStart: event.joinOpensMinutesBeforeStart,
      joinCutoffMinutesBeforeStart: event.joinCutoffMinutesBeforeStart,
      allowJoinLate: event.allowJoinLate,
      lateJoinCutoffMinutesAfterStart: event.lateJoinCutoffMinutesAfterStart,
      joinManuallyClosed: event.joinManuallyClosed,
      min: event.min,
      max: event.max,
      joinedCount: event.joinedCount,
      joinMode: event.joinMode as any,
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
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
  };

  return (
    <div className="min-h-screen pb-20 transition-colors duration-500 bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      {/* Back Navigation */}
      <div className="transition-colors duration-500 border-b border-zinc-200 backdrop-blur dark:border-zinc-800">
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
          <div className="relative h-[220px] md:h-[340px] overflow-hidden rounded-[20px] bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900 shadow-[0_8px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.2)] transition-all duration-500">
            {/* Background Image */}
            {eventData.coverKey ? (
              <BlurHashImage
                src={buildEventCoverUrl(eventData.coverKey, 'detail') || ''}
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
              <ReportButton onClick={() => setReportOpen(true)} size="md" />
              <ShareButton onClick={() => setShareOpen(true)} size="md" />
              <FavouriteButton
                eventId={eventData.id}
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
                        style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
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
                      {/* todo: time formatting */}
                      {new Date(eventData.startISO).toLocaleDateString(
                        'pl-PL',
                        {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        }
                      )}
                    </span>
                  </div>
                  <span className="text-white/40">·</span>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 opacity-80" />
                    <span>
                      {/* todo: time formatting */}
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
                      {formatParticipantsShort(
                        eventData.joinedCount,
                        eventData.min,
                        eventData.max,
                        eventData.mode as 'ONE_TO_ONE' | 'GROUP' | 'CUSTOM'
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Extended Metadata Card - Integrated below hero */}
        <div className="mb-6">
          <div className="relative p-4 overflow-hidden border rounded-xl border-zinc-200 bg-white/70 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/40 transition-all duration-300">
            <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-700 dark:text-zinc-300">
              {/* Event Size Category */}
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 opacity-70" />
                <span className="font-medium">
                  {eventData.mode === 'ONE_TO_ONE' ||
                  (eventData.max !== null && eventData.max <= 2)
                    ? 'Indywidualne'
                    : eventData.max === null
                      ? 'Bez limitu'
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
                <div className="p-6 border rounded-2xl border-zinc-200 bg-white/70 dark:border-zinc-800 dark:bg-zinc-900/40 transition-all duration-300">
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

            {/* FAQ Section - above reviews and comments */}
            {event?.faqs && event.faqs.length > 0 && (
              <EventFaq
                faqs={event.faqs.map((faq: any) => ({
                  id: faq.id,
                  question: faq.question,
                  answer: faq.answer,
                }))}
              />
            )}

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
              onCancel={() => setCancelId(eventId)}
              onDelete={() => setDeleteId(eventId)}
              onCloseJoin={() => setCloseJoinId(eventId)}
              onReopenJoin={() => setReopenJoinId(eventId)}
            />

            {/* Countdown Timer */}
            <EventCountdownTimer
              startAt={new Date(event.startAt)}
              endAt={new Date(event.endAt)}
              joinOpensMinutesBeforeStart={event.joinOpensMinutesBeforeStart}
              joinCutoffMinutesBeforeStart={event.joinCutoffMinutesBeforeStart}
              allowJoinLate={event.allowJoinLate}
              lateJoinCutoffMinutesAfterStart={
                event.lateJoinCutoffMinutesAfterStart
              }
              joinManuallyClosed={event.joinManuallyClosed}
              isCanceled={!!event.canceledAt}
              isDeleted={!!event.deletedAt}
            />

            <EventJoinSection
              event={eventData}
              onOpenChat={() => setChatOpen(true)}
            />

            {/* Engagement Stats */}
            <EventEngagementStats event={eventData} />

            <EventActions event={eventData} />
          </div>
        </div>
      </div>

      {/* Modals */}
      <CancelEventModals
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

      <DeleteEventModals
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
        eventId={closeJoinId}
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
        eventId={reopenJoinId}
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

      {/* Chat Modal */}
      <EventChatModal
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        eventId={eventData.id}
        eventTitle={eventData.title}
        membersCount={eventData.joinedCount}
      />

      {/* Report Modal */}
      <ReportEventModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        eventId={eventData.id}
        eventTitle={eventData.title}
      />

      {/* Floating Action Button - Chat (Bottom Right) */}
      {eventData.userMembership?.isJoined && (
        <button
          onClick={() => setChatOpen(true)}
          className="fixed z-50 flex items-center justify-center text-white transition-all duration-300 rounded-full shadow-2xl w-14 h-14 bottom-20 right-4 md:bottom-6 md:right-6 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 hover:scale-110 active:scale-95 group"
          aria-label="Otwórz czat wydarzenia"
          title="Otwórz czat wydarzenia"
        >
          <MessageCircle className="w-6 h-6 transition-transform group-hover:scale-110" />
          {eventData.messagesCount > 0 && (
            <span className="absolute flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-red-500 rounded-full -top-1 -right-1 ring-2 ring-white dark:ring-zinc-900">
              {eventData.messagesCount > 99 ? '99+' : eventData.messagesCount}
            </span>
          )}
        </button>
      )}

      {/* Sticky Join Button at Bottom */}
      <StickyJoinButton event={eventData} />
    </div>
  );
}
