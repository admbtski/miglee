'use client';

import { Check, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: string;
}

interface SimpleSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function SimpleSelect({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  disabled = false,
  className,
}: SimpleSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'w-full px-4 py-2.5 bg-white border border-zinc-300 rounded-lg text-sm text-left transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
          'dark:bg-zinc-800 dark:border-zinc-700',
          disabled && 'opacity-50 cursor-not-allowed',
          !disabled && 'hover:border-zinc-400 dark:hover:border-zinc-600'
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              'truncate',
              !selectedOption
                ? 'text-zinc-400 dark:text-zinc-500'
                : 'text-zinc-900 dark:text-zinc-100'
            )}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown
            className={cn(
              'w-4 h-4 flex-shrink-0 text-zinc-400 dark:text-zinc-500 transition-transform',
              isOpen && 'transform rotate-180'
            )}
          />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-zinc-200 rounded-lg shadow-lg dark:bg-zinc-800 dark:border-zinc-700 max-h-60 overflow-auto">
          {options.length === 0 ? (
            <div className="px-4 py-3 text-sm text-center text-zinc-500 dark:text-zinc-400">
              No options available
            </div>
          ) : (
            <div className="py-1">
              {options.map((option) => {
                const isSelected = option.value === value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={cn(
                      'w-full px-4 py-2.5 text-sm text-left transition-colors',
                      'flex items-center justify-between gap-2',
                      isSelected
                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300'
                        : 'text-zinc-900 hover:bg-zinc-50 dark:text-zinc-100 dark:hover:bg-zinc-700'
                    )}
                  >
                    <span className="truncate">{option.label}</span>
                    {isSelected && (
                      <Check className="w-4 h-4 flex-shrink-0 text-indigo-600 dark:text-indigo-400" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
