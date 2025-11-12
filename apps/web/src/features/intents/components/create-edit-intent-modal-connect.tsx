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

export function CreateEditIntentModalConnect({
  intentId,
  open,
  onClose,
}: {
  intentId?: string;
  open: boolean;
  onClose: () => void;
}) {
  const { mutateAsync: createAsync } = useCreateIntentMutation();
  const { mutateAsync: updateAsync } = useUpdateIntentMutation();

  const [successOpen, setSuccessOpen] = useState(false);

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

  const handleSubmit = useCallback(
    async (formValues: IntentFormValues) => {
      const startTime = Date.now();
      const action = intentId ? 'updateIntent' : 'createIntent';

      try {
        devLogger.mutationStart(action, formValues);

        const input = mapFormToCreateInput(formValues);

        let result;
        if (intentId) {
          result = await updateAsync({ id: intentId, input });
        } else {
          result = await createAsync({ input });
        }

        const duration = Date.now() - startTime;
        devLogger.mutationSuccess(action, result, duration);

        onClose();
        setSuccessOpen(true);
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

      <SuccessIntentModal
        open={successOpen}
        onClose={() => setSuccessOpen(false)}
      />
    </>
  );
}
