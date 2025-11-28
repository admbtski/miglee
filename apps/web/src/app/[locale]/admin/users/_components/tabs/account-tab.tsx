'use client';

import { useState } from 'react';
import {
  useUserQuery,
  useAdminUpdateUserMutation,
  useAdminDeleteUserMutation,
} from '@/lib/api/users';
import { Role } from '@/lib/api/__generated__/react-query-update';
import {
  Shield,
  CheckCircle,
  XCircle,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { buildAvatarUrl } from '@/lib/media/url';
import { Avatar } from '@/components/ui/avatar';
import { NoticeModal } from '@/components/feedback/notice-modal';
import { useMeQuery } from '@/lib/api/auth';
import { useRouter } from 'next/navigation';
import { useLocalePath } from '@/hooks/use-locale-path';

type AccountTabProps = {
  userId: string;
  onRefresh?: () => void;
};

export function AccountTab({ userId, onRefresh }: AccountTabProps) {
  const router = useRouter();
  const { localePath } = useLocalePath();
  const { data: userData, isLoading } = useUserQuery({ id: userId });
  const { data: meData } = useMeQuery();

  const [changeRoleOpen, setChangeRoleOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [toggleVerifyOpen, setToggleVerifyOpen] = useState(false);
  const [deleteUserOpen, setDeleteUserOpen] = useState(false);

  const updateUserMutation = useAdminUpdateUserMutation();
  const deleteUserMutation = useAdminDeleteUserMutation();

  const user = userData?.user;
  const me = meData?.me;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-blue-600 dark:border-zinc-700 dark:border-t-blue-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="py-12 text-center text-sm text-zinc-600 dark:text-zinc-400">
        Nie znaleziono użytkownika
      </div>
    );
  }

  const isSelf = me?.id === user.id;
  const canChangeRole = me?.role === Role.Admin && !isSelf;
  const canDelete = me?.role === Role.Admin && !isSelf;

  const handleRoleChange = (newRole: Role) => {
    setSelectedRole(newRole);
    setChangeRoleOpen(true);
  };

  const confirmRoleChange = async () => {
    if (!selectedRole) return;

    try {
      await updateUserMutation.mutateAsync({
        id: userId,
        input: {
          role: selectedRole,
        },
      });
      setChangeRoleOpen(false);
      onRefresh?.();
    } catch (error) {
      console.error('Failed to update user role:', error);
    }
  };

  const handleToggleVerify = async () => {
    if (!user) return;

    try {
      await updateUserMutation.mutateAsync({
        id: userId,
        input: {
          verifiedAt: user.verifiedAt ? null : new Date().toISOString(),
        },
      });
      setToggleVerifyOpen(false);
      onRefresh?.();
    } catch (error) {
      console.error('Failed to toggle verification:', error);
    }
  };

  const handleDeleteUser = async () => {
    try {
      await deleteUserMutation.mutateAsync({
        id: userId,
        anonymize: true,
      });
      setDeleteUserOpen(false);
      // Navigate back to users list after successful deletion
      router.push(localePath('/admin/users'));
    } catch (error) {
      console.error('Failed to delete user:', error);
      setDeleteUserOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* User Info Card */}
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900">
        <div className="flex items-start gap-4">
          <Avatar
            url={buildAvatarUrl(user.avatarKey, 'lg')}
            blurhash={user.avatarBlurhash}
            alt={user.name}
            size={64}
          />
          <div className="flex-1">
            <h4 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {user.name}
            </h4>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {user.email}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
                  user.role === Role.Admin
                    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                    : user.role === Role.Moderator
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                      : 'bg-zinc-100 text-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-300'
                }`}
              >
                {user.role === Role.Admin && <Shield className="h-3 w-3" />}
                {user.role}
              </span>
              {user.verifiedAt ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800 dark:bg-green-900/30 dark:text-green-300">
                  <CheckCircle className="h-3 w-3" />
                  Zweryfikowany
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                  <XCircle className="h-3 w-3" />
                  Niezweryfikowany
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Role Management */}
      <div className="space-y-3">
        <h5 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Zarządzanie rolą
        </h5>
        {isSelf && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
            <div className="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-300">
              <AlertTriangle className="h-4 w-4" />
              <span>Nie możesz zmienić swojej własnej roli</span>
            </div>
          </div>
        )}
        {canChangeRole && (
          <div className="grid gap-2 sm:grid-cols-3">
            <button
              onClick={() => handleRoleChange(Role.User)}
              disabled={user.role === Role.User}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Ustaw jako User
            </button>
            <button
              onClick={() => handleRoleChange(Role.Moderator)}
              disabled={user.role === Role.Moderator}
              className="rounded-lg border border-purple-300 px-4 py-2 text-sm font-medium text-purple-700 hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-purple-700 dark:text-purple-300 dark:hover:bg-purple-950/30"
            >
              Ustaw jako Moderator
            </button>
            <button
              onClick={() => handleRoleChange(Role.Admin)}
              disabled={user.role === Role.Admin}
              className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-950/30"
            >
              Ustaw jako Admin
            </button>
          </div>
        )}
      </div>

      {/* Verification */}
      <div className="space-y-3">
        <h5 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Weryfikacja konta
        </h5>
        <button
          onClick={() => setToggleVerifyOpen(true)}
          className={`rounded-lg border px-4 py-2 text-sm font-medium ${
            user.verifiedAt
              ? 'border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-950/30'
              : 'border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-950/30'
          }`}
        >
          {user.verifiedAt ? 'Cofnij weryfikację' : 'Zweryfikuj konto'}
        </button>
        {user.verifiedAt && (
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            Zweryfikowano:{' '}
            {format(new Date(user.verifiedAt), 'dd MMMM yyyy, HH:mm', {
              locale: pl,
            })}
          </p>
        )}
      </div>

      {/* Account Details */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h5 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Dane konta
          </h5>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-zinc-600 dark:text-zinc-400">ID:</span>
            <span className="font-mono text-zinc-900 dark:text-zinc-100">
              {user.id}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-600 dark:text-zinc-400">
              Data rejestracji:
            </span>
            <span className="text-zinc-900 dark:text-zinc-100">
              {format(new Date(user.createdAt), 'dd MMMM yyyy, HH:mm', {
                locale: pl,
              })}
            </span>
          </div>
          {user.lastSeenAt && (
            <div className="flex justify-between">
              <span className="text-zinc-600 dark:text-zinc-400">
                Ostatnia aktywność:
              </span>
              <span className="text-zinc-900 dark:text-zinc-100">
                {format(new Date(user.lastSeenAt), 'dd MMMM yyyy, HH:mm', {
                  locale: pl,
                })}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Danger Zone */}
      {canDelete && (
        <div className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/30">
          <h5 className="text-sm font-semibold text-red-900 dark:text-red-100">
            Strefa niebezpieczna
          </h5>
          <p className="text-xs text-red-700 dark:text-red-300">
            Usunięcie użytkownika jest nieodwracalne. Wszystkie dane zostaną
            zanonimizowane.
          </p>
          <button
            onClick={() => setDeleteUserOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/50"
          >
            <Trash2 className="h-4 w-4" />
            Usuń użytkownika
          </button>
        </div>
      )}

      {/* Modals */}
      <NoticeModal
        open={changeRoleOpen}
        onClose={() => setChangeRoleOpen(false)}
        variant="warning"
        size="sm"
        title="Zmienić rolę użytkownika?"
        subtitle={`Czy na pewno chcesz zmienić rolę na ${selectedRole}?`}
        primaryLabel={updateUserMutation.isPending ? 'Zapisywanie...' : 'Zmień'}
        secondaryLabel="Anuluj"
        onPrimary={confirmRoleChange}
        onSecondary={() => setChangeRoleOpen(false)}
      >
        <></>
      </NoticeModal>

      <NoticeModal
        open={toggleVerifyOpen}
        onClose={() => setToggleVerifyOpen(false)}
        variant={user?.verifiedAt ? 'warning' : 'success'}
        size="sm"
        title={
          user?.verifiedAt ? 'Cofnąć weryfikację?' : 'Zweryfikować użytkownika?'
        }
        subtitle={
          user?.verifiedAt
            ? 'Użytkownik będzie musiał ponownie zweryfikować konto.'
            : 'Użytkownik otrzyma pełny dostęp do platformy.'
        }
        primaryLabel={
          updateUserMutation.isPending ? 'Zapisywanie...' : 'Potwierdź'
        }
        secondaryLabel="Anuluj"
        onPrimary={handleToggleVerify}
        onSecondary={() => setToggleVerifyOpen(false)}
      >
        <></>
      </NoticeModal>

      <NoticeModal
        open={deleteUserOpen}
        onClose={() => setDeleteUserOpen(false)}
        variant="error"
        size="sm"
        title="Usunąć użytkownika?"
        subtitle="Ta akcja jest nieodwracalna. Wszystkie dane zostaną zanonimizowane."
        primaryLabel={deleteUserMutation.isPending ? 'Usuwanie...' : 'Usuń'}
        secondaryLabel="Anuluj"
        onPrimary={handleDeleteUser}
        onSecondary={() => setDeleteUserOpen(false)}
      >
        <></>
      </NoticeModal>
    </div>
  );
}
