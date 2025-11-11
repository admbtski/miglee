// apps/api/src/graphql/helpers.ts
import { Prisma } from '@prisma/client';
import { IntentStatus, JoinLockReason } from '../__generated__/resolvers-types';
import type {
  Level,
  MeetingKind,
  Mode,
  NotificationEntity,
  NotificationKind,
  Visibility,
  ReportStatus,
  // GraphQL result types:
  Intent as GQLIntent,
  Notification as GQLNotification,
  User as GQLUser,
  Category as GQLCategory,
  Tag as GQLTag,
  IntentMember as GQLIntentMember,
  DmThread as GQLDmThread,
  DmMessage as GQLDmMessage,
  Comment as GQLComment,
  Review as GQLReview,
  Report as GQLReport,
  IntentChatMessage as GQLIntentChatMessage,
  UserBlock as GQLUserBlock,
  IntentInviteLink as GQLIntentInviteLink,
  NotificationPreference as GQLNotificationPreference,
  IntentMute as GQLIntentMute,
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

export type IntentMemberWithUsers = Prisma.IntentMemberGetPayload<{
  include: { user: true; addedBy: true };
}>;

export type IntentWithGraph = Prisma.IntentGetPayload<{
  include: {
    categories: true;
    tags: true;
    members: { include: { user: true; addedBy: true } };
    owner: true; // właściciel (ownerId)
    canceledBy: true; // kto anulował
    deletedBy: true; // kto usunął
  };
}>;

export type NotificationWithGraph = Prisma.NotificationGetPayload<{
  include: {
    recipient: true;
    actor: true;
    intent: {
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
    intent: true;
    parent: { include: { author: true } };
    replies: { include: { author: true } };
    _count: { select: { replies: true } };
  };
}>;

export type ReviewWithGraph = Prisma.ReviewGetPayload<{
  include: { author: true; intent: true };
}>;

export type ReportWithGraph = Prisma.ReportGetPayload<{
  include: { reporter: true };
}>;

export type IntentChatMessageWithGraph = Prisma.IntentChatMessageGetPayload<{
  include: {
    author: true;
    intent: true;
    replyTo: { include: { author: true } };
  };
}>;

export type UserBlockWithGraph = Prisma.UserBlockGetPayload<{
  include: { blocker: true; blocked: true };
}>;

export type IntentInviteLinkWithGraph = Prisma.IntentInviteLinkGetPayload<{
  include: { intent: true };
}>;

export type NotificationPreferenceWithGraph =
  Prisma.NotificationPreferenceGetPayload<{ include: { user: true } }>;

export type IntentMuteWithGraph = Prisma.IntentMuteGetPayload<{
  include: { intent: true; user: true };
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
  return out;
}

/* =============================================================================
 * Helpers (viewer-aware visibility)
 * ========================================================================== */

function getViewerMembership(i: IntentWithGraph | any, viewerId?: string) {
  // Safe access to members - may be undefined if not included
  const m = viewerId
    ? ((i.members ?? []).find((mm: any) => mm.userId === viewerId) as
        | (IntentMemberWithUsers & { status: string; role: string })
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
  return {
    id: u.id,
    email: u.email,
    name: (u as any).name ?? null,
    imageUrl: (u as any).imageUrl ?? null,
    role: (u.role ?? 'USER') as any,
    verifiedAt: u.verifiedAt ?? null,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
    lastSeenAt: u.lastSeenAt,
    suspendedAt: u.suspendedAt,
    suspensionReason: (u as any).suspensionReason ?? null,
    locale: (u as any).locale ?? null,
    tz: (u as any).tz ?? null,
    acceptedTermsAt: (u as any).acceptedTermsAt ?? null,
    acceptedMarketingAt: (u as any).acceptedMarketingAt ?? null,
  };
}

export function mapCategory(
  c: IntentWithGraph['categories'][number]
): GQLCategory {
  return {
    id: c.id,
    slug: c.slug,
    names: toJSONObject(c.names),
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

export function mapTag(t: IntentWithGraph['tags'][number]): GQLTag {
  return {
    id: t.id,
    label: t.label,
    slug: t.slug,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  };
}

export function mapIntentMember(m: IntentMemberWithUsers): GQLIntentMember {
  return {
    id: m.id,
    intentId: m.intentId,
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

/* ---- Intent computed helpers ---- */

const hoursUntil = (date: Date) => (date.getTime() - Date.now()) / 3_600_000;

function computeIntentDerived(i: IntentWithGraph | any) {
  const now = new Date();
  const lockHrs = 6; // spójne z resolverem listy

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
  const withinLock = !hasStarted && hoursUntil(startDate) <= lockHrs;
  const canJoin =
    !isFull && !hasStarted && !withinLock && !isDeleted && !isCanceled;

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
 * Compute high-level IntentStatus from derived flags.
 * Priority order: DELETED > CANCELED > PAST > ONGOING > FULL > LOCKED > AVAILABLE
 */
function computeIntentStatus(
  derived: ReturnType<typeof computeIntentDerived>
): IntentStatus {
  if (derived.isDeleted) return IntentStatus.Deleted;
  if (derived.isCanceled) return IntentStatus.Canceled;
  if (derived.hasEnded) return IntentStatus.Past;
  if (derived.isOngoing) return IntentStatus.Ongoing;
  if (derived.isFull) return IntentStatus.Full;
  if (derived.withinLock) return IntentStatus.Locked;
  return IntentStatus.Available;
}

/**
 * Compute whether joins are currently open and the lock reason if not.
 */
function computeJoinOpenAndReason(i: IntentWithGraph): {
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
  const derived = computeIntentDerived(i);

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

function resolveOwnerFromMembers(i: IntentWithGraph | any): GQLUser | null {
  if ((i as any).owner) {
    return mapUser((i as any).owner);
  }
  // Safe access to members - may be undefined if not included
  const owner = (i.members ?? []).find(
    (m: any) => m.role === 'OWNER' && m.status === 'JOINED' && (m as any).user
  ) as any;
  return owner ? mapUser(owner.user) : null;
}

export function mapIntent(i: IntentWithGraph, viewerId?: string): GQLIntent {
  const derived = computeIntentDerived(i);
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
  const status = computeIntentStatus(derived);
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

  const lat = canSeeLocationAndUrl ? (i.lat ?? null) : null;
  const lng = canSeeLocationAndUrl ? (i.lng ?? null) : null;
  const address = canSeeLocationAndUrl ? (i.address ?? null) : null;
  const placeId = canSeeLocationAndUrl ? (i.placeId ?? null) : null;
  const radiusKm = canSeeLocationAndUrl ? (i.radiusKm ?? null) : null;
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

    // Privacy toggles (zwracamy zawsze)
    addressVisibility: i.addressVisibility as AddressVisibility,
    membersVisibility: i.membersVisibility as MembersVisibility,

    // Denormalized counters
    joinedCount,
    commentsCount: (i as any).commentsCount ?? 0,
    messagesCount: (i as any).messagesCount ?? 0,

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

    // Collections (safe access - may be undefined if not included)
    categories: (i.categories ?? []).map(mapCategory),
    tags: (i.tags ?? []).map(mapTag),

    // Convenience relations
    owner: resolveOwnerFromMembers(i),
    members: visibleMembers.map(mapIntentMember),

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

    intent: n.intent ? mapIntent(n.intent as any, viewerId) : null,
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
    intentId: c.intentId,
    authorId: c.authorId,
    threadId: c.threadId,
    parentId: c.parentId ?? null,
    content: c.content,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    deletedAt: c.deletedAt ?? null,

    intent: c.intent
      ? (mapIntent(c.intent as any, viewerId) as any)
      : ({} as any),
    author: mapUser(c.author as any),
    parent: c.parent ? (mapComment(c.parent as any, viewerId) as any) : null,
    replies: c.replies?.map((r) => mapComment(r as any, viewerId) as any) ?? [],

    repliesCount: (c as any)._count?.replies ?? 0,
  };
}

/* ---- Review ---- */
export function mapReview(r: ReviewWithGraph, viewerId?: string): GQLReview {
  return {
    id: r.id,
    intentId: r.intentId,
    authorId: r.authorId,
    rating: r.rating,
    content: r.content ?? null,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    deletedAt: r.deletedAt ?? null,

    intent: r.intent
      ? (mapIntent(r.intent as any, viewerId) as any)
      : ({} as any),
    author: mapUser(r.author as any),
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

/* ---- IntentChatMessage ---- */
export function mapIntentChatMessage(
  m: IntentChatMessageWithGraph,
  viewerId?: string
): GQLIntentChatMessage {
  return {
    id: m.id,
    intentId: m.intentId,
    authorId: m.authorId,
    content: m.content,
    replyToId: m.replyToId ?? null,
    createdAt: m.createdAt,
    editedAt: m.editedAt ?? null,
    deletedAt: m.deletedAt ?? null,

    intent: m.intent
      ? (mapIntent(m.intent as any, viewerId) as any)
      : ({} as any),
    author: mapUser(m.author as any),
    replyTo: m.replyTo
      ? (mapIntentChatMessage(m.replyTo as any, viewerId) as any)
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

/* ---- IntentInviteLink ---- */
export function mapIntentInviteLink(
  link: IntentInviteLinkWithGraph,
  viewerId?: string
): GQLIntentInviteLink {
  const now = new Date();
  const isExpired = link.expiresAt ? link.expiresAt < now : false;
  const isMaxedOut = link.maxUses ? link.usedCount >= link.maxUses : false;
  const isValid = !isExpired && !isMaxedOut;

  return {
    id: link.id,
    intentId: link.intentId,
    code: link.code,
    maxUses: link.maxUses ?? null,
    usedCount: link.usedCount,
    expiresAt: link.expiresAt ?? null,
    createdAt: link.createdAt,

    intent: link.intent
      ? (mapIntent(link.intent as any, viewerId) as any)
      : ({} as any),

    isExpired,
    isMaxedOut,
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

/* ---- IntentMute ---- */
export function mapIntentMute(
  mute: IntentMuteWithGraph,
  viewerId?: string
): GQLIntentMute {
  return {
    id: mute.id,
    intentId: mute.intentId,
    userId: mute.userId,
    muted: mute.muted,
    createdAt: mute.createdAt,

    intent: mute.intent
      ? (mapIntent(mute.intent as any, viewerId) as any)
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
