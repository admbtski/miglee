import * as React from 'react';
import clsx from 'clsx';

export interface RadioGroupProps {
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  children: React.ReactNode;
}

export interface RadioGroupItemProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    'type' | 'onChange'
  > {
  value: string;
}

const RadioGroupContext = React.createContext<{
  value?: string;
  onValueChange?: (value: string) => void;
}>({});

/**
 * RadioGroup component for single selection from multiple options
 *
 * @example
 * ```tsx
 * <RadioGroup value={selected} onValueChange={setSelected}>
 *   <div className="flex items-center space-x-2">
 *     <RadioGroupItem value="option1" id="opt1" />
 *     <Label htmlFor="opt1">Option 1</Label>
 *   </div>
 *   <div className="flex items-center space-x-2">
 *     <RadioGroupItem value="option2" id="opt2" />
 *     <Label htmlFor="opt2">Option 2</Label>
 *   </div>
 * </RadioGroup>
 * ```
 */
export const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ className, value, onValueChange, children, ...props }, ref) => {
    return (
      <RadioGroupContext.Provider value={{ value, onValueChange }}>
        <div
          ref={ref}
          className={clsx('grid gap-2', className)}
          role="radiogroup"
          {...props}
        >
          {children}
        </div>
      </RadioGroupContext.Provider>
    );
  }
);
RadioGroup.displayName = 'RadioGroup';

/**
 * RadioGroupItem component - individual radio button
 */
export const RadioGroupItem = React.forwardRef<
  HTMLInputElement,
  RadioGroupItemProps
>(({ className, value, ...props }, ref) => {
  const context = React.useContext(RadioGroupContext);
  const isChecked = context.value === value;
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Merge refs
  React.useImperativeHandle(ref, () => inputRef.current!);

  const handleChange = () => {
    context.onValueChange?.(value);
  };

  const handleClick = () => {
    // Trigger the input click to activate the radio
    inputRef.current?.click();
  };

  return (
    <div className="relative inline-flex items-center">
      <input
        type="radio"
        className="peer sr-only"
        ref={inputRef}
        checked={isChecked}
        onChange={handleChange}
        value={value}
        {...props}
      />
      <div
        onClick={handleClick}
        className={clsx(
          'h-4 w-4 rounded-full border-2 transition-all duration-200 cursor-pointer',
          'flex items-center justify-center',
          'peer-focus:ring-2 peer-focus:ring-indigo-500 peer-focus:ring-offset-2',
          'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
          isChecked
            ? 'border-indigo-600 dark:border-indigo-500'
            : 'border-zinc-300 dark:border-zinc-700',
          'hover:border-indigo-400 dark:hover:border-indigo-400',
          className
        )}
      >
        {isChecked && (
          <div className="h-2 w-2 rounded-full bg-indigo-600 dark:bg-indigo-500" />
        )}
      </div>
    </div>
  );
});
RadioGroupItem.displayName = 'RadioGroupItem';
