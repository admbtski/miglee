/**
 * EventAgenda Component
 * Displays the event agenda/schedule on the public event detail page
 */

// TODO i18n: All Polish strings need translation keys
// TODO i18n: Date/time formatting should be locale-aware

'use client';

import { useState } from 'react';
import { ListOrdered, Clock, ChevronDown, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AgendaHost {
  id: string;
  kind: 'USER' | 'MANUAL';
  userId?: string | null;
  user?: {
    id: string;
    name: string;
    avatarKey?: string | null;
    avatarBlurhash?: string | null;
  } | null;
  name?: string | null;
  avatarUrl?: string | null;
}

interface AgendaItem {
  id: string;
  title: string;
  description?: string | null;
  startAt?: string | null;
  endAt?: string | null;
  hosts: AgendaHost[];
}

interface EventAgendaProps {
  items: AgendaItem[];
}

function formatTime(dateString?: string | null): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleTimeString('pl-PL', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// formatDate function can be added when needed for multi-day agendas
// function formatDate(dateString?: string | null): string {
//   if (!dateString) return '';
//   const date = new Date(dateString);
//   return date.toLocaleDateString('pl-PL', {
//     day: 'numeric',
//     month: 'short',
//   });
// }

function HostAvatar({ host }: { host: AgendaHost }) {
  const name = host.kind === 'USER' ? host.user?.name : host.name;
  const avatarUrl =
    host.kind === 'USER' && host.user?.avatarKey
      ? `/api/media/${host.user.avatarKey}`
      : host.avatarUrl;

  return (
    <div className="flex items-center gap-2">
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name || 'Host'}
          className="w-6 h-6 rounded-full object-cover ring-2 ring-white dark:ring-zinc-800"
        />
      ) : (
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-[10px] font-semibold ring-2 ring-white dark:ring-zinc-800">
          {name?.charAt(0)?.toUpperCase() || '?'}
        </div>
      )}
      <span className="text-sm text-zinc-700 dark:text-zinc-300 font-medium">
        {name || 'Nieznany'}
      </span>
    </div>
  );
}

function AgendaItemCard({
  item,
  isLast,
}: {
  item: AgendaItem;
  isLast: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasDetails = item.description || item.hosts.length > 0;

  return (
    <div className="relative">
      {/* Timeline connector */}
      <div className="absolute left-4 top-0 bottom-0 flex flex-col items-center">
        <div className="w-3 h-3 rounded-full bg-indigo-500 dark:bg-indigo-400 ring-4 ring-indigo-100 dark:ring-indigo-900/30 z-10" />
        {!isLast && (
          <div className="flex-1 w-0.5 bg-gradient-to-b from-indigo-300 to-zinc-200 dark:from-indigo-700 dark:to-zinc-700" />
        )}
      </div>

      {/* Content */}
      <div className="pl-10 pb-6">
        <div
          className={cn(
            'rounded-xl border transition-all duration-200',
            expanded
              ? 'bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-200 dark:border-indigo-800'
              : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
          )}
        >
          <button
            onClick={() => hasDetails && setExpanded(!expanded)}
            disabled={!hasDetails}
            className={cn(
              'w-full p-4 text-left',
              hasDetails && 'cursor-pointer'
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                {/* Time badge */}
                {item.startAt && (
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                    <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                      {formatTime(item.startAt)}
                      {item.endAt && ` – ${formatTime(item.endAt)}`}
                    </span>
                  </div>
                )}

                {/* Title */}
                <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {item.title}
                </h4>

                {/* Hosts preview (collapsed) */}
                {!expanded && item.hosts.length > 0 && (
                  <div className="flex items-center gap-1 mt-2">
                    <User className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      {item.hosts
                        .slice(0, 2)
                        .map((h) => (h.kind === 'USER' ? h.user?.name : h.name))
                        .filter(Boolean)
                        .join(', ')}
                      {item.hosts.length > 2 &&
                        ` +${item.hosts.length - 2} więcej`}
                    </span>
                  </div>
                )}
              </div>

              {hasDetails && (
                <ChevronDown
                  className={cn(
                    'w-4 h-4 text-zinc-400 transition-transform flex-shrink-0 mt-1',
                    expanded && 'rotate-180'
                  )}
                />
              )}
            </div>
          </button>

          {/* Expanded content */}
          <AnimatePresence>
            {expanded && hasDetails && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 pt-0 space-y-3">
                  {/* Description */}
                  {item.description && (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">
                      {item.description}
                    </p>
                  )}

                  {/* Hosts */}
                  {item.hosts.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                        Prowadzący
                      </p>
                      <div className="flex flex-wrap gap-3">
                        {item.hosts.map((host) => (
                          <HostAvatar key={host.id} host={host} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export function EventAgenda({ items }: EventAgendaProps) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className="p-6 border rounded-2xl border-zinc-200 bg-white/70 dark:border-zinc-800 dark:bg-zinc-900/40 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/20">
          <ListOrdered className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            📋 Program wydarzenia
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {items.length}{' '}
            {items.length === 1
              ? 'punkt'
              : items.length < 5
                ? 'punkty'
                : 'punktów'}{' '}
            programu
          </p>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {items.map((item, index) => (
          <AgendaItemCard
            key={item.id}
            item={item}
            isLast={index === items.length - 1}
          />
        ))}
      </div>
    </div>
  );
}
