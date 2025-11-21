'use client';

import { CapacityStep } from '@/features/intents/components/capacity-step';
import { EditStepLayout } from '@/features/intents/components/edit-steps/edit-step-layout';
import { useIntentEdit } from '@/features/intents/components/edit-steps/intent-edit-provider';
import { useSaveIntentStep } from '@/features/intents/components/edit-steps/use-save-intent-step';

/**
 * Capacity step - Min/max participants
 */
export default function CapacityStepPage() {
  const { form } = useIntentEdit();
  const { saveCapacity, isSaving } = useSaveIntentStep();

  return (
    <EditStepLayout
      title="Capacity"
      description="Set the minimum and maximum number of participants"
      onSave={saveCapacity}
      isSaving={isSaving}
    >
      <CapacityStep form={form} />
    </EditStepLayout>
  );
}
