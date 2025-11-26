'use client';

import Link from 'next/link';
import type { EventDetailsData } from '@/types/event-details';
import { useMeQuery } from '@/lib/api/auth';
import { getCardHighlightClasses } from '@/lib/utils/is-boost-active';
import {
  Settings,
  Edit3,
  Ban,
  Trash2,
  Users,
  AlertTriangle,
  Lock,
  LockOpen,
  Crown,
  MessageSquare,
  UserPlus,
  Star,
  BarChart3,
} from 'lucide-react';
import { useMemo } from 'react';

type EventAdminPanelProps = {
  event: EventDetailsData;
  onCancel: () => void;
  onDelete: () => void;
  onCloseJoin?: () => void;
  onReopenJoin?: () => void;
};

/**
 * Panel zarządzania wydarzeniem dla administratorów i moderatorów
 * Wyświetla się dla:
 * - Właściciela wydarzenia
 * - Moderatorów wydarzenia
 * - Adminów aplikacji
 * - Moderatorów aplikacji
 */

// TODO NEXT: QUICK ACTIONS TO INTENT MANAGEMENT
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

  // Check if boost is active
  const isBoosted = useMemo(() => {
    if (!event.boostedAt) return false;
    const boostedTime = new Date(event.boostedAt).getTime();
    const now = Date.now();
    const elapsed = now - boostedTime;
    return elapsed < 24 * 60 * 60 * 1000;
  }, [event.boostedAt]);

  // Get highlight classes
  const highlightClasses = useMemo(
    () => getCardHighlightClasses(event.highlightColor, isBoosted),
    [event.highlightColor, isBoosted]
  );

  if (!canAccessPanel) {
    return null;
  }

  const isCanceled = !!event.canceledAt;
  const isDeleted = !!event.deletedAt;

  // Permission levels
  const canEdit = userMembership?.isOwner || isAppAdmin || isAppModerator;
  const canDelete = userMembership?.isOwner || isAppAdmin;
  const canCancel =
    userMembership?.isOwner ||
    userMembership?.isModerator ||
    isAppAdmin ||
    isAppModerator;

  return (
    <div
      className={`p-4 border border-blue-200 rounded-2xl bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/30 transition-all duration-300 ${highlightClasses.className}`}
      style={highlightClasses.style}
    >
      <div className="flex items-center gap-2 mb-3">
        <Settings className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
          Panel zarządzania
        </h3>
      </div>

      <div className="space-y-1">
        {/* Zarządzaj wydarzeniem - główny panel */}
        <Link
          href={`/intent/${event.id}/manage`}
          className="flex items-center w-full gap-3 px-3 py-2 text-sm text-blue-700 transition-colors rounded-xl hover:bg-blue-100 dark:text-blue-300 dark:hover:bg-blue-900/50"
        >
          <Settings className="w-4 h-4" />
          <span>Panel zarządzania</span>
        </Link>

        {/* Edytuj wydarzenie */}
        {canEdit && !isDeleted && (
          <Link
            href={`/intent/${event.id}/manage/edit`}
            className="flex items-center w-full gap-3 px-3 py-2 text-sm text-blue-700 transition-colors rounded-xl hover:bg-blue-100 dark:text-blue-300 dark:hover:bg-blue-900/50"
          >
            <Edit3 className="w-4 h-4" />
            <span>Edytuj szczegóły</span>
          </Link>
        )}

        {/* Uczestnicy */}
        <Link
          href={`/intent/${event.id}/manage/members`}
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

        {/* Sponsorship / Plan */}
        {!isDeleted && (
          <Link
            href={`/intent/${event.id}/manage/subscription`}
            className="flex items-center w-full gap-3 px-3 py-2 text-sm text-blue-700 transition-colors rounded-xl hover:bg-blue-100 dark:text-blue-300 dark:hover:bg-blue-900/50"
          >
            <Crown className="w-4 h-4" />
            <span>Sponsoring & Boosty</span>
          </Link>
        )}

        {/* Chat */}
        {!isDeleted && (
          <Link
            href={`/intent/${event.id}/manage/chat`}
            className="flex items-center w-full gap-3 px-3 py-2 text-sm text-blue-700 transition-colors rounded-xl hover:bg-blue-100 dark:text-blue-300 dark:hover:bg-blue-900/50"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Chat grupowy</span>
          </Link>
        )}

        {/* Zaproszenia */}
        {!isDeleted && (
          <Link
            href={`/intent/${event.id}/manage/invite-links`}
            className="flex items-center w-full gap-3 px-3 py-2 text-sm text-blue-700 transition-colors rounded-xl hover:bg-blue-100 dark:text-blue-300 dark:hover:bg-blue-900/50"
          >
            <UserPlus className="w-4 h-4" />
            <span>Linki zaproszeń</span>
          </Link>
        )}

        {/* Recenzje */}
        {!isDeleted && (
          <Link
            href={`/intent/${event.id}/manage/reviews`}
            className="flex items-center w-full gap-3 px-3 py-2 text-sm text-blue-700 transition-colors rounded-xl hover:bg-blue-100 dark:text-blue-300 dark:hover:bg-blue-900/50"
          >
            <Star className="w-4 h-4" />
            <span>Recenzje</span>
          </Link>
        )}

        {/* Analityka */}
        {!isDeleted && (
          <Link
            href={`/intent/${event.id}/manage/analytics`}
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
