'use client';

import { useState } from 'react';
import { useGetReports } from '@/lib/api/reports';
import {
  ReportEntity,
  ReportStatus,
} from '@/lib/api/__generated__/react-query-update';
import { ReportsTable } from './_components/reports-table';
import { ReportsFilters } from './_components/reports-filters';
import { ReportDetailModal } from './_components/report-detail-modal';

export default function ReportsPage() {
  const [status, setStatus] = useState<ReportStatus | undefined>(
    ReportStatus.Open
  );
  const [entity, setEntity] = useState<ReportEntity | undefined>();
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useGetReports({
    limit: 50,
    offset: 0,
    status,
    entity,
  });

  const reports = data?.reports?.items ?? [];
  const total = data?.reports?.pageInfo?.total ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Raporty
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Kolejka moderacyjna zgłoszeń użytkowników
        </p>
      </div>

      {/* Filters */}
      <ReportsFilters
        status={status}
        entity={entity}
        onStatusChange={setStatus}
        onEntityChange={setEntity}
        totalCount={total}
      />

      {/* Table */}
      <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 dark:border-gray-700 dark:border-t-blue-400" />
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Ładowanie raportów...
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="p-6 text-center">
            <p className="text-sm text-red-600 dark:text-red-400">
              Błąd ładowania raportów: {error.message}
            </p>
          </div>
        )}

        {!isLoading && !error && reports.length === 0 && (
          <div className="p-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Brak raportów do wyświetlenia
            </p>
          </div>
        )}

        {!isLoading && !error && reports.length > 0 && (
          <ReportsTable
            reports={reports as any}
            onSelectReport={setSelectedReportId}
          />
        )}
      </div>

      {/* Detail Modal */}
      {selectedReportId && (
        <ReportDetailModal
          reportId={selectedReportId}
          open={!!selectedReportId}
          onClose={() => {
            setSelectedReportId(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}
