'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { z } from 'zod';
import type { IntentFormValues } from './types';

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
  radiusKm: z.number().finite().min(0).max(20).optional(),
  cityName: z.string().trim().max(240).optional(),
  cityPlaceId: z.string().trim().max(240).optional(),
});

/** Core validation schema */
export const IntentSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, 'Min 3 characters')
      .max(60, 'Max 60 characters'),

    /** multiple categories: 1–3 required */
    categorySlugs: z
      .array(z.string().min(1))
      .min(1, 'Select at least 1 category')
      .max(3, 'You can select up to 3 categories'),

    /** multiple tags: 0–3 */
    tagSlugs: z
      .array(z.string().min(0))
      .min(0, 'Select at least 1 category')
      .max(3, 'You can select up to 3 categories'),

    description: z
      .string()
      .trim()
      .max(500, 'Max 500 characters')
      .optional()
      .or(z.literal('')),
    mode: z.enum(['ONE_TO_ONE', 'GROUP']),
    addressVisibility: z.enum(['AFTER_JOIN', 'HIDDEN', 'PUBLIC']),
    membersVisibility: z.enum(['AFTER_JOIN', 'HIDDEN', 'PUBLIC']),
    levels: z.array(z.enum(['ADVANCED', 'BEGINNER', 'INTERMEDIATE'])),
    min: z.number().int().min(2, 'Min capacity is 2'),
    max: z.number().int().max(50, 'Max capacity is 50'),
    startAt: z
      .date()
      .transform((d) => new Date(d)) // ensure instance copy (helps with weird inputs)
      .refine(
        (d) => d.getTime() >= nowPlus5Min().getTime(),
        'Start must be in the future (5 min buffer)'
      ),
    endAt: z.date().transform((d) => new Date(d)),

    // Join windows / cutoffs
    joinOpensMinutesBeforeStart: z
      .number()
      .int()
      .min(0, 'Must be 0 or positive')
      .max(10080, 'Max 7 days (10080 minutes)')
      .optional()
      .nullable(),
    joinCutoffMinutesBeforeStart: z
      .number()
      .int()
      .min(0, 'Must be 0 or positive')
      .max(10080, 'Max 7 days (10080 minutes)')
      .optional()
      .nullable(),
    allowJoinLate: z.boolean(),
    lateJoinCutoffMinutesAfterStart: z
      .number()
      .int()
      .min(0, 'Must be 0 or positive')
      .max(10080, 'Max 7 days (10080 minutes)')
      .optional()
      .nullable(),

    meetingKind: MeetingKind,
    onlineUrl: z
      .string()
      .trim()
      .optional()
      .or(z.literal(''))
      .refine(
        (s) => !s || URL_REGEX.test(s),
        'Provide a valid URL (http/https)'
      ),

    location: LocationSchema,

    visibility: z.enum(['PUBLIC', 'HIDDEN']),
    joinMode: z.enum(['INVITE_ONLY', 'OPEN', 'REQUEST']),
    notes: z
      .string()
      .trim()
      .max(300, 'Max 300 characters')
      .optional()
      .or(z.literal('')),
  })
  .refine((data) => data.endAt.getTime() > data.startAt.getTime(), {
    path: ['endAt'],
    message: 'End must be after start',
  })
  .refine(
    (data) => data.endAt.getTime() - data.startAt.getTime() <= MAX_DURATION_MS,
    { path: ['endAt'], message: 'Max duration is 30 days' }
  )
  .refine((data) => data.min <= data.max, {
    path: ['min'],
    message: 'Min must be ≤ Max',
  })
  // Mode-specific
  .superRefine((data, ctx) => {
    if (data.mode === 'ONE_TO_ONE') {
      if (data.min !== 2) {
        ctx.addIssue({
          code: 'custom',
          path: ['min'],
          message: 'For 1:1 mode, min must be 2',
        });
      }
      if (data.max !== 2) {
        ctx.addIssue({
          code: 'custom',
          path: ['max'],
          message: 'For 1:1 mode, max must be 2',
        });
      }
    } else {
      if (data.min < 2)
        ctx.addIssue({
          code: 'custom',
          path: ['min'],
          message: 'Minimum capacity is 2',
        });
      if (data.max > 50)
        ctx.addIssue({
          code: 'custom',
          path: ['max'],
          message: 'Maximum capacity is 50',
        });
    }
  })
  // MeetingKind-specific
  .superRefine((data, ctx) => {
    const hasCoords =
      Number.isFinite(data.location.lat) && Number.isFinite(data.location.lng);
    const hasUrl = !!data.onlineUrl && URL_REGEX.test(data.onlineUrl!);

    switch (data.meetingKind) {
      case 'ONSITE':
        if (!hasCoords) {
          ctx.addIssue({
            code: 'custom',
            message: 'Location coordinates are required for on-site meetings',
            path: ['location'],
          });
        }
        break;
      case 'ONLINE':
        if (!hasUrl) {
          ctx.addIssue({
            code: 'custom',
            message: 'Online link is required for online meetings',
            path: ['onlineUrl'],
          });
        }
        break;
      case 'HYBRID':
        if (!hasCoords && !hasUrl) {
          ctx.addIssue({
            code: 'custom',
            message:
              'Provide either a valid location or an online link (or both)',
            path: ['meetingKind'],
          });
        }
        break;
    }
  });

/** Default values */
export const defaultIntentValues: IntentFormValues = {
  title: '',
  categorySlugs: [],
  tagSlugs: [],
  description: '',
  mode: 'ONE_TO_ONE',
  min: 2,
  max: 2,
  startAt: new Date(Date.now() + NOW_BUFFER_MS),
  endAt: new Date(Date.now() + NOW_BUFFER_MS + 60 * 60 * 1000),

  // Join windows / cutoffs - defaults to null (no restrictions)
  joinOpensMinutesBeforeStart: null,
  joinCutoffMinutesBeforeStart: null,
  allowJoinLate: true,
  lateJoinCutoffMinutesAfterStart: null,

  meetingKind: 'ONSITE',
  onlineUrl: '',
  location: {
    lat: undefined,
    lng: undefined,
    address: '',
    radiusKm: 1,
    placeId: '',
    cityName: undefined,
    cityPlaceId: undefined,
  },
  visibility: 'PUBLIC',
  joinMode: 'OPEN',
  levels: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
  addressVisibility: 'PUBLIC',
  membersVisibility: 'PUBLIC',
  notes: '',
};

export function useIntentForm(
  initial?: Partial<IntentFormValues>
): UseFormReturn<IntentFormValues> {
  return useForm<IntentFormValues>({
    mode: 'onChange',
    resolver: zodResolver(IntentSchema),
    defaultValues: { ...defaultIntentValues, ...initial },
    shouldUnregister: false,
  });
}
