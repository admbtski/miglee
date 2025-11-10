'use client';

import { useState } from 'react';
import { Clock, User, Shield, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

type AuditLogTabProps = {
  userId: string;
};

// Mock data - replace with actual API call
const mockAuditLogs = [
  {
    id: '1',
    action: 'ROLE_CHANGED',
    description: 'Rola zmieniona z USER na MODERATOR',
    performedBy: { id: '1', name: 'Admin Jan' },
    createdAt: new Date().toISOString(),
    metadata: { oldRole: 'USER', newRole: 'MODERATOR' },
  },
  {
    id: '2',
    action: 'ACCOUNT_VERIFIED',
    description: 'Konto zweryfikowane',
    performedBy: { id: '1', name: 'Admin Jan' },
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    metadata: {},
  },
  {
    id: '3',
    action: 'NOTIFICATION_SENT',
    description: 'Wysłano powiadomienie systemowe',
    performedBy: { id: '2', name: 'Admin Maria' },
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    metadata: { title: 'Ważna informacja' },
  },
];

const actionIcons: Record<string, React.ReactNode> = {
  ROLE_CHANGED: <Shield className="h-4 w-4" />,
  ACCOUNT_VERIFIED: <User className="h-4 w-4" />,
  NOTIFICATION_SENT: <AlertTriangle className="h-4 w-4" />,
  ACCOUNT_SUSPENDED: <AlertTriangle className="h-4 w-4" />,
  ACCOUNT_BLOCKED: <AlertTriangle className="h-4 w-4" />,
  CONTENT_DELETED: <AlertTriangle className="h-4 w-4" />,
};

const actionColors: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  ROLE_CHANGED: {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
  },
  ACCOUNT_VERIFIED: {
    bg: 'bg-green-50 dark:bg-green-950/30',
    text: 'text-green-700 dark:text-green-300',
    border: 'border-green-200 dark:border-green-800',
  },
  NOTIFICATION_SENT: {
    bg: 'bg-purple-50 dark:bg-purple-950/30',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-800',
  },
  ACCOUNT_SUSPENDED: {
    bg: 'bg-red-50 dark:bg-red-950/30',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-200 dark:border-red-800',
  },
  ACCOUNT_BLOCKED: {
    bg: 'bg-orange-50 dark:bg-orange-950/30',
    text: 'text-orange-700 dark:text-orange-300',
    border: 'border-orange-200 dark:border-orange-800',
  },
  CONTENT_DELETED: {
    bg: 'bg-gray-50 dark:bg-gray-950/30',
    text: 'text-gray-700 dark:text-gray-300',
    border: 'border-gray-200 dark:border-gray-800',
  },
};

export function AuditLogTab({ userId: _userId }: AuditLogTabProps) {
  const [filter, setFilter] = useState<string>('all');

  // TODO: Replace with actual API call
  // const { data, isLoading } = useAdminUserAuditLog({ userId: _userId });
  const logs = mockAuditLogs;

  const filteredLogs =
    filter === 'all' ? logs : logs.filter((log) => log.action === filter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Historia akcji administracyjnych
          </h4>
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
            Wszystkie akcje wykonane przez administratorów na tym koncie
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
          Filtruj:
        </label>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
        >
          <option value="all">Wszystkie</option>
          <option value="ROLE_CHANGED">Zmiana roli</option>
          <option value="ACCOUNT_VERIFIED">Weryfikacja</option>
          <option value="ACCOUNT_SUSPENDED">Zawieszenie</option>
          <option value="ACCOUNT_BLOCKED">Blokada</option>
          <option value="NOTIFICATION_SENT">Powiadomienia</option>
          <option value="CONTENT_DELETED">Usunięcie treści</option>
        </select>
      </div>

      {/* Audit Log List */}
      <div className="space-y-3">
        {filteredLogs.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-600 dark:text-gray-400">
            Brak wpisów w historii akcji
          </div>
        ) : (
          filteredLogs.map((log) => {
            const colors =
              actionColors[log.action as keyof typeof actionColors] ||
              actionColors.CONTENT_DELETED;
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
                      <div>
                        <p
                          className={`text-sm font-medium ${colors?.text ?? ''}`}
                        >
                          {log.description}
                        </p>
                        <div className="mt-1 flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                          <span>Wykonano przez: {log.performedBy.name}</span>
                          <span>•</span>
                          <span>
                            {format(
                              new Date(log.createdAt),
                              'dd MMM yyyy, HH:mm',
                              { locale: pl }
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                    {Object.keys(log.metadata).length > 0 && (
                      <div className="mt-2 rounded border border-gray-200 bg-white/50 p-2 dark:border-gray-700 dark:bg-gray-900/50">
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          Szczegóły:
                        </p>
                        <pre className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* TODO Notice */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/30">
        <p className="text-xs text-blue-800 dark:text-blue-300">
          <strong>TODO:</strong> Implementacja wymaga query:
          adminUserAuditLog(userId)
        </p>
      </div>
    </div>
  );
}
