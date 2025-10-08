'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { IntentFormValues } from '../../types';

// --- Zod schema mirroring your requirements ---
const nowPlus5Min = () => new Date(Date.now() + 5 * 60 * 1000);

export const IntentSchema = z
  .object({
    title: z.string().min(3, 'Min 3 characters').max(60, 'Max 60 characters'),
    interestId: z.string().min(1, 'Select a category'),
    description: z
      .string()
      .max(500, 'Max 500 characters')
      .optional()
      .or(z.literal('')),
    mode: z.enum(['ONE_TO_ONE', 'GROUP']),
    min: z
      .number()
      .int()
      .refine((v) => v >= 2, 'Min capacity is set to 2'),
    max: z
      .number()
      .int()
      .refine((v) => v <= 50, 'Max capacity is set to 50'),
    startAt: z
      .date()
      .refine(
        (d) => d.getTime() >= nowPlus5Min().getTime(),
        'Start must be in the future (5 min buffer)'
      ),
    endAt: z.date(),
    allowJoinLate: z.boolean(),
    location: z.object({
      lat: z.number(),
      lng: z.number(),
      address: z.string().optional(),
      radiusKm: z.number().min(0).max(20).optional(),
    }),
    visibility: z.enum(['PUBLIC', 'HIDDEN']),
    notes: z.string().max(300).optional().or(z.literal('')),
  })
  .refine((data) => data.endAt.getTime() > data.startAt.getTime(), {
    path: ['endAt'],
    message: 'End must be after start',
  })
  .refine(
    (data) => {
      const MAX_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
      return data.endAt.getTime() - data.startAt.getTime() <= MAX_MS;
    },
    { path: ['endAt'], message: 'Max window is 30 days' }
  )
  .refine(
    (data) => {
      // ONE_TO_ONE → force capacity 2; GROUP → 2..50
      return data.mode === 'ONE_TO_ONE'
        ? data.min === 2
        : data.min >= 2 && data.max <= 50;
    },
    { path: ['capacity'], message: 'Invalid capacity for selected mode' }
  );

// --- Default values ---
export const defaultIntentValues: IntentFormValues = {
  title: '',
  interestId: '',
  description: '',
  mode: 'GROUP',
  min: 2,
  max: 50,
  startAt: nowPlus5Min(),
  endAt: new Date(Date.now() + 65 * 60 * 1000), // +65 min
  allowJoinLate: true,
  location: { lat: 0, lng: 0, address: '', radiusKm: 1 },
  visibility: 'PUBLIC',
  notes: '',
};

// Hook that encapsulates RHF + Zod for reuse in steps
export function useIntentForm(initial?: Partial<IntentFormValues>) {
  const values = useMemo(
    () => ({ ...defaultIntentValues, ...initial }),
    [initial]
  );

  const form = useForm<IntentFormValues>({
    mode: 'onChange',
    resolver: zodResolver(IntentSchema),
    defaultValues: values,
  });

  return form;
}
