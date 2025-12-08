// TODO: Move this file to features/events/types/event-form.ts
// These types are form-related and should be colocated with other event types.
'use client';

import { z } from 'zod';
import {
  EventSchema,
  SimpleEventSchema,
  MeetingKind as MeetingKindEnum,
} from './use-event-form';

export type MeetingKindType = z.infer<typeof MeetingKindEnum>;

/**
 * Simplified form values for new event creator (/event/new)
 * Only includes essential fields needed for quick event creation.
 */
export type SimpleEventFormValues = z.infer<typeof SimpleEventSchema>;

/**
 * Full form values for event editing in manage panel.
 * Includes all configurable fields.
 */
export type EventFormValues = z.infer<typeof EventSchema>;
