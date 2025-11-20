'use client';

import {
  BadgePlusIcon,
  CalendarClockIcon,
  HatGlassesIcon,
  ImageIcon,
  SquarePenIcon,
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CategoryOption } from '@/types/types';
import { appLanguage, appLanguageFallback } from '@/lib/config/language';
import {
  useCreateIntentMutation,
  useIntentQuery,
  useUpdateIntentMutation,
} from '@/lib/api/intents';
import { CategorySelectionProvider } from '@/features/intents/components/category-selection-provider';
import { TagSelectionProvider } from '@/features/intents/components/tag-selection-provider';
import { IntentFormValues } from '@/features/intents/components/types';
import {
  mapFormToCreateInput,
  mapIntentToFormValues,
} from '@/features/intents/components/mappers';
import { toast, devLogger } from '@/lib/utils';
import type { JoinFormQuestion } from '@/features/intents/components/join-form-step';
import { IntentCreatorForm } from './intent-creator-form';
import { SuccessIntentModal } from '@/features/intents/components/success-intent-modal';

const STEP_META = [
  { key: 'basics', label: 'Event Details', Icon: SquarePenIcon },
  { key: 'capacity', label: 'Capacity', Icon: HatGlassesIcon },
  { key: 'when', label: 'When', Icon: CalendarClockIcon },
  { key: 'where', label: 'Where', Icon: CalendarClockIcon },
  { key: 'settings', label: 'Privacy & Access', Icon: HatGlassesIcon },
  { key: 'cover', label: 'Cover Image', Icon: ImageIcon },
  { key: 'review', label: 'Review', Icon: BadgePlusIcon },
];

type IntentCreatorPageClientProps = {
  intentId?: string;
};

/**
 * IntentCreatorPageClient - Full-page intent creator/editor
 *
 * This is the page equivalent of CreateEditIntentModalConnect
 * Provides the same functionality but as a standalone page instead of a modal
 *
 * @param intentId - Optional ID for editing existing intent (via query param)
 */
export function IntentCreatorPageClient({
  intentId,
}: IntentCreatorPageClientProps) {
  const router = useRouter();
  const { mutateAsync: createAsync } = useCreateIntentMutation();
  const { mutateAsync: updateAsync } = useUpdateIntentMutation();

  const [successOpen, setSuccessOpen] = useState(false);
  const [createdIntentId, setCreatedIntentId] = useState<string | undefined>(
    undefined
  );

  const { data, isLoading } = useIntentQuery(
    { id: intentId! },
    { enabled: !!intentId }
  );

  const isEdit = !!intentId;
  const steps = STEP_META;

  const initialValues: Partial<IntentFormValues> | undefined = useMemo(() => {
    if (!intentId || !data?.intent) return undefined;
    return mapIntentToFormValues(data.intent);
  }, [intentId, data?.intent]);

  const initialCategoryOptions = useMemo((): CategoryOption[] => {
    if (!intentId || !data?.intent) return [];
    return data.intent.categories.map((c) => ({
      id: c.id,
      label: c.names[appLanguage] ?? c.names[appLanguageFallback] ?? c.slug,
      slug: c.slug,
    }));
  }, [intentId, data?.intent]);

  const initialTagOptions = useMemo(() => {
    if (!intentId || !data?.intent) return [];
    return data.intent.tags.map((t) => ({
      id: t.id,
      label: t.label,
      slug: t.slug,
    }));
  }, [intentId, data?.intent]);

  const handleSuccessClose = useCallback(() => {
    setSuccessOpen(false);

    // Navigate to intent detail page after success modal is closed
    if (createdIntentId) {
      router.push(`/intent/${createdIntentId}`);
      setCreatedIntentId(undefined);
    }
  }, [createdIntentId, router]);

  const handleSubmit = useCallback(
    async (
      formValues: IntentFormValues,
      joinFormQuestions?: JoinFormQuestion[]
    ): Promise<string | undefined> => {
      const startTime = Date.now();
      const action = intentId ? 'updateIntent' : 'createIntent';

      try {
        devLogger.mutationStart(action, formValues);

        const input = mapFormToCreateInput(formValues);

        // Add join questions to input if provided (only for create)
        if (!intentId && joinFormQuestions && joinFormQuestions.length > 0) {
          (input as any).joinQuestions = joinFormQuestions.map((q) => ({
            type: q.type,
            label: q.label,
            helpText: q.helpText || undefined,
            required: q.required,
            options: q.options?.map((opt) => ({ label: opt })),
            maxLength: q.maxLength,
          }));
        }

        let result;
        if (intentId) {
          result = await updateAsync({ id: intentId, input });
        } else {
          result = await createAsync({ input });
        }

        const duration = Date.now() - startTime;
        devLogger.mutationSuccess(action, result, duration);

        // Extract intent ID from result
        let resultIntentId: string | undefined = intentId;
        if (!resultIntentId && result && 'createIntent' in result) {
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
        toast.error(
          intentId ? 'Failed to update event' : 'Failed to create event',
          {
            description,
            duration: 5000,
          }
        );

        return undefined;
      }
    },
    [createAsync, updateAsync, intentId]
  );

  // Show loading skeleton while fetching intent data for edit mode
  if (isEdit && isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-4 w-full max-w-md rounded bg-zinc-200 dark:bg-zinc-800" />
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-2 w-full rounded-full bg-zinc-200 dark:bg-zinc-800" />
          <div className="space-y-3">
            <div className="h-10 w-full rounded-lg bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-10 w-full rounded-lg bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-32 w-full rounded-lg bg-zinc-200 dark:bg-zinc-800" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {isEdit ? 'Edit Event' : 'Create New Event'}
          </h1>
          <p className="mt-3 text-base text-zinc-600 dark:text-zinc-400 max-w-2xl">
            {isEdit
              ? 'Update your event details and settings'
              : 'Fill in the details below to create your event. All fields marked with * are required.'}
          </p>
        </div>

        {/* Form */}
        <CategorySelectionProvider initial={initialCategoryOptions}>
          <TagSelectionProvider initial={initialTagOptions}>
            <IntentCreatorForm
              initialCategories={initialCategoryOptions}
              initialTags={initialTagOptions}
              initialValues={initialValues}
              mode={isEdit ? 'edit' : 'create'}
              onSubmit={handleSubmit}
              steps={steps}
            />
          </TagSelectionProvider>
        </CategorySelectionProvider>
      </div>

      {/* Success Modal */}
      <SuccessIntentModal
        open={successOpen}
        onClose={handleSuccessClose}
        title={isEdit ? 'Event Updated!' : 'Event Created!'}
        subtitle={
          isEdit
            ? 'Your changes have been saved successfully.'
            : 'Your event is now live — share it or jump in to manage details.'
        }
        onViewIntent={
          createdIntentId
            ? () => router.push(`/intent/${createdIntentId}`)
            : undefined
        }
      />
    </>
  );
}
