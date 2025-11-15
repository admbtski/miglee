'use client';

import { useIntentDetail } from '@/hooks/use-intent-detail';
import { EventDetailSkeleton } from './event-detail-skeleton';
import { EventHero } from './event-hero';
import { EventDetails } from './event-details';
import { EventParticipants } from './event-participants';
import { EventJoinSection } from './event-join-section';
import { EventActions } from './event-actions';
import { EventAdminPanel } from './event-admin-panel';
import { EventComments } from './event-comments';
import { EventReviews } from './event-reviews';
import { EventCountdownTimer } from './event-countdown-timer';
import { EventLocationMap } from './event-location-map';
import { EventEngagementStats } from './event-engagement-stats';
import { EventMetadata } from './event-metadata';
import { StickyJoinButton } from './sticky-join-button';
import { computeJoinState } from '@/lib/utils/intent-join-state';
import type { EventDetailsData } from '@/types/event-details';
import { useMemo, useState } from 'react';
import { useMeQuery } from '@/lib/api/auth';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Video,
  Wifi,
  MapPinned,
} from 'lucide-react';
import { CreateEditIntentModalConnect } from '@/features/intents/components/create-edit-intent-modal-connect';
import { EventManagementModalConnect } from '@/app/account/intents/_components/managemen/event-management-modal-connect';
import { CancelIntentModals } from '@/app/account/intents/_components/cancel-intent-modals';
import { DeleteIntentModals } from '@/app/account/intents/_components/delete-intent-modals';
import {
  CloseJoinModal,
  ReopenJoinModal,
} from '@/app/account/intents/_components/close-join-modals';

// Helper function to get cover image based on categories
// Moved outside component to avoid React Hooks order issues
function getCoverImageUrl(categories: Array<{ slug: string; name: string }>) {
  // Map category slugs to Unsplash search terms
  const categoryImageMap: Record<string, string> = {
    sport: 'photo-1461896836934-ffe607ba8211', // Sports/fitness
    outdoor: 'photo-1551632811-561732d1e306', // Hiking/outdoor
    music: 'photo-1514320291840-2e0a9bf2a9ae', // Music/concert
    food: 'photo-1414235077428-338989a2e8c0', // Food/dining
    tech: 'photo-1519389950473-47ba0277781c', // Technology
    art: 'photo-1460661419201-fd4cecdf8a8b', // Art/creative
    education: 'photo-1523580494863-6f3031224c94', // Education/learning
    gaming: 'photo-1511512578047-dfb367046420', // Gaming
    social: 'photo-1511795409834-ef04bbd61622', // Social gathering
    wellness: 'photo-1545205597-3d9d02c29597', // Wellness/yoga
    business: 'photo-1557804506-669a67965ba0', // Business/networking
    travel: 'photo-1488646953014-85cb44e25828', // Travel/adventure
  };

  // Get the first category's image or use default
  const firstCategory = categories[0]?.slug;
  const imageId = firstCategory
    ? categoryImageMap[firstCategory] || 'photo-1540575467063-178a50c2df87'
    : 'photo-1540575467063-178a50c2df87'; // Default: team/group

  return `https://images.unsplash.com/${imageId}?w=1200&h=400&fit=crop&auto=format`;
}

type EventDetailClientProps = {
  intentId: string;
};

export function EventDetailClient({ intentId }: EventDetailClientProps) {
  // ALL HOOKS MUST BE AT THE TOP - before any conditional returns
  const { data, isLoading, error, refetch } = useIntentDetail(intentId);
  const { data: authData } = useMeQuery();

  // Modal states
  const [editOpen, setEditOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [closeJoinId, setCloseJoinId] = useState<string | null>(null);
  const [reopenJoinId, setReopenJoinId] = useState<string | null>(null);
  const [closeJoinReason, setCloseJoinReason] = useState('');

  // Get intent and user data (safe to access after hooks)
  const intent = data?.intent;
  const currentUserId = authData?.me?.id;

  // Check user membership status - must be declared before early returns
  const userMembership = useMemo(() => {
    if (!currentUserId || !intent?.members) return null;
    return intent.members.find((m) => m.userId === currentUserId);
  }, [currentUserId, intent?.members]);

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
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-950">
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
      avatarUrl: intent.owner?.imageUrl,
      verifiedAt: intent.owner?.verifiedAt,
    },
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
        imageUrl: m.user.imageUrl,
        verifiedAt: m.user.verifiedAt,
      },
      note: m.note,
      joinedAt: m.joinedAt,
    })),
    commentsCount: intent.commentsCount,
    messagesCount: intent.messagesCount,
    isFavourite: intent.isFavourite,
    savedCount: intent.savedCount,
    sponsorship: intent.sponsorship
      ? {
          plan: intent.sponsorship.plan as any,
          status: intent.sponsorship.status as any,
          highlightOn: intent.sponsorship.highlightOn,
          sponsor: {
            id: intent.sponsorship.sponsor.id,
            name: intent.sponsorship.sponsor.name,
          },
          startedAt: intent.sponsorship.startedAt ?? null,
          endsAt: intent.sponsorship.endsAt ?? null,
        }
      : undefined,
    inviteLinks: intent.inviteLinks?.map((link: any) => ({
      code: link.code,
      maxUses: link.maxUses ?? null,
      usedCount: link.usedCount,
      expiresAt: link.expiresAt ?? null,
    })),
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
    <div className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100 pb-20">
      {/* Back Navigation */}
      <div className="border-b border-neutral-200 bg-neutral-50/90 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/80">
        <div className="container mx-auto max-w-6xl px-4 py-3">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
          >
            ← Powrót do listy wydarzeń
          </a>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4 py-6">
        {/* Cover Photo with dynamic category-based image */}
        <div className="mb-6 -mt-6 -mx-4">
          <div className="relative h-64 md:h-80 lg:h-96 overflow-hidden rounded-b-3xl bg-gradient-to-br from-blue-500 to-purple-600">
            {/* Cover Image - dynamically based on category */}
            <img
              src={getCoverImageUrl(eventData.categories)}
              alt={eventData.title}
              className="h-full w-full object-cover"
              onError={(e) => {
                // Fallback to gradient background if image fails to load
                e.currentTarget.style.display = 'none';
              }}
            />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

            {/* Content Overlay */}
            <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8">
              <div className="container mx-auto max-w-6xl">
                {/* Categories Pills */}
                {eventData.categories.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {eventData.categories.slice(0, 3).map((cat) => (
                      <span
                        key={cat.slug}
                        className="inline-flex items-center rounded-full bg-white/20 backdrop-blur-sm px-3 py-1 text-xs font-medium text-white border border-white/30"
                      >
                        {cat.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Title */}
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white drop-shadow-2xl leading-tight">
                  {eventData.title}
                </h1>

                {/* Quick Info Bar */}
                <div className="mt-4 space-y-2">
                  {/* Primary Info Row */}
                  <div className="flex flex-wrap items-center gap-3 text-sm text-white/90">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {new Date(eventData.startISO).toLocaleDateString(
                          'pl-PL',
                          { day: 'numeric', month: 'long' }
                        )}
                      </span>
                    </div>
                    <span className="opacity-40">•</span>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      <span>
                        {new Date(eventData.startISO).toLocaleTimeString(
                          'pl-PL',
                          { hour: '2-digit', minute: '2-digit' }
                        )}
                      </span>
                    </div>
                    <span className="opacity-40">•</span>
                    <div className="flex items-center gap-1.5">
                      <Users className="h-4 w-4" />
                      <span>
                        {eventData.joinedCount} / {eventData.max}
                        <span className="ml-1 text-xs opacity-75">
                          (
                          {eventData.mode === 'ONE_TO_ONE' || eventData.max <= 2
                            ? 'Indywidualne'
                            : eventData.max <= 10
                              ? 'Kameralne'
                              : eventData.max <= 50
                                ? 'Grupowe'
                                : 'Masowe'}
                          )
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Location & Online Info Row */}
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    {/* Physical Location - only if visible */}
                    {eventData.meetingKind !== 'ONLINE' &&
                      eventData.address &&
                      (eventData.addressVisibility === 'PUBLIC' ||
                        (eventData.addressVisibility === 'AFTER_JOIN' &&
                          (isJoined || isOwner || isModerator))) && (
                        <div className="flex items-center gap-1.5 text-blue-200">
                          <MapPinned className="h-4 w-4" />
                          <span className="truncate max-w-[300px]">
                            {eventData.address.split(',')[0]}
                          </span>
                        </div>
                      )}

                    {/* Hidden location indicator */}
                    {eventData.meetingKind !== 'ONLINE' &&
                      eventData.address &&
                      !(
                        eventData.addressVisibility === 'PUBLIC' ||
                        (eventData.addressVisibility === 'AFTER_JOIN' &&
                          (isJoined || isOwner || isModerator))
                      ) && (
                        <div className="flex items-center gap-1.5 text-white/60">
                          <MapPin className="h-4 w-4" />
                          <span className="text-xs">
                            Lokalizacja{' '}
                            {eventData.addressVisibility === 'AFTER_JOIN'
                              ? 'widoczna po dołączeniu'
                              : 'ukryta'}
                          </span>
                        </div>
                      )}

                    {/* Online Meeting Info */}
                    {(eventData.meetingKind === 'ONLINE' ||
                      eventData.meetingKind === 'HYBRID') && (
                      <>
                        {eventData.meetingKind === 'HYBRID' &&
                          eventData.address &&
                          (eventData.addressVisibility === 'PUBLIC' ||
                            (eventData.addressVisibility === 'AFTER_JOIN' &&
                              (isJoined || isOwner || isModerator))) && (
                            <span className="opacity-40">•</span>
                          )}
                        <div className="flex items-center gap-1.5 text-green-300 font-medium">
                          {eventData.meetingKind === 'ONLINE' ? (
                            <Video className="h-4 w-4" />
                          ) : (
                            <Wifi className="h-4 w-4" />
                          )}
                          <span>
                            {eventData.meetingKind === 'ONLINE'
                              ? 'Spotkanie online'
                              : 'Dostępne online'}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
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
          <div className="space-y-6 min-w-0">
            <EventDetails event={eventData} />

            {/* Location Map - only show if coordinates are available and address visibility allows */}
            {eventData.lat != null &&
              eventData.lng != null &&
              eventData.meetingKind !== 'ONLINE' &&
              (eventData.addressVisibility === 'PUBLIC' ||
                (eventData.addressVisibility === 'AFTER_JOIN' &&
                  (isJoined || isOwner || isModerator))) && (
                <div className="rounded-2xl border border-neutral-200 bg-white/70 p-6 dark:border-neutral-800 dark:bg-neutral-900/40">
                  <h2 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
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
                    <div className="mt-4 flex items-start gap-3 rounded-xl px-2 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-900/40 transition">
                      <svg
                        className="mt-0.5 h-5 w-5 flex-shrink-0 text-neutral-500 dark:text-neutral-400"
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
                        <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                          Adres
                        </p>
                        <p className="text-md text-neutral-800 dark:text-neutral-200 break-words">
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

            {/* Admin Panel - tylko dla właściciela i moderatorów */}
            <EventAdminPanel
              event={eventData}
              onEdit={() => setEditOpen(true)}
              onManage={() => setManageOpen(true)}
              onCancel={() => setCancelId(intentId)}
              onDelete={() => setDeleteId(intentId)}
              onCloseJoin={() => setCloseJoinId(intentId)}
              onReopenJoin={() => setReopenJoinId(intentId)}
            />

            <EventActions event={eventData} />
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateEditIntentModalConnect
        intentId={editOpen ? intentId : undefined}
        open={editOpen}
        onClose={() => {
          setEditOpen(false);
          refetch();
        }}
      />

      <EventManagementModalConnect
        intentId={intentId}
        canManage={isOwner || isModerator}
        isPremium={!!eventData.sponsorship}
        open={manageOpen}
        onClose={() => {
          setManageOpen(false);
          refetch();
        }}
      />

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

      {/* Sticky Join Button at Bottom */}
      <StickyJoinButton event={eventData} />
    </div>
  );
}
