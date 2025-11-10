'use client';

import { Link as LinkIcon } from 'lucide-react';

type InviteLinksTabProps = {
  intentId: string;
};

export function InviteLinksTab({ intentId }: InviteLinksTabProps) {
  // TODO: Implement invite links query and management
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/30">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          <strong>Informacja:</strong> Zarządzanie linkami zaproszeń będzie
          dostępne w przyszłych wersjach.
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center gap-2">
          <LinkIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Aktywne linki
          </span>
        </div>
        <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
          -
        </p>
      </div>
    </div>
  );
}
