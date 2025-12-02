'use client';

import { CapacityStep } from '@/features/intents/components/capacity-step';
import { useIntentEdit } from '@/features/intents/components/edit-steps/intent-edit-provider';
import { useSaveIntentStep } from '@/features/intents/components/edit-steps/use-save-intent-step';
import { ManagementPageLayout } from '../../_components';
import { SaveButton } from '../../_components/save-button';
import { useFormState, useWatch } from 'react-hook-form';

/**
 * Capacity step - Min/max participants
 */
export default function CapacityStepPage() {
  const { form } = useIntentEdit();
  const { saveCapacity, isSaving } = useSaveIntentStep();

  // Subscribe to form changes to ensure isDirty is reactive
  // Must read the value to trigger React's subscription
  void useWatch({ control: form.control });

  // Use useFormState to subscribe to form state changes reactively
  const { isDirty } = useFormState({ control: form.control });

  return (
    <ManagementPageLayout
      title="Capacity"
      description="Set the minimum and maximum number of participants"
      actions={
        <SaveButton
          onClick={saveCapacity}
          isSaving={isSaving}
          isDirty={isDirty}
        />
      }
    >
      <CapacityStep form={form} />
    </ManagementPageLayout>
  );
}
