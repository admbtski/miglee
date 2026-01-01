export type {
  EventFormValues,
  SimpleEventFormValues,
} from '../hooks/use-event-form';

// Re-export MeetingKind type
import * as v from 'valibot';
import { MeetingKind as MeetingKindSchema } from '../hooks/use-event-form';

export type MeetingKindType = v.InferOutput<typeof MeetingKindSchema>;
