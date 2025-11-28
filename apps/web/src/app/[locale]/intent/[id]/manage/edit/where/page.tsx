'use client';

import { PlaceStep } from '@/features/intents/components/place-step';
import { useIntentEdit } from '@/features/intents/components/edit-steps/intent-edit-provider';
import { useSaveIntentStep } from '@/features/intents/components/edit-steps/use-save-intent-step';
import { ManagementPageLayout } from '../../_components/management-page-layout';
import { SaveButton } from '../../_components/save-button';
import { useFormState, useWatch } from 'react-hook-form';

/**
 * Where step - Location, meeting kind, online URL
 */
export default function WhereStepPage() {
  const { form } = useIntentEdit();
  const { saveLocation, isSaving } = useSaveIntentStep();

  // Subscribe to form changes to ensure isDirty is reactive
  // Must read the value to trigger React's subscription
  void useWatch({ control: form.control });

  // Use useFormState to subscribe to form state changes reactively
  const { isDirty } = useFormState({ control: form.control });

  return (
    <ManagementPageLayout
      title="Location"
      description="Set the location or online meeting details"
      actions={
        <SaveButton
          onClick={saveLocation}
          isSaving={isSaving}
          isDirty={isDirty}
        />
      }
    >
      <PlaceStep form={form} />
    </ManagementPageLayout>
  );
}
