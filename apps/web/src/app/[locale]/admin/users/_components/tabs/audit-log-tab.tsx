'use client';

import { format, pl } from '@/lib/date';
import { useState } from 'react';
import {
  Clock,
  Shield,
  Loader2,
  Ban,
  CheckCircle,
  Trash2,
  Edit,
  UserPlus,
  RefreshCw,
} from 'lucide-react';
import { useAdminUserAuditLogsQuery } from '@/features/admin';

type AuditLogTabProps = {
  userId: string;
};

const actionIcons: Record<string, React.ReactNode> = {
  UPDATE_ROLE: <Shield className="h-4 w-4" />,
  UPDATE_VERIFIED: <CheckCircle className="h-4 w-4" />,
  SUSPEND: <Ban className="h-4 w-4" />,
  UNSUSPEND: <CheckCircle className="h-4 w-4" />,
  DELETE: <Trash2 className="h-4 w-4" />,
  UPDATE_PROFILE: <Edit className="h-4 w-4" />,
  CREATE: <UserPlus className="h-4 w-4" />,
};

const actionColors: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  UPDATE_ROLE: {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
  },
  UPDATE_VERIFIED: {
    bg: 'bg-green-50 dark:bg-green-950/30',
    text: 'text-green-700 dark:text-green-300',
    border: 'border-green-200 dark:border-green-800',
  },
  SUSPEND: {
    bg: 'bg-red-50 dark:bg-red-950/30',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-200 dark:border-red-800',
  },
  UNSUSPEND: {
    bg: 'bg-green-50 dark:bg-green-950/30',
    text: 'text-green-700 dark:text-green-300',
    border: 'border-green-200 dark:border-green-800',
  },
  DELETE: {
    bg: 'bg-zinc-50 dark:bg-zinc-950/30',
    text: 'text-zinc-700 dark:text-zinc-300',
    border: 'border-zinc-200 dark:border-zinc-800',
  },
  UPDATE_PROFILE: {
    bg: 'bg-purple-50 dark:bg-purple-950/30',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-800',
  },
  CREATE: {
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
  },
};

const actionLabels: Record<string, string> = {
  UPDATE_ROLE: 'Zmiana roli',
  UPDATE_VERIFIED: 'Zmiana weryfikacji',
  SUSPEND: 'Zawieszenie konta',
  UNSUSPEND: 'Odwieszenie konta',
  DELETE: 'Usunięcie konta',
  UPDATE_PROFILE: 'Edycja profilu',
  CREATE: 'Utworzenie konta',
};

const getSeverityLabel = (severity: number) => {
  if (severity >= 5)
    return { label: 'Krytyczne', color: 'text-red-600 dark:text-red-400' };
  if (severity >= 4)
    return { label: 'Wysokie', color: 'text-orange-600 dark:text-orange-400' };
  if (severity >= 3)
    return { label: 'Średnie', color: 'text-amber-600 dark:text-amber-400' };
  return { label: 'Niskie', color: 'text-blue-600 dark:text-blue-400' };
};

export function AuditLogTab({ userId }: AuditLogTabProps) {
  const [filter, setFilter] = useState<string>('all');

  const { data, isLoading, refetch } = useAdminUserAuditLogsQuery({
    userId,
    limit: 50,
    offset: 0,
  });

  const logs = data?.adminUserAuditLogs?.items ?? [];
  const filteredLogs =
    filter === 'all' ? logs : logs.filter((log) => log.action === filter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Historia akcji administracyjnych
          </h4>
          <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
            Wszystkie akcje wykonane przez administratorów na tym koncie
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          title="Odśwież historię"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Odśwież
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Filtruj:
        </label>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        >
          <option value="all">Wszystkie</option>
          <option value="UPDATE_ROLE">Zmiana roli</option>
          <option value="UPDATE_VERIFIED">Weryfikacja</option>
          <option value="SUSPEND">Zawieszenie</option>
          <option value="UNSUSPEND">Odwieszenie</option>
          <option value="DELETE">Usunięcie</option>
          <option value="UPDATE_PROFILE">Edycja profilu</option>
          <option value="CREATE">Utworzenie</option>
        </select>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
        </div>
      )}

      {/* Audit Log List */}
      {!isLoading && (
        <div className="space-y-3">
          {filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-sm text-zinc-600 dark:text-zinc-400">
              Brak wpisów w historii akcji
            </div>
          ) : (
            filteredLogs.map((log: any) => {
              const colors =
                actionColors[log.action as keyof typeof actionColors] ||
                actionColors.DELETE;
              const severityInfo = getSeverityLabel(log.severity);

              return (
                <div
                  key={log.id}
                  className={`rounded-lg border p-4 ${colors?.border ?? ''} ${colors?.bg ?? ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 ${colors?.text ?? ''}`}>
                      {actionIcons[log.action] || <Clock className="h-4 w-4" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p
                              className={`text-sm font-medium ${colors?.text ?? ''}`}
                            >
                              {actionLabels[log.action] || log.action}
                            </p>
                            <span
                              className={`text-xs font-semibold ${severityInfo.color}`}
                            >
                              [{severityInfo.label}]
                            </span>
                          </div>
                          {log.reason && (
                            <p className="mt-1 text-xs text-zinc-700 dark:text-zinc-300">
                              Powód: {log.reason}
                            </p>
                          )}
                          <div className="mt-1 flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                            <span>
                              Wykonano przez:{' '}
                              {log.actor ? log.actor.name : 'SYSTEM'}
                            </span>
                            <span>•</span>
                            <span>
                              {format(
                                new Date(log.createdAt),
                                'dd MMM yyyy, HH:mm',
                                { locale: pl }
                              )}
                            </span>
                          </div>
                          {log.ipAddress && (
                            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
                              IP: {log.ipAddress}
                            </p>
                          )}
                        </div>
                      </div>
                      {(log.diff || log.meta) && (
                        <div className="mt-3 space-y-2">
                          {log.diff && (
                            <div className="rounded border border-zinc-200 bg-white/50 p-2 dark:border-zinc-700 dark:bg-zinc-900/50">
                              <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                                Zmiany:
                              </p>
                              <pre className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                                {JSON.stringify(log.diff, null, 2)}
                              </pre>
                            </div>
                          )}
                          {log.meta && (
                            <div className="rounded border border-zinc-200 bg-white/50 p-2 dark:border-zinc-700 dark:bg-zinc-900/50">
                              <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                                Metadata:
                              </p>
                              <pre className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                                {JSON.stringify(log.meta, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
