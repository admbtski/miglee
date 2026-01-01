'use client';

import { valibotResolver } from '@hookform/resolvers/valibot';
import { useForm, type UseFormReturn } from 'react-hook-form';
import * as v from 'valibot';

/** --- Constants --- */
const NOW_BUFFER_MS = 5 * 60 * 1000; // 5 minutes buffer
const MAX_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const URL_REGEX = /^https?:\/\/\S+/i;

/** Meeting type enum */
export const MeetingKind = v.picklist(['ONSITE', 'ONLINE', 'HYBRID']);

/** Returns "now + 5min" timestamp for validation */
const nowPlus5Min = () => new Date(Date.now() + NOW_BUFFER_MS);

/** Location schema */
const LocationSchema = v.object({
  lat: v.optional(v.pipe(v.number(), v.finite(), v.minValue(-90), v.maxValue(90))),
  lng: v.optional(v.pipe(v.number(), v.finite(), v.minValue(-180), v.maxValue(180))),
  placeId: v.optional(v.pipe(v.string(), v.trim(), v.maxLength(240))),
  address: v.optional(v.pipe(v.string(), v.trim(), v.maxLength(240))),
  radiusKm: v.optional(v.pipe(v.number(), v.finite(), v.minValue(0), v.maxValue(10))),
  cityName: v.optional(v.pipe(v.string(), v.trim(), v.maxLength(240))),
  cityPlaceId: v.optional(v.pipe(v.string(), v.trim(), v.maxLength(240))),
});

/** Base schema without cross-field validations */
const SimpleEventBaseSchema = v.object({
  // Step 1: Basics
  title: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(3, 'Min 3 znaki'),
    v.maxLength(60, 'Max 60 znaków')
  ),
  categorySlugs: v.pipe(
    v.array(v.pipe(v.string(), v.minLength(1))),
    v.minLength(1, 'Wybierz co najmniej 1 kategorię'),
    v.maxLength(3, 'Możesz wybrać max 3 kategorie')
  ),
  description: v.optional(
    v.union([
      v.pipe(v.string(), v.trim(), v.maxLength(500, 'Max 500 znaków')),
      v.literal(''),
    ])
  ),

  // Step 2: Schedule
  startAt: v.pipe(
    v.date(),
    v.transform((d) => new Date(d))
  ),
  endAt: v.pipe(
    v.date(),
    v.transform((d) => new Date(d))
  ),

  // Step 3: Location & Format
  meetingKind: MeetingKind,
  onlineUrl: v.optional(
    v.union([
      v.pipe(
        v.string(),
        v.trim(),
        v.check((s) => !s || URL_REGEX.test(s), 'Podaj prawidłowy URL (http/https)')
      ),
      v.literal(''),
    ])
  ),
  location: LocationSchema,

  // Step 4: Capacity
  mode: v.picklist(['ONE_TO_ONE', 'GROUP', 'CUSTOM']),
  min: v.nullable(
    v.pipe(
      v.number(),
      v.integer(),
      v.minValue(1, 'Min. pojemność to 1'),
      v.maxValue(99999, 'Max 99999')
    )
  ),
  max: v.nullable(
    v.pipe(
      v.number(),
      v.integer(),
      v.minValue(1, 'Min. pojemność to 1'),
      v.maxValue(99999, 'Max 99999')
    )
  ),

  // Step 5: Privacy
  visibility: v.picklist(['PUBLIC', 'HIDDEN']),
  joinMode: v.picklist(['INVITE_ONLY', 'OPEN', 'REQUEST']),
});

/**
 * Simplified schema for new event creator (/event/new)
 * Only includes fields used in the 7-step simplified creator.
 * Advanced fields (tags, notes, levels, join windows, etc.) are set via UpdateEvent in manage panel.
 */
export const SimpleEventSchema = v.pipe(
  SimpleEventBaseSchema,
  // Validate start is in future
  v.check(
    (data) => data.startAt.getTime() >= nowPlus5Min().getTime(),
    'Start musi być w przyszłości (min. 5 min)'
  ),
  // Validate end > start
  v.check(
    (data) => data.endAt.getTime() > data.startAt.getTime(),
    'Koniec musi być po starcie'
  ),
  // Validate max duration
  v.check(
    (data) => data.endAt.getTime() - data.startAt.getTime() <= MAX_DURATION_MS,
    'Max. czas trwania to 30 dni'
  ),
  // Validate min <= max
  v.check((data) => {
    if (data.min !== null && data.max !== null) {
      return data.min <= data.max;
    }
    return true;
  }, 'Min musi być ≤ Max'),
  // Mode-specific validation
  v.check((data) => {
    if (data.mode === 'ONE_TO_ONE') {
      return data.min === 2 && data.max === 2;
    }
    return true;
  }, 'Dla trybu 1:1, min i max muszą być 2'),
  v.check((data) => {
    if (data.mode === 'GROUP') {
      return (
        (data.min === null || data.min >= 1) &&
        (data.max === null || data.max <= 50)
      );
    }
    return true;
  }, 'Dla grupy: min >= 1, max <= 50'),
  // MeetingKind-specific validation
  v.check((data) => {
    const hasCoords =
      Number.isFinite(data.location.lat) && Number.isFinite(data.location.lng);
    const hasUrl = !!data.onlineUrl && URL_REGEX.test(data.onlineUrl);

    switch (data.meetingKind) {
      case 'ONSITE':
        return hasCoords;
      case 'ONLINE':
        return hasUrl;
      case 'HYBRID':
        return hasCoords || hasUrl;
      default:
        return true;
    }
  }, 'Wymagana lokalizacja lub link (zależnie od typu spotkania)')
);

/** Extended schema for manage panel */
const EventExtendedSchema = v.object({
  // Additional fields for manage panel editing
  tagSlugs: v.pipe(
    v.array(v.string()),
    v.maxLength(3, 'Możesz wybrać max 3 tagi')
  ),
  notes: v.optional(
    v.union([
      v.pipe(v.string(), v.trim(), v.maxLength(300, 'Max 300 znaków')),
      v.literal(''),
    ])
  ),
  levels: v.array(v.picklist(['ADVANCED', 'BEGINNER', 'INTERMEDIATE'])),
  addressVisibility: v.picklist(['AFTER_JOIN', 'HIDDEN', 'PUBLIC']),
  membersVisibility: v.picklist(['AFTER_JOIN', 'HIDDEN', 'PUBLIC']),

  // Join windows / cutoffs
  joinOpensMinutesBeforeStart: v.nullish(
    v.pipe(
      v.number(),
      v.integer(),
      v.minValue(0, 'Musi być 0 lub więcej'),
      v.maxValue(10080, 'Max 7 dni (10080 minut)')
    )
  ),
  joinCutoffMinutesBeforeStart: v.nullish(
    v.pipe(
      v.number(),
      v.integer(),
      v.minValue(0, 'Musi być 0 lub więcej'),
      v.maxValue(10080, 'Max 7 dni (10080 minut)')
    )
  ),
  allowJoinLate: v.boolean(),
  lateJoinCutoffMinutesAfterStart: v.nullish(
    v.pipe(
      v.number(),
      v.integer(),
      v.minValue(0, 'Musi być 0 lub więcej'),
      v.maxValue(10080, 'Max 7 dni (10080 minut)')
    )
  ),
});

/**
 * Full schema for event editing in manage panel.
 * Includes all fields that can be configured after creation.
 */
export const EventSchema = v.pipe(
  v.intersect([SimpleEventBaseSchema, EventExtendedSchema]),
  // Validate start is in future
  v.check(
    (data) => data.startAt.getTime() >= nowPlus5Min().getTime(),
    'Start musi być w przyszłości (min. 5 min)'
  ),
  // Validate end > start
  v.check(
    (data) => data.endAt.getTime() > data.startAt.getTime(),
    'Koniec musi być po starcie'
  ),
  // Validate max duration
  v.check(
    (data) => data.endAt.getTime() - data.startAt.getTime() <= MAX_DURATION_MS,
    'Max. czas trwania to 30 dni'
  ),
  // Validate min <= max
  v.check((data) => {
    if (data.min !== null && data.max !== null) {
      return data.min <= data.max;
    }
    return true;
  }, 'Min musi być ≤ Max'),
  // Mode-specific validation
  v.check((data) => {
    if (data.mode === 'ONE_TO_ONE') {
      return data.min === 2 && data.max === 2;
    }
    return true;
  }, 'Dla trybu 1:1, min i max muszą być 2'),
  v.check((data) => {
    if (data.mode === 'GROUP') {
      return (
        (data.min === null || data.min >= 1) &&
        (data.max === null || data.max <= 50)
      );
    }
    return true;
  }, 'Dla grupy: min >= 1, max <= 50'),
  // MeetingKind-specific validation
  v.check((data) => {
    const hasCoords =
      Number.isFinite(data.location.lat) && Number.isFinite(data.location.lng);
    const hasUrl = !!data.onlineUrl && URL_REGEX.test(data.onlineUrl);

    switch (data.meetingKind) {
      case 'ONSITE':
        return hasCoords;
      case 'ONLINE':
        return hasUrl;
      case 'HYBRID':
        return hasCoords || hasUrl;
      default:
        return true;
    }
  }, 'Wymagana lokalizacja lub link (zależnie od typu spotkania)')
);

/** Simplified form values type (for new creator) */
export type SimpleEventFormValues = v.InferOutput<typeof SimpleEventSchema>;

/** Full form values type (for manage panel) */
export type EventFormValues = v.InferOutput<typeof EventSchema>;

/** Default values for simplified creator */
export const defaultSimpleEventValues: SimpleEventFormValues = {
  title: '',
  categorySlugs: [],
  description: '',
  startAt: new Date(Date.now() + NOW_BUFFER_MS),
  endAt: new Date(Date.now() + NOW_BUFFER_MS + 60 * 60 * 1000),
  meetingKind: 'ONSITE',
  onlineUrl: '',
  location: {
    lat: undefined,
    lng: undefined,
    address: '',
    radiusKm: 0,
    placeId: '',
    cityName: undefined,
    cityPlaceId: undefined,
  },
  mode: 'GROUP',
  min: 1,
  max: 10,
  visibility: 'PUBLIC',
  joinMode: 'OPEN',
};

/** Default values for full form (editing in manage panel) */
export const defaultEventValues: EventFormValues = {
  ...defaultSimpleEventValues,
  tagSlugs: [],
  notes: '',
  levels: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
  addressVisibility: 'PUBLIC',
  membersVisibility: 'PUBLIC',
  joinOpensMinutesBeforeStart: null,
  joinCutoffMinutesBeforeStart: null,
  allowJoinLate: true,
  lateJoinCutoffMinutesAfterStart: null,
};

/**
 * Hook for simplified event creation form (/event/new)
 * Uses SimpleEventSchema with only essential fields.
 */
export function useSimpleEventForm(
  initial?: Partial<SimpleEventFormValues>
): UseFormReturn<SimpleEventFormValues> {
  return useForm<SimpleEventFormValues>({
    mode: 'onChange',
    resolver: valibotResolver(SimpleEventSchema),
    defaultValues: { ...defaultSimpleEventValues, ...initial },
    shouldUnregister: false,
  });
}

/**
 * Hook for full event editing form (manage panel)
 * Uses full EventSchema with all fields.
 */
export function useEventForm(
  initial?: Partial<EventFormValues>
): UseFormReturn<EventFormValues> {
  return useForm<EventFormValues>({
    mode: 'onChange',
    resolver: valibotResolver(EventSchema),
    defaultValues: { ...defaultEventValues, ...initial },
    shouldUnregister: false,
  });
}
