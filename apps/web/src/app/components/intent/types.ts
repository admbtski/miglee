'use client';

import { z } from 'zod';
import {
  IntentSchema,
  MeetingKind as MeetingKindEnum,
} from './create/hooks/use-intent-form';

export type MeetingKindType = z.infer<typeof MeetingKindEnum>;

export type CreateIntentInput = {
  title: string;
  interestIds: string[]; // min 1, max 3
  description?: string; // ⬅️ opcjonalne
  startAt: string; // ISO
  endAt: string; // ISO
  allowJoinLate: boolean;
  min: number;
  max: number;
  mode: 'ONE_TO_ONE' | 'GROUP';
  meetingKind: MeetingKindType;
  onlineUrl?: string; // ⬅️ opcjonalne
  location: {
    lat?: number;
    lng?: number;
    address?: string;
    radiusKm?: number;
  };
  visibility: 'PUBLIC' | 'HIDDEN';
  notes?: string; // ⬅️ opcjonalne
};

export type IntentSuggestion = {
  id: string;
  title: string;
  author: string;
  distanceKm: number;
  startAt: string; // ISO
  endAt: string; // ISO
  min: number;
  max: number;
  taken: number;
};

export type CategoryOption = { id: string; name: string };

export type IntentFormValues = z.infer<typeof IntentSchema>;
