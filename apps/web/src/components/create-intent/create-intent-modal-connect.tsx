'use client';

import { useCallback } from 'react';
import { CreateIntentModal } from './create-intent-modal';
import { useCreateIntentMutation } from '@/hooks/graphql/intents';
import { CreateIntentInput } from './types';

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
      await mutateAsync({
        input: {
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
        },
      });
    } catch (err) {
      console.dir({ err });
    }
  }, []);

  if (!open) return null;

  return (
    <CreateIntentModal
      open={open}
      onClose={handleClose}
      fetchSuggestions={async () => []}
      onCreate={handleCreate}
    />
  );
}
