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
    'bg-emerald-500': status === 'JOINED',
    'bg-yellow-500': status === 'PENDING',
    'bg-cyan-500': status === 'INVITED',
    'bg-zinc-400': status === 'LEFT',
    'bg-orange-500': status === 'REJECTED',
    'bg-rose-500': status === 'KICKED',
    'bg-red-600': status === 'BANNED',
  });

  return (
    <section aria-labelledby={`group-${status}`}>
      <button
        id={`group-${status}`}
        onClick={() => setOpen((s) => !s)}
        className={clsx(
          'group inline-flex items-center justify-between w-full px-2 py-2 mb-2 text-left transition rounded-xl ring-1 ring-transparent focus:outline-none focus:ring-2 focus:ring-indigo-300/50',
          'hover:bg-zinc-50 dark:hover:bg-zinc-900/40'
        )}
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
          <span className={dotClass} />
          {status}
          <span className="ml-1 px-2 py-0.5 text-[11px] font-medium rounded-full bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
            {items.length}
          </span>
        </span>
        <ChevronDown
          className={clsx(
            'w-4 h-4 text-zinc-500 transition-transform shrink-0 group-hover:text-zinc-700 dark:group-hover:text-zinc-300',
            open ? 'rotate-180' : 'rotate-0'
          )}
          aria-hidden
        />
      </button>

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
            <div className="grid gap-2">
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
