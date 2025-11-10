'use client';

import { useIntentDetail } from '@/hooks/use-intent-detail';
import { EventDetailSkeleton } from './event-detail-skeleton';
import { EventHero } from './event-hero';
import { EventDetails } from './event-details';
import { EventParticipants } from './event-participants';
import { EventJoinSection } from './event-join-section';
import { EventActions } from './event-actions';
import { EventAdminPanel } from './event-admin-panel';
import { computeJoinState } from '@/lib/utils/intent-join-state';
import type { EventDetailsData } from '@/types/event-details';
import { useMemo, useState } from 'react';
import { useMeQuery } from '@/lib/api/auth';
import { CreateEditIntentModalConnect } from '@/features/intents/components/create-edit-intent-modal-connect';
import { EventManagementModalConnect } from '@/app/account/intents/_components/managemen/event-management-modal-connect';
import { CancelIntentModals } from '@/app/account/intents/_components/cancel-intent-modals';
import { DeleteIntentModals } from '@/app/account/intents/_components/delete-intent-modals';

type EventDetailClientProps = {
  intentId: string;
};

export function EventDetailClient({ intentId }: EventDetailClientProps) {
  const { data, isLoading, error, refetch } = useIntentDetail(intentId);
  const { data: authData } = useMeQuery();

  // Modal states
  const [editOpen, setEditOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

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
  const currentUserId = authData?.me?.id;

  // Check user membership status
  const userMembership = useMemo(() => {
    if (!currentUserId || !intent.members) return null;
    return intent.members.find((m) => m.userId === currentUserId);
  }, [currentUserId, intent.members]);

  const isOwner = userMembership?.role === 'OWNER';
  const isModerator = userMembership?.role === 'MODERATOR';
  const isJoined = userMembership?.status === 'JOINED';
  const isPending = userMembership?.status === 'PENDING';
  const isInvited = userMembership?.status === 'INVITED';

  // Determine if user can see members based on visibility settings
  const canSeeMembers = useMemo(() => {
    if (intent.membersVisibility === 'PUBLIC') return true;
    if (intent.membersVisibility === 'AFTER_JOIN')
      return isJoined || isOwner || isModerator;
    return isOwner || isModerator; // HIDDEN
  }, [intent.membersVisibility, isJoined, isOwner, isModerator]);

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
          canSeeMembers,
        }
      : undefined,
    createdAt: intent.createdAt,
    updatedAt: intent.updatedAt,
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      {/* Back Navigation */}
      <div className="border-b border-zinc-200 bg-zinc-50/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="container mx-auto max-w-6xl px-4 py-3">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            ← Powrót do listy wydarzeń
          </a>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4 py-6">
        {/* Hero Section */}
        <div className="mb-6">
          <EventHero event={eventData} />
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* Left Column - Main Content */}
          <div className="space-y-6 min-w-0">
            <EventDetails event={eventData} />
            <EventParticipants event={eventData} />
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            <EventJoinSection event={eventData} />

            {/* Admin Panel - tylko dla właściciela i moderatorów */}
            <EventAdminPanel
              event={eventData}
              onEdit={() => setEditOpen(true)}
              onManage={() => setManageOpen(true)}
              onCancel={() => setCancelId(intentId)}
              onDelete={() => setDeleteId(intentId)}
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
    </div>
  );
}
