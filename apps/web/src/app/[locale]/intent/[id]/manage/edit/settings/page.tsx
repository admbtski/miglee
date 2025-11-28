'use client';

import { PrivacyStep } from '@/features/intents/components/privacy-step';
import { useIntentEdit } from '@/features/intents/components/edit-steps/intent-edit-provider';
import { useSaveIntentStep } from '@/features/intents/components/edit-steps/use-save-intent-step';
import { ManagementPageLayout } from '../../_components/management-page-layout';
import { SaveButton } from '../../_components/save-button';
import { useFormState, useWatch } from 'react-hook-form';

/**
 * Settings step - Privacy, join mode, visibility, levels
 */
export default function SettingsStepPage() {
  const { form } = useIntentEdit();
  const { savePrivacy, isSaving } = useSaveIntentStep();
  
  // Subscribe to form changes to ensure isDirty is reactive
  // Must read the value to trigger React's subscription
  void useWatch({ control: form.control });
  
  // Use useFormState to subscribe to form state changes reactively
  const { isDirty } = useFormState({ control: form.control });

  return (
    <ManagementPageLayout
      title="Privacy & Access"
      description="Configure who can see and join your event"
      actions={
        <SaveButton
          onClick={savePrivacy}
          isSaving={isSaving}
          isDirty={isDirty}
        />
      }
    >
      <PrivacyStep form={form} />
    </ManagementPageLayout>
  );
}
