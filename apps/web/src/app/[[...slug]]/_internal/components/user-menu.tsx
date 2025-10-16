'use client';

import { ThemeSwitchConnected } from '@/app/components/theme/theme-switch-connect';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronDown,
  CreditCard,
  LogOut,
  Settings,
  User as UserIcon,
  Users,
  Wand2,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { SignOutConfirmModal } from './signout-confirm-modal';

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
          className="flex cursor-pointer items-center gap-2 rounded-full border border-zinc-200 bg-white p-1 pr-2 shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
        >
          <img
            src={user.avatarUrl || AVATAR_FALLBACK}
            alt={user.name}
            className="h-6 w-6 rounded-full object-cover"
          />
          <ChevronDown className="h-4 w-4 opacity-60" />
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
              <div className="flex items-center gap-3 rounded-xl px-3 py-3">
                <img
                  src={user.avatarUrl || AVATAR_FALLBACK}
                  alt=""
                  className="h-10 w-10 rounded-full object-cover"
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
                icon={<CreditCard className="h-4 w-4" />}
                label="Billing"
                onClick={() => onNavigate?.('billing')}
              />
              <MenuBtn
                icon={<Settings className="h-4 w-4" />}
                label="Settings"
                onClick={() => onNavigate?.('settings')}
              />
              <MenuBtn
                icon={<UserIcon className="h-4 w-4" />}
                label="My account"
                onClick={() => onNavigate?.('account')}
              />

              <div className="my-1 h-px w-full bg-zinc-200 dark:bg-zinc-800" />

              <div className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800">
                <span>Dark mode</span>
                <ThemeSwitchConnected />
              </div>

              <div className="my-1 h-px w-full bg-zinc-200 dark:bg-zinc-800" />

              <MenuBtn
                icon={<Wand2 className="h-4 w-4" />}
                label={
                  <span className="inline-flex items-center gap-2">
                    Customization
                    <span className="rounded-full bg-zinc-200 px-1.5 text-[10px] font-semibold text-zinc-700 dark:bg-zinc-700 dark:text-zinc-100">
                      New
                    </span>
                  </span>
                }
                onClick={() => onNavigate?.('customization')}
              />
              <MenuBtn
                icon={<Users className="h-4 w-4" />}
                label="Manage team"
                onClick={() => onNavigate?.('team')}
              />

              <div className="h-px w-full bg-zinc-200 dark:bg-zinc-800" />

              <MenuBtn
                icon={<LogOut className="h-4 w-4" />}
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
      className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-left text-sm hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:hover:bg-zinc-800"
    >
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
        {icon}
      </span>
      <span className="flex-1">{label}</span>
    </button>
  );
}
