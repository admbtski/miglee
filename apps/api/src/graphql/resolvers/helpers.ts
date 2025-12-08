// apps/api/src/graphql/helpers.ts
import { Prisma } from '@prisma/client';
import { EventStatus, JoinLockReason } from '../__generated__/resolvers-types';
import type {
  Level,
  MeetingKind,
  Mode,
  NotificationEntity,
  NotificationKind,
  Visibility,
  ReportStatus,
  EventPlan,
  // GraphQL result types:
  Event as GQLEvent,
  Notification as GQLNotification,
  User as GQLUser,
  Category as GQLCategory,
  Tag as GQLTag,
  EventMember as GQLEventMember,
  DmThread as GQLDmThread,
  DmMessage as GQLDmMessage,
  Comment as GQLComment,
  Review as GQLReview,
  Report as GQLReport,
  EventChatMessage as GQLEventChatMessage,
  UserBlock as GQLUserBlock,
  EventInviteLink as GQLEventInviteLink,
  NotificationPreference as GQLNotificationPreference,
  EventMute as GQLEventMute,
  DmMute as GQLDmMute,
  JoinMode,
  AddressVisibility,
  MembersVisibility,
} from '../__generated__/resolvers-types';

/* =============================================================================
 * Prisma payload types (strict includes) — kopiuj te include do zapytań!
 * ========================================================================== */

const LEVEL_ORDER: Record<Level, number> = {
  BEGINNER: 0,
  INTERMEDIATE: 1,
  ADVANCED: 2,
};

export type EventMemberWithUsers = Prisma.EventMemberGetPayload<{
  include: {
    user: { include: { profile: true } };
    addedBy: { include: { profile: true } };
  };
}>;

export type EventWithGraph = Prisma.EventGetPayload<{
  include: {
    categories: true;
    tags: true;
    members: {
      include: {
        user: { include: { profile: true } };
        addedBy: { include: { profile: true } };
      };
    };
    owner: { include: { profile: true } }; // właściciel (ownerId)
    canceledBy: { include: { profile: true } }; // kto anulował
    deletedBy: { include: { profile: true } }; // kto usunął
    sponsorship: {
      include: {
        sponsor: { include: { profile: true } };
      };
    };
  };
}>;

export type NotificationWithGraph = Prisma.NotificationGetPayload<{
  include: {
    recipient: true;
    actor: true;
    event: {
      include: {
        categories: true;
        tags: true;
        members: { include: { user: true; addedBy: true } };
        owner: true;
        canceledBy: true;
        deletedBy: true;
      };
    };
  };
}>;

export type DmThreadWithGraph = Prisma.DmThreadGetPayload<{
  include: {
    aUser: true;
    bUser: true;
    messages: {
      include: { sender: true };
      orderBy: { createdAt: 'desc' };
      take: 1;
    };
    mutes: true;
  };
}>;

export type DmMessageWithGraph = Prisma.DmMessageGetPayload<{
  include: {
    sender: true;
    thread: {
      include: {
        aUser: true;
        bUser: true;
      };
    };
    replyTo: {
      include: {
        sender: true;
      };
    };
  };
}>;

export type CommentWithGraph = Prisma.CommentGetPayload<{
  include: {
    author: true;
    event: true;
    parent: { include: { author: true } };
    replies: { include: { author: true } };
    _count: { select: { replies: true } };
  };
}>;

export type ReviewWithGraph = Prisma.ReviewGetPayload<{
  include: { author: true; event: true };
}>;

export type ReportWithGraph = Prisma.ReportGetPayload<{
  include: { reporter: true };
}>;

export type EventChatMessageWithGraph = Prisma.EventChatMessageGetPayload<{
  include: {
    author: true;
    event: true;
    replyTo: { include: { author: true } };
  };
}>;

export type UserBlockWithGraph = Prisma.UserBlockGetPayload<{
  include: { blocker: true; blocked: true };
}>;

export type EventInviteLinkWithGraph = Prisma.EventInviteLinkGetPayload<{
  include: { event: true; createdBy: true; revokedBy: true };
}>;

export type NotificationPreferenceWithGraph =
  Prisma.NotificationPreferenceGetPayload<{ include: { user: true } }>;

export type EventMuteWithGraph = Prisma.EventMuteGetPayload<{
  include: { event: true; user: true };
}>;

export type DmMuteWithGraph = Prisma.DmMuteGetPayload<{
  include: {
    thread: { include: { aUser: true; bUser: true } };
    user: true;
  };
}>;

/* =============================================================================
 * Small utils
 * ========================================================================== */

type JSONObject = Record<string, unknown>;

export function toJSONObject(v: Prisma.JsonValue): JSONObject {
  return v && typeof v === 'object' && !Array.isArray(v)
    ? (v as JSONObject)
    : {};
}

/** Safe JSON input do Prisma (GraphQL null vs SQL NULL semantics). */
export function toInputJson(
  v: unknown
):
  | Prisma.InputJsonValue
  | typeof Prisma.JsonNull
  | typeof Prisma.DbNull
  | undefined {
  if (v === undefined) return undefined;
  if (v === null) return Prisma.JsonNull;
  return v as Prisma.InputJsonValue;
}

/* =============================================================================
 * Location
 * ========================================================================== */

export type LocationInputShape = {
  lat?: number | null;
  lng?: number | null;
  address?: string | null;
  placeId?: string | null;
  radiusKm?: number | null;
  cityName?: string | null;
  cityPlaceId?: string | null;
};

/** Normalize LocationInput into prisma fields; preserves explicit nulls. */
export function pickLocation(
  input?: LocationInputShape | null
): Partial<LocationInputShape> {
  if (!input) return {};
  const out: Partial<LocationInputShape> = {};
  if ('lat' in input) out.lat = input.lat ?? null;
  if ('lng' in input) out.lng = input.lng ?? null;
  if ('address' in input) out.address = input.address ?? null;
  if ('placeId' in input) out.placeId = input.placeId ?? null;
  if ('radiusKm' in input) out.radiusKm = input.radiusKm ?? null;
  if ('cityName' in input) out.cityName = input.cityName ?? null;
  if ('cityPlaceId' in input) out.cityPlaceId = input.cityPlaceId ?? null;
  return out;
}

/* =============================================================================
 * Helpers (viewer-aware visibility)
 * ========================================================================== */

function getViewerMembership(i: EventWithGraph | any, viewerId?: string) {
  // Safe access to members - may be undefined if not included
  const m = viewerId
    ? ((i.members ?? []).find((mm: any) => mm.userId === viewerId) as
        | (EventMemberWithUsers & { status: string; role: string })
        | undefined)
    : undefined;

  const role =
    (m?.role as 'OWNER' | 'MODERATOR' | 'PARTICIPANT' | undefined) ?? null;
  const status =
    (m?.status as
      | 'JOINED'
      | 'PENDING'
      | 'INVITED'
      | 'REJECTED'
      | 'BANNED'
      | 'LEFT'
      | 'KICKED'
      | undefined) ?? null;

  const viewerJoined = status === 'JOINED';
  const isOwnerOrModerator = role === 'OWNER' || role === 'MODERATOR';
  const isParticipant = viewerJoined; // „participant” w interfejsie = realnie JOINED

  return {
    role,
    status,
    viewerJoined,
    isOwnerOrModerator,
    isParticipant,
    member: m,
  };
}

type VisibilityLike =
  | 'PUBLIC'
  | 'HIDDEN'
  | 'AFTER_JOIN'
  | 'JOINED_ONLY'
  | 'INVITED_ONLY'
  | null
  | undefined;

/**
 * Reguły:
 * - PUBLIC: zawsze widać.
 * - HIDDEN: widzą OWNER/MODERATOR.
 * - AFTER_JOIN / JOINED_ONLY / INVITED_ONLY: widzą OWNER/MODERATOR oraz uczestnik (JOINED).
 */
function canSeeWithRole(
  vis: VisibilityLike,
  opts: { isOwnerOrModerator: boolean; isParticipant: boolean }
): boolean {
  if (!vis) return true;
  if (vis === 'PUBLIC') return true;
  if (vis === 'HIDDEN') return opts.isOwnerOrModerator;
  if (vis === 'AFTER_JOIN' || vis === 'JOINED_ONLY' || vis === 'INVITED_ONLY') {
    return opts.isOwnerOrModerator || opts.isParticipant;
  }
  return true;
}

/* =============================================================================
 * Mappers (strict typing)
 * ========================================================================== */

export function mapUser(u: NotificationWithGraph['recipient']): GQLUser {
  const avatarKey = u.avatarKey ?? null;
  return {
    id: u.id,
    email: u.email,
    name: (u as any).name ?? null,
    avatarKey,
    role: (u.role ?? 'USER') as any,
    verifiedAt: u.verifiedAt ?? null,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
    lastSeenAt: u.lastSeenAt,
    suspendedAt: u.suspendedAt,
    suspensionReason: (u as any).suspensionReason ?? null,
    locale: (u as any).locale ?? 'en',
    timezone: (u as any).timezone ?? 'UTC',
    acceptedTermsAt: (u as any).acceptedTermsAt ?? null,
    acceptedMarketingAt: (u as any).acceptedMarketingAt ?? null,
  };
}

export function mapCategory(
  c: EventWithGraph['categories'][number]
): GQLCategory {
  return {
    id: c.id,
    slug: c.slug,
    names: toJSONObject(c.names),
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

export function mapTag(t: EventWithGraph['tags'][number]): GQLTag {
  return {
    id: t.id,
    label: t.label,
    slug: t.slug,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  };
}

export function mapEventMember(m: EventMemberWithUsers): GQLEventMember {
  return {
    id: m.id,
    eventId: m.eventId,
    userId: m.userId,
    role: (m.role as any) ?? 'PARTICIPANT',
    status: (m.status as any) ?? 'PENDING',
    addedBy: m.addedBy ? mapUser(m.addedBy as any) : null,
    joinedAt: m.joinedAt ?? null,
    leftAt: m.leftAt ?? null,
    note: m.note ?? null,
    user: mapUser(m.user as any),
  };
}

/* ---- Event computed helpers ---- */

function computeEventDerived(i: EventWithGraph | any) {
  const now = new Date();

  const startDate = new Date(i.startAt);
  const endDate = new Date(i.endAt ?? i.startAt);

  // Safe access to members - may be undefined if not included
  const joinedCount = (i.members ?? []).filter(
    (m: any) => m.status === 'JOINED'
  ).length;
  const isFull =
    typeof i.max === 'number' && i.max > 0 ? joinedCount >= i.max : false;
  const hasStarted = now >= startDate;
  const isOngoing = now >= startDate && now < endDate;
  const hasEnded = now >= endDate;
  const isCanceled = Boolean(i.canceledAt);
  const isDeleted = Boolean(i.deletedAt);

  // withinLock: true when in any time-based "closing" window or manual close
  let withinLock = false;

  if (i.joinManuallyClosed) {
    withinLock = true;
  } else if (!hasStarted) {
    // Before start: check NOT_OPEN_YET or CUTOFF
    if (i.joinOpensMinutesBeforeStart != null) {
      const openTime = new Date(
        startDate.getTime() - i.joinOpensMinutesBeforeStart * 60_000
      );
      if (now < openTime) {
        withinLock = true; // NOT_OPEN_YET
      }
    }
    if (!withinLock && i.joinCutoffMinutesBeforeStart != null) {
      const cutoffTime = new Date(
        startDate.getTime() - i.joinCutoffMinutesBeforeStart * 60_000
      );
      if (now >= cutoffTime) {
        withinLock = true; // CUTOFF
      }
    }
  } else if (!hasEnded) {
    // After start, before end: check NO_LATE_JOIN or LATE_CUTOFF
    if (!i.allowJoinLate) {
      withinLock = true; // NO_LATE_JOIN
    } else if (i.lateJoinCutoffMinutesAfterStart != null) {
      const lateCutoff = new Date(
        startDate.getTime() + i.lateJoinCutoffMinutesAfterStart * 60_000
      );
      if (now >= lateCutoff) {
        withinLock = true; // LATE_CUTOFF
      }
    }
  }

  const canJoin =
    !isFull && !withinLock && !isDeleted && !isCanceled && !hasEnded;

  return {
    joinedCount,
    isFull,
    hasStarted,
    hasEnded,
    isCanceled,
    isDeleted,
    isOngoing,
    withinLock,
    canJoin,
  };
}

/**
 * Compute high-level EventStatus from derived flags.
 * Priority order: DELETED > CANCELED > PAST > ONGOING > UPCOMING
 *
 * Note: UPCOMING is computed here for individual event detail views.
 * For list queries, status filtering is done in SQL (see events.ts resolver).
 */
function computeEventStatus(
  derived: ReturnType<typeof computeEventDerived>
): EventStatus {
  if (derived.isDeleted) return EventStatus.Deleted;
  if (derived.isCanceled) return EventStatus.Canceled;
  if (derived.hasEnded) return EventStatus.Past;
  if (derived.isOngoing) return EventStatus.Ongoing;
  // If not started yet → UPCOMING
  if (!derived.hasStarted) return EventStatus.Upcoming;
  // Fallback (shouldn't normally reach here)
  return EventStatus.Upcoming;
}

/**
 * Compute whether joins are currently open and the lock reason if not.
 */
function computeJoinOpenAndReason(i: EventWithGraph): {
  joinOpen: boolean;
  lockReason: JoinLockReason | null;
} {
  const now = new Date();
  const { startAt, endAt, joinMode, joinManuallyClosed, allowJoinLate } = i;
  const {
    joinOpensMinutesBeforeStart,
    joinCutoffMinutesBeforeStart,
    lateJoinCutoffMinutesAfterStart,
  } = i;

  const hasStarted = now >= startAt;
  const hasEnded = now >= endAt;
  const derived = computeEventDerived(i);

  // Hard blocks first
  if (derived.isDeleted)
    return { joinOpen: false, lockReason: JoinLockReason.Deleted };
  if (derived.isCanceled)
    return { joinOpen: false, lockReason: JoinLockReason.Canceled };
  if (hasEnded) return { joinOpen: false, lockReason: JoinLockReason.Ended };
  if (derived.isFull)
    return { joinOpen: false, lockReason: JoinLockReason.Full };
  if (joinManuallyClosed)
    return { joinOpen: false, lockReason: JoinLockReason.Manual };
  if (joinMode === 'INVITE_ONLY')
    return { joinOpen: false, lockReason: JoinLockReason.InviteOnly };

  // Time-based windows
  if (!hasStarted) {
    // Before start
    if (joinOpensMinutesBeforeStart != null) {
      const openTime = new Date(
        startAt.getTime() - joinOpensMinutesBeforeStart * 60_000
      );
      if (now < openTime) {
        return { joinOpen: false, lockReason: JoinLockReason.NotOpenYet };
      }
    }

    if (joinCutoffMinutesBeforeStart != null) {
      const cutoffTime = new Date(
        startAt.getTime() - joinCutoffMinutesBeforeStart * 60_000
      );
      if (now >= cutoffTime) {
        return { joinOpen: false, lockReason: JoinLockReason.Cutoff };
      }
    }
  } else {
    // After start
    if (!allowJoinLate) {
      return { joinOpen: false, lockReason: JoinLockReason.NoLateJoin };
    }

    if (lateJoinCutoffMinutesAfterStart != null) {
      const lateCutoff = new Date(
        startAt.getTime() + lateJoinCutoffMinutesAfterStart * 60_000
      );
      if (now >= lateCutoff) {
        return { joinOpen: false, lockReason: JoinLockReason.LateCutoff };
      }
    }
  }

  return { joinOpen: true, lockReason: null };
}

function resolveOwnerFromMembers(i: EventWithGraph | any): GQLUser | null {
  if (i.owner) {
    return mapUser(i.owner);
  }
  // Safe access to members - may be undefined if not included
  const owner = (i.members ?? []).find(
    (m: any) => m.role === 'OWNER' && m.status === 'JOINED' && (m as any).user
  ) as any;
  return owner ? mapUser(owner.user) : null;
}

export function mapEvent(i: EventWithGraph, viewerId?: string): GQLEvent {
  const derived = computeEventDerived(i);
  const {
    joinedCount,
    isFull,
    hasStarted,
    hasEnded,
    isCanceled,
    isDeleted,
    canJoin,
    isOngoing,
    withinLock,
  } = derived;

  const status = computeEventStatus(derived);
  const { joinOpen, lockReason } = computeJoinOpenAndReason(i);

  const { isOwnerOrModerator, isParticipant } = getViewerMembership(
    i,
    viewerId
  );

  // Members visibility (po rolach)
  const canSeeMembers = canSeeWithRole(
    i.membersVisibility as MembersVisibility,
    { isOwnerOrModerator, isParticipant }
  );
  // Safe access to members - may be undefined if not included
  const visibleMembers = canSeeMembers ? (i.members ?? []) : [];

  // Address/online visibility (po rolach)
  const canSeeLocationAndUrl = canSeeWithRole(
    i.addressVisibility as AddressVisibility,
    { isOwnerOrModerator, isParticipant }
  );

  const lat = i.lat ?? null;
  const lng = i.lng ?? null;
  const radiusKm = i.radiusKm ?? null;
  const placeId = i.placeId ?? null;

  const address = canSeeLocationAndUrl ? (i.address ?? null) : null;
  const onlineUrl = canSeeLocationAndUrl ? (i.onlineUrl ?? null) : null;

  return {
    id: i.id,
    title: i.title,
    description: i.description ?? null,
    notes: i.notes ?? null,

    visibility: i.visibility as Visibility,
    joinMode: (i.joinMode as JoinMode) ?? 'OPEN',
    mode: i.mode as Mode,
    min: i.min,
    max: i.max,

    startAt: i.startAt,
    endAt: i.endAt,

    // Join control fields
    joinOpensMinutesBeforeStart: i.joinOpensMinutesBeforeStart ?? null,
    joinCutoffMinutesBeforeStart: i.joinCutoffMinutesBeforeStart ?? null,
    allowJoinLate: i.allowJoinLate,
    lateJoinCutoffMinutesAfterStart: i.lateJoinCutoffMinutesAfterStart ?? null,
    joinManuallyClosed: i.joinManuallyClosed,
    joinManuallyClosedAt: i.joinManuallyClosedAt ?? null,
    joinManuallyClosedBy: (i as any).joinManuallyClosedBy
      ? mapUser((i as any).joinManuallyClosedBy)
      : null,
    joinManualCloseReason: i.joinManualCloseReason ?? null,

    meetingKind: i.meetingKind as MeetingKind,
    onlineUrl,

    lat,
    lng,
    address,
    placeId,
    radiusKm,

    levels: ((i.levels ?? []) as Level[]).sort(
      (a, b) => LEVEL_ORDER[a] - LEVEL_ORDER[b]
    ),

    // Media
    coverKey: (i as any).coverKey ?? null,
    coverBlurhash: (i as any).coverBlurhash ?? null,

    // Privacy toggles (zwracamy zawsze)
    addressVisibility: i.addressVisibility as AddressVisibility,
    membersVisibility: i.membersVisibility as MembersVisibility,

    // Denormalized counters
    joinedCount,
    commentsCount: (i as any).commentsCount ?? 0,
    messagesCount: (i as any).messagesCount ?? 0,
    savedCount: i.savedCount ?? 0,

    // Ownership
    ownerId: i.ownerId ?? null,

    // Cancellation
    canceledAt: i.canceledAt ?? null,
    canceledBy: i.canceledBy ? mapUser(i.canceledBy) : null,
    cancelReason: i.cancelReason ?? null,
    isCanceled,

    // Soft-delete
    deletedAt: i.deletedAt ?? null,
    deletedBy: i.deletedBy ? mapUser(i.deletedBy) : null,
    deleteReason: i.deleteReason ?? null,
    isDeleted,

    // Publication status
    publicationStatus: (i.status as any) ?? 'DRAFT',
    publishedAt: i.publishedAt ?? null,
    scheduledPublishAt: i.scheduledPublishAt ?? null,

    // Billing & Sponsorship
    sponsorshipPlan: i.sponsorshipPlan as EventPlan,
    boostedAt: i.boostedAt ?? null,
    sponsorship: i.sponsorship
      ? ({
          plan: i.sponsorship.plan as EventPlan,
          status: i.sponsorship.status as any,
          startsAt: i.sponsorship.startsAt ?? null,
          endsAt: i.sponsorship.endsAt ?? null,
          boostsTotal: i.sponsorship.boostsTotal,
          boostsUsed: i.sponsorship.boostsUsed,
          localPushesTotal: i.sponsorship.localPushesTotal,
          localPushesUsed: i.sponsorship.localPushesUsed,
          sponsor: i.sponsorship.sponsor
            ? {
                id: i.sponsorship.sponsor.id,
                name: i.sponsorship.sponsor.name,
              }
            : null,
        } as any)
      : null,

    // Collections (safe access - may be undefined if not included)
    categories: (i.categories ?? []).map(mapCategory),
    tags: (i.tags ?? []).map(mapTag),

    // Convenience relations
    owner: resolveOwnerFromMembers(i),
    members: visibleMembers.map(mapEventMember),

    // Computed helpers
    status,
    isFull,
    hasStarted,
    hasEnded,
    canJoin,
    isOngoing,
    withinLock,
    joinOpen,
    lockReason,
    isOnline: i.meetingKind === 'ONLINE',
    isHybrid: i.meetingKind === 'HYBRID',
    isOnsite: i.meetingKind === 'ONSITE',

    createdAt: i.createdAt,
    updatedAt: i.updatedAt,
  };
}

/* ---- Notification ---- */
export function mapNotification(
  n: NotificationWithGraph,
  viewerId?: string
): GQLNotification {
  return {
    id: n.id,
    kind: (n.kind as NotificationKind) ?? 'SYSTEM',
    title: n.title ?? null,
    body: n.body ?? null,
    data: (n.data ?? null) as any,
    dedupeKey: n.dedupeKey ?? null,
    readAt: n.readAt ?? null,
    createdAt: n.createdAt,

    recipient: mapUser(n.recipient),
    actor: n.actor ? mapUser(n.actor) : null,

    entityType: (n.entityType as NotificationEntity) ?? 'OTHER',
    entityId: n.entityId ?? null,

    event: n.event ? mapEvent(n.event as any, viewerId) : null,
  };
}

/* ---- DM Thread ---- */
export function mapDmThread(
  t: DmThreadWithGraph & { unreadCount?: number },
  _currentUserId?: string
): GQLDmThread {
  const lastMessage = t.messages?.[0] ?? null;

  // Use provided unreadCount or default to 0
  const unreadCount = t.unreadCount ?? 0;

  return {
    id: t.id,
    aUserId: t.aUserId,
    bUserId: t.bUserId,
    pairKey: t.pairKey,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
    lastMessageAt: t.lastMessageAt ?? null,

    aUser: mapUser(t.aUser),
    bUser: mapUser(t.bUser),
    messages: [],

    unreadCount,
    lastMessage: lastMessage ? mapDmMessage(lastMessage as any) : null,
  };
}

/* ---- DM Message ---- */
export function mapDmMessage(m: DmMessageWithGraph): GQLDmMessage {
  return {
    id: m.id,
    threadId: m.threadId,
    senderId: m.senderId,
    content: m.content,
    replyToId: m.replyToId ?? null,
    createdAt: m.createdAt,
    readAt: m.readAt ?? null,
    editedAt: m.editedAt ?? null,
    deletedAt: m.deletedAt ?? null,

    thread: m.thread ? (mapDmThread(m.thread as any) as any) : ({} as any),
    sender: mapUser(m.sender as any),
    replyTo: m.replyTo
      ? {
          id: m.replyTo.id,
          threadId: m.replyTo.threadId,
          senderId: m.replyTo.senderId,
          content: m.replyTo.content,
          replyToId: m.replyTo.replyToId ?? null,
          createdAt: m.replyTo.createdAt,
          readAt: m.replyTo.readAt ?? null,
          editedAt: m.replyTo.editedAt ?? null,
          deletedAt: m.replyTo.deletedAt ?? null,
          thread: {} as any, // Avoid circular reference
          sender: mapUser(m.replyTo.sender as any),
          reactions: [], // Don't need reactions for reply preview
        }
      : null,
    reactions: [], // Will be populated by field resolver
  };
}

/* ---- DM Helpers ---- */
export function createPairKey(userId1: string, userId2: string): string {
  return [userId1, userId2].sort().join('|');
}

/* ---- Comment ---- */
export function mapComment(c: CommentWithGraph, viewerId?: string): GQLComment {
  return {
    id: c.id,
    eventId: c.eventId,
    authorId: c.authorId,
    threadId: c.threadId,
    parentId: c.parentId ?? null,
    content: c.content,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    deletedAt: c.deletedAt ?? null,
    deletedById: (c as any).deletedById ?? null,
    hiddenAt: (c as any).hiddenAt ?? null,
    hiddenById: (c as any).hiddenById ?? null,

    event: c.event ? (mapEvent(c.event as any, viewerId) as any) : ({} as any),
    author: c.author ? mapUser(c.author as any) : (null as any),
    parent: c.parent ? (mapComment(c.parent as any, viewerId) as any) : null,
    replies: c.replies?.map((r) => mapComment(r as any, viewerId) as any) ?? [],
    deletedBy: (c as any).deletedBy ? mapUser((c as any).deletedBy) : null,
    hiddenBy: (c as any).hiddenBy ? mapUser((c as any).hiddenBy) : null,

    repliesCount: (c as any)._count?.replies ?? 0,
  };
}

/* ---- Review ---- */
export function mapReview(r: ReviewWithGraph, viewerId?: string): GQLReview {
  return {
    id: r.id,
    eventId: r.eventId,
    authorId: r.authorId,
    rating: r.rating,
    content: r.content ?? null,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    deletedAt: r.deletedAt ?? null,
    deletedById: (r as any).deletedById ?? null,
    hiddenAt: (r as any).hiddenAt ?? null,
    hiddenById: (r as any).hiddenById ?? null,

    event: r.event ? (mapEvent(r.event as any, viewerId) as any) : ({} as any),
    author: r.author ? mapUser(r.author as any) : (null as any),
    deletedBy: (r as any).deletedBy ? mapUser((r as any).deletedBy) : null,
    hiddenBy: (r as any).hiddenBy ? mapUser((r as any).hiddenBy) : null,
  };
}

/* ---- Report ---- */
export function mapReport(r: ReportWithGraph): GQLReport {
  return {
    id: r.id,
    reporterId: r.reporterId,
    entity: r.entity as any,
    entityId: r.entityId,
    reason: r.reason,
    status: (r.status as ReportStatus) ?? 'OPEN',
    createdAt: r.createdAt,
    resolvedAt: r.resolvedAt ?? null,

    reporter: mapUser(r.reporter as any),
  };
}

/* ---- EventChatMessage ---- */
export function mapEventChatMessage(
  m: EventChatMessageWithGraph,
  viewerId?: string
): GQLEventChatMessage {
  return {
    id: m.id,
    eventId: m.eventId,
    authorId: m.authorId,
    content: m.content,
    replyToId: m.replyToId ?? null,
    createdAt: m.createdAt,
    editedAt: m.editedAt ?? null,
    deletedAt: m.deletedAt ?? null,

    event: m.event ? (mapEvent(m.event as any, viewerId) as any) : ({} as any),
    author: mapUser(m.author as any),
    replyTo: m.replyTo
      ? (mapEventChatMessage(m.replyTo as any, viewerId) as any)
      : null,

    isEdited: !!m.editedAt,
    isDeleted: !!m.deletedAt,
  };
}

/* ---- UserBlock ---- */
export function mapUserBlock(b: UserBlockWithGraph): GQLUserBlock {
  return {
    id: b.id,
    blockerId: b.blockerId,
    blockedId: b.blockedId,
    createdAt: b.createdAt,

    blocker: mapUser(b.blocker as any),
    blocked: mapUser(b.blocked as any),
  };
}

/* ---- EventInviteLink ---- */
export function mapEventInviteLink(
  link: EventInviteLinkWithGraph,
  viewerId?: string
): GQLEventInviteLink {
  const now = new Date();
  const isExpired = link.expiresAt ? link.expiresAt < now : false;
  const isMaxedOut = link.maxUses ? link.usedCount >= link.maxUses : false;
  const isRevoked = !!link.revokedAt;
  const isValid = !isExpired && !isMaxedOut && !isRevoked;

  return {
    id: link.id,
    eventId: link.eventId,
    code: link.code,
    maxUses: link.maxUses ?? null,
    usedCount: link.usedCount,
    expiresAt: link.expiresAt ?? null,
    createdById: link.createdById ?? null,
    createdBy: link.createdBy
      ? (mapUser(link.createdBy, viewerId) as any)
      : null,
    label: link.label ?? null,
    revokedAt: link.revokedAt ?? null,
    revokedById: link.revokedById ?? null,
    revokedBy: link.revokedBy
      ? (mapUser(link.revokedBy, viewerId) as any)
      : null,
    createdAt: link.createdAt,
    updatedAt: link.updatedAt ?? null,

    event: link.event
      ? (mapEvent(link.event as any, viewerId) as any)
      : ({} as any),

    isExpired,
    isMaxedOut,
    isRevoked,
    isValid,
  };
}

/* ---- NotificationPreference ---- */
export function mapNotificationPreference(
  pref: NotificationPreferenceWithGraph
): GQLNotificationPreference {
  return {
    id: pref.id,
    userId: pref.userId,
    emailOnInvite: pref.emailOnInvite,
    emailOnJoinRequest: pref.emailOnJoinRequest,
    emailOnMessage: pref.emailOnMessage,
    pushOnReminder: pref.pushOnReminder,
    inAppOnEverything: pref.inAppOnEverything,
    createdAt: pref.createdAt,
    updatedAt: pref.updatedAt,

    user: mapUser(pref.user as any),
  };
}

/* ---- EventMute ---- */
export function mapEventMute(
  mute: EventMuteWithGraph,
  viewerId?: string
): GQLEventMute {
  return {
    id: mute.id,
    eventId: mute.eventId,
    userId: mute.userId,
    muted: mute.muted,
    createdAt: mute.createdAt,

    event: mute.event
      ? (mapEvent(mute.event as any, viewerId) as any)
      : ({} as any),
    user: mapUser(mute.user as any),
  };
}

/* ---- DmMute ---- */
export function mapDmMute(mute: DmMuteWithGraph): GQLDmMute {
  return {
    id: mute.id,
    threadId: mute.threadId,
    userId: mute.userId,
    muted: mute.muted,
    createdAt: mute.createdAt,

    thread: mute.thread
      ? (mapDmThread(mute.thread as any) as any)
      : ({} as any),
    user: mapUser(mute.user as any),
  };
}
