'use client';

import { useGetIntentQuery } from '@/lib/api/__generated__/react-query-update';
import { EventDetailSkeleton } from './event-detail-skeleton';
import { EventHero } from './event-hero';
import { EventDetails } from './event-details';
import { EventParticipants } from './event-participants';
import { EventJoinSection } from './event-join-section';
import { EventActions } from './event-actions';
import { computeJoinState } from '@/lib/utils/intent-join-state';
import type { EventDetailsData } from '@/types/event-details';

type EventDetailClientProps = {
  intentId: string;
};

export function EventDetailClient({ intentId }: EventDetailClientProps) {
  const { data, isLoading, error } = useGetIntentQuery({
    id: intentId,
  });

  if (isLoading) {
    return <EventDetailSkeleton />;
  }

  if (error || !data?.intent) {
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

  const intent = data.intent;

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
    categories: intent.categories.map((cat) => ({
      slug: cat.slug,
      name: (cat.names as any)?.pl ?? cat.slug,
    })),
    tags: intent.tags.map((tag) => ({
      slug: tag.slug,
      label: tag.label,
    })),
    canceledAt: intent.canceledAt,
    cancelReason: intent.cancelReason,
    deletedAt: intent.deletedAt,
    deleteReason: intent.deleteReason,
    members: intent.members?.map((m) => ({
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
    sponsorship: (intent as any).sponsorship
      ? {
          plan: (intent as any).sponsorship.plan as any,
          status: (intent as any).sponsorship.status as any,
          highlightOn: (intent as any).sponsorship.highlightOn,
          sponsor: {
            id: (intent as any).sponsorship.sponsor.id,
            name: (intent as any).sponsorship.sponsor.name,
          },
          startedAt: (intent as any).sponsorship.startedAt,
          endsAt: (intent as any).sponsorship.endsAt,
        }
      : undefined,
    inviteLinks: (intent as any).inviteLinks?.map((link: any) => ({
      code: link.code,
      maxUses: link.maxUses,
      usedCount: link.usedCount,
      expiresAt: link.expiresAt,
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
    createdAt: intent.createdAt,
    updatedAt: intent.updatedAt,
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      {/* Hero Section */}
      <EventHero event={eventData} />

      {/* Main Content Grid */}
      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        {/* Left Column - Main Content */}
        <div className="space-y-6 lg:col-span-2">
          <EventDetails event={eventData} />
          <EventParticipants event={eventData} />
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          <EventJoinSection event={eventData} />
          <EventActions event={eventData} />
        </div>
      </div>
    </div>
  );
}
