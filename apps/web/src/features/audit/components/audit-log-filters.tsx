'use client';

/**
 * Audit Log Filters Component
 *
 * Provides filtering options for audit log timeline.
 */

import { useState, useCallback } from 'react';
import {
  Calendar,
  Edit,
  Filter,
  Shield,
  Users,
  Eye,
  Check,
  Link,
  X,
  ChevronDown,
} from 'lucide-react';
import type { AuditScope, AuditAction, AuditLogsFilter } from '../types';

interface AuditLogFiltersProps {
  filter: AuditLogsFilter;
  onChange: (filter: AuditLogsFilter) => void;
}

const SCOPE_OPTIONS: {
  value: AuditScope;
  label: string;
  icon: React.ElementType;
}[] = [
  { value: 'EVENT', label: 'Event', icon: Calendar }, // TODO i18n
  { value: 'PUBLICATION', label: 'Publication', icon: Eye }, // TODO i18n
  { value: 'MEMBER', label: 'Members', icon: Users }, // TODO i18n
  { value: 'MODERATION', label: 'Moderation', icon: Shield }, // TODO i18n
  { value: 'CHECKIN', label: 'Check-in', icon: Check }, // TODO i18n
  { value: 'INVITE_LINK', label: 'Invite Links', icon: Link }, // TODO i18n
  { value: 'COMMENT', label: 'Comments', icon: Edit }, // TODO i18n
  { value: 'REVIEW', label: 'Reviews', icon: Edit }, // TODO i18n
];

const ACTION_OPTIONS: { value: AuditAction; label: string }[] = [
  { value: 'CREATE', label: 'Create' }, // TODO i18n
  { value: 'UPDATE', label: 'Update' }, // TODO i18n
  { value: 'DELETE', label: 'Delete' }, // TODO i18n
  { value: 'PUBLISH', label: 'Publish' }, // TODO i18n
  { value: 'UNPUBLISH', label: 'Unpublish' }, // TODO i18n
  { value: 'CANCEL', label: 'Cancel' }, // TODO i18n
  { value: 'APPROVE', label: 'Approve' }, // TODO i18n
  { value: 'REJECT', label: 'Reject' }, // TODO i18n
  { value: 'KICK', label: 'Kick' }, // TODO i18n
  { value: 'BAN', label: 'Ban' }, // TODO i18n
  { value: 'UNBAN', label: 'Unban' }, // TODO i18n
  { value: 'HIDE', label: 'Hide' }, // TODO i18n
  { value: 'UNHIDE', label: 'Unhide' }, // TODO i18n
  { value: 'ROLE_CHANGE', label: 'Role Change' }, // TODO i18n
  { value: 'STATUS_CHANGE', label: 'Status Change' }, // TODO i18n
  { value: 'CONFIG_CHANGE', label: 'Config Change' }, // TODO i18n
];

// Quick filters for common use cases
const QUICK_FILTERS = [
  { id: 'all', label: 'All', filter: {} }, // TODO i18n
  {
    id: 'changes',
    label: 'Changes',
    filter: { scope: ['EVENT', 'PUBLICATION'] as AuditScope[] },
  }, // TODO i18n
  {
    id: 'members',
    label: 'Members',
    filter: { scope: ['MEMBER'] as AuditScope[] },
  }, // TODO i18n
  {
    id: 'moderation',
    label: 'Moderation',
    filter: { scope: ['MODERATION'] as AuditScope[] },
  }, // TODO i18n
  {
    id: 'checkin',
    label: 'Check-in',
    filter: { scope: ['CHECKIN'] as AuditScope[] },
  }, // TODO i18n
];

export function AuditLogFilters({ filter, onChange }: AuditLogFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showActionDropdown, setShowActionDropdown] = useState(false);

  const activeFiltersCount =
    (filter.scope?.length || 0) +
    (filter.action?.length || 0) +
    (filter.from ? 1 : 0) +
    (filter.to ? 1 : 0);

  const toggleScope = useCallback(
    (scope: AuditScope) => {
      const current = filter.scope || [];
      const updated = current.includes(scope)
        ? current.filter((s) => s !== scope)
        : [...current, scope];
      onChange({ ...filter, scope: updated.length > 0 ? updated : undefined });
    },
    [filter, onChange]
  );

  const toggleAction = useCallback(
    (action: AuditAction) => {
      const current = filter.action || [];
      const updated = current.includes(action)
        ? current.filter((a) => a !== action)
        : [...current, action];
      onChange({ ...filter, action: updated.length > 0 ? updated : undefined });
    },
    [filter, onChange]
  );

  const setDateRange = useCallback(
    (from: string | undefined, to: string | undefined) => {
      onChange({ ...filter, from, to });
    },
    [filter, onChange]
  );

  const clearFilters = useCallback(() => {
    onChange({});
  }, [onChange]);

  const applyQuickFilter = useCallback(
    (quickFilter: (typeof QUICK_FILTERS)[number]) => {
      onChange(quickFilter.filter);
    },
    [onChange]
  );

  // Check which quick filter is active
  const activeQuickFilter = QUICK_FILTERS.find((qf) => {
    if (qf.id === 'all') {
      return !filter.scope?.length && !filter.action?.length;
    }
    return (
      JSON.stringify(qf.filter.scope?.sort()) ===
        JSON.stringify(filter.scope?.sort()) && !filter.action?.length
    );
  });

  return (
    <div className="space-y-3">
      {/* Quick filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {QUICK_FILTERS.map((qf) => (
          <button
            key={qf.id}
            onClick={() => applyQuickFilter(qf)}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
              activeQuickFilter?.id === qf.id
                ? 'bg-indigo-100 border-indigo-300 text-indigo-700 dark:bg-indigo-900/50 dark:border-indigo-700 dark:text-indigo-300'
                : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600'
            }`}
          >
            {qf.label}
          </button>
        ))}

        {/* Toggle advanced filters */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
        >
          <Filter className="w-4 h-4" />
          <span>More</span> {/* TODO i18n */}
          <ChevronDown
            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          />
          {activeFiltersCount > 0 && (
            <span className="px-1.5 py-0.5 text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      {/* Advanced filter panel */}
      {isExpanded && (
        <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700 space-y-4">
          {/* Scope filters */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Category {/* TODO i18n */}
            </label>
            <div className="flex flex-wrap gap-2">
              {SCOPE_OPTIONS.map(({ value, label, icon: Icon }) => {
                const isActive = filter.scope?.includes(value);
                return (
                  <button
                    key={value}
                    onClick={() => toggleScope(value)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                      isActive
                        ? 'bg-indigo-100 border-indigo-300 text-indigo-700 dark:bg-indigo-900/50 dark:border-indigo-700 dark:text-indigo-300'
                        : 'bg-white border-zinc-200 text-zinc-700 hover:border-zinc-300 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-600'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action filters */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Action {/* TODO i18n */}
            </label>
            <div className="relative">
              <button
                onClick={() => setShowActionDropdown(!showActionDropdown)}
                className="flex items-center justify-between w-full max-w-xs px-3 py-2 text-sm bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:border-zinc-300 dark:hover:border-zinc-600"
              >
                <span className="text-zinc-600 dark:text-zinc-400">
                  {filter.action?.length
                    ? `${filter.action.length} selected` /* TODO i18n */
                    : 'All actions'}{' '}
                  {/* TODO i18n */}
                </span>
                <ChevronDown className="w-4 h-4 text-zinc-400" />
              </button>

              {showActionDropdown && (
                <div className="absolute z-10 mt-1 w-full max-w-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {ACTION_OPTIONS.map(({ value, label }) => {
                    const isActive = filter.action?.includes(value);
                    return (
                      <button
                        key={value}
                        onClick={() => toggleAction(value)}
                        className={`flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-zinc-100 dark:hover:bg-zinc-700 ${
                          isActive ? 'bg-indigo-50 dark:bg-indigo-900/30' : ''
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded border ${
                            isActive
                              ? 'bg-indigo-500 border-indigo-500'
                              : 'border-zinc-300 dark:border-zinc-600'
                          } flex items-center justify-center`}
                        >
                          {isActive && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className="text-zinc-700 dark:text-zinc-300">
                          {label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Date range */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Date Range {/* TODO i18n */}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={filter.from?.split('T')[0] || ''}
                onChange={(e) =>
                  setDateRange(
                    e.target.value
                      ? new Date(e.target.value).toISOString()
                      : undefined,
                    filter.to
                  )
                }
                className="px-3 py-2 text-sm bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="From" // TODO i18n
              />
              <span className="text-zinc-400">–</span>
              <input
                type="date"
                value={filter.to?.split('T')[0] || ''}
                onChange={(e) =>
                  setDateRange(
                    filter.from,
                    e.target.value
                      ? new Date(e.target.value).toISOString()
                      : undefined
                  )
                }
                className="px-3 py-2 text-sm bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="To" // TODO i18n
              />
            </div>
          </div>

          {/* Clear filters */}
          {activeFiltersCount > 0 && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
            >
              <X className="w-4 h-4" />
              Clear all filters {/* TODO i18n */}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
