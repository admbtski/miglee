'use client';

import { ThemeSwitchConnected } from '@/app/components/theme/theme-switch-connect';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Briefcase,
  Building2,
  Calculator,
  CircleDollarSign,
  Cookie,
  Facebook,
  HelpCircle,
  Info,
  Instagram,
  Linkedin,
  Monitor,
  Rocket,
  Scale,
  Shield,
  UserRound,
  X,
  Youtube,
} from 'lucide-react';

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
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/40 cursor-pointer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          {/* Panel */}
          <motion.aside
            className="fixed right-0 top-0 z-50 h-full w-[88vw] max-w-md overflow-y-auto rounded-l-2xl border-l border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 260, damping: 30 }}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-zinc-200 bg-white/80 px-4 py-3 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/70">
              <button
                onClick={onClose}
                className="rounded-lg p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="text-base font-semibold">Menu</div>
              <ThemeSwitchConnected />
            </div>

            {/* Items */}
            <nav className="px-2 py-2">
              <MenuItem icon={Briefcase} label="Job offers" />
              <MenuItem icon={Calculator} label="Salary calculator" />
              <MenuItem icon={Building2} label="Company Profiles" />
              <MenuItem icon={Rocket} label="RocketSpace.pl" />
              <MenuItem icon={Info} label="About us" />
              <MenuItem icon={CircleDollarSign} label="Pricing" />
              <MenuItem icon={Scale} label="Career" />
              <MenuItem icon={HelpCircle} label="Help" />
              <MenuItem icon={Scale} label="Terms" />
              <MenuItem icon={Shield} label="Privacy policy" />
              <MenuItem icon={Cookie} label="Cookie settings" />
            </nav>

            {/* CTAs */}
            <div className="space-y-3 px-4 py-3">
              <CardButton
                icon={UserRound}
                title="Sign in to Candidate's profile"
              />
              <CardButton icon={Monitor} title="Sign in to Employer's panel" />
            </div>

            {/* Socials */}
            <div className="px-4 pb-6 pt-3">
              <div className="mb-2 text-center text-sm text-zinc-600 dark:text-zinc-400">
                Follow us on social media
              </div>
              <div className="flex items-center justify-center gap-4">
                <IconButton icon={Facebook} label="Facebook" />
                <IconButton icon={Instagram} label="Instagram" />
                <IconButton icon={Linkedin} label="LinkedIn" />
                <IconButton icon={Youtube} label="YouTube" />
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

/* --- tiny UI pieces --- */

function MenuItem({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <button className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[15px] hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer">
      <Icon className="h-5 w-5 opacity-70" />
      <span>{label}</span>
    </button>
  );
}

function CardButton({ icon: Icon, title }: { icon: any; title: string }) {
  return (
    <button className="flex w-full items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-3 py-3 text-left shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800 cursor-pointer">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
        <Icon className="h-5 w-5" />
      </div>
      <div className="text-sm font-medium">{title}</div>
    </button>
  );
}

function IconButton({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <button
      className="rounded-xl border border-zinc-200 p-2 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800 cursor-pointer"
      aria-label={label}
      title={label}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}
