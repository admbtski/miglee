'use client';

import { BoostPage } from '../../subscription/_components/boost-page';
import { useSubscriptionData } from '../../subscription/_components/use-subscription-data';

type BoostPageWrapperProps = {
  intentId: string;
};

export function BoostPageWrapper({ intentId }: BoostPageWrapperProps) {
  const { sponsorship, onBoostEvent } = useSubscriptionData(intentId);

  if (!sponsorship) {
    return (
      <div className="rounded-[32px] border border-zinc-200/80 dark:border-white/5 bg-white dark:bg-[#10121a] shadow-sm p-6">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Brak aktywnego planu sponsorowania. Wybierz plan, aby uzyskać dostęp
          do podbić.
        </p>
      </div>
    );
  }

  return (
    <BoostPage
      intentId={intentId}
      sponsorship={sponsorship}
      onBoostEvent={onBoostEvent}
    />
  );
}
