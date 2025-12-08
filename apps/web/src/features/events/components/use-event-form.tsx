'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { z } from 'zod';
import type { EventFormValues } from './types';

/** --- Constants --- */
const NOW_BUFFER_MS = 5 * 60 * 1000; // 5 minutes buffer
const MAX_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const URL_REGEX = /^https?:\/\/\S+/i;

/** Meeting type enum */
export const MeetingKind = z.enum(['ONSITE', 'ONLINE', 'HYBRID']);

/** Returns "now + 5min" timestamp for validation */
const nowPlus5Min = () => new Date(Date.now() + NOW_BUFFER_MS);

/** Location schema */
const LocationSchema = z.object({
  lat: z.number().finite().min(-90).max(90).optional(),
  lng: z.number().finite().min(-180).max(180).optional(),
  placeId: z.string().trim().max(240).optional(),
  address: z.string().trim().max(240).optional(),
  radiusKm: z.number().finite().min(0).max(10).optional(),
  cityName: z.string().trim().max(240).optional(),
  cityPlaceId: z.string().trim().max(240).optional(),
});

/**
 * Simplified schema for new event creator (/event/new)
 * Only includes fields used in the 7-step simplified creator.
 * Advanced fields (tags, notes, levels, join windows, etc.) are set via UpdateEvent in manage panel.
 */
export const SimpleEventSchema = z
  .object({
    // Step 1: Basics
    title: z.string().trim().min(3, 'Min 3 znaki').max(60, 'Max 60 znaków'),
    categorySlugs: z
      .array(z.string().min(1))
      .min(1, 'Wybierz co najmniej 1 kategorię')
      .max(3, 'Możesz wybrać max 3 kategorie'),
    description: z
      .string()
      .trim()
      .max(500, 'Max 500 znaków')
      .optional()
      .or(z.literal('')),

    // Step 2: Schedule
    startAt: z
      .date()
      .transform((d) => new Date(d))
      .refine(
        (d) => d.getTime() >= nowPlus5Min().getTime(),
        'Start musi być w przyszłości (min. 5 min)'
      ),
    endAt: z.date().transform((d) => new Date(d)),

    // Step 3: Location & Format
    meetingKind: MeetingKind,
    onlineUrl: z
      .string()
      .trim()
      .optional()
      .or(z.literal(''))
      .refine(
        (s) => !s || URL_REGEX.test(s),
        'Podaj prawidłowy URL (http/https)'
      ),
    location: LocationSchema,

    // Step 4: Capacity
    mode: z.enum(['ONE_TO_ONE', 'GROUP', 'CUSTOM']),
    min: z
      .number()
      .int()
      .min(1, 'Min. pojemność to 1')
      .max(99999, 'Max 99999')
      .nullable(),
    max: z
      .number()
      .int()
      .min(1, 'Min. pojemność to 1')
      .max(99999, 'Max 99999')
      .nullable(),

    // Step 5: Privacy
    visibility: z.enum(['PUBLIC', 'HIDDEN']),
    joinMode: z.enum(['INVITE_ONLY', 'OPEN', 'REQUEST']),
  })
  // Validate end > start
  .refine((data) => data.endAt.getTime() > data.startAt.getTime(), {
    path: ['endAt'],
    message: 'Koniec musi być po starcie',
  })
  // Validate max duration
  .refine(
    (data) => data.endAt.getTime() - data.startAt.getTime() <= MAX_DURATION_MS,
    { path: ['endAt'], message: 'Max. czas trwania to 30 dni' }
  )
  // Validate min <= max
  .refine(
    (data) => {
      if (data.min !== null && data.max !== null) {
        return data.min <= data.max;
      }
      return true;
    },
    { path: ['min'], message: 'Min musi być ≤ Max' }
  )
  // Mode-specific validation
  .superRefine((data, ctx) => {
    if (data.mode === 'ONE_TO_ONE') {
      if (data.min !== 2) {
        ctx.addIssue({
          code: 'custom',
          path: ['min'],
          message: 'Dla trybu 1:1, min musi być 2',
        });
      }
      if (data.max !== 2) {
        ctx.addIssue({
          code: 'custom',
          path: ['max'],
          message: 'Dla trybu 1:1, max musi być 2',
        });
      }
    } else if (data.mode === 'GROUP') {
      if (data.min === null || data.min < 1) {
        ctx.addIssue({
          code: 'custom',
          path: ['min'],
          message: 'Min. pojemność dla grupy to 1',
        });
      }
      if (data.max === null || data.max > 50) {
        ctx.addIssue({
          code: 'custom',
          path: ['max'],
          message: 'Max. pojemność dla grupy to 50',
        });
      }
    }
  })
  // MeetingKind-specific validation
  .superRefine((data, ctx) => {
    const hasCoords =
      Number.isFinite(data.location.lat) && Number.isFinite(data.location.lng);
    const hasUrl = !!data.onlineUrl && URL_REGEX.test(data.onlineUrl!);

    switch (data.meetingKind) {
      case 'ONSITE':
        if (!hasCoords) {
          ctx.addIssue({
            code: 'custom',
            message: 'Lokalizacja jest wymagana dla spotkań stacjonarnych',
            path: ['location'],
          });
        }
        break;
      case 'ONLINE':
        if (!hasUrl) {
          ctx.addIssue({
            code: 'custom',
            message: 'Link jest wymagany dla spotkań online',
            path: ['onlineUrl'],
          });
        }
        break;
      case 'HYBRID':
        if (!hasCoords && !hasUrl) {
          ctx.addIssue({
            code: 'custom',
            message: 'Podaj lokalizację lub link online (lub oba)',
            path: ['meetingKind'],
          });
        }
        break;
    }
  });

/**
 * Full schema for event editing in manage panel.
 * Includes all fields that can be configured after creation.
 */
export const EventSchema = SimpleEventSchema.and(
  z.object({
    // Additional fields for manage panel editing
    tagSlugs: z.array(z.string().min(0)).max(3, 'Możesz wybrać max 3 tagi'),
    notes: z
      .string()
      .trim()
      .max(300, 'Max 300 znaków')
      .optional()
      .or(z.literal('')),
    levels: z.array(z.enum(['ADVANCED', 'BEGINNER', 'INTERMEDIATE'])),
    addressVisibility: z.enum(['AFTER_JOIN', 'HIDDEN', 'PUBLIC']),
    membersVisibility: z.enum(['AFTER_JOIN', 'HIDDEN', 'PUBLIC']),

    // Join windows / cutoffs
    joinOpensMinutesBeforeStart: z
      .number()
      .int()
      .min(0, 'Musi być 0 lub więcej')
      .max(10080, 'Max 7 dni (10080 minut)')
      .optional()
      .nullable(),
    joinCutoffMinutesBeforeStart: z
      .number()
      .int()
      .min(0, 'Musi być 0 lub więcej')
      .max(10080, 'Max 7 dni (10080 minut)')
      .optional()
      .nullable(),
    allowJoinLate: z.boolean(),
    lateJoinCutoffMinutesAfterStart: z
      .number()
      .int()
      .min(0, 'Musi być 0 lub więcej')
      .max(10080, 'Max 7 dni (10080 minut)')
      .optional()
      .nullable(),
  })
);

/** Simplified form values type (for new creator) */
export type SimpleEventFormValues = z.infer<typeof SimpleEventSchema>;

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
    resolver: zodResolver(SimpleEventSchema),
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
    resolver: zodResolver(EventSchema),
    defaultValues: { ...defaultEventValues, ...initial },
    shouldUnregister: false,
  });
}
