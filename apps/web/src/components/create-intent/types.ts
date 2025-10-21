'use client';

import {
  MeetingKind,
  Mode,
  Visibility,
} from '@/libs/graphql/__generated__/react-query-update';
import { z } from 'zod';
import {
  IntentSchema,
  MeetingKind as MeetingKindEnum,
} from './use-intent-form';

export type MeetingKindType = z.infer<typeof MeetingKindEnum>;

export type CreateIntentInput = {
  title: string;
  categorySlugs: string[];
  tagsSlugs: string[];
  description?: string;
  startAt: string;
  endAt: string;
  allowJoinLate: boolean;
  min: number;
  max: number;
  mode: Mode;
  meetingKind: MeetingKind;
  onlineUrl?: string;
  location: {
    placeId?: string;
    lat?: number;
    lng?: number;
    address?: string;
    radiusKm?: number;
  };
  visibility: Visibility;
  notes?: string;
};

export type CategoryOption = { id: string; slug: string; name: string };

export type IntentFormValues = z.infer<typeof IntentSchema>;
