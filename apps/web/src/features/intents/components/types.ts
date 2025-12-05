'use client';

import { z } from 'zod';
import {
  IntentSchema,
  SimpleIntentSchema,
  MeetingKind as MeetingKindEnum,
} from './use-intent-form';

export type MeetingKindType = z.infer<typeof MeetingKindEnum>;

/**
 * Simplified form values for new intent creator (/intent/new)
 * Only includes essential fields needed for quick event creation.
 */
export type SimpleIntentFormValues = z.infer<typeof SimpleIntentSchema>;

/**
 * Full form values for intent editing in manage panel.
 * Includes all configurable fields.
 */
export type IntentFormValues = z.infer<typeof IntentSchema>;
