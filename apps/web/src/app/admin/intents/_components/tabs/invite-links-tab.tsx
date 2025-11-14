'use client';

import { InviteLinksPanel } from '@/app/account/intents/_components/managemen/panels/invite-links/invite-links-panel';

type InviteLinksTabProps = {
  intentId: string;
};

export function InviteLinksTab({ intentId }: InviteLinksTabProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/30">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          <strong>Panel Admina:</strong> Zarządzaj linkami zaproszeń do tego
          wydarzenia.
        </p>
      </div>

      <InviteLinksPanel intentId={intentId} />
    </div>
  );
}
