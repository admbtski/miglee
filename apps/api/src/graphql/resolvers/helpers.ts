// apps/api/src/graphql/helpers.ts
import { Prisma } from '@prisma/client';
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
  DmMute as GQLDmMute,
  Comment as GQLComment,
  Review as GQLReview,
  Report as GQLReport,
  IntentChatMessage as GQLIntentChatMessage,
  UserBlock as GQLUserBlock,
  IntentInviteLink as GQLIntentInviteLink,
  NotificationPreference as GQLNotificationPreference,
  IntentMute as GQLIntentMute,
  DmMute as GQLDmMute,
} from '../__generated__/resolvers-types';

/* =============================================================================
 * Prisma payload types (strict includes) — kopiuj te include do zapytań!
 * ========================================================================== */

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
      include: {
        sender: true;
      };
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
  };
}>;

export type DmMuteWithGraph = Prisma.DmMuteGetPayload<{
  include: {
    user: true;
    thread: {
      include: {
        aUser: true;
        bUser: true;
      };
    };
  };
}>;

export type CommentWithGraph = Prisma.CommentGetPayload<{
  include: {
    author: true;
    intent: true;
    parent: true;
    replies: {
      include: {
        author: true;
      };
    };
    _count: {
      select: {
        replies: true;
      };
    };
  };
}>;

export type ReviewWithGraph = Prisma.ReviewGetPayload<{
  include: {
    author: true;
    intent: true;
  };
}>;

export type ReportWithGraph = Prisma.ReportGetPayload<{
  include: {
    reporter: true;
  };
}>;

export type IntentChatMessageWithGraph = Prisma.IntentChatMessageGetPayload<{
  include: {
    author: true;
    intent: true;
    replyTo: {
      include: {
        author: true;
      };
    };
  };
}>;

export type UserBlockWithGraph = Prisma.UserBlockGetPayload<{
  include: {
    blocker: true;
    blocked: true;
  };
}>;

export type IntentInviteLinkWithGraph = Prisma.IntentInviteLinkGetPayload<{
  include: {
    intent: true;
  };
}>;

export type NotificationPreferenceWithGraph =
  Prisma.NotificationPreferenceGetPayload<{
    include: {
      user: true;
    };
  }>;

export type IntentMuteWithGraph = Prisma.IntentMuteGetPayload<{
  include: {
    intent: true;
    user: true;
  };
}>;

export type DmMuteWithGraph = Prisma.DmMuteGetPayload<{
  include: {
    thread: {
      include: {
        aUser: true;
        bUser: true;
      };
    };
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

/** Safe JSON input to Prisma (GraphQL null vs SQL NULL semantics). */
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
 * Mappers (strictly typed, no any)
 *  - WYMAGAJĄ: IntentWithGraph / IntentMemberWithUsers / NotificationWithGraph
 *  - Jeśli chcesz wersje "shallow", zrób osobne funkcje i typy.
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

function computeIntentDerived(i: IntentWithGraph) {
  const now = new Date();
  const lockHrs = 6;

  const startDate = new Date(i.startAt);
  const endDate = new Date(i.startAt);

  const joinedCount = i.members.filter((m) => m.status === 'JOINED').length;
  const isFull = joinedCount >= i.max;
  const hasStarted = now >= startDate;
  const isOngoing = now >= startDate && now <= endDate;
  const hasEnded = now > endDate;
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

function resolveOwnerFromMembers(i: IntentWithGraph): GQLUser | null {
  // Prefer the owner relation if available (ownerId field)
  if ((i as any).owner) {
    return mapUser((i as any).owner);
  }
  // Fallback to finding owner in members
  const owner = i.members.find(
    (m) => m.role === 'OWNER' && m.status === 'JOINED' && (m as any).user
  ) as any;
  return owner ? mapUser(owner.user) : null;
}

export function mapIntent(i: IntentWithGraph): GQLIntent {
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
  } = computeIntentDerived(i);

  return {
    id: i.id,
    title: i.title,
    description: i.description ?? null,
    notes: i.notes ?? null,

    visibility: i.visibility as Visibility,
    joinMode: (i as any).joinMode ?? 'OPEN',
    mode: i.mode as Mode,
    min: i.min,
    max: i.max,

    startAt: i.startAt,
    endAt: i.endAt,
    allowJoinLate: i.allowJoinLate,

    meetingKind: i.meetingKind as MeetingKind,
    onlineUrl: i.onlineUrl ?? null,

    lat: i.lat ?? null,
    lng: i.lng ?? null,
    address: i.address ?? null,
    placeId: i.placeId ?? null,
    radiusKm: i.radiusKm ?? null,

    levels: (i.levels ?? []) as Level[],

    // Privacy toggles
    showMemberCount: (i as any).showMemberCount ?? true,
    showAddress: (i as any).showAddress ?? false,

    // Derived counters
    joinedCount,
    commentsCount: (i as any).commentsCount ?? 0,
    messagesCount: (i as any).messagesCount ?? 0,

    // Ownership
    ownerId: (i as any).ownerId ?? null,

    // --- cancellation
    canceledAt: (i as any).canceledAt ?? null,
    canceledBy: (i as any).canceledBy ? mapUser((i as any).canceledBy) : null,
    cancelReason: (i as any).cancelReason ?? null,
    isCanceled,

    // --- soft-delete
    deletedAt: (i as any).deletedAt ?? null,
    deletedBy: i.deletedBy ? mapUser(i.deletedBy) : null,
    deleteReason: i.deleteReason ?? null,
    isDeleted,

    // ✅ REQUIRED by SDL
    categories: i.categories.map(mapCategory),
    tags: i.tags.map(mapTag),

    // convenience + computed
    owner: resolveOwnerFromMembers(i),
    members: i.members.map(mapIntentMember),

    // Computed helpers (resolver-calculated)
    isFull,
    hasStarted,
    hasEnded,
    canJoin,
    isOngoing,
    withinLock,
    isOnline: i.meetingKind === 'ONLINE',
    isHybrid: i.meetingKind === 'HYBRID',
    isOnsite: i.meetingKind === 'ONSITE',

    createdAt: i.createdAt,
    updatedAt: i.updatedAt,
  };
}

/* ---- Notification ---- */
export function mapNotification(n: NotificationWithGraph): GQLNotification {
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

    intent: n.intent ? mapIntent(n.intent) : null,
  };
}

/* ---- DM Thread ---- */
export function mapDmThread(
  t: DmThreadWithGraph,
  currentUserId?: string
): GQLDmThread {
  const lastMessage = t.messages?.[0] ?? null;

  // Count unread messages for current user
  const unreadCount = currentUserId ? ((t as any)._count?.messages ?? 0) : 0;

  return {
    id: t.id,
    aUserId: t.aUserId,
    bUserId: t.bUserId,
    pairKey: t.pairKey,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
    lastMessageAt: t.lastMessageAt ?? null,

    aUser: mapUser(t.aUser as any),
    bUser: mapUser(t.bUser as any),
    messages: [], // Loaded separately via dmMessages query

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
    createdAt: m.createdAt,
    readAt: m.readAt ?? null,
    deletedAt: m.deletedAt ?? null,

    thread: m.thread ? (mapDmThread(m.thread as any) as any) : ({} as any),
    sender: mapUser(m.sender as any),
  };
}

/* ---- DM Helpers ---- */
export function createPairKey(userId1: string, userId2: string): string {
  return [userId1, userId2].sort().join('|');
}

/* ---- Comment ---- */
export function mapComment(c: CommentWithGraph): GQLComment {
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

    intent: c.intent ? (mapIntent(c.intent as any) as any) : ({} as any),
    author: mapUser(c.author as any),
    parent: c.parent ? (mapComment(c.parent as any) as any) : null,
    replies: c.replies?.map((r) => mapComment(r as any) as any) ?? [],

    repliesCount: (c as any)._count?.replies ?? 0,
  };
}

/* ---- Review ---- */
export function mapReview(r: ReviewWithGraph): GQLReview {
  return {
    id: r.id,
    intentId: r.intentId,
    authorId: r.authorId,
    rating: r.rating,
    content: r.content ?? null,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    deletedAt: r.deletedAt ?? null,

    intent: r.intent ? (mapIntent(r.intent as any) as any) : ({} as any),
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
  m: IntentChatMessageWithGraph
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

    intent: m.intent ? (mapIntent(m.intent as any) as any) : ({} as any),
    author: mapUser(m.author as any),
    replyTo: m.replyTo ? (mapIntentChatMessage(m.replyTo as any) as any) : null,

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
  link: IntentInviteLinkWithGraph
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

    intent: link.intent ? (mapIntent(link.intent as any) as any) : ({} as any),

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
export function mapIntentMute(mute: IntentMuteWithGraph): GQLIntentMute {
  return {
    id: mute.id,
    intentId: mute.intentId,
    userId: mute.userId,
    muted: mute.muted,
    createdAt: mute.createdAt,

    intent: mute.intent ? (mapIntent(mute.intent as any) as any) : ({} as any),
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
