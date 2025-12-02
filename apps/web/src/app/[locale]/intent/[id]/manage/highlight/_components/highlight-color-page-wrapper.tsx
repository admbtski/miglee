'use client';

import { HighlightColorPage } from '../../subscription/_components/highlight-color-page';
import { useSubscriptionData } from '../../subscription/_components/use-subscription-data';

type HighlightColorPageWrapperProps = {
  intentId: string;
};

export function HighlightColorPageWrapper({
  intentId,
}: HighlightColorPageWrapperProps) {
  const { sponsorship, onUpdateHighlightColor } = useSubscriptionData(intentId);

  if (!sponsorship) {
    return (
      <div className="rounded-[32px] border border-zinc-200/80 dark:border-white/5 bg-white dark:bg-[#10121a] shadow-sm p-6">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Brak aktywnego planu sponsorowania. Wybierz plan, aby uzyskać dostęp
          do koloru wyróżnienia.
        </p>
      </div>
    );
  }

  return (
    <HighlightColorPage
      intentId={intentId}
      sponsorship={sponsorship}
      onUpdateHighlightColor={onUpdateHighlightColor}
    />
  );
}
