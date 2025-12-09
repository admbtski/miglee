'use client';

// TODO i18n: All menu labels need translation keys
// - "Menu", "Wydarzenia", "Konto", "About us", etc., "Sign in to your account", "Follow us on social media"

import { ThemeSwitchConnected } from '@/features/theme/components/theme-switch-connect';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Cookie,
  Facebook,
  HelpCircle,
  Info,
  Instagram,
  Linkedin,
  PanelsTopLeftIcon,
  Scale,
  Shield,
  User,
  UserRound,
  X,
  Youtube,
} from 'lucide-react';
import { ComponentType } from 'react';

type IconT = ComponentType<{ className?: string }>;

export function NavDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <div className="bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
          <motion.button
            type="button"
            className="fixed inset-0 z-50 cursor-pointer bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            aria-label="Close menu overlay"
            onClick={onClose}
          />

          <motion.aside
            className="fixed right-0 top-0 z-50 h-full w-[88vw] max-w-md overflow-y-auto rounded-l-2xl border-l border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 260, damping: 30 }}
            role="dialog"
            aria-label="Main menu"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/70">
              <button
                type="button"
                onClick={onClose}
                aria-label="Close menu"
                className="p-2 rounded-lg cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="text-base font-semibold">Menu</div>
              <ThemeSwitchConnected />
            </div>

            {/* Links */}
            <nav className="px-2 py-2" aria-label="Menu links">
              {(
                [
                  [PanelsTopLeftIcon, 'Wydarzenia'],
                  [User, 'Konto'],
                  [Info, 'About us'],
                  [HelpCircle, 'Help'],
                  [Scale, 'Terms'],
                  [Shield, 'Privacy policy'],
                  [Cookie, 'Cookie settings'],
                ] as [IconT, string][]
              ).map(([Icon, label], index) => (
                <MenuItem key={index} icon={Icon} label={label} />
              ))}
            </nav>

            {/* CTAs */}
            <div className="px-4 py-3 space-y-3">
              <CardButton icon={UserRound} title="Sign in to your account" />
            </div>

            {/* Socials */}
            <div className="px-4 pt-3 pb-6">
              <div className="mb-2 text-sm text-center text-zinc-600 dark:text-zinc-400">
                Follow us on social media
              </div>
              <div className="flex justify-center gap-4">
                {[Facebook, Instagram, Linkedin, Youtube].map((Icon, i) => (
                  <IconButton key={i} icon={Icon} />
                ))}
              </div>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

/* Small building blocks */
function MenuItem({ icon: Icon, label }: { icon: IconT; label: string }) {
  return (
    <button
      type="button"
      className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-left text-[15px] hover:bg-zinc-50 dark:hover:bg-zinc-800"
    >
      <Icon className="w-5 h-5 opacity-70" aria-hidden />
      <span>{label}</span>
    </button>
  );
}

function CardButton({ icon: Icon, title }: { icon: IconT; title: string }) {
  return (
    <button
      type="button"
      className="flex items-center w-full gap-3 px-3 py-3 text-left bg-white border shadow-sm cursor-pointer rounded-2xl border-zinc-200 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
    >
      <div className="grid w-10 h-10 place-items-center rounded-xl bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
        <Icon className="w-5 h-5" aria-hidden />
      </div>
      <div className="text-sm font-medium">{title}</div>
    </button>
  );
}

function IconButton({ icon: Icon }: { icon: IconT }) {
  return (
    <button
      type="button"
      className="p-2 border cursor-pointer rounded-xl border-zinc-200 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
      aria-label="Open social link"
      title="Open social link"
    >
      <Icon className="w-5 h-5" aria-hidden />
    </button>
  );
}
