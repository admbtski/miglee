'use client';

import { PlaceStep } from '@/features/intents/components/place-step';
import { EditStepLayout } from '@/features/intents/components/edit-steps/edit-step-layout';
import { useIntentEdit } from '@/features/intents/components/edit-steps/intent-edit-provider';
import { useSaveIntentStep } from '@/features/intents/components/edit-steps/use-save-intent-step';

/**
 * Where step - Location, meeting kind, online URL
 */
export default function WhereStepPage() {
  const { form } = useIntentEdit();
  const { saveLocation, isSaving } = useSaveIntentStep();

  return (
    <EditStepLayout
      title="Where"
      description="Set the location or online meeting details"
      onSave={saveLocation}
      isSaving={isSaving}
    >
      <PlaceStep form={form} />
    </EditStepLayout>
  );
}
