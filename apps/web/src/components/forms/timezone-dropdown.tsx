'use client';

import {
  autoUpdate,
  flip,
  FloatingFocusManager,
  offset,
  shift,
  size as floatingSize,
  useFloating,
  useDismiss,
  useInteractions,
  useRole,
} from '@floating-ui/react';
import { Check, ChevronDown, Clock, Loader2, Search } from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';

export type TimezoneDropdownProps = {
  value: string;
  onChange: (value: string) => void;
  timezones: readonly string[];
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  placeholder?: string;
};

export function TimezoneDropdown({
  value,
  onChange,
  timezones,
  disabled = false,
  loading = false,
  className = '',
  placeholder = 'Select timezone...',
}: TimezoneDropdownProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const listboxId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const floatingRef = useRef<HTMLDivElement | null>(null);

  // Filter timezones based on search query
  const filteredTimezones = useMemo(() => {
    return timezones;
  }, [query, timezones]);

  // Get display name for selected timezone
  const selectedTimezone = value || placeholder;

  // Floating UI setup
  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement: 'bottom-start',
    strategy: 'fixed',
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(4),
      flip({ padding: 8 }),
      shift({ padding: 8 }),
      floatingSize({
        apply({ availableHeight, elements, rects }) {
          const floating = elements.floating as HTMLElement;
          // Calculate max height considering:
          // - Available viewport height
          // - Search input height (~64px with padding)
          // - Some breathing room (16px)
          const searchHeight = 64;
          const padding = 16;
          const maxListHeight = Math.min(
            Math.max(200, availableHeight - searchHeight - padding),
            400
          );

          // Set CSS variable for list max height
          floating.style.setProperty('--list-max-height', `${maxListHeight}px`);

          floating.style.width = `${rects.reference.width}px`;
        },
      }),
    ],
  });

  const dismiss = useDismiss(context);
  const role = useRole(context, { role: 'listbox' });
  const { getReferenceProps, getFloatingProps } = useInteractions([
    dismiss,
    role,
  ]);

  // Set reference to trigger button
  useEffect(() => {
    refs.setReference(triggerRef.current);
  }, [refs]);

  // Focus input when dropdown opens
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
    if (!open) {
      setQuery('');
      setHighlightedIndex(-1);
    }
  }, [open]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredTimezones.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (
          highlightedIndex >= 0 &&
          highlightedIndex < filteredTimezones.length
        ) {
          const selectedTz = filteredTimezones[highlightedIndex];
          if (selectedTz) {
            onChange(selectedTz);
            setOpen(false);
          }
        }
        break;
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        break;
    }
  };

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const highlightedEl = listRef.current.children[
        highlightedIndex
      ] as HTMLElement;
      if (highlightedEl) {
        highlightedEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  const handleSelect = (tz: string) => {
    onChange(tz);
    setOpen(false);
    setQuery('');
  };

  return (
    <div className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => !disabled && !loading && setOpen(!open)}
        disabled={disabled || loading}
        className={`
          w-full flex items-center justify-between gap-2 px-3 py-3
          rounded-xl border border-zinc-200 dark:border-zinc-800
          bg-white dark:bg-zinc-800
          text-zinc-900 dark:text-zinc-100
          transition-all
          ${
            open
              ? 'ring-2 ring-blue-500 dark:ring-blue-600 border-blue-500 dark:border-blue-600'
              : 'hover:border-zinc-300 dark:hover:border-zinc-700'
          }
          ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        {...getReferenceProps()}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Clock className="w-4 h-4 text-zinc-400 dark:text-zinc-500 shrink-0" />
          <span className="truncate text-left text-sm">{selectedTimezone}</span>
        </div>
        {loading ? (
          <Loader2 className="w-4 h-4 text-zinc-400 dark:text-zinc-500 animate-spin shrink-0" />
        ) : (
          <ChevronDown
            className={`w-4 h-4 text-zinc-400 dark:text-zinc-500 shrink-0 transition-transform ${
              open ? 'rotate-180' : ''
            }`}
          />
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <FloatingFocusManager context={context} modal={false}>
          <div
            ref={(node) => {
              refs.setFloating(node);
              floatingRef.current = node;
            }}
            style={floatingStyles}
            className="z-50 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-lg overflow-hidden flex flex-col"
            {...getFloatingProps()}
          >
            {/* Search Input - Fixed at top */}
            <div className="p-3 border-b border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setHighlightedIndex(-1);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Search timezone..."
                  className="
                    w-full pl-9 pr-3 py-2
                    text-sm
                    bg-zinc-50 dark:bg-zinc-900
                    border border-zinc-200 dark:border-zinc-700
                    rounded-lg
                    text-zinc-900 dark:text-zinc-100
                    placeholder:text-zinc-400 dark:placeholder:text-zinc-500
                    focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600
                    transition-all
                  "
                />
              </div>
            </div>

            {/* Options List - Scrollable */}
            <div
              ref={listRef}
              role="listbox"
              id={listboxId}
              className="overflow-y-auto py-1 flex-1 min-h-0"
              style={{ maxHeight: 'var(--list-max-height, 400px)' }}
            >
              {filteredTimezones.length === 0 ? (
                <div className="px-3 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
                  No timezones found
                </div>
              ) : (
                filteredTimezones.map((tz, index) => {
                  const isSelected = tz === value;
                  const isHighlighted = index === highlightedIndex;

                  return (
                    <button
                      key={tz}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelect(tz)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      className={`
                        w-full flex items-center justify-between gap-2 px-3 py-2.5
                        text-sm text-left
                        transition-colors
                        ${
                          isSelected
                            ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 font-medium'
                            : isHighlighted
                              ? 'bg-zinc-100 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100'
                              : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/50'
                        }
                      `}
                    >
                      <span className="truncate">{tz}</span>
                      {isSelected && (
                        <Check className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </FloatingFocusManager>
      )}
    </div>
  );
}
