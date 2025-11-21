'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';
import { IntentMember, IntentMemberStatus } from './types';
import { MemberRow } from './member-row';

export function MembersSection({
  status,
  items,
  canManage,
  callbacks,
  onOpenManage,
  defaultOpen = true,
}: {
  status: IntentMemberStatus;
  items: IntentMember[];
  canManage: boolean;
  callbacks: any;
  onOpenManage: (m: IntentMember) => void;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = React.useState(defaultOpen);

  const dotClass = clsx('inline-block w-2 h-2 rounded-full', {
    'bg-emerald-400': status === 'JOINED',
    'bg-amber-400': status === 'PENDING',
    'bg-cyan-400': status === 'INVITED',
    'bg-zinc-400': status === 'LEFT',
    'bg-orange-400': status === 'REJECTED',
    'bg-orange-500': status === 'KICKED',
    'bg-red-500': status === 'BANNED',
  });

  return (
    <section
      aria-labelledby={`group-${status}`}
      className="mt-8 overflow-hidden border rounded-xl bg-gray-50 dark:bg-gradient-to-b dark:from-[#0B0B0D] dark:to-[#0C0C0E] border-zinc-200/70 dark:border-zinc-800 shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:shadow-none"
    >
      {/* Header */}
      <button
        id={`group-${status}`}
        onClick={() => setOpen((s) => !s)}
        className={clsx(
          'group w-full flex items-center justify-between px-4 py-3 text-left',
          'transition-colors hover:bg-white/60 dark:hover:bg-zinc-900/30',
          'focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-300'
        )}
        aria-expanded={open}
      >
        <div className="flex items-center gap-2.5">
          <span className={dotClass} />
          <span className="text-[13px] font-medium tracking-wide uppercase text-zinc-600 dark:text-zinc-400">
            {status}
          </span>
          <span className="px-1.5 py-0.5 text-[11px] font-semibold tabular-nums rounded-full bg-zinc-100 text-zinc-700 dark:bg-zinc-800/70 dark:text-zinc-300">
            {items.length}
          </span>
        </div>
        <ChevronDown
          className={clsx(
            'w-4 h-4 text-zinc-400 transition-transform shrink-0',
            'group-hover:text-zinc-600 dark:group-hover:text-zinc-300',
            open ? 'rotate-180' : 'rotate-0'
          )}
          aria-hidden
        />
      </button>

      {/* Content */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'tween', duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="px-1.5 pb-1.5 pt-2.5 space-y-0.5">
              {items.map((m) => (
                <MemberRow
                  key={m.id}
                  member={m}
                  canManage={canManage}
                  onOpenManage={onOpenManage}
                  callbacks={callbacks}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
