'use client';

import { useState } from 'react';
import { useUpdateIntentMutation } from '@/lib/api/intents';
import { toast } from '@/lib/utils';
import { useIntentEdit } from './intent-edit-provider';

/**
 * Hook for saving individual intent edit steps
 * Each step can save independently
 */
export function useSaveIntentStep() {
  const { form, intentId, categories, tags } = useIntentEdit();
  const [isSaving, setIsSaving] = useState(false);
  const updateIntentMutation = useUpdateIntentMutation();

  const saveBasics = async () => {
    const isValid = await form.trigger([
      'title',
      'categorySlugs',
      'mode',
      'description',
    ]);
    if (!isValid) {
      toast.error('Please fix validation errors');
      return;
    }

    setIsSaving(true);
    try {
      const values = form.getValues();
      await updateIntentMutation.mutateAsync({
        id: intentId,
        input: {
          title: values.title,
          categorySlugs: categories.map((c) => c.slug),
          tagSlugs: tags.map((t) => t.slug),
          description: values.description || undefined,
          mode: values.mode,
        },
      });
      toast.success('Event basics updated successfully!');
    } catch (error) {
      console.error('Failed to update event basics:', error);
      toast.error('Failed to update event basics');
    } finally {
      setIsSaving(false);
    }
  };

  const saveCapacity = async () => {
    const isValid = await form.trigger(['min', 'max']);
    if (!isValid) {
      toast.error('Please fix validation errors');
      return;
    }

    setIsSaving(true);
    try {
      const values = form.getValues();
      await updateIntentMutation.mutateAsync({
        id: intentId,
        input: {
          min: values.min,
          max: values.max,
        },
      });
      toast.success('Capacity updated successfully!');
    } catch (error) {
      console.error('Failed to update capacity:', error);
      toast.error('Failed to update capacity');
    } finally {
      setIsSaving(false);
    }
  };

  const saveTime = async () => {
    const isValid = await form.trigger(['startAt', 'endAt', 'allowJoinLate']);
    if (!isValid) {
      toast.error('Please fix validation errors');
      return;
    }

    setIsSaving(true);
    try {
      const values = form.getValues();
      await updateIntentMutation.mutateAsync({
        id: intentId,
        input: {
          startAt: values.startAt.toISOString(),
          endAt: values.endAt.toISOString(),
          allowJoinLate: values.allowJoinLate,
          joinOpensMinutesBeforeStart: values.joinOpensMinutesBeforeStart,
          joinCutoffMinutesBeforeStart: values.joinCutoffMinutesBeforeStart,
          lateJoinCutoffMinutesAfterStart:
            values.lateJoinCutoffMinutesAfterStart,
        },
      });
      toast.success('Time settings updated successfully!');
    } catch (error) {
      console.error('Failed to update time settings:', error);
      toast.error('Failed to update time settings');
    } finally {
      setIsSaving(false);
    }
  };

  const saveLocation = async () => {
    const isValid = await form.trigger([
      'meetingKind',
      'onlineUrl',
      'location.lat',
      'location.lng',
      'location.address',
      'location.placeId',
      'location.radiusKm',
      'notes',
    ]);
    if (!isValid) {
      toast.error('Please fix validation errors');
      return;
    }

    setIsSaving(true);
    try {
      const values = form.getValues();
      await updateIntentMutation.mutateAsync({
        id: intentId,
        input: {
          meetingKind: values.meetingKind,
          onlineUrl: values.onlineUrl || undefined,
          location: {
            placeId: values.location.placeId,
            lat: values.location.lat,
            lng: values.location.lng,
            address: values.location.address,
            radiusKm: values.location.radiusKm,
          },
          notes: values.notes || undefined,
        },
      });
      toast.success('Location updated successfully!');
    } catch (error) {
      console.error('Failed to update location:', error);
      toast.error('Failed to update location');
    } finally {
      setIsSaving(false);
    }
  };

  const savePrivacy = async () => {
    const isValid = await form.trigger([
      'visibility',
      'joinMode',
      'levels',
      'addressVisibility',
      'membersVisibility',
    ]);
    if (!isValid) {
      toast.error('Please fix validation errors');
      return;
    }

    setIsSaving(true);
    try {
      const values = form.getValues();
      await updateIntentMutation.mutateAsync({
        id: intentId,
        input: {
          visibility: values.visibility,
          joinMode: values.joinMode,
          levels: values.levels,
          addressVisibility: values.addressVisibility,
          membersVisibility: values.membersVisibility,
        },
      });
      toast.success('Privacy settings updated successfully!');
    } catch (error) {
      console.error('Failed to update privacy settings:', error);
      toast.error('Failed to update privacy settings');
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isSaving,
    saveBasics,
    saveCapacity,
    saveTime,
    saveLocation,
    savePrivacy,
  };
}
