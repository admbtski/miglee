import * as React from 'react';
import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';

// Context for Select component
interface SelectContextValue {
  value?: string;
  onValueChange?: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  selectedLabel?: React.ReactNode;
  setSelectedLabel: (label: React.ReactNode) => void;
}

const SelectContext = React.createContext<SelectContextValue | undefined>(
  undefined
);

const useSelectContext = () => {
  const context = React.useContext(SelectContext);
  if (!context) {
    throw new Error('Select components must be used within a Select');
  }
  return context;
};

export interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  defaultValue?: string;
}

/**
 * Select component for dropdown selections with composable API
 *
 * @example
 * ```tsx
 * <Select value={value} onValueChange={setValue}>
 *   <SelectTrigger>
 *     <SelectValue />
 *   </SelectTrigger>
 *   <SelectContent>
 *     <SelectItem value="1">Option 1</SelectItem>
 *     <SelectItem value="2">Option 2</SelectItem>
 *   </SelectContent>
 * </Select>
 * ```
 */
export function Select({
  value,
  onValueChange,
  children,
  defaultValue,
}: SelectProps) {
  const [open, setOpen] = React.useState(false);
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const [selectedLabel, setSelectedLabel] = React.useState<React.ReactNode>();

  const currentValue = value !== undefined ? value : internalValue;

  const handleValueChange = (newValue: string) => {
    if (value === undefined) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
    setOpen(false);
  };

  return (
    <SelectContext.Provider
      value={{
        value: currentValue,
        onValueChange: handleValueChange,
        open,
        setOpen,
        selectedLabel,
        setSelectedLabel,
      }}
    >
      <div className="relative">{children}</div>
    </SelectContext.Provider>
  );
}

export const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
  const { open, setOpen } = useSelectContext();

  return (
    <button
      type="button"
      className={clsx(
        'flex h-10 w-full items-center justify-between rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm',
        'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100',
        'dark:focus:ring-indigo-400',
        className
      )}
      onClick={() => setOpen(!open)}
      ref={ref}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 text-zinc-500 ml-2" />
    </button>
  );
});
SelectTrigger.displayName = 'SelectTrigger';

export const SelectContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }) => {
  const { open, setOpen } = useSelectContext();
  const contentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        contentRef.current &&
        !contentRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
    return undefined;
  }, [open, setOpen]);

  if (!open) return null;

  return (
    <div
      className={clsx(
        'absolute z-50 mt-1 w-full rounded-lg border border-zinc-200 bg-white shadow-lg max-h-60 overflow-auto',
        'dark:border-zinc-800 dark:bg-zinc-900',
        className
      )}
      ref={contentRef}
      {...props}
    >
      {children}
    </div>
  );
});
SelectContent.displayName = 'SelectContent';

export interface SelectItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  children: React.ReactNode;
}

export const SelectItem = React.forwardRef<HTMLDivElement, SelectItemProps>(
  ({ className, children, value, ...props }, ref) => {
    const {
      value: selectedValue,
      onValueChange,
      setSelectedLabel,
    } = useSelectContext();
    const isSelected = selectedValue === value;

    // Update selected label when this item is selected
    React.useEffect(() => {
      if (isSelected) {
        setSelectedLabel(children);
      }
    }, [isSelected, children, setSelectedLabel]);

    return (
      <div
        className={clsx(
          'relative flex cursor-pointer select-none items-center rounded-md px-3 py-2 text-sm',
          'hover:bg-zinc-100 dark:hover:bg-zinc-800',
          isSelected && 'bg-zinc-100 dark:bg-zinc-800 font-medium',
          className
        )}
        onClick={() => {
          onValueChange?.(value);
          setSelectedLabel(children);
        }}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    );
  }
);
SelectItem.displayName = 'SelectItem';

export const SelectValue = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement> & { placeholder?: string }
>(({ className, children, placeholder, ...props }, ref) => {
  const { selectedLabel } = useSelectContext();

  return (
    <span className={clsx('block truncate', className)} ref={ref} {...props}>
      {children || selectedLabel || placeholder}
    </span>
  );
});
SelectValue.displayName = 'SelectValue';
