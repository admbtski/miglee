'use client';

import { useState, useEffect } from 'react';
import {
  useIntentMembersQuery,
  useIntentMemberStatsQuery,
  useApproveMembershipMutation,
  useRejectMembershipMutation,
} from '@/lib/api/intent-members';
import {
  useAdminUpdateMemberRoleMutation,
  useAdminKickMemberMutation,
  useAdminBanMemberMutation,
  useAdminUnbanMemberMutation,
} from '@/lib/api/admin-intent-members';
import {
  IntentMemberStatus,
  IntentMemberRole,
} from '@/lib/api/__generated__/react-query-update';
import {
  UserCheck,
  UserX,
  Clock,
  MoreVertical,
  CheckCircle,
  XCircle,
  Trash2,
  Ban,
  RotateCcw,
  Shield,
  User,
  Crown,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { buildAvatarUrl } from '@/lib/media/url';
import { Avatar } from '@/components/ui/avatar';
import { NoticeModal } from '@/components/feedback/notice-modal';

type MembersTabProps = {
  intentId: string;
  onRefresh?: () => void;
};

export function MembersTab({ intentId, onRefresh }: MembersTabProps) {
  const [statusFilter, setStatusFilter] = useState<
    IntentMemberStatus | undefined
  >();
  const [roleFilter, setRoleFilter] = useState<IntentMemberRole | undefined>();

  // Modals
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [kickModalOpen, setKickModalOpen] = useState(false);
  const [banModalOpen, setBanModalOpen] = useState(false);
  const [unbanModalOpen, setUnbanModalOpen] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<{
    userId: string;
    userName: string;
    currentRole?: IntentMemberRole;
  } | null>(null);
  const [newRole, setNewRole] = useState<IntentMemberRole>(
    IntentMemberRole.Participant
  );
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Queries
  const { data: statsData } = useIntentMemberStatsQuery({ intentId });
  const {
    data: membersData,
    isLoading,
    refetch,
  } = useIntentMembersQuery({
    intentId,
    status: statusFilter,
    role: roleFilter,
    limit: 100,
  });

  // Mutations
  const approveMutation = useApproveMembershipMutation();
  const rejectMutation = useRejectMembershipMutation();
  const kickMutation = useAdminKickMemberMutation();
  const banMutation = useAdminBanMemberMutation();
  const unbanMutation = useAdminUnbanMemberMutation();
  const updateRoleMutation = useAdminUpdateMemberRoleMutation();

  const stats = statsData?.intentMemberStats;
  const members = membersData?.intentMembers ?? [];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdownId) {
        const target = event.target as HTMLElement;
        if (!target.closest('.dropdown-container')) {
          setOpenDropdownId(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdownId]);

  const handleApprove = async () => {
    if (!selectedMember) return;
    try {
      await approveMutation.mutateAsync({
        input: {
          intentId,
          userId: selectedMember.userId,
        },
      });
      setApproveModalOpen(false);
      setSelectedMember(null);
      refetch();
      onRefresh?.();
    } catch (error) {
      console.error('Failed to approve member:', error);
    }
  };

  const handleReject = async () => {
    if (!selectedMember) return;
    try {
      await rejectMutation.mutateAsync({
        input: {
          intentId,
          userId: selectedMember.userId,
        },
      });
      setRejectModalOpen(false);
      setSelectedMember(null);
      refetch();
      onRefresh?.();
    } catch (error) {
      console.error('Failed to reject member:', error);
    }
  };

  const handleKick = async () => {
    if (!selectedMember) return;
    try {
      await kickMutation.mutateAsync({
        input: {
          intentId,
          userId: selectedMember.userId,
        },
      });
      setKickModalOpen(false);
      setSelectedMember(null);
      refetch();
      onRefresh?.();
    } catch (error) {
      console.error('Failed to kick member:', error);
    }
  };

  const handleBan = async () => {
    if (!selectedMember) return;
    try {
      await banMutation.mutateAsync({
        input: {
          intentId,
          userId: selectedMember.userId,
        },
      });
      setBanModalOpen(false);
      setSelectedMember(null);
      refetch();
      onRefresh?.();
    } catch (error) {
      console.error('Failed to ban member:', error);
    }
  };

  const handleUnban = async () => {
    if (!selectedMember) return;
    try {
      await unbanMutation.mutateAsync({
        input: {
          intentId,
          userId: selectedMember.userId,
        },
      });
      setUnbanModalOpen(false);
      setSelectedMember(null);
      refetch();
      onRefresh?.();
    } catch (error) {
      console.error('Failed to unban member:', error);
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedMember) return;
    try {
      await updateRoleMutation.mutateAsync({
        input: {
          intentId,
          userId: selectedMember.userId,
          role: newRole,
        },
      });
      setRoleModalOpen(false);
      setSelectedMember(null);
      refetch();
      onRefresh?.();
    } catch (error) {
      console.error('Failed to update role:', error);
    }
  };

  const openApproveModal = (userId: string, userName: string) => {
    setSelectedMember({ userId, userName });
    setApproveModalOpen(true);
    setOpenDropdownId(null);
  };

  const openRejectModal = (userId: string, userName: string) => {
    setSelectedMember({ userId, userName });
    setRejectModalOpen(true);
    setOpenDropdownId(null);
  };

  const openKickModal = (userId: string, userName: string) => {
    setSelectedMember({ userId, userName });
    setKickModalOpen(true);
    setOpenDropdownId(null);
  };

  const openBanModal = (userId: string, userName: string) => {
    setSelectedMember({ userId, userName });
    setBanModalOpen(true);
    setOpenDropdownId(null);
  };

  const openUnbanModal = (userId: string, userName: string) => {
    setSelectedMember({ userId, userName });
    setUnbanModalOpen(true);
    setOpenDropdownId(null);
  };

  const openRoleModal = (
    userId: string,
    userName: string,
    currentRole: IntentMemberRole
  ) => {
    setSelectedMember({ userId, userName, currentRole });
    setNewRole(currentRole);
    setRoleModalOpen(true);
    setOpenDropdownId(null);
  };

  const getRoleIcon = (role: IntentMemberRole) => {
    switch (role) {
      case IntentMemberRole.Owner:
        return (
          <Crown className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
        );
      case IntentMemberRole.Moderator:
        return <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
      default:
        return <User className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />;
    }
  };

  const getStatusBadge = (status: IntentMemberStatus) => {
    switch (status) {
      case IntentMemberStatus.Joined:
        return (
          <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800 dark:bg-green-900/30 dark:text-green-300">
            Zaakceptowany
          </span>
        );
      case IntentMemberStatus.Pending:
        return (
          <span className="inline-flex rounded-full bg-orange-100 px-2 py-1 text-xs font-semibold text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
            Oczekujący
          </span>
        );
      case IntentMemberStatus.Invited:
        return (
          <span className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
            Zaproszony
          </span>
        );
      case IntentMemberStatus.Banned:
        return (
          <span className="inline-flex rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-800 dark:bg-red-900/30 dark:text-red-300">
            Zbanowany
          </span>
        );
      default:
        return (
          <span className="inline-flex rounded-full bg-zinc-100 px-2 py-1 text-xs font-semibold text-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              Zaakceptowani
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {stats?.joined ?? 0}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              Oczekujący
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {stats?.pending ?? 0}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-2">
            <UserX className="h-5 w-5 text-red-600 dark:text-red-400" />
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              Zablokowani
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {stats?.banned ?? 0}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Status
          </label>
          <select
            value={statusFilter || ''}
            onChange={(e) =>
              setStatusFilter(
                (e.target.value as IntentMemberStatus) || undefined
              )
            }
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          >
            <option value="">Wszystkie</option>
            <option value={IntentMemberStatus.Joined}>Zaakceptowani</option>
            <option value={IntentMemberStatus.Pending}>Oczekujący</option>
            <option value={IntentMemberStatus.Invited}>Zaproszeni</option>
            <option value={IntentMemberStatus.Banned}>Zablokowani</option>
          </select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Rola
          </label>
          <select
            value={roleFilter || ''}
            onChange={(e) =>
              setRoleFilter((e.target.value as IntentMemberRole) || undefined)
            }
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          >
            <option value="">Wszystkie</option>
            <option value={IntentMemberRole.Owner}>Właściciel</option>
            <option value={IntentMemberRole.Moderator}>Moderator</option>
            <option value={IntentMemberRole.Participant}>Uczestnik</option>
          </select>
        </div>
      </div>

      {/* Members Table */}
      <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
          </div>
        )}

        {!isLoading && members.length === 0 && (
          <div className="p-6 text-center">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Brak członków spełniających kryteria
            </p>
          </div>
        )}

        {!isLoading && members.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                    Użytkownik
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                    Rola
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                    Data dołączenia
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                    Akcje
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-950">
                {members.map((member) => (
                  <tr
                    key={member.id}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-900"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {member.user.avatarKey && (
                          <Avatar
                            url={buildAvatarUrl(member.user.avatarKey, 'xs')}
                            blurhash={member.user.avatarBlurhash}
                            alt={member.user.name}
                            size={32}
                          />
                        )}
                        <div>
                          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                            {member.user.name}
                          </p>
                          <p className="text-xs text-zinc-600 dark:text-zinc-400">
                            {member.user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getRoleIcon(member.role)}
                        <span className="text-sm text-zinc-700 dark:text-zinc-300">
                          {member.role === IntentMemberRole.Owner
                            ? 'Właściciel'
                            : member.role === IntentMemberRole.Moderator
                              ? 'Moderator'
                              : 'Uczestnik'}
                        </span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {getStatusBadge(member.status)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-700 dark:text-zinc-300">
                      {member.joinedAt
                        ? format(new Date(member.joinedAt), 'dd MMM yyyy', {
                            locale: pl,
                          })
                        : '-'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                      <div className="dropdown-container relative inline-block text-left">
                        <button
                          onClick={() =>
                            setOpenDropdownId(
                              openDropdownId === member.id ? null : member.id
                            )
                          }
                          className="inline-flex items-center gap-1 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-300"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        {openDropdownId === member.id && (
                          <div className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-zinc-800">
                            {member.status === IntentMemberStatus.Pending && (
                              <>
                                <button
                                  onClick={() =>
                                    openApproveModal(
                                      member.userId,
                                      member.user.name
                                    )
                                  }
                                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-green-600 hover:bg-zinc-100 dark:text-green-400 dark:hover:bg-zinc-700"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                  Zaakceptuj
                                </button>
                                <button
                                  onClick={() =>
                                    openRejectModal(
                                      member.userId,
                                      member.user.name
                                    )
                                  }
                                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-zinc-100 dark:text-red-400 dark:hover:bg-zinc-700"
                                >
                                  <XCircle className="h-4 w-4" />
                                  Odrzuć
                                </button>
                              </>
                            )}
                            {member.status === IntentMemberStatus.Joined &&
                              member.role !== IntentMemberRole.Owner && (
                                <>
                                  <button
                                    onClick={() =>
                                      openRoleModal(
                                        member.userId,
                                        member.user.name,
                                        member.role
                                      )
                                    }
                                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700"
                                  >
                                    <Shield className="h-4 w-4" />
                                    Zmień rolę
                                  </button>
                                  <button
                                    onClick={() =>
                                      openKickModal(
                                        member.userId,
                                        member.user.name
                                      )
                                    }
                                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-orange-600 hover:bg-zinc-100 dark:text-orange-400 dark:hover:bg-zinc-700"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    Wyrzuć
                                  </button>
                                  <button
                                    onClick={() =>
                                      openBanModal(
                                        member.userId,
                                        member.user.name
                                      )
                                    }
                                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-zinc-100 dark:text-red-400 dark:hover:bg-zinc-700"
                                  >
                                    <Ban className="h-4 w-4" />
                                    Zbanuj
                                  </button>
                                </>
                              )}
                            {member.status === IntentMemberStatus.Banned && (
                              <button
                                onClick={() =>
                                  openUnbanModal(
                                    member.userId,
                                    member.user.name
                                  )
                                }
                                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-green-600 hover:bg-zinc-100 dark:text-green-400 dark:hover:bg-zinc-700"
                              >
                                <RotateCcw className="h-4 w-4" />
                                Odbanuj
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <NoticeModal
        open={approveModalOpen}
        onClose={() => setApproveModalOpen(false)}
        variant="success"
        size="sm"
        title="Zaakceptuj członka"
        subtitle={`Czy na pewno chcesz zaakceptować użytkownika ${selectedMember?.userName}?`}
        primaryLabel={
          approveMutation.isPending ? 'Akceptowanie...' : 'Zaakceptuj'
        }
        secondaryLabel="Anuluj"
        onPrimary={handleApprove}
        onSecondary={() => setApproveModalOpen(false)}
      >
        <></>
      </NoticeModal>

      <NoticeModal
        open={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        variant="error"
        size="sm"
        title="Odrzuć członka"
        subtitle={`Czy na pewno chcesz odrzucić użytkownika ${selectedMember?.userName}?`}
        primaryLabel={rejectMutation.isPending ? 'Odrzucanie...' : 'Odrzuć'}
        secondaryLabel="Anuluj"
        onPrimary={handleReject}
        onSecondary={() => setRejectModalOpen(false)}
      >
        <></>
      </NoticeModal>

      <NoticeModal
        open={kickModalOpen}
        onClose={() => setKickModalOpen(false)}
        variant="warning"
        size="sm"
        title="Wyrzuć członka"
        subtitle={`Czy na pewno chcesz wyrzucić użytkownika ${selectedMember?.userName}?`}
        primaryLabel={kickMutation.isPending ? 'Wyrzucanie...' : 'Wyrzuć'}
        secondaryLabel="Anuluj"
        onPrimary={handleKick}
        onSecondary={() => setKickModalOpen(false)}
      >
        <></>
      </NoticeModal>

      <NoticeModal
        open={banModalOpen}
        onClose={() => setBanModalOpen(false)}
        variant="error"
        size="sm"
        title="Zbanuj członka"
        subtitle={`Czy na pewno chcesz zbanować użytkownika ${selectedMember?.userName}? Nie będzie mógł ponownie dołączyć.`}
        primaryLabel={banMutation.isPending ? 'Banowanie...' : 'Zbanuj'}
        secondaryLabel="Anuluj"
        onPrimary={handleBan}
        onSecondary={() => setBanModalOpen(false)}
      >
        <></>
      </NoticeModal>

      <NoticeModal
        open={unbanModalOpen}
        onClose={() => setUnbanModalOpen(false)}
        variant="success"
        size="sm"
        title="Odbanuj członka"
        subtitle={`Czy na pewno chcesz odbanować użytkownika ${selectedMember?.userName}?`}
        primaryLabel={unbanMutation.isPending ? 'Odbanowywanie...' : 'Odbanuj'}
        secondaryLabel="Anuluj"
        onPrimary={handleUnban}
        onSecondary={() => setUnbanModalOpen(false)}
      >
        <></>
      </NoticeModal>

      {/* Role Change Modal */}
      {roleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-zinc-900">
            <h4 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Zmień rolę użytkownika
            </h4>
            <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
              Użytkownik: <strong>{selectedMember?.userName}</strong>
            </p>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Nowa rola
                </label>
                <select
                  value={newRole}
                  onChange={(e) =>
                    setNewRole(e.target.value as IntentMemberRole)
                  }
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                >
                  <option value={IntentMemberRole.Participant}>
                    Uczestnik
                  </option>
                  <option value={IntentMemberRole.Moderator}>Moderator</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setRoleModalOpen(false)}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Anuluj
              </button>
              <button
                onClick={handleUpdateRole}
                disabled={updateRoleMutation.isPending}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {updateRoleMutation.isPending ? 'Zapisywanie...' : 'Zapisz'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
