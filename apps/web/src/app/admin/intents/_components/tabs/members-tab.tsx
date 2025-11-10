'use client';

import { Users, UserCheck, UserX, Clock } from 'lucide-react';

type MembersTabProps = {
  intentId: string;
  onRefresh?: () => void;
};

export function MembersTab({ intentId }: MembersTabProps) {
  // TODO: Implement members query and management
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/30">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          <strong>Informacja:</strong> Zarządzanie członkami wydarzenia będzie
          dostępne w przyszłych wersjach. Obecnie można przeglądać członków
          bezpośrednio w wydarzeniu.
        </p>
      </div>

      {/* Placeholder Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Zaakceptowani
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
            -
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Oczekujący
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
            -
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-2">
            <UserX className="h-5 w-5 text-red-600 dark:text-red-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Zablokowani
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
            -
          </p>
        </div>
      </div>
    </div>
  );
}
