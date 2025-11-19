'use client';

import { appLanguage, appLanguageFallback } from '@/lib/config/language';
import {
  useCreateIntentMutation,
  useIntentQuery,
  useUpdateIntentMutation,
} from '@/lib/api/intents';
import { CategoryOption } from '@/types/types';
import { useCallback, useMemo, useState } from 'react';
import { CategorySelectionProvider } from './category-selection-provider';
import { CreateEditIntentModal } from './create-edit-intent-modal';
import { mapFormToCreateInput, mapIntentToFormValues } from './mappers';
import { SuccessIntentModal } from './success-intent-modal';
import { TagSelectionProvider } from './tag-selection-provider';
import { IntentFormValues } from './types';
import { toast, devLogger } from '@/lib/utils';
import type { JoinFormQuestion } from './join-form-step';
import { useIntentCoverUpload } from '@/lib/media/use-media-upload';

/**
 * CreateEditIntentModalConnect - Modal for creating/editing intents with auto-save
 *
 * @param intentId - Optional ID for editing existing intent
 * @param open - Controls modal visibility
 * @param onClose - Called when modal is closed
 * @param onSuccess - Optional callback with intentId called AFTER success modal is closed
 *                    Use this to navigate to detail page after user sees success message
 *
 * @example
 * // Without navigation (just shows success modal)
 * <CreateEditIntentModalConnect
 *   open={isOpen}
 *   onClose={() => setIsOpen(false)}
 * />
 *
 * @example
 * // With navigation to detail page after success modal
 * const router = useRouter();
 * <CreateEditIntentModalConnect
 *   open={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   onSuccess={(intentId) => {
 *     // This will be called AFTER user closes the success modal
 *     router.push(`/intent/${intentId}`);
 *   }}
 * />
 */
export function CreateEditIntentModalConnect({
  intentId,
  open,
  onClose,
  onSuccess,
}: {
  intentId?: string;
  open: boolean;
  onClose: () => void;
  onSuccess?: (intentId: string) => void;
}) {
  const { mutateAsync: createAsync } = useCreateIntentMutation();
  const { mutateAsync: updateAsync } = useUpdateIntentMutation();

  const [successOpen, setSuccessOpen] = useState(false);
  const [createdIntentId, setCreatedIntentId] = useState<string | undefined>(
    undefined
  );

  const { data } = useIntentQuery(
    { id: intentId! },
    { enabled: !!intentId && open }
  );

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

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleSuccessClose = useCallback(() => {
    setSuccessOpen(false);

    // Call onSuccess callback after success modal is closed
    if (onSuccess && createdIntentId) {
      onSuccess(createdIntentId);
      setCreatedIntentId(undefined);
    }
  }, [onSuccess, createdIntentId]);

  const handleSubmit = useCallback(
    async (
      formValues: IntentFormValues,
      joinFormQuestions?: JoinFormQuestion[],
      coverImageFile?: File | null
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

        onClose();

        // Always show success modal
        // onSuccess will be called in handleSuccessClose after user closes the modal
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
    [createAsync, updateAsync, onClose, intentId]
  );

  // Render nothing only when both are closed
  if (!open && !successOpen) return null;

  return (
    <>
      {open && (
        <CategorySelectionProvider initial={initialCategoryOptions}>
          <TagSelectionProvider initial={initialTagOptions}>
            <CreateEditIntentModal
              initialCategories={initialCategoryOptions}
              initialTags={initialTagOptions}
              initialValues={initialValues}
              open={open}
              mode={intentId ? 'edit' : 'create'}
              onClose={handleClose}
              onSubmit={handleSubmit}
            />
          </TagSelectionProvider>
        </CategorySelectionProvider>
      )}

      <SuccessIntentModal open={successOpen} onClose={handleSuccessClose} />
    </>
  );
}
