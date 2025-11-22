'use client';

import Link from 'next/link';
import type { EventDetailsData } from '@/types/event-details';
import { useMeQuery } from '@/lib/api/auth';
import {
  Settings,
  Edit3,
  Ban,
  Trash2,
  Users,
  AlertTriangle,
  Lock,
  LockOpen,
} from 'lucide-react';

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

  // Permission levels
  const canEdit = userMembership?.isOwner || isAppAdmin || isAppModerator;
  const canDelete = userMembership?.isOwner || isAppAdmin;
  const canCancel =
    userMembership?.isOwner ||
    userMembership?.isModerator ||
    isAppAdmin ||
    isAppModerator;

  return (
    <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-800 dark:bg-blue-950/30">
      <div className="mb-3 flex items-center gap-2">
        <Settings className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
          Panel zarządzania
        </h3>
      </div>

      <div className="space-y-1">
        {/* Edytuj wydarzenie */}
        {canEdit && !isDeleted && (
          <Link
            href={`/intent/${event.id}/manage/edit`}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-blue-700 transition-colors hover:bg-blue-100 dark:text-blue-300 dark:hover:bg-blue-900/50"
          >
            <Edit3 className="h-4 w-4" />
            <span>Edytuj wydarzenie</span>
          </Link>
        )}

        {/* Zarządzaj wydarzeniem */}
        <Link
          href={`/intent/${event.id}/manage`}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-blue-700 transition-colors hover:bg-blue-100 dark:text-blue-300 dark:hover:bg-blue-900/50"
        >
          <Users className="h-4 w-4" />
          <span>Zarządzaj wydarzeniem</span>
          {event.membersStats && (
            <span className="ml-auto text-xs opacity-70">
              {event.membersStats.PENDING
                ? `${event.membersStats.PENDING} oczekujących`
                : ''}
            </span>
          )}
        </Link>

        {/* Zamknij/Otwórz zapisy */}
        {!isCanceled && !isDeleted && (
          <>
            {event.joinManuallyClosed ? (
              <button
                onClick={onReopenJoin}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-emerald-700 transition-colors hover:bg-emerald-100 dark:text-emerald-300 dark:hover:bg-emerald-950"
              >
                <LockOpen className="h-4 w-4" />
                <span>Otwórz zapisy ponownie</span>
              </button>
            ) : (
              <button
                onClick={onCloseJoin}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-amber-700 transition-colors hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-950"
              >
                <Lock className="h-4 w-4" />
                <span>Zamknij zapisy ręcznie</span>
              </button>
            )}
          </>
        )}

        {/* Anuluj wydarzenie */}
        {canCancel && !isCanceled && !isDeleted && (
          <button
            onClick={onCancel}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-orange-700 transition-colors hover:bg-orange-100 dark:text-orange-300 dark:hover:bg-orange-950"
          >
            <AlertTriangle className="h-4 w-4" />
            <span>Anuluj wydarzenie</span>
          </button>
        )}

        {/* Usuń wydarzenie */}
        {canDelete && !isDeleted && (
          <button
            onClick={onDelete}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-red-700 transition-colors hover:bg-red-100 dark:text-red-300 dark:hover:bg-red-950"
          >
            <Trash2 className="h-4 w-4" />
            <span>Usuń wydarzenie</span>
          </button>
        )}
      </div>

      {/* Status info */}
      {(isCanceled || isDeleted) && (
        <div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-900">
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            {isDeleted && (
              <>
                <Ban className="mb-1 inline h-3 w-3" /> Wydarzenie zostało
                usunięte
                {event.deleteReason && `: ${event.deleteReason}`}
              </>
            )}
            {isCanceled && !isDeleted && (
              <>
                <AlertTriangle className="mb-1 inline h-3 w-3" /> Wydarzenie
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
