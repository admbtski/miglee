'use client';

import {
  Calendar1Icon,
  CreditCardIcon,
  LogOut,
  MessagesSquareIcon,
  SettingsIcon,
  UserIcon,
  ChevronDown,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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

type Item = {
  key:
    | 'profile'
    | 'chats'
    | 'intents'
    | 'plans-and-bills'
    | 'settings'
    | 'logout';
  label: string;
  href?: string;
  tone?: 'danger';
  icon: React.ComponentType<{ className?: string }>;
};

const NAV: Item[] = [
  {
    key: 'profile',
    label: 'Profile',
    href: '/account/profile',
    icon: UserIcon,
  },
  {
    key: 'chats',
    label: 'Chats',
    href: '/account/chats',
    icon: MessagesSquareIcon,
  },
  {
    key: 'intents',
    label: 'Intents',
    href: '/account/intents',
    icon: Calendar1Icon,
  },
  {
    key: 'plans-and-bills',
    label: 'Plans & Bills',
    href: '/account/plans-and-bills',
    icon: CreditCardIcon,
  },
  {
    key: 'settings',
    label: 'Settings',
    href: '/account/settings',
    icon: SettingsIcon,
  },
  { key: 'logout', label: 'Sign out', icon: LogOut, tone: 'danger' },
];

export function AccountSidebarMobile({
  placement = 'bottom-start',
  strategy = 'fixed',
}: {
  placement?: Placement;
  strategy?: 'absolute' | 'fixed';
}) {
  const pathname = usePathname();
  const router = useRouter();

  const active = useMemo<Item>(
    () =>
      NAV.find((i) => i.href && pathname.startsWith(i.href)) ??
      NAV.find((i) => i.key === 'profile')!,
    [pathname]
  );

  const onLogout = useCallback(() => {
    // TODO: podłącz realny logout (np. next-auth signOut)
    router.push('/');
  }, [router]);

  const [open, setOpen] = useState(false);

  // Roving focus
  const listRef = useRef<Array<HTMLButtonElement | null>>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: (next) => {
      setOpen(next);
      if (!next) setActiveIndex(null);
    },
    placement,
    strategy,
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(6),
      flip({
        fallbackPlacements: ['top-start', 'top-end', 'bottom-end'],
        padding: 8,
      }),
      shift({ padding: 8 }),
      size({
        padding: 8,
        apply({ availableHeight, rects, elements }) {
          const el = elements.floating as HTMLElement;
          el.style.minWidth = `${Math.ceil(rects.reference.width)}px`;
          el.style.maxHeight = `${Math.min(availableHeight, 360)}px`;
          el.style.overflow = 'auto';
        },
      }),
    ],
  });

  const click = useClick(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: 'menu' });
  const listNav = useListNavigation(context, {
    listRef,
    activeIndex: activeIndex ?? -1,
    onNavigate: (i) => setActiveIndex(i),
    loop: true,
  });
  const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions(
    [click, dismiss, role, listNav]
  );

  useEffect(() => {
    if (open && activeIndex == null) {
      const first = listRef.current.findIndex((n) => n && !n.disabled);
      if (first >= 0) setActiveIndex(first);
    }
  }, [open, activeIndex]);

  const handleSelect = (key: Item['key']) => {
    const item = NAV.find((i) => i.key === key);
    if (!item) return;
    if (item.key === 'logout') return onLogout();
    if (item.href) router.push(item.href);
  };

  const items = NAV;

  return (
    <div className="relative inline-block w-full">
      {/* Trigger */}
      <button
        ref={refs.setReference}
        {...getReferenceProps()}
        className={[
          'flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl px-4 py-2.5',
          'border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50',
          'dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800',
          'text-base font-medium transition-all duration-150 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500/30',
        ].join(' ')}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={active?.label ?? 'Menu'}
      >
        <span className="truncate">{active?.label}</span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 transition-transform duration-150 ${open ? 'rotate-180 text-pink-500' : 'opacity-70'}`}
        />
      </button>

      {open && (
        <FloatingFocusManager context={context} modal={false}>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
            role="menu"
            className={[
              // LIGHT (jak desktop)
              'z-40 w-56 overflow-auto rounded-2xl border bg-white p-1 shadow-2xl',
              'border-zinc-200 ring-1 ring-black/5',
              // DARK
              'dark:border-zinc-800 dark:bg-zinc-900 dark:ring-white/10',
            ].join(' ')}
          >
            {items.map((it, i) => {
              const isActive = it.key === active.key;
              const isDanger = it.tone === 'danger';

              const baseItem =
                'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors focus:outline-none';
              const cls = isActive
                ? // ACTIVE — jak w desktop
                  'bg-pink-200/60 text-pink-800 dark:bg-pink-800/25 dark:text-pink-200'
                : isDanger
                  ? 'text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-900/20'
                  : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800/60';

              const iconWrap = isActive
                ? 'bg-pink-200/70 text-pink-900 dark:bg-pink-800/30 dark:text-pink-100'
                : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200';

              return (
                <button
                  key={it.key}
                  ref={(node) => {
                    listRef.current[i] = node;
                  }}
                  role="menuitemradio"
                  aria-checked={isActive}
                  className={`${baseItem} ${cls}`}
                  {...getItemProps({
                    tabIndex: (activeIndex ?? -1) === i ? 0 : -1,
                    onMouseMove: () => setActiveIndex(i),
                    onFocus: () => setActiveIndex(i),
                    onClick: () => {
                      setOpen(false);
                      handleSelect(it.key);
                    },
                  })}
                >
                  <span
                    className={`grid h-8 w-8 place-items-center rounded-lg ${iconWrap}`}
                  >
                    {it.key === 'logout' ? (
                      <LogOut className="h-4 w-4" />
                    ) : (
                      <it.icon className="h-4 w-4" />
                    )}
                  </span>
                  <span className="font-medium">{it.label}</span>
                </button>
              );
            })}
          </div>
        </FloatingFocusManager>
      )}
    </div>
  );
}

export function AccountSidebarDesktop({
  className = '',
}: {
  className?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const onLogout = useCallback(() => {
    // TODO: podłącz realny logout (np. next-auth signOut)
    router.push('/');
  }, [router]);

  return (
    <nav className={`grid gap-1 ${className}`}>
      {NAV.map(({ key, label, href, icon: Icon, tone }) => {
        const isActive = href ? pathname.startsWith(href) : false;

        const base =
          'flex items-center gap-3 cursor-pointer rounded-xl px-3 py-2 text-sm transition-colors';
        const cls = isActive
          ? 'bg-pink-200/60 text-pink-800 dark:bg-pink-800/25 dark:text-pink-200'
          : tone === 'danger'
            ? 'text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-900/20'
            : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800/60';

        const iconWrap = isActive
          ? 'bg-pink-200/70 text-pink-900 dark:bg-pink-800/30 dark:text-pink-100'
          : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200';

        if (key === 'logout') {
          return (
            <button
              key={key}
              type="button"
              onClick={onLogout}
              className={`${base} ${cls}`}
              aria-label={label}
            >
              <span
                className={`grid h-8 w-8 place-items-center rounded-lg ${iconWrap}`}
              >
                <LogOut className="h-4 w-4" />
              </span>
              <span className="font-medium">{label}</span>
            </button>
          );
        }

        return (
          <Link
            key={key}
            href={href!}
            className={`${base} ${cls}`}
            aria-current={isActive ? 'page' : undefined}
          >
            <span
              className={`grid h-8 w-8 place-items-center rounded-lg ${iconWrap}`}
            >
              <Icon className="h-4 w-4" />
            </span>
            <span className="font-medium">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
