'use client';

import type {
  CreateIntentInput,
  Intent,
  IntentsResultCoreFragment_IntentsResult_items_Intent,
  JoinMode,
  MeetingKind,
  Mode,
  Visibility,
} from '@/lib/api/__generated__/react-query-update';
import { CategoryOption } from '@/features/categories';
import { TagOption } from '@/features/tags/types';
import { IntentFormValues, SimpleIntentFormValues } from './types';

/** ---- API → Form (full form for editing) ---- */
export function mapIntentToFormValues(
  intent: IntentsResultCoreFragment_IntentsResult_items_Intent
): IntentFormValues {
  return {
    // Basic fields
    title: intent.title ?? '',
    categorySlugs: intent.categories?.map((c) => c.slug) ?? [],
    description: intent.description ?? '',
    startAt: new Date(intent.startAt),
    endAt: new Date(intent.endAt),
    meetingKind: intent.meetingKind,
    onlineUrl: intent.onlineUrl ?? '',
    location: {
      placeId: intent.placeId ?? undefined,
      lat: intent.lat ?? undefined,
      lng: intent.lng ?? undefined,
      address: intent.address ?? undefined,
      radiusKm: intent.radiusKm ?? undefined,
      cityName: (intent as any).cityName ?? undefined,
      cityPlaceId: (intent as any).cityPlaceId ?? undefined,
    },
    mode: intent.mode,
    min: intent.min ?? 2,
    max: intent.max ?? 50,
    visibility: intent.visibility,
    joinMode: intent.joinMode,

    // Extended fields (for manage panel)
    tagSlugs: intent.tags?.map((t) => t.slug) ?? [],
    notes: intent.notes ?? '',
    levels: intent.levels,
    addressVisibility: intent.addressVisibility,
    membersVisibility: intent.membersVisibility,
    joinOpensMinutesBeforeStart: intent.joinOpensMinutesBeforeStart ?? null,
    joinCutoffMinutesBeforeStart: intent.joinCutoffMinutesBeforeStart ?? null,
    allowJoinLate: !!intent.allowJoinLate,
    lateJoinCutoffMinutesAfterStart:
      intent.lateJoinCutoffMinutesAfterStart ?? null,
  };
}

/**
 * Maps simplified form values to CreateIntentInput for new intent creation.
 * Only includes fields supported by the simplified CreateIntentInput schema.
 */
export function mapSimpleFormToCreateInput(
  v: SimpleIntentFormValues
): CreateIntentInput {
  const input: CreateIntentInput = {
    // Required fields
    title: v.title,
    categorySlugs: v.categorySlugs,
    startAt: v.startAt.toISOString(),
    endAt: v.endAt.toISOString(),

    // Optional fields
    description: v.description?.trim() || undefined,
    meetingKind: v.meetingKind as MeetingKind,
    onlineUrl: v.onlineUrl?.trim() || undefined,
    location: {},

    // Capacity
    mode: v.mode as Mode,
    min: v.min,
    max: v.max,

    // Privacy
    visibility: v.visibility as Visibility,
    joinMode: v.joinMode as JoinMode,
  };

  // Location fields
  if (v.location.lat != null) input.location!.lat = v.location.lat;
  if (v.location.lng != null) input.location!.lng = v.location.lng;
  if (v.location.address?.trim())
    input.location!.address = v.location.address.trim();
  if (v.location.radiusKm != null)
    input.location!.radiusKm = v.location.radiusKm;
  if (v.location.placeId?.trim())
    input.location!.placeId = v.location.placeId.trim();
  if (v.location.cityName?.trim())
    input.location!.cityName = v.location.cityName.trim();
  if (v.location.cityPlaceId?.trim())
    input.location!.cityPlaceId = v.location.cityPlaceId.trim();

  return input;
}

/**
 * Maps full form values to CreateIntentInput.
 * @deprecated Use mapSimpleFormToCreateInput for new intent creation.
 * This function is kept for backward compatibility with existing code.
 */
export function mapFormToCreateInput(
  v: IntentFormValues | SimpleIntentFormValues
): CreateIntentInput {
  // Use simplified mapper - extra fields will be ignored by backend
  return mapSimpleFormToCreateInput(v as SimpleIntentFormValues);
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
