'use client';

import {
  ReportEntity,
  ReportStatus,
} from '@/lib/api/__generated__/react-query-update';
import clsx from 'clsx';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Eye } from 'lucide-react';

type Report = {
  id: string;
  reporterId: string;
  entity: ReportEntity;
  entityId: string;
  reason: string;
  status: ReportStatus;
  createdAt: string;
  resolvedAt?: string | null;
  reporter: {
    id: string;
    name: string;
    email: string;
  };
};

type ReportsTableProps = {
  reports: Report[];
  onSelectReport: (id: string) => void;
};

const statusConfig = {
  [ReportStatus.Open]: {
    label: 'Otwarte',
    className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  },
  [ReportStatus.Investigating]: {
    label: 'W trakcie',
    className:
      'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  },
  [ReportStatus.Resolved]: {
    label: 'Rozwiązane',
    className:
      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  },
  [ReportStatus.Dismissed]: {
    label: 'Odrzucone',
    className:
      'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
  },
};

const entityLabels = {
  [ReportEntity.Intent]: 'Wydarzenie',
  [ReportEntity.Comment]: 'Komentarz',
  [ReportEntity.Review]: 'Recenzja',
  [ReportEntity.User]: 'Użytkownik',
  [ReportEntity.Message]: 'Wiadomość',
};

export function ReportsTable({ reports, onSelectReport }: ReportsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
              Typ
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
              Powód
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
              Zgłaszający
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
              Data
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
              Akcje
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-800 dark:bg-gray-950">
          {reports.map((report) => (
            <tr
              key={report.id}
              className="hover:bg-gray-50 dark:hover:bg-gray-900"
            >
              <td className="whitespace-nowrap px-6 py-4">
                <span
                  className={clsx(
                    'inline-flex rounded-full px-2 py-1 text-xs font-semibold',
                    statusConfig[report.status].className
                  )}
                >
                  {statusConfig[report.status].label}
                </span>
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                {entityLabels[report.entity]}
              </td>
              <td className="max-w-xs truncate px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                {report.reason}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                {report.reporter.name}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                {format(new Date(report.createdAt), 'dd MMM yyyy, HH:mm', {
                  locale: pl,
                })}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                <button
                  onClick={() => onSelectReport(report.id)}
                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  <Eye className="h-4 w-4" />
                  <span>Szczegóły</span>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
