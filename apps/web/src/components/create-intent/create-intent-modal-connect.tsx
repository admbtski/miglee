'use client';

import { useCreateIntentMutation } from '@/hooks/graphql/intents';
import { useCallback } from 'react';
import { CreateIntentModal } from './create-intent-modal';
import { CreateIntentInput } from './types';
import { CategorySelectionProvider } from './category-selection-provider';
import { TagSelectionProvider } from './tag-selection-provider';

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

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleCreate = useCallback(async (input: CreateIntentInput) => {
    try {
      await mutateAsync({ input: map(input) });
    } catch (err) {
      console.error(err); // todo
    }
  }, []);

  if (!open) return null;

  return (
    <CategorySelectionProvider>
      <TagSelectionProvider>
        <CreateIntentModal
          open={open}
          onClose={handleClose}
          onCreate={handleCreate}
        />
      </TagSelectionProvider>
    </CategorySelectionProvider>
  );
}
