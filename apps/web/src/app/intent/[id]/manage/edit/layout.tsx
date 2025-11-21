import { ReactNode } from 'react';
import { IntentEditProvider } from '@/features/intents/components/edit-steps/intent-edit-provider';
import { CategorySelectionProvider } from '@/features/intents/components/category-selection-provider';
import { TagSelectionProvider } from '@/features/intents/components/tag-selection-provider';

interface EditLayoutProps {
  children: ReactNode;
  params: Promise<{ id: string }>;
}

/**
 * Layout for event edit section
 * Provides form state context for all edit steps
 */
export default async function EditLayout({
  children,
  params,
}: EditLayoutProps) {
  const { id } = await params;

  return (
    <CategorySelectionProvider>
      <TagSelectionProvider>
        <IntentEditProvider intentId={id}>
          <div className="flex-1 overflow-y-auto">{children}</div>
        </IntentEditProvider>
      </TagSelectionProvider>
    </CategorySelectionProvider>
  );
}
