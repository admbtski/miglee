'use client';

import { format, pl } from '@/lib/date';
import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { NoticeModal } from '@/components/ui/notice-modal';
import { useGetReports } from '@/features/reports';
import {
  ReportStatus,
  ReportEntity,
} from '@/lib/api/__generated__/react-query-update';
import {
  ExternalLink,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import clsx from 'clsx';
import { useDeleteReport } from '@/features/reports';
import { useUpdateReportStatus } from '@/features/reports';

type ReportDetailModalProps = {
  reportId: string;
  open: boolean;
  onClose: () => void;
};

const statusActions = [
  {
    status: ReportStatus.Investigating,
    label: 'Rozpocznij sprawdzanie',
    icon: Clock,
    color: 'amber',
  },
  {
    status: ReportStatus.Resolved,
    label: 'Oznacz jako rozwiązane',
    icon: CheckCircle,
    color: 'green',
  },
  {
    status: ReportStatus.Dismissed,
    label: 'Odrzuć zgłoszenie',
    icon: XCircle,
    color: 'gray',
  },
];

const entityLabels: Record<ReportEntity, string> = {
  [ReportEntity.Event]: 'Wydarzenie',
  [ReportEntity.Comment]: 'Komentarz',
  [ReportEntity.Review]: 'Recenzja',
  [ReportEntity.User]: 'Użytkownik',
  [ReportEntity.Message]: 'Wiadomość',
  [ReportEntity.Chat]: 'Czat',
};

export function ReportDetailModal({
  reportId,
  open,
  onClose,
}: ReportDetailModalProps) {
  const [successOpen, setSuccessOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const { data, refetch } = useGetReports({ limit: 100 }, { enabled: open });

  const { mutateAsync: updateStatus, isPending: isUpdating } =
    useUpdateReportStatus();
  const { mutateAsync: deleteReport, isPending: isDeleting } =
    useDeleteReport();

  const report = data?.reports?.items?.find((r) => r.id === reportId);

  useEffect(() => {
    if (open) {
      refetch();
    }
  }, [open, refetch]);

  if (!report) {
    return null;
  }

  const handleStatusChange = async (newStatus: ReportStatus) => {
    try {
      await updateStatus({
        id: reportId,
        input: { status: newStatus },
      });
      setSuccessOpen(true);
      setTimeout(() => {
        setSuccessOpen(false);
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error updating report status:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteReport({ id: reportId });
      setDeleteConfirmOpen(false);
      setSuccessOpen(true);
      setTimeout(() => {
        setSuccessOpen(false);
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error deleting report:', error);
    }
  };

  const getEntityLink = () => {
    switch (report.entity) {
      case ReportEntity.Event:
        return `/event/${report.entityId}`;
      case ReportEntity.User:
        return `/admin/users/${report.entityId}`;
      case ReportEntity.Comment:
        return `/admin/comments?id=${report.entityId}`;
      case ReportEntity.Review:
        return `/admin/reviews?id=${report.entityId}`;
      case ReportEntity.Message:
        return `/admin/dm?id=${report.entityId}`;
      case ReportEntity.Chat:
        return `/admin/dm?thread=${report.entityId}`;
      default:
        return null;
    }
  };

  const entityLink = getEntityLink();

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        variant="centered"
        size="lg"
        labelledById="report-detail-title"
        ariaLabel="Szczegóły zgłoszenia"
        header={
          <div>
            <h3
              id="report-detail-title"
              className="text-lg font-semibold text-zinc-900 dark:text-zinc-100"
            >
              Szczegóły zgłoszenia
            </h3>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              ID: {report.id}
            </p>
          </div>
        }
        content={
          <div className="space-y-6">
            {/* Basic info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Typ zgłoszenia
                </label>
                <p className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">
                  {entityLabels[report.entity]}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Status
                </label>
                <p className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">
                  {report.status}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Data zgłoszenia
                </label>
                <p className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">
                  {format(new Date(report.createdAt), 'dd MMMM yyyy, HH:mm', {
                    locale: pl,
                  })}
                </p>
              </div>
              {report.resolvedAt && (
                <div>
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Data rozwiązania
                  </label>
                  <p className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">
                    {format(
                      new Date(report.resolvedAt),
                      'dd MMMM yyyy, HH:mm',
                      {
                        locale: pl,
                      }
                    )}
                  </p>
                </div>
              )}
            </div>

            {/* Reporter */}
            <div>
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Zgłaszający
              </label>
              <div className="mt-1 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-900">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {report.reporter.name}
                </p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {(report.reporter as any).email || 'N/A'}
                </p>
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Powód zgłoszenia
              </label>
              <div className="mt-1 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-900">
                <p className="text-sm text-zinc-900 dark:text-zinc-100">
                  {report.reason}
                </p>
              </div>
            </div>

            {/* Entity link */}
            {entityLink && (
              <div>
                <a
                  href={entityLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  <ExternalLink className="h-4 w-4" />
                  Przejdź do zgłoszonego elementu
                </a>
              </div>
            )}

            {/* Actions */}
            {report.status !== ReportStatus.Resolved &&
              report.status !== ReportStatus.Dismissed && (
                <div>
                  <label className="mb-3 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Akcje moderacyjne
                  </label>
                  <div className="space-y-2">
                    {statusActions.map((action) => {
                      const Icon = action.icon;
                      return (
                        <button
                          key={action.status}
                          onClick={() => handleStatusChange(action.status)}
                          disabled={isUpdating}
                          className={clsx(
                            'flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                            action.color === 'green' &&
                              'border-green-200 bg-green-50 text-green-700 hover:bg-green-100 dark:border-green-800 dark:bg-green-950/30 dark:text-green-300 dark:hover:bg-green-950/50',
                            action.color === 'amber' &&
                              'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300 dark:hover:bg-amber-950/50',
                            action.color === 'gray' &&
                              'border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800'
                          )}
                        >
                          <Icon className="h-5 w-5" />
                          {action.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
          </div>
        }
        footer={
          <div className="flex justify-between">
            <button
              onClick={() => setDeleteConfirmOpen(true)}
              disabled={isDeleting}
              className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
            >
              <Trash2 className="h-4 w-4" />
              Usuń zgłoszenie
            </button>
            <button
              onClick={onClose}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Zamknij
            </button>
          </div>
        }
      />

      {/* Delete confirmation */}
      <NoticeModal
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        variant="error"
        size="sm"
        title="Usunąć zgłoszenie?"
        subtitle="Ta akcja jest nieodwracalna. Zgłoszenie zostanie trwale usunięte."
        primaryLabel="Usuń"
        secondaryLabel="Anuluj"
        onPrimary={handleDelete}
        onSecondary={() => setDeleteConfirmOpen(false)}
        primaryLoading={isDeleting}
      >
        <></>
      </NoticeModal>

      {/* Success */}
      <NoticeModal
        open={successOpen}
        onClose={() => setSuccessOpen(false)}
        variant="success"
        size="sm"
        title="Sukces"
        subtitle="Zgłoszenie zostało zaktualizowane"
        autoCloseMs={1500}
      >
        <></>
      </NoticeModal>
    </>
  );
}
