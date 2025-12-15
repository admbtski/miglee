/**
 * Mapping functions for transforming API data to form values
 */

import type {
  CreateEventInput,
  Event,
  EventsResultCoreFragment_EventsResult_items_Event,
  JoinMode,
  MeetingKind,
  Mode,
  Visibility,
} from '@/lib/api/__generated__/react-query-update';
import type { CategoryOption } from '@/features/categories';
import type { TagOption } from '@/features/tags/types';
import type {
  EventFormValues,
  SimpleEventFormValues,
} from '../types/event-form';

/**
 * Maps simplified form values to CreateEventInput for new event creation.
 * Only includes fields supported by the simplified CreateEventInput schema.
 */
export function mapSimpleFormToCreateInput(
  v: SimpleEventFormValues
): CreateEventInput {
  const input: CreateEventInput = {
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
 * Maps full form values to CreateEventInput.
 * @deprecated Use mapSimpleFormToCreateInput for new event creation.
 * This function is kept for backward compatibility with existing code.
 */
export function mapFormToCreateInput(
  v: EventFormValues | SimpleEventFormValues
): CreateEventInput {
  // Use simplified mapper - extra fields will be ignored by backend
  return mapSimpleFormToCreateInput(v as SimpleEventFormValues);
}

/** ---- Form → Update payload ---- */
export function mapFormToUpdateInput(id: string, v: EventFormValues) {
  return {
    id,
    input: {
      ...mapFormToCreateInput(v),
    },
  };
}

/** ---- Helpers for Providers initial values ---- */
export function mapEventToCategoryOptions(event: Event): CategoryOption[] {
  return (
    event.categories?.map((c: any) => ({
      id: c.id,
      slug: c.slug,
      label: c.name ?? c.label ?? c.slug,
    })) ?? []
  );
}

export function mapEventToTagOptions(event: Event): TagOption[] {
  return (
    event.tags?.map((t: any) => ({
      id: t.id,
      slug: t.slug,
      label: t.name ?? t.label ?? t.slug,
    })) ?? []
  );
}
