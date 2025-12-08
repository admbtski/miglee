'use client';

import { useState } from 'react';
import {
  Calendar,
  Users,
  UserMinus,
  Ban,
  CheckCircle,
  XCircle,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import {
  useAdminUserMembershipsQuery,
  useAdminUserIntentsQuery,
} from '@/features/admin/api/admin-users';
import {
  useAdminKickMemberMutation,
  useAdminBanMemberMutation,
  useAdminUnbanMemberMutation,
} from '@/features/admin/api/admin-intent-members';
import {
  useApproveMembershipMutation,
  useRejectMembershipMutation,
} from '@/features/intents/api/intent-members';
import Link from 'next/link';

type IntentsTabProps = {
  userId: string;
};

export function IntentsTab({ userId }: IntentsTabProps) {
  const [membershipsOpen, setMembershipsOpen] = useState(false);
  const [intentsOpen, setIntentsOpen] = useState(false);

  const { data: membershipsData, isLoading: membershipsLoading } =
    useAdminUserMembershipsQuery({
      userId,
      limit: 50,
      offset: 0,
    });

  const { data: intentsData, isLoading: intentsLoading } =
    useAdminUserIntentsQuery({
      userId,
      limit: 50,
      offset: 0,
    });

  const kickMemberMutation = useAdminKickMemberMutation();
  const banMemberMutation = useAdminBanMemberMutation();
  const unbanMemberMutation = useAdminUnbanMemberMutation();
  const approveMembershipMutation = useApproveMembershipMutation();
  const rejectMembershipMutation = useRejectMembershipMutation();

  const memberships = membershipsData?.adminUserMemberships?.items ?? [];
  const intents = intentsData?.adminUserIntents?.items ?? [];

  const handleKickMember = async (intentId: string) => {
    if (
      !confirm('Czy na pewno chcesz wyrzucić tego użytkownika z wydarzenia?')
    ) {
      return;
    }

    try {
      await kickMemberMutation.mutateAsync({
        input: {
          intentId,
          userId,
          note: 'Wyrzucony przez administratora',
        },
      });
    } catch (error) {
      console.error('Failed to kick member:', error);
      alert('Nie udało się wyrzucić użytkownika');
    }
  };

  const handleBanMember = async (intentId: string) => {
    if (
      !confirm(
        'Czy na pewno chcesz zbanować tego użytkownika na tym wydarzeniu?'
      )
    ) {
      return;
    }

    try {
      await banMemberMutation.mutateAsync({
        input: {
          intentId,
          userId,
          note: 'Zbanowany przez administratora',
        },
      });
    } catch (error) {
      console.error('Failed to ban member:', error);
      alert('Nie udało się zbanować użytkownika');
    }
  };

  const handleUnbanMember = async (intentId: string) => {
    if (!confirm('Czy na pewno chcesz odbanować tego użytkownika?')) {
      return;
    }

    try {
      await unbanMemberMutation.mutateAsync({
        input: {
          intentId,
          userId,
        },
      });
    } catch (error) {
      console.error('Failed to unban member:', error);
      alert('Nie udało się odbanować użytkownika');
    }
  };

  const handleApproveMembership = async (intentId: string) => {
    if (!confirm('Czy na pewno chcesz zatwierdzić to członkostwo?')) {
      return;
    }

    try {
      await approveMembershipMutation.mutateAsync({
        input: {
          intentId,
          userId,
        },
      });
    } catch (error) {
      console.error('Failed to approve membership:', error);
      alert('Nie udało się zatwierdzić członkostwa');
    }
  };

  const handleRejectMembership = async (intentId: string) => {
    if (!confirm('Czy na pewno chcesz odrzucić to członkostwo?')) {
      return;
    }

    try {
      await rejectMembershipMutation.mutateAsync({
        input: {
          intentId,
          userId,
          note: 'Odrzucone przez administratora',
        },
      });
    } catch (error) {
      console.error('Failed to reject membership:', error);
      alert('Nie udało się odrzucić członkostwa');
    }
  };

  return (
    <div className="space-y-6">
      {/* Memberships */}
      <div className="space-y-3">
        <h5 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Członkostwa w wydarzeniach
        </h5>
        <button
          onClick={() => setMembershipsOpen(true)}
          disabled={membershipsLoading}
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          {membershipsLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Users className="h-4 w-4" />
          )}
          Pokaż członkostwa ({memberships.length})
        </button>
      </div>

      {/* Created Intents */}
      <div className="space-y-3">
        <h5 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Utworzone wydarzenia
        </h5>
        <button
          onClick={() => setIntentsOpen(true)}
          disabled={intentsLoading}
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          {intentsLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Calendar className="h-4 w-4" />
          )}
          Pokaż wydarzenia ({intents.length})
        </button>
      </div>

      {/* Memberships Modal */}
      {membershipsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-4xl rounded-lg bg-white p-6 dark:bg-zinc-900">
            <h4 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Członkostwa w wydarzeniach
            </h4>

            {memberships.length === 0 ? (
              <div className="py-12 text-center text-sm text-zinc-600 dark:text-zinc-400">
                Użytkownik nie jest członkiem żadnego wydarzenia
              </div>
            ) : (
              <div className="space-y-3">
                {memberships.map((membership: any) => (
                  <div
                    key={membership.id}
                    className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/intent/${membership.intent.id}`}
                            className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400"
                          >
                            {membership.intent.title}
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        </div>
                        <div className="mt-2 flex items-center gap-3 text-xs text-zinc-600 dark:text-zinc-400">
                          <span>
                            {format(
                              new Date(membership.intent.startAt),
                              'dd MMM yyyy, HH:mm',
                              {
                                locale: pl,
                              }
                            )}
                          </span>
                          <span>•</span>
                          <span className="capitalize">
                            {membership.status}
                          </span>
                          <span>•</span>
                          <span className="capitalize">{membership.role}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {membership.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() =>
                                handleApproveMembership(membership.intent.id)
                              }
                              disabled={approveMembershipMutation.isPending}
                              className="inline-flex items-center gap-1 text-sm text-green-600 hover:text-green-800 disabled:opacity-50 dark:text-green-400"
                            >
                              {approveMembershipMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle className="h-4 w-4" />
                              )}
                              Zatwierdź
                            </button>
                            <button
                              onClick={() =>
                                handleRejectMembership(membership.intent.id)
                              }
                              disabled={rejectMembershipMutation.isPending}
                              className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-800 disabled:opacity-50 dark:text-red-400"
                            >
                              {rejectMembershipMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <XCircle className="h-4 w-4" />
                              )}
                              Odrzuć
                            </button>
                          </>
                        )}
                        {membership.status === 'JOINED' && (
                          <>
                            <button
                              onClick={() =>
                                handleKickMember(membership.intent.id)
                              }
                              disabled={kickMemberMutation.isPending}
                              className="inline-flex items-center gap-1 text-sm text-orange-600 hover:text-orange-800 disabled:opacity-50 dark:text-orange-400"
                            >
                              {kickMemberMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <UserMinus className="h-4 w-4" />
                              )}
                              Wyrzuć
                            </button>
                            <button
                              onClick={() =>
                                handleBanMember(membership.intent.id)
                              }
                              disabled={banMemberMutation.isPending}
                              className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-800 disabled:opacity-50 dark:text-red-400"
                            >
                              {banMemberMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Ban className="h-4 w-4" />
                              )}
                              Zbanuj
                            </button>
                          </>
                        )}
                        {membership.status === 'BANNED' && (
                          <button
                            onClick={() =>
                              handleUnbanMember(membership.intent.id)
                            }
                            disabled={unbanMemberMutation.isPending}
                            className="inline-flex items-center gap-1 text-sm text-green-600 hover:text-green-800 disabled:opacity-50 dark:text-green-400"
                          >
                            {unbanMemberMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                            Odbanuj
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setMembershipsOpen(false)}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Zamknij
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Intents Modal */}
      {intentsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-4xl rounded-lg bg-white p-6 dark:bg-zinc-900">
            <h4 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Utworzone wydarzenia
            </h4>

            {intents.length === 0 ? (
              <div className="py-12 text-center text-sm text-zinc-600 dark:text-zinc-400">
                Użytkownik nie utworzył jeszcze żadnych wydarzeń
              </div>
            ) : (
              <div className="space-y-3">
                {intents.map((intent: any) => (
                  <div
                    key={intent.id}
                    className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <Link
                          href={`/intent/${intent.id}`}
                          className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400"
                        >
                          {intent.title}
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                        <div className="mt-2 flex items-center gap-3 text-xs text-zinc-600 dark:text-zinc-400">
                          <span>
                            {format(
                              new Date(intent.startAt),
                              'dd MMM yyyy, HH:mm',
                              {
                                locale: pl,
                              }
                            )}
                          </span>
                          <span>•</span>
                          <span className="capitalize">{intent.status}</span>
                          <span>•</span>
                          <span>{intent.joinedCount} uczestników</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setIntentsOpen(false)}
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
