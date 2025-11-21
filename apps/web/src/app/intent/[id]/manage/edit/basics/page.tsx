'use client';

import { BasicsStep } from '@/features/intents/components/basics-step';
import { EditStepLayout } from '@/features/intents/components/edit-steps/edit-step-layout';
import { useIntentEdit } from '@/features/intents/components/edit-steps/intent-edit-provider';
import { useSaveIntentStep } from '@/features/intents/components/edit-steps/use-save-intent-step';

/**
 * Basics step - Event title, categories, tags, description, mode
 */
export default function BasicsStepPage() {
  const { form } = useIntentEdit();
  const { saveBasics, isSaving } = useSaveIntentStep();

  return (
    <EditStepLayout
      title="Event Basics"
      description="Set up the fundamental details of your event"
      onSave={saveBasics}
      isSaving={isSaving}
    >
      <BasicsStep form={form} />
    </EditStepLayout>
  );
}
