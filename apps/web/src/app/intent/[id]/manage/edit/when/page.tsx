'use client';

import { TimeStep } from '@/features/intents/components/time-step';
import { EditStepLayout } from '@/features/intents/components/edit-steps/edit-step-layout';
import { useIntentEdit } from '@/features/intents/components/edit-steps/intent-edit-provider';
import { useSaveIntentStep } from '@/features/intents/components/edit-steps/use-save-intent-step';

/**
 * When step - Start/end time, join windows
 */
export default function WhenStepPage() {
  const { form } = useIntentEdit();
  const { saveTime, isSaving } = useSaveIntentStep();

  // Get user timezone (you can get this from user profile or browser)
  const userTzLabel = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <EditStepLayout
      title="When"
      description="Set the date and time for your event"
      onSave={saveTime}
      isSaving={isSaving}
    >
      <TimeStep form={form} userTzLabel={userTzLabel} />
    </EditStepLayout>
  );
}
