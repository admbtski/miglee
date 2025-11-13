'use client';

import {
  Ban,
  Eye,
  Lock,
  LockOpen,
  MoreVertical,
  Pencil,
  Trash2,
  UserCogIcon,
  UserRoundMinusIcon,
} from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  useFloating,
  offset,
  flip,
  shift,
  size,
  autoUpdate,
  useClick,
  useDismiss,
  useRole,
  useListNavigation,
  useInteractions,
  FloatingFocusManager,
  type Placement,
} from '@floating-ui/react';

type Props = {
  onPreview?: () => void | Promise<void>;
  onEdit?: () => void | Promise<void>;
  onLeave?: () => void | Promise<void>;
  onManage?: () => void | Promise<void>;
  onCloseJoin?: () => void | Promise<void>;
  onReopenJoin?: () => void | Promise<void>;
  onCancel?: () => void | Promise<void>;
  onDelete?: () => void | Promise<void>;

  disablePreview?: boolean;
  disableEdit?: boolean;
  disableLeave?: boolean;
  disableManage?: boolean;
  disableCloseJoin?: boolean;
  disableReopenJoin?: boolean;
  disableCancel?: boolean;
  disableDelete?: boolean;

  // Additional props for conditional rendering
  isJoinManuallyClosed?: boolean;

  label?: string;
  /** default: 'bottom-end' */
  placement?: Placement;
  /** default: 'fixed' (safer with overflow/transform/portals) */
  strategy?: 'absolute' | 'fixed';
};

export function ActionMenu({
  onPreview,
  onEdit,
  onLeave,
  onManage,
  onCloseJoin,
  onReopenJoin,
  onCancel,
  onDelete,
  disablePreview,
  disableEdit,
  disableLeave,
  disableManage,
  disableCloseJoin,
  disableReopenJoin,
  disableCancel,
  disableDelete,
  isJoinManuallyClosed = false,
  label = 'Menu akcji',
  placement = 'bottom-end',
  strategy = 'fixed',
}: Props) {
  const [open, setOpen] = useState(false);

  // Roving focus: a ref holding menu item nodes and a controlled active index
  const listRef = useRef<Array<HTMLButtonElement | null>>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: (next) => {
      setOpen(next);
      if (!next) setActiveIndex(null); // reset focus index on close
    },
    placement,
    strategy,
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(6),
      flip({
        fallbackPlacements: ['top-end', 'bottom-start', 'top-start'],
        padding: 8,
      }),
      shift({ padding: 8 }),
      size({
        padding: 8,
        apply({ availableHeight, rects, elements }) {
          const el = elements.floating as HTMLElement;
          // match trigger width visually, but allow to grow
          el.style.minWidth = `${Math.ceil(rects.reference.width)}px`;
          // cap height to available space
          el.style.maxHeight = `${Math.min(availableHeight, 320)}px`;
          el.style.overflow = 'auto';
        },
      }),
    ],
  });

  // Floating UI interactions
  const click = useClick(context); // toggles on click
  const dismiss = useDismiss(context); // ESC + outside click
  const role = useRole(context, { role: 'menu' });

  // ✅ Provide activeIndex + onNavigate to satisfy TS and enable arrow nav
  const listNav = useListNavigation(context, {
    listRef,
    activeIndex: activeIndex ?? -1,
    onNavigate: (index) => setActiveIndex(index),
    loop: true,
  });

  const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions(
    [click, dismiss, role, listNav]
  );

  // Ensure first enabled item gets focus when opening via keyboard (optional)
  useEffect(() => {
    if (open && activeIndex == null) {
      // find first enabled
      const first = listRef.current.findIndex((n) => n && !n.disabled);
      if (first >= 0) setActiveIndex(first);
    }
  }, [open, activeIndex]);

  const items = useMemo(
    () => [
      {
        id: 'preview',
        label: 'Podgląd',
        Icon: Eye,
        onClick: onPreview,
        disabled: !!disablePreview,
        tone: 'default' as const,
      },
      {
        id: 'edit',
        label: 'Edytuj',
        Icon: Pencil,
        onClick: onEdit,
        disabled: !!disableEdit,
        tone: 'default' as const,
      },
      {
        id: 'manage',
        label: 'Zarządzaj',
        Icon: UserCogIcon,
        onClick: onManage,
        disabled: !!disableManage,
        tone: 'default' as const,
      },
      { divider: true },
      // Conditionally show close or reopen join
      ...(isJoinManuallyClosed
        ? [
            {
              id: 'reopenJoin',
              label: 'Otwórz zapisy',
              Icon: LockOpen,
              onClick: onReopenJoin,
              disabled: !!disableReopenJoin,
              tone: 'default' as const,
            },
          ]
        : [
            {
              id: 'closeJoin',
              label: 'Zamknij zapisy',
              Icon: Lock,
              onClick: onCloseJoin,
              disabled: !!disableCloseJoin,
              tone: 'default' as const,
            },
          ]),
      {
        id: 'leave',
        label: 'Opuść',
        Icon: UserRoundMinusIcon,
        onClick: onLeave,
        disabled: !!disableLeave,
        tone: 'default' as const,
      },
      {
        id: 'cancel',
        label: 'Anuluj',
        Icon: Ban,
        onClick: onCancel,
        disabled: !!disableCancel,
        tone: 'default' as const,
      },
      {
        id: 'delete',
        label: 'Usuń',
        Icon: Trash2,
        onClick: onDelete,
        disabled: !!disableDelete,
        tone: 'danger' as const,
      },
    ],
    [
      onPreview,
      onEdit,
      onManage,
      onCloseJoin,
      onReopenJoin,
      onLeave,
      onCancel,
      onDelete,
      disablePreview,
      disableEdit,
      disableManage,
      disableCloseJoin,
      disableReopenJoin,
      disableLeave,
      disableCancel,
      disableDelete,
      isJoinManuallyClosed,
    ]
  );

  return (
    <div className="relative inline-flex">
      <button
        ref={refs.setReference}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        className="inline-flex relative -right-1 items-center justify-center rounded-md border border-zinc-200 bg-white p-2 text-zinc-600 shadow-sm hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
        {...getReferenceProps()}
      >
        <MoreVertical className="w-3 h-3" aria-hidden />
      </button>

      {open && (
        <FloatingFocusManager context={context} modal={false}>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            className="z-40 w-44 overflow-auto rounded-lg border border-zinc-200 bg-white p-1.5 text-sm shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
            {...getFloatingProps()}
          >
            {items.map((it, i) =>
              'divider' in it ? (
                <div
                  key={`div-${i}`}
                  className="my-1 border-t border-zinc-200 dark:border-zinc-800"
                />
              ) : (
                <button
                  key={it.id}
                  ref={(node) => {
                    listRef.current[i] = node;
                  }}
                  role="menuitem"
                  disabled={it.disabled}
                  // a11y + visual states
                  className={[
                    'flex w-full items-center gap-2 rounded-md px-2 py-1.5 focus:outline-none',
                    it.tone === 'danger'
                      ? 'text-red-600 hover:bg-red-50 focus:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/30 dark:focus:bg-red-950/30'
                      : 'hover:bg-zinc-100 focus:bg-zinc-100 disabled:opacity-50 dark:hover:bg-zinc-800 dark:focus:bg-zinc-800',
                    it.disabled ? 'cursor-not-allowed' : '',
                  ].join(' ')}
                  // Pass keyboard interactions from Floating UI + our handlers
                  {...getItemProps({
                    // Keep tab flow sane for screen readers:
                    tabIndex: activeIndex === i ? 0 : -1,
                    onMouseMove: () => setActiveIndex(i),
                    onFocus: () => setActiveIndex(i),
                    onClick: async () => {
                      setOpen(false);
                      await it.onClick?.();
                    },
                  })}
                >
                  <it.Icon className="w-4 h-4" />
                  {it.label}
                </button>
              )
            )}
          </div>
        </FloatingFocusManager>
      )}
    </div>
  );
}
