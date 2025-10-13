import { Prisma } from '@prisma/client';
import type {
  CreateIntentInput,
  Intent as GQLIntent,
  Notification as GQLNotification,
  Level,
  MeetingKind,
  Mode,
  NotificationKind,
  Role,
  UpdateIntentInput,
  Visibility,
} from '../__generated__/resolvers-types';

export function mapIntent(i: any): GQLIntent {
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
    radiusKm: i.radiusKm ?? null,

    // levels + tags
    levels: (i.levels ?? []) as Level[],

    createdAt: i.createdAt,
    updatedAt: i.updatedAt,

    authorId: i.authorId ?? null,
    author: i.author
      ? {
          id: i.author.id,
          email: i.author.email,
          name: i.author.name ?? null,
          imageUrl: i.author.imageUrl ?? null,
          role: (i.author.role ?? 'USER') as Role,
          createdAt: i.author.createdAt,
          updatedAt: i.author.updatedAt,
        }
      : null,

    categories:
      i.categories?.map((c: any) => ({
        id: c.id,
        slug: c.slug,
        names: toJSONObject(c.names), // <-- ważne: JSON → Record<string, any>
        icon: c.icon ?? null,
        color: c.color ?? null,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })) ?? [],

    tags:
      i.tags?.map((t: any) => ({
        id: t.id,
        label: t.label,
        slug: t.slug,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      })) ?? [],
  };
}

export function mapNotification(n: any): GQLNotification {
  // recipient jest wymagany w schemacie (User!), a w zapytaniach/mutacjach zawsze dajemy include: { recipient: true }
  const r = n.recipient!;
  return {
    id: n.id,
    kind: n.kind as NotificationKind,
    message: n.message ?? null,
    payload: (n.payload ?? null) as any,
    readAt: n.readAt ?? null,
    createdAt: n.createdAt,

    recipientId: n.recipientId,
    recipient: {
      id: r.id,
      email: r.email,
      name: r.name ?? null,
      imageUrl: r.imageUrl ?? null,
      role: (r.role ?? 'USER') as Role,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    },

    intentId: n.intentId ?? null,
    intent: n.intent ? mapIntent(n.intent) : null,
  };
}

/** Normalizuje input LocationInput -> shape zapisu w Intent (tylko wartości typu number/string) */
export function pickLocation(
  input?: CreateIntentInput['location'] | UpdateIntentInput['location']
) {
  if (!input) return {};
  const out: Record<string, any> = {};
  if (typeof input.lat === 'number') out.lat = input.lat;
  if (typeof input.lng === 'number') out.lng = input.lng;
  if (typeof input.address === 'string') out.address = input.address;
  if (typeof input.radiusKm === 'number') out.radiusKm = input.radiusKm;
  return out;
}

/** DB JSON → GraphQL JSON scalar (Record<string, any>) */
export function toJSONObject(v: Prisma.JsonValue): Record<string, any> {
  return v && typeof v === 'object' && !Array.isArray(v)
    ? (v as Record<string, any>)
    : {};
}

/** Bezpieczny JSON input do Prisma (obsługa JSON null, SQL null, pominięcia) */
export function toInputJson(
  v: unknown
):
  | Prisma.InputJsonValue
  | typeof Prisma.JsonNull
  | typeof Prisma.DbNull
  | undefined {
  if (v === undefined) return undefined; // pomiń klucz
  if (v === null) return Prisma.JsonNull; // JSON-owe null
  return v as Prisma.InputJsonValue; // obiekt/liczba/string/bool/array
}
