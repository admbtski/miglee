'use client';

import { LocalPushPage } from '../../subscription/_components/local-push-page';
import { useSubscriptionData } from '../../subscription/_components/use-subscription-data';

type LocalPushPageWrapperProps = {
  intentId: string;
};

export function LocalPushPageWrapper({ intentId }: LocalPushPageWrapperProps) {
  const { sponsorship, onSendLocalPush } = useSubscriptionData(intentId);

  if (!sponsorship) {
    return (
      <div className="rounded-[32px] border border-zinc-200/80 dark:border-white/5 bg-white dark:bg-[#10121a] shadow-sm p-6">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Brak aktywnego planu sponsorowania. Wybierz plan, aby uzyskać dostęp
          do powiadomień lokalnych.
        </p>
      </div>
    );
  }

  return (
    <LocalPushPage
      intentId={intentId}
      sponsorship={sponsorship}
      onSendLocalPush={onSendLocalPush}
    />
  );
}
