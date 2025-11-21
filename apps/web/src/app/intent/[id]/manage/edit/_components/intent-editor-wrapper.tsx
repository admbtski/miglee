'use client';

import { IntentCreatorPageClient } from '@/app/intent/creator/_components/intent-creator-page-client';

interface IntentEditorWrapperProps {
  intentId: string;
}

/**
 * IntentEditorWrapper - Wrapper for IntentCreatorPageClient in management context
 *
 * This component wraps the creator/editor component and adapts it for use
 * within the management interface, removing the standalone page styling
 * and integrating it with the management layout.
 */
export function IntentEditorWrapper({ intentId }: IntentEditorWrapperProps) {
  return (
    <div className="space-y-6">
      <IntentCreatorPageClient intentId={intentId} />
    </div>
  );
}
