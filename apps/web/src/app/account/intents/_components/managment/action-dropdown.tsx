// file: components/manage-members/ActionsDropdown.tsx
'use client';

import * as React from 'react';
import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';
import {
  useFloating,
  offset,
  flip,
  shift,
  useDismiss,
  useRole,
  useListNavigation,
  useInteractions,
  FloatingPortal,
  FloatingFocusManager,
} from '@floating-ui/react';

export type ActionItem =
  | {
      key: string;
      label: string;
      icon: React.ReactNode;
      onClick?: () => void | Promise<void>;
      danger?: boolean;
      disabled?: boolean;
    }
  | 'divider';

export function ActionsDropdown({
  disabled,
  actions,
}: {
  disabled?: boolean;
  actions: ActionItem[];
}) {
  const [open, setOpen] = React.useState(false);

  // Floating UI positioning + a11y hooks
  const { refs, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement: 'bottom-end',
    middleware: [offset(6), flip(), shift({ padding: 8 })],
  });

  // Roving focus for items (ArrowUp/Down)
  const listRef = React.useRef<Array<HTMLButtonElement | null>>([]);
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);

  const dismiss = useDismiss(context, { escapeKey: true, outsidePress: true });
  const role = useRole(context, { role: 'menu' });
  const listNav = useListNavigation(context, {
    listRef,
    activeIndex,
    onNavigate: setActiveIndex,
    loop: true,
    orientation: 'vertical',
  });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    dismiss,
    role,
    listNav,
  ]);

  // Close on route changes/unmount safety (optional)
  React.useEffect(() => () => setOpen(false), []);

  // Keep roving focus index sane when actions change
  React.useEffect(() => {
    if (!open) setActiveIndex(null);
  }, [open]);

  // ids for a11y
  const menuId = React.useId();
  const buttonId = React.useId();

  return (
    <div className="relative inline-block">
      <button
        id={buttonId}
        type="button"
        ref={refs.setReference}
        {...getReferenceProps({
          onClick: () => !disabled && setOpen((s) => !s),
          'aria-haspopup': 'menu',
          'aria-expanded': open,
          'aria-controls': open ? menuId : undefined,
          className: clsx(
            'inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs transition',
            disabled
              ? 'cursor-not-allowed border-zinc-200 text-zinc-400 dark:border-zinc-800 dark:text-zinc-600'
              : 'cursor-pointer border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800'
          ),
          disabled,
        })}
      >
        Akcje
        <ChevronDown className="h-4 w-4" />
      </button>

      <FloatingPortal>
        {open && (
          <FloatingFocusManager
            context={context}
            modal={false}
            initialFocus={-1} // nie przenoś fokusa na pierwszy element na siłę
            returnFocus
          >
            <div
              id={menuId}
              ref={refs.setFloating}
              {...getFloatingProps({
                role: 'menu',
                className:
                  'z-100 mt-1 w-48 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-900',
                style: {
                  position: context.strategy,
                  top: context.y ?? 0,
                  left: context.x ?? 0,
                },
              })}
            >
              <ul className="py-1 text-sm outline-none">
                {actions.map((a, i) =>
                  a === 'divider' ? (
                    <li
                      key={`div-${i}`}
                      role="separator"
                      className="my-1 border-t border-zinc-200 dark:border-zinc-800"
                    />
                  ) : (
                    <li key={a.key} role="none">
                      <button
                        ref={(el) => (listRef.current[i] = el)}
                        role="menuitem"
                        type="button"
                        tabIndex={activeIndex === i ? 0 : -1}
                        disabled={a.disabled}
                        onClick={async () => {
                          if (a.disabled) return;
                          await a.onClick?.();
                          setOpen(false);
                        }}
                        className={clsx(
                          'flex w-full items-center gap-2 px-3 py-2 text-left transition',
                          a.disabled
                            ? 'cursor-not-allowed opacity-50'
                            : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 focus:bg-zinc-100 dark:focus:bg-zinc-800 focus:outline-none',
                          a.danger ? 'text-rose-600 dark:text-rose-400' : ''
                        )}
                      >
                        {a.icon}
                        <span>{a.label}</span>
                      </button>
                    </li>
                  )
                )}
              </ul>
            </div>
          </FloatingFocusManager>
        )}
      </FloatingPortal>
    </div>
  );
}
