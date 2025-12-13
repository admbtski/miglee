/**
 * GraphQL Resolver Helpers
 *
 * This file contains:
 * - Prisma payload types for strict typing
 * - Mappers from Prisma models to GraphQL types
 * - Utility functions for data transformations
 */

import { Prisma, User as PrismaUser } from '@prisma/client';
import { toGQLCheckinMethods } from './helpers/checkin-types';
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
  Role,
  UserEffectivePlan,
  EventMemberRole,
  EventMemberStatus,
  PublicationStatus,
  SponsorshipStatus,
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
  EventSponsorship as GQLEventSponsorship,
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

function getViewerMembership(i: EventWithGraph, viewerId?: string) {
  // Safe access to members - may be undefined if not included
  type MemberLike = { userId: string; status: string; role: string };
  const m = viewerId
    ? ((i.members ?? []).find((mm: MemberLike) => mm.userId === viewerId) as
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

/**
 * Map a Prisma User to GraphQL User type.
 * Field resolvers handle: avatarBlurhash, profile, privacy, stats, socialLinks,
 * categoryLevels, availability, badges, effectivePlan, planEndsAt,
 * activeSubscription, activePlanPeriods
 */
export function mapUser(u: PrismaUser): GQLUser {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    avatarKey: u.avatarKey ?? null,
    role: u.role as Role,
    verifiedAt: u.verifiedAt ?? null,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
    lastSeenAt: u.lastSeenAt ?? null,
    suspendedAt: u.suspendedAt ?? null,
    suspensionReason: u.suspensionReason ?? null,
    locale: u.locale,
    timezone: u.timezone,
    acceptedTermsAt: u.acceptedTermsAt ?? null,
    acceptedMarketingAt: u.acceptedMarketingAt ?? null,
    // Field resolvers handle these - provide defaults
    avatarBlurhash: null,
    profile: null,
    privacy: null,
    stats: null,
    socialLinks: [],
    categoryLevels: [],
    availability: [],
    badges: [],
    effectivePlan: 'FREE' as UserEffectivePlan,
    planEndsAt: null,
    activeSubscription: null,
    activePlanPeriods: [],
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

/**
 * Map a Prisma EventMember to GraphQL EventMember type.
 * Field resolvers handle: event, joinAnswers
 */
export function mapEventMember(m: EventMemberWithUsers): GQLEventMember {
  return {
    id: m.id,
    eventId: m.eventId,
    userId: m.userId,
    role: m.role as EventMemberRole,
    status: m.status as EventMemberStatus,
    addedBy: m.addedBy ? mapUser(m.addedBy) : null,
    joinedAt: m.joinedAt ?? null,
    leftAt: m.leftAt ?? null,
    note: m.note ?? null,
    user: mapUser(m.user),
    rejectReason: (m as { rejectReason?: string | null }).rejectReason ?? null,

    // Check-in fields
    isCheckedIn: m.isCheckedIn ?? false,
    checkinMethods: toGQLCheckinMethods(m.checkinMethods ?? []),
    lastCheckinAt: m.lastCheckinAt ?? null,
    memberCheckinToken: m.memberCheckinToken ?? null,
    checkinBlockedAll: m.checkinBlockedAll ?? false,
    checkinBlockedMethods: toGQLCheckinMethods(m.checkinBlockedMethods ?? []),
    lastCheckinRejectionReason: m.lastCheckinRejectionReason ?? null,
    lastCheckinRejectedAt: m.lastCheckinRejectedAt ?? null,
    lastCheckinRejectedBy: null, // Field resolver will handle this if needed

    // Field resolvers handle these
    event: null as unknown as GQLEvent, // Lazy loaded by field resolver
    joinAnswers: [],
  };
}

/* ---- Event computed helpers ---- */

function computeEventDerived(i: EventWithGraph | any) {
  const now = new Date();

  const startDate = new Date(i.startAt);
  const endDate = new Date(i.endAt ?? i.startAt);

  // Safe access to members - may be undefined if not included
  const joinedCount = (i.members ?? []).filter(
    (m: { status: string }) => m.status === 'JOINED'
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

function resolveOwnerFromMembers(i: EventWithGraph): GQLUser | null {
  if (i.owner) {
    return mapUser(i.owner);
  }
  // Safe access to members - find OWNER member
  const ownerMember = (i.members ?? []).find(
    (m) => m.role === 'OWNER' && m.status === 'JOINED' && m.user
  );
  return ownerMember ? mapUser(ownerMember.user) : null;
}

/**
 * Map sponsorship to GraphQL type
 */
function mapSponsorship(
  s: NonNullable<EventWithGraph['sponsorship']>
): GQLEventSponsorship {
  return {
    id: s.id,
    eventId: s.eventId,
    sponsorId: s.sponsorId,
    plan: s.plan as EventPlan,
    status: s.status as SponsorshipStatus,
    startsAt: s.startsAt ?? null,
    endsAt: s.endsAt ?? null,
    boostsTotal: s.boostsTotal,
    boostsUsed: s.boostsUsed,
    localPushesTotal: s.localPushesTotal,
    localPushesUsed: s.localPushesUsed,
    stripeCheckoutSessionId: s.stripeCheckoutSessionId ?? null,
    stripePaymentEventId: s.stripePaymentEventId ?? null,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
    sponsor: mapUser(s.sponsor),
    // Field resolver handles event to avoid circular reference
    event: null as unknown as GQLEvent,
  };
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
    // joinManuallyClosedBy is handled by field resolver if needed
    joinManuallyClosedBy: null,
    joinManualCloseReason: i.joinManualCloseReason ?? null,

    meetingKind: i.meetingKind as MeetingKind,
    onlineUrl,

    lat,
    lng,
    address,
    placeId,
    radiusKm,
    cityName: i.cityName ?? null,
    cityPlaceId: i.cityPlaceId ?? null,

    levels: ((i.levels ?? []) as Level[]).sort(
      (a, b) => LEVEL_ORDER[a] - LEVEL_ORDER[b]
    ),

    // Media
    coverKey: i.coverKey ?? null,
    coverBlurhash: null, // Field resolver handles blurhash computation

    // Privacy toggles
    addressVisibility: i.addressVisibility as AddressVisibility,
    membersVisibility: i.membersVisibility as MembersVisibility,

    // Denormalized counters
    joinedCount,
    commentsCount: i.commentsCount ?? 0,
    messagesCount: i.messagesCount ?? 0,
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
    publicationStatus: (i.status ?? 'DRAFT') as PublicationStatus,
    publishedAt: i.publishedAt ?? null,
    scheduledPublishAt: i.scheduledPublishAt ?? null,

    // Billing & Sponsorship
    sponsorshipPlan: i.sponsorshipPlan as EventPlan,
    boostedAt: i.boostedAt ?? null,
    sponsorship: i.sponsorship ? mapSponsorship(i.sponsorship) : null,

    // Check-in configuration
    checkinEnabled: i.checkinEnabled ?? false,
    enabledCheckinMethods: toGQLCheckinMethods(i.enabledCheckinMethods ?? []),
    eventCheckinToken: i.eventCheckinToken ?? null,

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

    // Field resolvers handle these
    isFavourite: false,
    inviteLinks: [],
    faqs: [],
    joinQuestions: [],
    agendaItems: [],
    appearance: null,
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
    data: toJSONObject(n.data),
    dedupeKey: n.dedupeKey ?? null,
    readAt: n.readAt ?? null,
    createdAt: n.createdAt,

    recipient: mapUser(n.recipient),
    actor: n.actor ? mapUser(n.actor) : null,

    entityType: (n.entityType as NotificationEntity) ?? 'OTHER',
    entityId: n.entityId ?? null,

    // Event from notification has different include structure - needs type assertion
    event: n.event
      ? mapEvent(n.event as unknown as EventWithGraph, viewerId)
      : null,
  };
}

/* ---- DM Thread ---- */
export function mapDmThread(
  t: DmThreadWithGraph & { unreadCount?: number },
  _currentUserId?: string
): GQLDmThread {
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
    // lastMessage is computed separately to avoid circular dependency
    lastMessage: null,
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

    // Minimal thread reference to avoid circular dependency
    thread: {
      id: m.thread.id,
      aUserId: m.thread.aUserId,
      bUserId: m.thread.bUserId,
      pairKey: m.thread.pairKey,
      createdAt: m.thread.createdAt,
      updatedAt: m.thread.updatedAt,
      lastMessageAt: null,
      aUser: mapUser(m.thread.aUser),
      bUser: mapUser(m.thread.bUser),
      messages: [],
      unreadCount: 0,
      lastMessage: null,
    },
    sender: mapUser(m.sender),
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
          // Avoid deep nesting - minimal thread for reply
          thread: null as unknown as GQLDmThread,
          sender: mapUser(m.replyTo.sender),
          reactions: [],
          replyTo: null,
        }
      : null,
    reactions: [], // Field resolver handles reactions
  };
}

/* ---- DM Helpers ---- */
export function createPairKey(userId1: string, userId2: string): string {
  return [userId1, userId2].sort().join('|');
}

/* ---- Comment ---- */

// Extended type for Comment with optional moderation fields
type CommentExtended = CommentWithGraph & {
  deletedById?: string | null;
  hiddenAt?: Date | null;
  hiddenById?: string | null;
  deletedBy?: PrismaUser | null;
  hiddenBy?: PrismaUser | null;
  _count?: { replies: number };
};

export function mapComment(c: CommentExtended, viewerId?: string): GQLComment {
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
    deletedById: c.deletedById ?? null,
    hiddenAt: c.hiddenAt ?? null,
    hiddenById: c.hiddenById ?? null,

    // Event reference - field resolver can provide full event if needed
    event: c.event
      ? mapEvent(c.event as unknown as EventWithGraph, viewerId)
      : (null as unknown as GQLEvent),
    author: c.author ? mapUser(c.author) : (null as unknown as GQLUser),
    parent: c.parent
      ? mapComment(c.parent as unknown as CommentExtended, viewerId)
      : null,
    replies:
      c.replies?.map((r) =>
        mapComment(r as unknown as CommentExtended, viewerId)
      ) ?? [],
    deletedBy: c.deletedBy ? mapUser(c.deletedBy) : null,
    hiddenBy: c.hiddenBy ? mapUser(c.hiddenBy) : null,

    repliesCount: c._count?.replies ?? 0,
  };
}

/* ---- Review ---- */

// Extended type for Review with optional moderation fields
type ReviewExtended = ReviewWithGraph & {
  deletedById?: string | null;
  hiddenAt?: Date | null;
  hiddenById?: string | null;
  deletedBy?: PrismaUser | null;
  hiddenBy?: PrismaUser | null;
};

export function mapReview(r: ReviewExtended, viewerId?: string): GQLReview {
  return {
    id: r.id,
    eventId: r.eventId,
    authorId: r.authorId,
    rating: r.rating,
    content: r.content ?? null,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    deletedAt: r.deletedAt ?? null,
    deletedById: r.deletedById ?? null,
    hiddenAt: r.hiddenAt ?? null,
    hiddenById: r.hiddenById ?? null,

    event: r.event
      ? mapEvent(r.event as unknown as EventWithGraph, viewerId)
      : (null as unknown as GQLEvent),
    author: r.author ? mapUser(r.author) : (null as unknown as GQLUser),
    deletedBy: r.deletedBy ? mapUser(r.deletedBy) : null,
    hiddenBy: r.hiddenBy ? mapUser(r.hiddenBy) : null,
  };
}

/* ---- Report ---- */
export function mapReport(r: ReportWithGraph): GQLReport {
  return {
    id: r.id,
    reporterId: r.reporterId,
    entity: r.entity as GQLReport['entity'],
    entityId: r.entityId,
    reason: r.reason,
    status: (r.status as ReportStatus) ?? 'OPEN',
    createdAt: r.createdAt,
    resolvedAt: r.resolvedAt ?? null,

    reporter: mapUser(r.reporter),
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

    event: m.event
      ? mapEvent(m.event as unknown as EventWithGraph, viewerId)
      : (null as unknown as GQLEvent),
    author: mapUser(m.author),
    replyTo: m.replyTo
      ? mapEventChatMessage(
          m.replyTo as unknown as EventChatMessageWithGraph,
          viewerId
        )
      : null,

    isEdited: !!m.editedAt,
    isDeleted: !!m.deletedAt,
    reactions: [], // Field resolver handles reactions
  };
}

/* ---- UserBlock ---- */
export function mapUserBlock(b: UserBlockWithGraph): GQLUserBlock {
  return {
    id: b.id,
    blockerId: b.blockerId,
    blockedId: b.blockedId,
    createdAt: b.createdAt,

    blocker: mapUser(b.blocker),
    blocked: mapUser(b.blocked),
  };
}

/* ---- EventInviteLink ---- */
export function mapEventInviteLink(
  link: EventInviteLinkWithGraph,
  _viewerId?: string
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
    createdBy: link.createdBy ? mapUser(link.createdBy) : null,
    label: link.label ?? null,
    revokedAt: link.revokedAt ?? null,
    revokedById: link.revokedById ?? null,
    revokedBy: link.revokedBy ? mapUser(link.revokedBy) : null,
    createdAt: link.createdAt,
    updatedAt: link.updatedAt ?? null,

    event: link.event
      ? mapEvent(link.event as unknown as EventWithGraph, _viewerId)
      : (null as unknown as GQLEvent),

    isExpired,
    isMaxedOut,
    isRevoked,
    isValid,
    uses: [], // Field resolver handles uses
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

    user: mapUser(pref.user),
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
      ? mapEvent(mute.event as unknown as EventWithGraph, viewerId)
      : (null as unknown as GQLEvent),
    user: mapUser(mute.user),
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

    // Thread reference - simplified to avoid deep include requirements
    thread: {
      id: mute.thread.id,
      aUserId: mute.thread.aUserId,
      bUserId: mute.thread.bUserId,
      pairKey: mute.thread.pairKey,
      createdAt: mute.thread.createdAt,
      updatedAt: mute.thread.updatedAt,
      lastMessageAt: mute.thread.lastMessageAt ?? null,
      aUser: mapUser(mute.thread.aUser),
      bUser: mapUser(mute.thread.bUser),
      messages: [],
      unreadCount: 0,
      lastMessage: null,
    },
    user: mapUser(mute.user),
  };
}
export { toGQLCheckinMethods } from './helpers/checkin-types';
