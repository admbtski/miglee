'use client';

import type {
  AddressVisibility,
  CreateIntentInput,
  Intent,
  IntentsResultCoreFragment_IntentsResult_items_Intent,
  JoinMode,
  MeetingKind,
  MembersVisibility,
  Mode,
  Visibility,
} from '@/lib/api/__generated__/react-query-update';
import type { CategoryOption } from '@/types/types';
import type { TagOption } from '@/types/types';
import { IntentFormValues } from './types';

/** ---- API → Form ---- */
export function mapIntentToFormValues(
  intent: IntentsResultCoreFragment_IntentsResult_items_Intent
): IntentFormValues {
  return {
    title: intent.title ?? '',
    categorySlugs: intent.categories?.map((c) => c.slug) ?? [],
    tagSlugs: intent.tags?.map((t) => t.slug) ?? [],
    description: intent.description ?? '',
    mode: intent.mode,
    min: intent.min ?? 2,
    max: intent.max ?? 50,
    startAt: new Date(intent.startAt),
    endAt: new Date(intent.endAt),
    allowJoinLate: !!intent.allowJoinLate,
    meetingKind: intent.meetingKind,
    onlineUrl: intent.onlineUrl ?? '',
    location: {
      placeId: intent.placeId ?? undefined,
      lat: intent.lat ?? undefined,
      lng: intent.lng ?? undefined,
      address: intent.address ?? undefined,
      radiusKm: intent.radiusKm ?? undefined,
    },
    visibility: intent.visibility,
    addressVisibility: intent.addressVisibility,
    membersVisibility: intent.membersVisibility,
    joinMode: intent.joinMode,
    levels: intent.levels,
    notes: intent.notes ?? '',
  };
}

export function mapFormToCreateInput(v: IntentFormValues): CreateIntentInput {
  const input: CreateIntentInput = {
    title: v.title,
    levels: [], //todo
    categorySlugs: v.categorySlugs,
    tagSlugs: v.tagSlugs,
    startAt: v.startAt.toISOString(),
    endAt: v.endAt.toISOString(),
    allowJoinLate: v.allowJoinLate,
    min: v.min,
    max: v.max,
    mode: v.mode as Mode,
    meetingKind: v.meetingKind as MeetingKind,
    location: {},
    visibility: v.visibility as Visibility,
    addressVisibility: v.addressVisibility as AddressVisibility,
    membersVisibility: v.visibility as MembersVisibility,
    joinMode: v.joinMode as JoinMode,
    description: v.description,
    notes: v.notes,
    onlineUrl: v.onlineUrl,
  };

  if (v.description?.trim()) input.description = v.description.trim();
  if (v.onlineUrl?.trim()) input.onlineUrl = v.onlineUrl.trim();
  if (v.notes?.trim()) input.notes = v.notes.trim();

  if (v.location.lat != null) input.location!.lat = v.location.lat;
  if (v.location.lng != null) input.location!.lng = v.location.lng;
  if (v.location.address?.trim())
    input.location!.address = v.location.address.trim();
  if (v.location.radiusKm != null)
    input.location!.radiusKm = v.location.radiusKm;
  if (v.location.placeId?.trim())
    input.location!.placeId = v.location.placeId.trim();

  return input;
}

/** ---- Form → Update payload ---- */
export function mapFormToUpdateInput(id: string, v: IntentFormValues) {
  return {
    id,
    input: {
      ...mapFormToCreateInput(v),
    },
  };
}

/** ---- Helpers for Providers initial values ---- */
export function mapIntentToCategoryOptions(intent: Intent): CategoryOption[] {
  return (
    intent.categories?.map((c: any) => ({
      id: c.id,
      slug: c.slug,
      label: c.name ?? c.label ?? c.slug,
    })) ?? []
  );
}

export function mapIntentToTagOptions(intent: Intent): TagOption[] {
  return (
    intent.tags?.map((t: any) => ({
      id: t.id,
      slug: t.slug,
      label: t.name ?? t.label ?? t.slug,
    })) ?? []
  );
}
