'use client';

import { useCreateIntentMutation } from '@/hooks/graphql/intents';
import { useCallback, useState } from 'react';
import { CreateIntentModal } from './create-intent-modal';
import { CreateIntentInput } from './types';
import { CategorySelectionProvider } from './category-selection-provider';
import { TagSelectionProvider } from './tag-selection-provider';
import { SuccessIntentModal } from './success-intent-modal';

const map = (
  input: CreateIntentInput
): Parameters<
  ReturnType<typeof useCreateIntentMutation>['mutateAsync']
>['0']['input'] => {
  return {
    title: input.title,
    description: input.description,
    notes: input.notes,
    categorySlugs: input.categorySlugs,
    tagSlugs: [], //todo
    visibility: input.visibility,
    mode: input.mode,
    min: input.min,
    max: input.max,
    startAt: input.startAt,
    endAt: input.endAt,
    allowJoinLate: input.allowJoinLate,
    meetingKind: input.meetingKind,
    onlineUrl: input.onlineUrl,
    location: input.location.placeId
      ? {
          address: input.location.address,
          lat: input.location.lat,
          lng: input.location.lng,
          placeId: input.location.placeId,
          radiusKm: input.location.radiusKm,
        }
      : undefined,
    levels: [], //todo
  };
};

export function CreateIntentModalConnect({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { mutateAsync } = useCreateIntentMutation();
  const [successOpen, setSuccessOpen] = useState(false);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleCreate = useCallback(
    async (input: CreateIntentInput) => {
      try {
        await mutateAsync({ input: map(input) });
        // Close the create modal...
        onClose();
        // ...then show success modal (it renders even when create modal is closed)
        setSuccessOpen(true);
      } catch (err) {
        console.error(err); // todo: proper error handling/toast
      }
    },
    [mutateAsync, onClose]
  );

  // Render nothing only when both are closed
  if (!open && !successOpen) return null;

  return (
    <>
      {open && (
        <CategorySelectionProvider>
          <TagSelectionProvider>
            <CreateIntentModal
              open={open}
              onClose={handleClose}
              onCreate={handleCreate}
            />
          </TagSelectionProvider>
        </CategorySelectionProvider>
      )}

      {/* Success modal lives outside of the form lifecycle */}
      <SuccessIntentModal
        open={successOpen}
        onClose={() => setSuccessOpen(false)}
      />
    </>
  );
}
