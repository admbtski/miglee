'use client';

import { Avatar } from '@/components/ui/avatar';
import { useAdminUserDmThreadsQuery } from '@/features/admin';
import {
  useAdminSuspendUserMutation,
  useAdminUnsuspendUserMutation,
  useUserQuery,
} from '@/features/users';
import { format, pl } from '@/lib/date';
import { buildAvatarUrl } from '@/lib/media/url';
import {
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Loader2,
  MessageSquare,
  Shield,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

type SecurityTabProps = {
  userId: string;
  onRefresh?: () => void;
};

export function SecurityTab({ userId, onRefresh }: SecurityTabProps) {
  const { data: userData } = useUserQuery({ id: userId });
  const user = userData?.user;

  const { data: dmThreadsData, isLoading: dmThreadsLoading } =
    useAdminUserDmThreadsQuery({
      userId,
      limit: 50,
      offset: 0,
    });

  const dmThreads = dmThreadsData?.adminUserDmThreads?.items ?? [];

  const [suspendOpen, setSuspendOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [dmThreadsOpen, setDmThreadsOpen] = useState(false);

  const suspendMutation = useAdminSuspendUserMutation();
  const unsuspendMutation = useAdminUnsuspendUserMutation();

  const isSuspended = !!user?.suspendedAt;

  const handleSuspend = async () => {
    try {
      await suspendMutation.mutateAsync({
        id: userId,
        reason: suspendReason || undefined,
      });
      setSuspendOpen(false);
      setSuspendReason('');
      onRefresh?.();
    } catch (error) {
      console.error('Failed to suspend user:', error);
    }
  };

  const handleUnsuspend = async () => {
    try {
      await unsuspendMutation.mutateAsync({
        id: userId,
      });
      onRefresh?.();
    } catch (error) {
      console.error('Failed to unsuspend user:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Account Suspension */}
      <div className="space-y-3">
        <h5 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Zawieszenie konta (Global Ban)
        </h5>
        <p className="text-xs text-zinc-600 dark:text-zinc-400">
          Zawieszenie konta uniemożliwia użytkownikowi jakiekolwiek działania na
          platformie
        </p>
        {isSuspended ? (
          <div className="space-y-2">
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/30">
              <div className="flex items-center gap-2 text-sm text-red-800 dark:text-red-300">
                <AlertTriangle className="h-4 w-4" />
                <div>
                  <p className="font-medium">Konto zawieszone</p>
                  {user?.suspensionReason && (
                    <p className="mt-1 text-xs">
                      Powód: {user.suspensionReason}
                    </p>
                  )}
                  {user?.suspendedAt && (
                    <p className="mt-1 text-xs">
                      Data:{' '}
                      {format(
                        new Date(user.suspendedAt),
                        'dd MMM yyyy, HH:mm',
                        { locale: pl }
                      )}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={handleUnsuspend}
              disabled={unsuspendMutation.isPending}
              className="inline-flex items-center gap-2 rounded-lg border border-green-300 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-950/30"
            >
              {unsuspendMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              {unsuspendMutation.isPending
                ? 'Przywracanie...'
                : 'Cofnij zawieszenie'}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setSuspendOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-950/30"
          >
            <Shield className="h-4 w-4" />
            Zawieś konto
          </button>
        )}
      </div>

      {/* DM Threads */}
      <div className="space-y-3">
        <h5 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Wątki wiadomości prywatnych
        </h5>
        <button
          onClick={() => setDmThreadsOpen(true)}
          disabled={dmThreadsLoading}
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          {dmThreadsLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MessageSquare className="h-4 w-4" />
          )}
          Przeglądaj wątki DM ({dmThreads.length})
        </button>
      </div>

      {/* Info Notice */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/30">
        <p className="text-xs text-blue-800 dark:text-blue-300">
          <strong>Informacja:</strong> Funkcje blokowania i zawieszania
          użytkowników będą dostępne w przyszłych wersjach. Obecnie można
          zarządzać użytkownikami poprzez zmianę roli i weryfikację konta w
          zakładce "Konto".
        </p>
      </div>

      {/* Suspend Modal */}
      {suspendOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-zinc-900">
            <h4 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Zawieś konto użytkownika
            </h4>
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
              <p className="text-xs text-amber-800 dark:text-amber-300">
                <strong>Uwaga:</strong> Zawieszenie konta uniemożliwi
                użytkownikowi jakiekolwiek działania na platformie.
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Powód zawieszenia (opcjonalnie)
                </label>
                <textarea
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  placeholder="Wpisz powód zawieszenia..."
                  rows={3}
                  className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setSuspendOpen(false)}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Anuluj
              </button>
              <button
                onClick={handleSuspend}
                disabled={suspendMutation.isPending}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {suspendMutation.isPending ? 'Zawieszanie...' : 'Zawieś konto'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DM Threads Modal */}
      {dmThreadsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-4xl rounded-lg bg-white p-6 dark:bg-zinc-900">
            <h4 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Wątki wiadomości prywatnych ({dmThreads.length})
            </h4>
            <div className="max-h-[60vh] space-y-3 overflow-y-auto">
              {dmThreads.length === 0 ? (
                <div className="py-12 text-center text-sm text-zinc-600 dark:text-zinc-400">
                  Użytkownik nie ma żadnych wątków DM
                </div>
              ) : (
                dmThreads.map((thread: any) => (
                  <div
                    key={thread.id}
                    className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {thread.otherUser.avatarKey && (
                          <Avatar
                            url={buildAvatarUrl(
                              thread.otherUser.avatarKey,
                              'md'
                            )}
                            blurhash={thread.otherUser.avatarBlurhash}
                            alt={thread.otherUser.name}
                            size={40}
                          />
                        )}
                        <div>
                          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                            {thread.otherUser.name}
                          </p>
                          <div className="mt-1 flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                            <span>{thread.messageCount} wiadomości</span>
                            {thread.lastMessageAt && (
                              <>
                                <span>•</span>
                                <span>
                                  Ostatnia:{' '}
                                  {format(
                                    new Date(thread.lastMessageAt),
                                    'dd MMM yyyy',
                                    { locale: pl }
                                  )}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <Link
                        href={`/account/messages/${thread.id}`}
                        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline dark:text-blue-400"
                      >
                        Otwórz
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setDmThreadsOpen(false)}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Zamknij
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
