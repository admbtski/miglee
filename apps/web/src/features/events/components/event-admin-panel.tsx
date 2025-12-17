'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import type { EventDetailsData } from '@/features/events/types/event-details';
import { useMeQuery } from '@/features/auth';
import {
  Settings,
  Edit3,
  Ban,
  Trash2,
  Users,
  AlertTriangle,
  Lock,
  LockOpen,
  MessageSquare,
  UserPlus,
  Star,
  BarChart3,
  Send,
  Rocket,
  FileEdit,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type EventAdminPanelProps = {
  event: EventDetailsData;
  onCancel: () => void;
  onDelete: () => void;
  onCloseJoin?: () => void;
  onReopenJoin?: () => void;
};

enum PublicationStatus {
  Draft = 'DRAFT',
  Published = 'PUBLISHED',
  Scheduled = 'SCHEDULED',
}

/**
 * Panel zarządzania wydarzeniem dla administratorów i moderatorów
 * Wyświetla się dla:
 * - Właściciela wydarzenia
 * - Moderatorów wydarzenia
 * - Adminów aplikacji
 * - Moderatorów aplikacji
 */

// TODO NEXT: QUICK ACTIONS TO EVENT MANAGEMENT
export function EventAdminPanel({
  event,
  onCancel,
  onDelete,
  onCloseJoin,
  onReopenJoin,
}: EventAdminPanelProps) {
  const { userMembership } = event;
  const { data: authData } = useMeQuery();
  const user = authData?.me;

  // Check if user is app-level admin or moderator
  const isAppAdmin = user?.role === 'ADMIN';
  const isAppModerator = user?.role === 'MODERATOR';

  // Panel widoczny dla właściciela, moderatora wydarzenia, lub admina/moderatora aplikacji
  const canAccessPanel =
    userMembership?.isOwner ||
    userMembership?.isModerator ||
    isAppAdmin ||
    isAppModerator;

  if (!canAccessPanel) {
    return null;
  }

  const isCanceled = !!event.canceledAt;
  const isDeleted = !!event.deletedAt;

  // Get publication status
  const status: PublicationStatus =
    ((event as any)?.publicationStatus as PublicationStatus) ??
    PublicationStatus.Draft;
  const isDraft = status === PublicationStatus.Draft;

  const statusConfig = {
    [PublicationStatus.Draft]: {
      icon: FileEdit,
      label: 'Draft',
      bgColor: 'bg-amber-100 dark:bg-amber-900/30',
      textColor: 'text-amber-700 dark:text-amber-300',
      borderColor: 'border-amber-300 dark:border-amber-700',
    },
    [PublicationStatus.Published]: {
      icon: CheckCircle2,
      label: 'Published',
      bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
      textColor: 'text-emerald-700 dark:text-emerald-300',
      borderColor: 'border-emerald-300 dark:border-emerald-700',
    },
    [PublicationStatus.Scheduled]: {
      icon: Clock,
      label: 'Scheduled',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      textColor: 'text-blue-700 dark:text-blue-300',
      borderColor: 'border-blue-300 dark:border-blue-700',
    },
  };

  const currentStatus = statusConfig[status];
  const StatusIcon = currentStatus.icon;

  // Permission levels
  const canEdit = userMembership?.isOwner || isAppAdmin || isAppModerator;
  const canDelete = userMembership?.isOwner || isAppAdmin;
  const canCancel =
    userMembership?.isOwner ||
    userMembership?.isModerator ||
    isAppAdmin ||
    isAppModerator;

  return (
    <div className="p-4 border border-blue-200 rounded-2xl bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/30 transition-all duration-300">
      <div className="flex items-center gap-2 mb-3">
        <Settings className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
          Panel zarządzania
        </h3>
      </div>

      {/* Publication Status Badge */}
      <Link
        href={`/event/${event.id}/manage/publish`}
        className={cn(
          'flex items-center justify-between gap-2 px-3 py-2.5 mb-3 rounded-xl border-2 transition-all hover:scale-[1.01]',
          currentStatus.bgColor,
          currentStatus.textColor,
          currentStatus.borderColor
        )}
      >
        <div className="flex items-center gap-2">
          <StatusIcon className="w-4 h-4" />
          <span className="text-sm font-bold">{currentStatus.label}</span>
        </div>
        {isDraft && <AlertTriangle className="w-4 h-4 opacity-75" />}
      </Link>

      <div className="space-y-1">
        {/* Publish - Highlighted if draft */}
        {!isDeleted && (
          <Link
            href={`/event/${event.id}/manage/publish`}
            className={cn(
              'flex items-center w-full gap-3 px-3 py-2 text-sm transition-colors rounded-xl',
              isDraft
                ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:hover:bg-amber-900/50'
                : 'text-blue-700 hover:bg-blue-100 dark:text-blue-300 dark:hover:bg-blue-900/50'
            )}
          >
            <Send className="w-4 h-4" />
            <span className="flex-1">Publikacja</span>
            {isDraft && <AlertTriangle className="w-3.5 h-3.5" />}
          </Link>
        )}

        {/* Zarządzaj wydarzeniem - główny panel */}
        <Link
          href={`/event/${event.id}/manage`}
          className="flex items-center w-full gap-3 px-3 py-2 text-sm text-blue-700 transition-colors rounded-xl hover:bg-blue-100 dark:text-blue-300 dark:hover:bg-blue-900/50"
        >
          <Settings className="w-4 h-4" />
          <span>Pełny panel zarządzania</span>
        </Link>

        {/* Edytuj wydarzenie */}
        {canEdit && !isDeleted && (
          <Link
            href={`/event/${event.id}/manage/edit/basics`}
            className="flex items-center w-full gap-3 px-3 py-2 text-sm text-blue-700 transition-colors rounded-xl hover:bg-blue-100 dark:text-blue-300 dark:hover:bg-blue-900/50"
          >
            <Edit3 className="w-4 h-4" />
            <span>Edytuj szczegóły</span>
          </Link>
        )}

        {/* Uczestnicy */}
        <Link
          href={`/event/${event.id}/manage/members`}
          className="flex items-center w-full gap-3 px-3 py-2 text-sm text-blue-700 transition-colors rounded-xl hover:bg-blue-100 dark:text-blue-300 dark:hover:bg-blue-900/50"
        >
          <Users className="w-4 h-4" />
          <span>Zarządzaj członkami</span>
          {event.membersStats?.PENDING && event.membersStats.PENDING > 0 && (
            <span className="ml-auto px-2 py-0.5 text-xs font-semibold bg-orange-100 text-orange-700 rounded-full dark:bg-orange-900/30 dark:text-orange-300">
              {event.membersStats.PENDING}
            </span>
          )}
        </Link>

        {/* Upgrade Plan - with pulse animation */}
        {!isDeleted && (
          <Link
            href={`/event/${event.id}/manage/plans`}
            className="flex items-center w-full gap-3 px-3 py-2 text-sm text-violet-700 transition-colors rounded-xl hover:bg-violet-100 dark:text-violet-300 dark:hover:bg-violet-900/50"
          >
            <Rocket className="w-4 h-4" />
            <motion.span
              animate={{
                opacity: [1, 0.5, 1],
                scale: [1, 1.02, 1],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                repeatDelay: 2,
                ease: 'easeInOut',
              }}
            >
              Upgrade Plan
            </motion.span>
          </Link>
        )}

        {/* Chat */}
        {!isDeleted && (
          <Link
            href={`/event/${event.id}/manage/chat`}
            className="flex items-center w-full gap-3 px-3 py-2 text-sm text-blue-700 transition-colors rounded-xl hover:bg-blue-100 dark:text-blue-300 dark:hover:bg-blue-900/50"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Chat grupowy</span>
          </Link>
        )}

        {/* Zaproszenia */}
        {!isDeleted && (
          <Link
            href={`/event/${event.id}/manage/invite-links`}
            className="flex items-center w-full gap-3 px-3 py-2 text-sm text-blue-700 transition-colors rounded-xl hover:bg-blue-100 dark:text-blue-300 dark:hover:bg-blue-900/50"
          >
            <UserPlus className="w-4 h-4" />
            <span>Linki zaproszeń</span>
          </Link>
        )}

        {/* Recenzje */}
        {!isDeleted && (
          <Link
            href={`/event/${event.id}/manage/reviews`}
            className="flex items-center w-full gap-3 px-3 py-2 text-sm text-blue-700 transition-colors rounded-xl hover:bg-blue-100 dark:text-blue-300 dark:hover:bg-blue-900/50"
          >
            <Star className="w-4 h-4" />
            <span>Recenzje</span>
          </Link>
        )}

        {/* Analityka */}
        {!isDeleted && (
          <Link
            href={`/event/${event.id}/manage/analytics`}
            className="flex items-center w-full gap-3 px-3 py-2 text-sm text-blue-700 transition-colors rounded-xl hover:bg-blue-100 dark:text-blue-300 dark:hover:bg-blue-900/50"
          >
            <BarChart3 className="w-4 h-4" />
            <span>Analityka</span>
          </Link>
        )}

        {/* Separator */}
        {!isCanceled && !isDeleted && (
          <div className="h-px my-2 bg-blue-200 dark:bg-blue-800" />
        )}

        {/* Zamknij/Otwórz zapisy */}
        {!isCanceled && !isDeleted && (
          <>
            {event.joinManuallyClosed ? (
              <button
                onClick={onReopenJoin}
                className="flex items-center w-full gap-3 px-3 py-2 text-sm transition-colors rounded-xl text-emerald-700 hover:bg-emerald-100 dark:text-emerald-300 dark:hover:bg-emerald-950"
              >
                <LockOpen className="w-4 h-4" />
                <span>Otwórz zapisy ponownie</span>
              </button>
            ) : (
              <button
                onClick={onCloseJoin}
                className="flex items-center w-full gap-3 px-3 py-2 text-sm transition-colors rounded-xl text-amber-700 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-950"
              >
                <Lock className="w-4 h-4" />
                <span>Zamknij zapisy ręcznie</span>
              </button>
            )}
          </>
        )}

        {/* Separator before danger zone */}
        {((canCancel && !isCanceled && !isDeleted) ||
          (canDelete && !isDeleted)) && (
          <div className="h-px my-2 bg-blue-200 dark:bg-blue-800" />
        )}

        {/* Anuluj wydarzenie */}
        {canCancel && !isCanceled && !isDeleted && (
          <button
            onClick={onCancel}
            className="flex items-center w-full gap-3 px-3 py-2 text-sm text-orange-700 transition-colors rounded-xl hover:bg-orange-100 dark:text-orange-300 dark:hover:bg-orange-950"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Anuluj wydarzenie</span>
          </button>
        )}

        {/* Usuń wydarzenie */}
        {canDelete && !isDeleted && (
          <button
            onClick={onDelete}
            className="flex items-center w-full gap-3 px-3 py-2 text-sm text-red-700 transition-colors rounded-xl hover:bg-red-100 dark:text-red-300 dark:hover:bg-red-950"
          >
            <Trash2 className="w-4 h-4" />
            <span>Usuń wydarzenie</span>
          </button>
        )}
      </div>

      {/* Status info */}
      {(isCanceled || isDeleted) && (
        <div className="p-3 mt-3 border rounded-lg border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900">
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            {isDeleted && (
              <>
                <Ban className="inline w-3 h-3 mb-1" /> Wydarzenie zostało
                usunięte
                {event.deleteReason && `: ${event.deleteReason}`}
              </>
            )}
            {isCanceled && !isDeleted && (
              <>
                <AlertTriangle className="inline w-3 h-3 mb-1" /> Wydarzenie
                zostało anulowane
                {event.cancelReason && `: ${event.cancelReason}`}
              </>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
