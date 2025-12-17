export type {
  EventFormValues,
  SimpleEventFormValues,
} from '../hooks/use-event-form';

// Re-export MeetingKind type
import { z } from 'zod';
import { MeetingKind as MeetingKindEnum } from '../hooks/use-event-form';

export type MeetingKindType = z.infer<typeof MeetingKindEnum>;
