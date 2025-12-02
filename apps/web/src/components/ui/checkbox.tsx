import * as React from 'react';
import clsx from 'clsx';
import { Check } from 'lucide-react';

export interface CheckboxProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    'type' | 'onChange'
  > {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

/**
 * Checkbox component for boolean selections
 * Provides a styled checkbox with custom appearance
 *
 * @example
 * ```tsx
 * <Checkbox checked={isChecked} onCheckedChange={setIsChecked} />
 * <Checkbox id="terms" checked={accepted} onCheckedChange={setAccepted} />
 * ```
 */
export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, ...props }, ref) => {
    const inputRef = React.useRef<HTMLInputElement>(null);

    // Merge refs
    React.useImperativeHandle(ref, () => inputRef.current!);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onCheckedChange?.(e.target.checked);
    };

    const handleClick = () => {
      // Trigger the input click to toggle the checkbox
      inputRef.current?.click();
    };

    return (
      <div className="relative inline-flex items-center">
        <input
          type="checkbox"
          className="peer sr-only"
          ref={inputRef}
          checked={checked}
          onChange={handleChange}
          {...props}
        />
        <div
          onClick={handleClick}
          className={clsx(
            'h-4 w-4 rounded border-2 transition-all duration-200 cursor-pointer',
            'flex items-center justify-center',
            'peer-focus:ring-2 peer-focus:ring-indigo-500 peer-focus:ring-offset-2',
            'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
            checked
              ? 'bg-indigo-600 border-indigo-600 dark:bg-indigo-500 dark:border-indigo-500'
              : 'border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900',
            'hover:border-indigo-400 dark:hover:border-indigo-400',
            className
          )}
        >
          {checked && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
        </div>
      </div>
    );
  }
);
Checkbox.displayName = 'Checkbox';
