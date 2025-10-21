'use client';

import { ThemeSwitchConnected } from '@/components/theme-switch/theme-switch-connect';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Calendar1Icon,
  ChevronDown,
  LogOut,
  MessagesSquareIcon,
  Settings,
  User as UserIcon,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { SignOutConfirmModal } from '../auth/signout-confirm-modal';

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
    avatarUrl?: string;
  };

  onNavigate?: (key: NavigateKey) => void;
  onSignOut?: () => void;
};

const AVATAR_FALLBACK =
  'https://api.dicebear.com/7.x/thumbs/svg?seed=user&radius=50';

export function UserMenu({ user, onNavigate, onSignOut }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
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

  return (
    <>
      <div className="relative shrink-0">
        <button
          ref={btnRef}
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={avatarBtnLabel}
          className="flex items-center gap-2 p-1 pr-2 bg-white border rounded-full shadow-sm cursor-pointer border-zinc-200 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
        >
          <img
            src={user.avatarUrl || AVATAR_FALLBACK}
            alt={user.name}
            className="object-cover w-6 h-6 rounded-full"
          />
          <ChevronDown className="w-4 h-4 opacity-60" />
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              ref={menuRef}
              role="menu"
              initial={{ opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.12 }}
              className="absolute right-0 top-[calc(100%+8px)] z-50 w-72 rounded-2xl border border-zinc-200 bg-white p-0.5 shadow-2xl ring-1 ring-black/5 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-center gap-3 px-3 py-3 rounded-xl">
                <img
                  src={user.avatarUrl || AVATAR_FALLBACK}
                  alt=""
                  className="object-cover w-10 h-10 rounded-full"
                />
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate text-zinc-900 dark:text-zinc-50">
                    {user.name}
                  </div>
                  {user.email && (
                    <div className="text-xs truncate text-zinc-500">
                      {user.email}
                    </div>
                  )}
                </div>
              </div>

              <div className="w-full h-px bg-zinc-200 dark:bg-zinc-800" />

              <MenuBtn
                icon={<UserIcon className="w-4 h-4" />}
                label="Profile"
                onClick={() => onNavigate?.('billing')}
              />

              <MenuBtn
                icon={<MessagesSquareIcon className="w-4 h-4" />}
                label="Chats"
                onClick={() => onNavigate?.('account')}
              />

              <MenuBtn
                icon={<Calendar1Icon className="w-4 h-4" />}
                label="Intents"
                onClick={() => onNavigate?.('settings')}
              />

              <MenuBtn
                icon={<Settings className="w-4 h-4" />}
                label="Settings"
                onClick={() => onNavigate?.('settings')}
              />

              <div className="w-full h-px my-1 bg-zinc-200 dark:bg-zinc-800" />

              <div className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800">
                <span>Dark mode</span>
                <ThemeSwitchConnected />
              </div>

              <div className="w-full h-px my-1 bg-zinc-200 dark:bg-zinc-800" />

              <MenuBtn
                icon={<LogOut className="w-4 h-4" />}
                label="Sign out"
                onClick={() => {
                  setOpen(false);
                  setConfirmOpen(true);
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <SignOutConfirmModal
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          onSignOut?.();
        }}
      />
    </>
  );
}

function MenuBtn({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      role="menuitem"
      onClick={onClick}
      className="flex items-center w-full gap-3 px-3 py-2 text-sm text-left cursor-pointer rounded-xl hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:hover:bg-zinc-800"
    >
      <span className="grid w-8 h-8 rounded-lg place-items-center bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
        {icon}
      </span>
      <span className="flex-1">{label}</span>
    </button>
  );
}
