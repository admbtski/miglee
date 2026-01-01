'use client';

/**
 * Audit Log Timeline Component
 *
 * Displays a chronological list of audit log entries with filtering.
 */

import { useState, useCallback } from 'react';
import { format, isToday, isYesterday, startOfDay } from '@/lib/date';
import {
  Loader2,
  RefreshCw,
  AlertCircle,
  Download,
  Archive,
} from 'lucide-react';
import {
  useEventAuditLogs,
  useExportAuditLogs,
  useArchiveAuditLogs,
} from '../api';
import type {
  AuditLogItem as AuditLogItemType,
  AuditLogsFilter,
} from '../types';
import { AuditLogItem } from './audit-log-item';
import { AuditLogFilters } from './audit-log-filters';
import { AuditLogDetailsModal } from './audit-log-details-modal';
import { ArchiveConfirmModal } from './archive-confirm-modal';

interface AuditLogTimelineProps {
  eventId: string;
}

// Group logs by date
function groupByDate(
  items: AuditLogItemType[]
): Map<string, AuditLogItemType[]> {
  const groups = new Map<string, AuditLogItemType[]>();

  for (const item of items) {
    const date = startOfDay(new Date(item.createdAt)).toISOString();
    const existing = groups.get(date) || [];
    groups.set(date, [...existing, item]);
  }

  return groups;
}

// Format date header
function formatDateHeader(dateStr: string): string {
  const date = new Date(dateStr);
  if (isToday(date)) return 'Today'; // TODO i18n
  if (isYesterday(date)) return 'Yesterday'; // TODO i18n
  return format(date, 'MMMM d, yyyy'); // TODO i18n: date formatting should be locale-aware
}

export function AuditLogTimeline({ eventId }: AuditLogTimelineProps) {
  const [filter, setFilter] = useState<AuditLogsFilter>({});
  const [selectedItem, setSelectedItem] = useState<AuditLogItemType | null>(
    null
  );
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isRefetching,
  } = useEventAuditLogs({
    eventId,
    filter,
    limit: 25,
  });

  const { mutate: exportLogs, isPending: isExporting } = useExportAuditLogs({
    eventId,
    filter,
  });

  const { mutate: archiveLogs, isPending: isArchiving } = useArchiveAuditLogs({
    eventId,
    onSuccess: () => {
      setShowArchiveConfirm(false);
    },
  });

  const handleShowDetails = useCallback((item: AuditLogItemType) => {
    setSelectedItem(item);
  }, []);

  const handleCloseDetails = useCallback(() => {
    setSelectedItem(null);
  }, []);

  const handleArchiveClick = useCallback(() => {
    setShowArchiveConfirm(true);
  }, []);

  const handleConfirmArchive = useCallback(() => {
    archiveLogs();
  }, [archiveLogs]);

  const handleCancelArchive = useCallback(() => {
    setShowArchiveConfirm(false);
  }, []);

  // Flatten all pages
  const allItems =
    data?.pages.flatMap((page) => page.eventAuditLogs.items) || [];
  const groupedItems = groupByDate(allItems);
  const totalCount = data?.pages[0]?.eventAuditLogs.pageInfo.total || 0;

  // Empty state
  if (!isLoading && allItems.length === 0) {
    return (
      <div className="space-y-4">
        <AuditLogFilters filter={filter} onChange={setFilter} />
        <div className="py-12 text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-zinc-300 dark:text-zinc-600" />
          <p className="mt-4 text-zinc-500 dark:text-zinc-400">
            No activity logs found {/* TODO i18n */}
          </p>
          {Object.keys(filter).length > 0 && (
            <button
              onClick={() => setFilter({})}
              className="mt-2 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Clear filters {/* TODO i18n */}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <AuditLogFilters filter={filter} onChange={setFilter} />
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportLogs()}
            disabled={isExporting || allItems.length === 0}
            className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors disabled:opacity-50"
            aria-label="Export" // TODO i18n
          >
            <Download
              className={`w-4 h-4 ${isExporting ? 'animate-pulse' : ''}`}
            />
            <span className="hidden sm:inline">Export</span> {/* TODO i18n */}
          </button>
          <button
            onClick={handleArchiveClick}
            disabled={isArchiving || allItems.length === 0}
            className="flex items-center gap-1.5 text-sm text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 transition-colors disabled:opacity-50"
            aria-label="Archive" // TODO i18n
          >
            <Archive
              className={`w-4 h-4 ${isArchiving ? 'animate-pulse' : ''}`}
            />
            <span className="hidden sm:inline">Archive</span> {/* TODO i18n */}
          </button>
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors disabled:opacity-50"
            aria-label="Refresh" // TODO i18n
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`}
            />
            <span className="hidden sm:inline">Refresh</span> {/* TODO i18n */}
          </button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="py-12 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="py-12 text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-red-400" />
          <p className="mt-4 text-red-600 dark:text-red-400">
            Failed to load activity logs {/* TODO i18n */}
          </p>
          <button
            onClick={() => refetch()}
            className="mt-2 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Try again {/* TODO i18n */}
          </button>
        </div>
      )}

      {/* Timeline */}
      {!isLoading && !isError && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
          {/* Total count */}
          <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              {totalCount} {totalCount === 1 ? 'entry' : 'entries'}{' '}
              {/* TODO i18n */}
            </span>
          </div>

          {/* Grouped items */}
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {Array.from(groupedItems.entries()).map(([dateStr, items]) => (
              <div key={dateStr}>
                {/* Date header */}
                <div className="px-4 py-2 bg-zinc-50 dark:bg-zinc-800/50 sticky top-0">
                  <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    {formatDateHeader(dateStr)}
                  </span>
                </div>

                {/* Items for this date */}
                <div className="px-4">
                  {items.map((item) => (
                    <AuditLogItem
                      key={item.id}
                      item={item}
                      onShowDetails={handleShowDetails}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Load more */}
          {hasNextPage && (
            <div className="px-4 py-4 border-t border-zinc-200 dark:border-zinc-800">
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="w-full py-2 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isFetchingNextPage ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading... {/* TODO i18n */}
                  </>
                ) : (
                  'Load more' /* TODO i18n */
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Details Modal */}
      <AuditLogDetailsModal
        item={selectedItem}
        isOpen={selectedItem !== null}
        onClose={handleCloseDetails}
      />

      {/* Archive Confirmation Modal */}
      <ArchiveConfirmModal
        isOpen={showArchiveConfirm}
        onClose={handleCancelArchive}
        onConfirm={handleConfirmArchive}
        isLoading={isArchiving}
        logCount={totalCount}
      />
    </div>
  );
}
