'use client';

/**
 * SimpleCreatorPageClient - Simplified event creator
 *
 * Features:
 * - Minimal cognitive load (max 4 decisions per step)
 * - Quick presets for common choices
 * - Draft auto-save
 * - Creates events as DRAFT status by default
 */

// Note: This page uses Polish strings - already i18n ready pattern

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CalendarDays,
  CheckCircle2,
  Eye,
  FileText,
  Image as ImageIcon,
  MapPin,
  Sparkles,
  Users,
} from 'lucide-react';

// Features
import { useCreateEventMutation } from '@/features/events/api/events';
import {
  CategorySelectionProvider,
  mapSimpleFormToCreateInput,
  SuccessEventModal,
} from '@/features/events';
import type { SimpleEventFormValues } from '@/features/events/types/event-form';

// Lib
import { devLogger, toast } from '@/lib/utils';

// Local components
import { SimpleCreatorForm } from './simple-creator-form';

/**
 * Step metadata for the simplified creator
 * Only 7 steps: Basics, Schedule, Location, Capacity, Privacy, Cover, Review
 */
const STEP_META = [
  { key: 'basics', label: 'Podstawy', Icon: FileText },
  { key: 'schedule', label: 'Termin', Icon: CalendarDays },
  { key: 'location', label: 'Lokalizacja', Icon: MapPin },
  { key: 'capacity', label: 'Liczebność', Icon: Users },
  { key: 'privacy', label: 'Prywatność', Icon: Eye },
  { key: 'cover', label: 'Okładka', Icon: ImageIcon },
  { key: 'review', label: 'Podsumowanie', Icon: CheckCircle2 },
];

export function SimpleCreatorPageClient() {
  const router = useRouter();
  const { mutateAsync: createAsync } = useCreateEventMutation();

  const [successOpen, setSuccessOpen] = useState(false);
  const [createdEventId, setCreatedEventId] = useState<string | undefined>(
    undefined
  );

  const handleSuccessClose = useCallback(() => {
    setSuccessOpen(false);

    // Navigate to event management page after success modal is closed
    if (createdEventId) {
      router.push(`/event/${createdEventId}/manage`);
      setCreatedEventId(undefined);
    }
  }, [createdEventId, router]);

  const handleSubmit = useCallback(
    async (
      formValues: SimpleEventFormValues,
      _coverImageFile?: File | null // Cover is uploaded in SimpleCreatorForm
    ): Promise<string | undefined> => {
      const startTime = Date.now();
      const action = 'createEvent';

      try {
        devLogger.mutationStart(action, formValues);

        const input = mapSimpleFormToCreateInput(formValues);

        const result = await createAsync({ input });

        const duration = Date.now() - startTime;
        devLogger.mutationSuccess(action, result, duration);

        // Extract event ID from result
        let resultEventId: string | undefined;
        if (result && 'createEvent' in result) {
          resultEventId = result.createEvent?.id;
        }

        // Store event ID for later use in handleSuccessClose
        setCreatedEventId(resultEventId);

        // Show success modal
        setSuccessOpen(true);

        // Return eventId for cover upload
        return resultEventId;
      } catch (err: any) {
        const duration = Date.now() - startTime;
        devLogger.mutationError(action, err, formValues, duration);

        // Extract error message from GraphQL error
        const errorMessage =
          err?.response?.errors?.[0]?.message ||
          err?.message ||
          'Failed to save event';

        // Extract field from extensions if available
        const field = err?.response?.errors?.[0]?.extensions?.field;
        const errorCode = err?.response?.errors?.[0]?.extensions?.code;

        // Create user-friendly error message
        let description = errorMessage;
        if (field && errorCode === 'BAD_USER_INPUT') {
          description = `Invalid ${field}: ${errorMessage}`;
        }

        // Show user-friendly error toast
        toast.error('Nie udało się utworzyć wydarzenia', {
          description,
          duration: 5000,
        });

        return undefined;
      }
    },
    [createAsync]
  );

  return (
    <>
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-4 text-sm font-medium rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
            <Sparkles className="w-4 h-4" />
            Szybki kreator
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
            Stwórz wydarzenie
          </h1>
          <p className="mt-3 text-base text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
            Wypełnij podstawowe informacje — resztę ustawień dostosujesz w
            panelu wydarzenia po jego utworzeniu.
          </p>
        </div>

        {/* Form - no TagSelectionProvider needed for simplified creator */}
        <CategorySelectionProvider initial={[]}>
          <SimpleCreatorForm onSubmit={handleSubmit} steps={STEP_META} />
        </CategorySelectionProvider>
      </div>

      {/* Success Modal */}
      <SuccessEventModal
        open={successOpen}
        onClose={handleSuccessClose}
        title="Wydarzenie utworzone!"
        subtitle="Twoje wydarzenie zostało zapisane jako wersja robocza. Teraz możesz je opublikować lub dalej konfigurować w panelu zarządzania."
        onViewEvent={
          createdEventId
            ? () => router.push(`/event/${createdEventId}/manage`)
            : undefined
        }
        viewLabel="Przejdź do panelu"
      />
    </>
  );
}
