'use client';

import { TimeStep } from '@/features/intents/components/time-step';
import { useIntentEdit } from '@/features/intents/components/edit-steps/intent-edit-provider';
import { useSaveIntentStep } from '@/features/intents/components/edit-steps/use-save-intent-step';
import { ManagementPageLayout } from '../../_components/management-page-layout';
import { SaveButton } from '../../_components/save-button';
import { useFormState, useWatch } from 'react-hook-form';

/**
 * When step - Start/end time, join windows
 */
export default function WhenStepPage() {
  const { form } = useIntentEdit();
  const { saveTime, isSaving } = useSaveIntentStep();
  
  // Subscribe to form changes to ensure isDirty is reactive
  // Must read the value to trigger React's subscription
  void useWatch({ control: form.control });
  
  // Use useFormState to subscribe to form state changes reactively
  const { isDirty } = useFormState({ control: form.control });

  // Get user timezone (you can get this from user profile or browser)
  const userTzLabel = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <ManagementPageLayout
      title="Schedule"
      description="Set the date and time for your event"
      actions={
        <SaveButton onClick={saveTime} isSaving={isSaving} isDirty={isDirty} />
      }
    >
      <TimeStep form={form} userTzLabel={userTzLabel} />
    </ManagementPageLayout>
  );
}
