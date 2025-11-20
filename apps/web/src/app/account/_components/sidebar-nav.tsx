'use client';

import {
  Calendar1Icon,
  CreditCardIcon,
  LogOut,
  MessagesSquareIcon,
  SettingsIcon,
  UserIcon,
  ChevronDown,
  Bell,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState, memo } from 'react';
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

type NavItemKey =
  | 'profile'
  | 'chats'
  | 'intents'
  | 'notifications'
  | 'plans-and-bills'
  | 'settings'
  | 'logout';

type NavItem = {
  key: NavItemKey;
  label: string;
  href?: string;
  tone?: 'danger';
  icon: React.ComponentType<{ className?: string }>;
};

const NAV_ITEMS: NavItem[] = [
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
    label: 'Moje Intenty',
    href: '/account/intents',
    icon: Calendar1Icon,
  },
  {
    key: 'notifications',
    label: 'Notifications',
    href: '/account/notifications',
    icon: Bell,
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
  {
    key: 'logout',
    label: 'Sign out',
    icon: LogOut,
    tone: 'danger',
  },
];

function getActiveNavItem(pathname: string): NavItem {
  return (
    NAV_ITEMS.find((item) => item.href && pathname.startsWith(item.href)) ||
    NAV_ITEMS[0]!
  );
}

function getNavItemClasses(isActive: boolean, isDanger: boolean): string {
  const base =
    'flex items-center gap-3 cursor-pointer rounded-xl px-3 py-2 text-sm transition-colors';

  if (isActive) {
    return `${base} bg-pink-200/60 text-pink-800 dark:bg-pink-800/25 dark:text-pink-200`;
  }

  if (isDanger) {
    return `${base} text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-900/20`;
  }

  return `${base} text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800/60`;
}

function getIconWrapperClasses(isActive: boolean): string {
  const base = 'grid h-8 w-8 place-items-center rounded-lg';

  if (isActive) {
    return `${base} bg-pink-200/70 text-pink-900 dark:bg-pink-800/30 dark:text-pink-100`;
  }

  return `${base} bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200`;
}

type AccountSidebarMobileProps = {
  placement?: Placement;
  strategy?: 'absolute' | 'fixed';
};

export const AccountSidebarMobile = memo(function AccountSidebarMobile({
  placement = 'bottom-start',
  strategy = 'fixed',
}: AccountSidebarMobileProps) {
  const pathname = usePathname();
  const router = useRouter();

  const activeItem = useMemo(() => getActiveNavItem(pathname), [pathname]);

  const handleLogout = useCallback(() => {
    // TODO: podłącz realny logout (np. next-auth signOut)
    router.push('/');
  }, [router]);

  const [isOpen, setIsOpen] = useState(false);
  const listRef = useRef<Array<HTMLButtonElement | null>>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: (next) => {
      setIsOpen(next);
      if (!next) {
        setActiveIndex(null);
      }
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
    onNavigate: setActiveIndex,
    loop: true,
  });

  const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions(
    [click, dismiss, role, listNav]
  );

  useEffect(() => {
    if (isOpen && activeIndex === null) {
      const firstEnabledIndex = listRef.current.findIndex(
        (node) => node && !node.disabled
      );
      if (firstEnabledIndex >= 0) {
        setActiveIndex(firstEnabledIndex);
      }
    }
  }, [isOpen, activeIndex]);

  const handleSelect = useCallback(
    (key: NavItemKey) => {
      const item = NAV_ITEMS.find((i) => i.key === key);
      if (!item) {
        return;
      }

      if (item.key === 'logout') {
        handleLogout();
        return;
      }

      if (item.href) {
        router.push(item.href);
      }
    },
    [router, handleLogout]
  );

  return (
    <div className="relative inline-block w-full">
      <button
        ref={refs.setReference}
        {...getReferenceProps()}
        className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl px-4 py-2.5 border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800 text-base font-medium transition-all duration-150 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500/30"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={activeItem.label}
      >
        <span className="truncate">{activeItem.label}</span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 transition-transform duration-150 ${isOpen ? 'rotate-180 text-pink-500' : 'opacity-70'}`}
        />
      </button>

      {isOpen && (
        <FloatingFocusManager context={context} modal={false}>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
            role="menu"
            className="z-40 w-56 overflow-auto rounded-2xl border bg-white p-1 shadow-2xl border-zinc-200 ring-1 ring-black/5 dark:border-zinc-800 dark:bg-zinc-900 dark:ring-white/10"
          >
            {NAV_ITEMS.map((item, index) => {
              const isActive = item.key === activeItem.key;
              const isDanger = item.tone === 'danger';
              const Icon = item.icon;

              return (
                <button
                  key={item.key}
                  ref={(node) => {
                    listRef.current[index] = node;
                  }}
                  role="menuitemradio"
                  aria-checked={isActive}
                  className={getNavItemClasses(isActive, isDanger)}
                  {...getItemProps({
                    tabIndex: (activeIndex ?? -1) === index ? 0 : -1,
                    onMouseMove: () => setActiveIndex(index),
                    onFocus: () => setActiveIndex(index),
                    onClick: () => {
                      setIsOpen(false);
                      handleSelect(item.key);
                    },
                  })}
                >
                  <span className={getIconWrapperClasses(isActive)}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </FloatingFocusManager>
      )}
    </div>
  );
});

type AccountSidebarDesktopProps = {
  className?: string;
};

export const AccountSidebarDesktop = memo(function AccountSidebarDesktop({
  className = '',
}: AccountSidebarDesktopProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = useCallback(() => {
    // TODO: podłącz realny logout (np. next-auth signOut)
    router.push('/');
  }, [router]);

  return (
    <nav className={`grid gap-1 ${className}`}>
      {NAV_ITEMS.map((item) => {
        const isActive = item.href ? pathname.startsWith(item.href) : false;
        const isDanger = item.tone === 'danger';
        const Icon = item.icon;

        if (item.key === 'logout') {
          return (
            <button
              key={item.key}
              type="button"
              onClick={handleLogout}
              className={getNavItemClasses(isActive, isDanger)}
              aria-label={item.label}
            >
              <span className={getIconWrapperClasses(isActive)}>
                <Icon className="h-4 w-4" />
              </span>
              <span className="font-medium">{item.label}</span>
            </button>
          );
        }

        if (!item.href) {
          return null;
        }

        return (
          <Link
            key={item.key}
            href={item.href}
            className={getNavItemClasses(isActive, isDanger)}
            aria-current={isActive ? 'page' : undefined}
          >
            <span className={getIconWrapperClasses(isActive)}>
              <Icon className="h-4 w-4" />
            </span>
            <span className="font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
});
