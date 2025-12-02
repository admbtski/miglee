'use client';

import { BasicsStep } from '@/features/intents/components/basics-step';
import { useIntentEdit } from '@/features/intents/components/edit-steps/intent-edit-provider';
import { useSaveIntentStep } from '@/features/intents/components/edit-steps/use-save-intent-step';
import { SaveButton } from '../../_components/save-button';
import { useFormState } from 'react-hook-form';
import { ManagementPageLayout } from '../../_components';

/**
 * Basics step - Event title, categories, tags, description, mode
 */
export default function BasicsStepPage() {
  const { form } = useIntentEdit();
  const { saveBasics, isSaving } = useSaveIntentStep();

  // Use useFormState to subscribe to form state changes reactively
  const { isDirty } = useFormState({ control: form.control });

  console.dir({ isDirty });

  return (
    <ManagementPageLayout
      title="Event Basics"
      description="Set up the fundamental details of your event"
      actions={
        <SaveButton
          onClick={saveBasics}
          isSaving={isSaving}
          isDirty={isDirty}
        />
      }
    >
      <BasicsStep form={form} />
    </ManagementPageLayout>
  );
}
