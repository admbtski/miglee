'use client';

import { PrivacyStep } from '@/features/intents/components/privacy-step';
import { EditStepLayout } from '@/features/intents/components/edit-steps/edit-step-layout';
import { useIntentEdit } from '@/features/intents/components/edit-steps/intent-edit-provider';
import { useSaveIntentStep } from '@/features/intents/components/edit-steps/use-save-intent-step';

/**
 * Settings step - Privacy, join mode, visibility, levels
 */
export default function SettingsStepPage() {
  const { form } = useIntentEdit();
  const { savePrivacy, isSaving } = useSaveIntentStep();

  return (
    <EditStepLayout
      title="Privacy & Access"
      description="Configure who can see and join your event"
      onSave={savePrivacy}
      isSaving={isSaving}
    >
      <PrivacyStep form={form} />
    </EditStepLayout>
  );
}
