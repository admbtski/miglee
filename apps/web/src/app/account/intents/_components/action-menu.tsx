'use client';
import {
  Ban,
  Eye,
  MoreVertical,
  Pencil,
  Trash2,
  UserCogIcon,
  UserRoundMinusIcon,
} from 'lucide-react';
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';

export function ActionMenu(props: {
  onPreview?: () => void | Promise<void>;
  onEdit?: () => void | Promise<void>;
  onLeave?: () => void | Promise<void>;
  onManage?: () => void | Promise<void>;
  onCancel?: () => void | Promise<void>;
  onDelete?: () => void | Promise<void>;
  disablePreview?: boolean;
  disableEdit?: boolean;
  disableLeave?: boolean;
  disableManage?: boolean;
  disableCancel?: boolean;
  disableDelete?: boolean;
  label?: string;
}) {
  const {
    onPreview,
    onEdit,
    onLeave,
    onManage,
    onCancel,
    onDelete,
    disablePreview,
    disableEdit,
    disableLeave,
    disableManage,
    disableCancel,
    disableDelete,
    label = 'Menu akcji',
  } = props;
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const itemsRef = useRef<HTMLButtonElement[]>([]);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!panelRef.current || !btnRef.current) return;
      if (!panelRef.current.contains(t) && !btnRef.current.contains(t))
        setOpen(false);
    };
    const onKey = (e: KeyboardEvent | any) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey as any);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey as any);
    };
  }, [open]);

  const onMenuKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const enabled = itemsRef.current.filter((el) => el && !el.disabled);
    if (!enabled.length) return;
    const idx = enabled.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      enabled[(idx + 1 + enabled.length) % enabled.length]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      enabled[(idx - 1 + enabled.length) % enabled.length]?.focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      enabled[0]?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      enabled[enabled.length - 1]?.focus();
    }
  };
  const setItemRef = (el: HTMLButtonElement | null, i: number) => {
    if (el) itemsRef.current[i] = el;
  };

  return (
    <div className="relative inline-flex">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        className="inline-flex items-center justify-center rounded-md border border-zinc-200 bg-white p-1.5 text-zinc-600 shadow-sm hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        <MoreVertical className="w-4 h-4" aria-hidden />
      </button>
      {open && (
        <div
          ref={panelRef}
          role="menu"
          tabIndex={-1}
          onKeyDown={onMenuKeyDown}
          className="absolute right-0 z-40 mt-1 w-44 overflow-hidden rounded-lg border border-zinc-200 bg-white p-1.5 text-sm shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
        >
          <button
            ref={(el) => setItemRef(el, 0)}
            role="menuitem"
            disabled={disablePreview}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 hover:bg-zinc-100 focus:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-zinc-800 dark:focus:bg-zinc-800"
            onClick={() => {
              setOpen(false);
              onPreview?.();
            }}
          >
            <Eye className="w-4 h-4" /> Podgląd
          </button>
          <button
            ref={(el) => setItemRef(el, 1)}
            role="menuitem"
            disabled={disableEdit}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 hover:bg-zinc-100 focus:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-zinc-800 dark:focus:bg-zinc-800"
            onClick={() => {
              setOpen(false);
              onEdit?.();
            }}
          >
            <Pencil className="w-4 h-4" /> Edytuj
          </button>
          <button
            ref={(el) => setItemRef(el, 2)}
            role="menuitem"
            disabled={disableManage}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 hover:bg-zinc-100 focus:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-zinc-800 dark:focus:bg-zinc-800"
            onClick={() => {
              setOpen(false);
              onManage?.();
            }}
          >
            <UserCogIcon className="w-4 h-4" /> Zarządzaj
          </button>
          <div className="my-1 border-t border-zinc-200 dark:border-zinc-800" />
          <button
            ref={(el) => setItemRef(el, 3)}
            role="menuitem"
            disabled={disableLeave}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 hover:bg-zinc-100 focus:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-zinc-800 dark:focus:bg-zinc-800"
            onClick={async () => {
              setOpen(false);
              onLeave?.();
            }}
          >
            <UserRoundMinusIcon className="w-4 h-4" /> Opuść
          </button>
          <button
            ref={(el) => setItemRef(el, 4)}
            role="menuitem"
            disabled={disableCancel}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 hover:bg-zinc-100 focus:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-zinc-800 dark:focus:bg-zinc-800"
            onClick={async () => {
              setOpen(false);
              onCancel?.();
            }}
          >
            <Ban className="w-4 h-4" /> Anuluj
          </button>
          <button
            ref={(el) => setItemRef(el, 5)}
            role="menuitem"
            disabled={disableDelete}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-red-600 hover:bg-red-50 focus:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/30 dark:focus:bg-red-950/30"
            onClick={async () => {
              setOpen(false);
              onDelete?.();
            }}
          >
            <Trash2 className="w-4 h-4" /> Usuń
          </button>
        </div>
      )}
    </div>
  );
}
