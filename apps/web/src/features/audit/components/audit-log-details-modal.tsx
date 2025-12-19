'use client';

/**
 * Audit Log Details Modal
 *
 * Displays detailed information about an audit log entry including diff and meta.
 */

import { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import {
  X,
  Calendar,
  User,
  Shield,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import type { AuditLogItem } from '../types';

interface AuditLogDetailsModalProps {
  item: AuditLogItem | null;
  isOpen: boolean;
  onClose: () => void;
}

// Severity configuration
const SEVERITY_CONFIG: Record<
  number,
  { label: string; className: string; icon: React.ElementType }
> = {
  1: {
    label: 'Info',
    className: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
    icon: AlertCircle,
  },
  2: {
    label: 'Normal',
    className: 'bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300',
    icon: AlertCircle,
  },
  3: {
    label: 'Important',
    className:
      'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
    icon: AlertCircle,
  },
  4: {
    label: 'Critical',
    className: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
    icon: AlertCircle,
  },
  5: {
    label: 'Security',
    className:
      'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
    icon: Shield,
  },
};

// Format value for display
function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '—'; // Empty indicator
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'; // TODO i18n
  }
  if (value instanceof Date) {
    return format(value, 'PPP HH:mm', { locale: pl });
  }
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }
  return String(value);
}

export function AuditLogDetailsModal({
  item,
  isOpen,
  onClose,
}: AuditLogDetailsModalProps) {
  // Handle escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  // Handle backdrop click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  // Add/remove keyboard listener and body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen || !item) return null;

  const severityConfig = SEVERITY_CONFIG[item.severity] || SEVERITY_CONFIG[2];
  const SeverityIcon = severityConfig.icon;

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Modal Panel */}
      <div className="relative w-full max-w-lg transform overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2
              id="modal-title"
              className="text-lg font-semibold text-zinc-900 dark:text-zinc-100"
            >
              Activity Details {/* TODO i18n */}
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              {format(new Date(item.createdAt), 'PPP HH:mm:ss', {
                locale: pl,
              })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Close" // TODO i18n
          >
            <X className="w-5 h-5 text-zinc-500" />
          </button>
        </div>

        {/* Overview */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase">
                Scope {/* TODO i18n */}
              </span>
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {item.scope}
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase">
                Action {/* TODO i18n */}
              </span>
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {item.action}
              </span>
            </div>
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${severityConfig.className}`}
            >
              <SeverityIcon className="w-4 h-4" />
              <span className="text-xs font-medium">
                {severityConfig.label /* TODO i18n */}
              </span>
            </div>
          </div>

          {/* Actor info */}
          {item.actor && (
            <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {item.actor.name}
                </p>
                {item.actorRole && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {item.actorRole}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Entity info */}
          {item.entityType && (
            <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
              <Calendar className="w-4 h-4" />
              <span>
                {item.entityType}{' '}
                {item.entityId && (
                  <span className="text-zinc-400 dark:text-zinc-500">
                    ({item.entityId})
                  </span>
                )}
              </span>
            </div>
          )}
        </div>

        {/* Scrollable content area */}
        <div className="max-h-[50vh] overflow-y-auto">
          {/* Diff section */}
          {item.diff && Object.keys(item.diff).length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
                Changes {/* TODO i18n */}
              </h4>
              <div className="space-y-2">
                {Object.entries(item.diff).map(([field, change]) => (
                  <div
                    key={field}
                    className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg"
                  >
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase mb-2">
                      {field}
                    </p>
                    <div className="flex items-center gap-2 text-sm flex-wrap">
                      <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded line-through">
                        {formatValue(change.from)}
                      </span>
                      <ArrowRight className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">
                        {formatValue(change.to)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Meta section */}
          {item.meta && Object.keys(item.meta).length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
                Additional Details {/* TODO i18n */}
              </h4>
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                <dl className="space-y-2 text-sm">
                  {Object.entries(item.meta).map(([key, value]) => (
                    <div key={key} className="flex justify-between gap-4">
                      <dt className="text-zinc-500 dark:text-zinc-400">
                        {key}
                      </dt>
                      <dd className="text-zinc-900 dark:text-zinc-100 font-mono text-right truncate max-w-[60%]">
                        {formatValue(value)}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          )}
        </div>

        {/* Close button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-sm font-medium"
          >
            Close {/* TODO i18n */}
          </button>
        </div>
      </div>
    </div>
  );

  // Use portal to render modal at document body level
  if (typeof document === 'undefined') return null;
  return createPortal(modalContent, document.body);
}
