'use client';

import { appLanguage, appLanguageFallback } from '@/constants/language';
import {
  useCreateIntentMutation,
  useIntentQuery,
  useUpdateIntentMutation,
} from '@/hooks/graphql/intents';
import { CategoryOption } from '@/types/types';
import { useCallback, useMemo, useState } from 'react';
import { CategorySelectionProvider } from './category-selection-provider';
import { CreateEditIntentModal } from './create-edit-intent-modal';
import { mapFormToCreateInput, mapIntentToFormValues } from './mappers';
import { SuccessIntentModal } from './success-intent-modal';
import { TagSelectionProvider } from './tag-selection-provider';
import { IntentFormValues } from './types';

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
      try {
        const input = mapFormToCreateInput(formValues);
        if (intentId) {
          await updateAsync({ id: intentId, input });
        } else {
          await createAsync({ input });
        }
        onClose();
        setSuccessOpen(true);
      } catch (err) {
        console.error(err); // TODO: toast
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
