'use client';

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
import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateIntentMutation } from '@/features/intents/api/intents';
import { CategorySelectionProvider } from '@/features/intents/components/category-selection-provider';
import { SimpleIntentFormValues } from '@/features/intents/components/types';
import { mapSimpleFormToCreateInput } from '@/features/intents/components/mappers';
import { toast, devLogger } from '@/lib/utils';
import { SimpleCreatorForm } from './simple-creator-form';
import { SuccessIntentModal } from '@/features/intents/components/success-intent-modal';

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

/**
 * SimpleCreatorPageClient - Simplified event creator
 *
 * Features:
 * - Minimal cognitive load (max 4 decisions per step)
 * - Quick presets for common choices
 * - Draft auto-save
 * - Creates events as DRAFT status by default
 */
export function SimpleCreatorPageClient() {
  const router = useRouter();
  const { mutateAsync: createAsync } = useCreateIntentMutation();

  const [successOpen, setSuccessOpen] = useState(false);
  const [createdIntentId, setCreatedIntentId] = useState<string | undefined>(
    undefined
  );

  const handleSuccessClose = useCallback(() => {
    setSuccessOpen(false);

    // Navigate to intent management page after success modal is closed
    if (createdIntentId) {
      router.push(`/intent/${createdIntentId}/manage`);
      setCreatedIntentId(undefined);
    }
  }, [createdIntentId, router]);

  const handleSubmit = useCallback(
    async (
      formValues: SimpleIntentFormValues,
      _coverImageFile?: File | null // Cover is uploaded in SimpleCreatorForm
    ): Promise<string | undefined> => {
      const startTime = Date.now();
      const action = 'createIntent';

      try {
        devLogger.mutationStart(action, formValues);

        const input = mapSimpleFormToCreateInput(formValues);

        const result = await createAsync({ input });

        const duration = Date.now() - startTime;
        devLogger.mutationSuccess(action, result, duration);

        // Extract intent ID from result
        let resultIntentId: string | undefined;
        if (result && 'createIntent' in result) {
          resultIntentId = result.createIntent?.id;
        }

        // Store intent ID for later use in handleSuccessClose
        setCreatedIntentId(resultIntentId);

        // Show success modal
        setSuccessOpen(true);

        // Return intentId for cover upload
        return resultIntentId;
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
      <SuccessIntentModal
        open={successOpen}
        onClose={handleSuccessClose}
        title="Wydarzenie utworzone!"
        subtitle="Twoje wydarzenie zostało zapisane jako wersja robocza. Teraz możesz je opublikować lub dalej konfigurować w panelu zarządzania."
        onViewIntent={
          createdIntentId
            ? () => router.push(`/intent/${createdIntentId}/manage`)
            : undefined
        }
        viewLabel="Przejdź do panelu"
      />
    </>
  );
}
