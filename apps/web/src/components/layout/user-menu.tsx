'use client';

import { ThemeSwitchConnected } from '@/components/ui/theme-switch-connect';
import { buildAvatarUrl } from '@/lib/media/url';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CalendarIcon,
  ChevronDown,
  CreditCardIcon,
  LogOut,
  MessagesSquareIcon,
  SettingsIcon,
  User as UserIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Avatar } from '../ui/avatar';

export type NavigateKey =
  | 'billing'
  | 'settings'
  | 'account'
  | 'customization'
  | 'team';

type UserMenuProps = {
  user: {
    name: string;
    email?: string;
    avatarKey?: string;
    avatarBlurhash?: string;
  };

  /** opcjonalne callbacki – obecnie nie są używane do nawigacji ani logoutu */
  onNavigate?: (key: NavigateKey) => void;
  onSignOut?: () => void;
};

const AVATAR_FALLBACK =
  'https://api.dicebear.com/7.x/thumbs/svg?seed=user&radius=50';

export function UserMenu({ user }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!open) return;
      const t = e.target as Node;
      if (!btnRef.current?.contains(t) && !menuRef.current?.contains(t)) {
        setOpen(false);
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  const avatarBtnLabel = `Open user menu for ${user.name}`;

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  return (
    <>
      <div className="relative shrink-0">
        <button
          ref={btnRef}
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={avatarBtnLabel}
          className="flex cursor-pointer items-center gap-2 rounded-full border border-zinc-200 bg-white p-1 pr-2 shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
        >
          <Avatar
            url={buildAvatarUrl(user.avatarKey, 'sm')}
            blurhash={user.avatarBlurhash}
            alt={user.name}
            size={24}
            className="opacity-90 group-hover:opacity-100 transition-opacity"
          />

          <ChevronDown className="h-4 w-4 opacity-60" aria-hidden />
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              ref={menuRef}
              role="menu"
              aria-label="User menu"
              initial={{ opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.12 }}
              className="absolute right-0 top-[calc(100%+8px)] z-50 w-72 rounded-2xl border border-zinc-200 bg-white p-0.5 shadow-2xl ring-1 ring-black/5 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-center gap-3 rounded-xl px-3 py-3">
                <Avatar
                  url={buildAvatarUrl(user.avatarKey, 'md')}
                  blurhash={user.avatarBlurhash}
                  alt={user.name}
                  size={48}
                  className="opacity-90 group-hover:opacity-100 transition-opacity"
                />

                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    {user.name}
                  </div>
                  {user.email && (
                    <div className="truncate text-xs text-zinc-500">
                      {user.email}
                    </div>
                  )}
                </div>
              </div>

              <div className="h-px w-full bg-zinc-200 dark:bg-zinc-800" />

              <MenuBtn
                icon={<UserIcon className="h-4 w-4" />}
                label="Profile"
                href="/account/profile"
                onClick={handleClose}
              />

              <MenuBtn
                icon={<MessagesSquareIcon className="h-4 w-4" />}
                label="Chats"
                href="/account/chats"
                onClick={handleClose}
              />

              <MenuBtn
                icon={<CalendarIcon className="h-4 w-4" />}
                label="Intents"
                href="/account/intents"
                onClick={handleClose}
              />

              <MenuBtn
                icon={<CreditCardIcon className="h-4 w-4" />}
                label="Plans & Bills"
                href="/account/plans-and-bills"
                onClick={handleClose}
              />

              <MenuBtn
                icon={<SettingsIcon className="h-4 w-4" />}
                label="Settings"
                href="/account/settings"
                onClick={handleClose}
              />

              <div className="my-1 h-px w-full bg-zinc-200 dark:bg-zinc-800" />

              <div className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800">
                <span>Dark mode</span>
                <ThemeSwitchConnected />
              </div>

              <div className="my-1 h-px w-full bg-zinc-200 dark:bg-zinc-800" />

              <MenuBtn
                icon={<LogOut className="h-4 w-4" />}
                label="Sign out"
                onClick={() => {
                  alert('sign out');
                  handleClose();
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

function MenuBtn({
  icon,
  label,
  href,
  onClick,
}: {
  icon: React.ReactNode;
  label: React.ReactNode;
  href?: string;
  onClick?: () => void;
}) {
  const content = (
    <>
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
        {icon}
      </span>
      <span>{label}</span>
    </>
  );

  return href ? (
    <Link
      href={href}
      onClick={onClick}
      className="flex cursor-pointer w-full items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
    >
      {content}
    </Link>
  ) : (
    <button
      type="button"
      onClick={onClick}
      className="flex cursor-pointer w-full items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
    >
      {content}
    </button>
  );
}
