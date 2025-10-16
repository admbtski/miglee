// apps/api/src/graphql/helpers.ts
import { Prisma } from '@prisma/client';
import type {
  Level,
  MeetingKind,
  Mode,
  NotificationEntity,
  NotificationKind,
  Visibility,
  // GraphQL result types:
  Intent as GQLIntent,
  Notification as GQLNotification,
  User as GQLUser,
  Category as GQLCategory,
  Tag as GQLTag,
  IntentMember as GQLIntentMember,
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
      };
    };
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
    name: u.name ?? null,
    imageUrl: u.imageUrl ?? null,
    role: (u.role ?? 'USER') as any,
    verifiedAt: u.verifiedAt ?? null,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  };
}

export function mapCategory(
  c: IntentWithGraph['categories'][number]
): GQLCategory {
  return {
    id: c.id,
    slug: c.slug,
    names: toJSONObject(c.names),
    icon: c.icon ?? null,
    color: c.color ?? null,
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
    addedBy: m.addedBy ? mapUser(m.addedBy) : null,
    joinedAt: m.joinedAt ?? null,
    leftAt: m.leftAt ?? null,
    note: m.note ?? null,
    user: mapUser(m.user),
  };
}

/* ---- Intent computed helpers ---- */

function computeIntentDerived(i: IntentWithGraph) {
  const now = new Date();
  const joinedCount = i.members.filter((m) => m.status === 'JOINED').length;
  const isFull = joinedCount >= i.max;
  const hasStarted = now >= new Date(i.startAt);
  const hasEnded = now > new Date(i.endAt);
  return { joinedCount, isFull, hasStarted, hasEnded };
}

function resolveOwnerFromMembers(i: IntentWithGraph): GQLUser | null {
  const owner = i.members.find(
    (m) => m.role === 'OWNER' && m.status === 'JOINED' && m.user
  );
  return owner ? mapUser(owner.user) : null;
}

export function mapIntent(i: IntentWithGraph): GQLIntent {
  const { joinedCount, isFull, hasStarted, hasEnded } = computeIntentDerived(i);

  return {
    id: i.id,
    title: i.title,
    description: i.description ?? null,
    notes: i.notes ?? null,

    visibility: i.visibility as Visibility,
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

    // ✅ REQUIRED by SDL
    categories: i.categories.map(mapCategory),
    tags: i.tags.map(mapTag),

    // convenience + computed
    owner: resolveOwnerFromMembers(i),
    members: i.members.map(mapIntentMember),

    joinedCount,
    isFull,
    hasStarted,
    hasEnded,

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
