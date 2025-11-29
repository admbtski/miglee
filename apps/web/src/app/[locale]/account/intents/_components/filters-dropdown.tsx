'use client';

import { useState } from 'react';
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useClick,
  useDismiss,
  useRole,
  useInteractions,
  FloatingFocusManager,
  FloatingPortal,
} from '@floating-ui/react';
import { Filter, X } from 'lucide-react';
import { RoleFilter, type RoleFilterValue } from './role-filter';
import {
  IntentStatusFilter,
  type IntentStatusFilterValue,
} from './intent-status-filter';
import { useI18n } from '@/lib/i18n/provider-ssr';

interface FiltersDropdownProps {
  roleFilter: RoleFilterValue;
  statusFilters: IntentStatusFilterValue[];
  onRoleChange: (value: RoleFilterValue) => void;
  onStatusChange: (values: IntentStatusFilterValue[]) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export function FiltersDropdown({
  roleFilter,
  statusFilters,
  onRoleChange,
  onStatusChange,
  onClearFilters,
  hasActiveFilters,
}: FiltersDropdownProps) {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [offset(8), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });

  const click = useClick(context);
  const dismiss = useDismiss(context);
  const role = useRole(context);

  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    dismiss,
    role,
  ]);

  return (
    <>
      {/* Trigger Button */}
      <button
        ref={refs.setReference}
        {...getReferenceProps()}
        className="flex items-center gap-2 rounded-xl bg-white dark:bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
      >
        <Filter className="h-4 w-4" />
        <span>{t.myIntents.filters.all}</span>
        {hasActiveFilters && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">
            {(roleFilter !== 'all' ? 1 : 0) + statusFilters.length}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <FloatingPortal>
          <FloatingFocusManager context={context} modal={false}>
            <div
              ref={refs.setFloating}
              style={floatingStyles}
              {...getFloatingProps()}
              className="z-50 w-[calc(100vw-2rem)] sm:w-[500px] max-w-2xl rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  {t.myIntents.filters.all}
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <X className="h-5 w-5 text-zinc-500" />
                </button>
              </div>

              {/* Filters Content */}
              <div className="p-4 space-y-6 max-h-[60vh] overflow-y-auto">
                <RoleFilter value={roleFilter} onChange={onRoleChange} />
                <IntentStatusFilter
                  values={statusFilters}
                  onChange={onStatusChange}
                />
              </div>

              {/* Footer */}
              {hasActiveFilters && (
                <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
                  <button
                    onClick={() => {
                      onClearFilters();
                      setIsOpen(false);
                    }}
                    className="w-full rounded-xl bg-zinc-100 dark:bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                  >
                    {t.myIntents.clearFilters}
                  </button>
                </div>
              )}
            </div>
          </FloatingFocusManager>
        </FloatingPortal>
      )}
    </>
  );
}
