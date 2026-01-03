'use client';

import { format, pl } from '@/lib/date';
import { useState } from 'react';
import Link from 'next/link';
import {
  useUserQuery,
  useAdminUpdateUserMutation,
  useAdminDeleteUserMutation,
  useAdminSuspendUserMutation,
  useAdminUnsuspendUserMutation,
} from '@/features/users';
import { Role } from '@/lib/api/__generated__/react-query-update';
import {
  Shield,
  CheckCircle,
  XCircle,
  Trash2,
  AlertTriangle,
  ShieldBan,
  Loader2,
  ExternalLink,
  Mail,
} from 'lucide-react';
import { buildAvatarUrl } from '@/lib/media/url';
import { Avatar } from '@/components/ui/avatar';
import { NoticeModal } from '@/components/ui/notice-modal';
import { useMeQuery } from '@/features/auth';
import { useLocalePath } from '@/hooks/use-locale-path';

type AccountTabProps = {
  userId: string;
  onRefresh?: () => void;
};

export function AccountTab({ userId, onRefresh }: AccountTabProps) {
  const { localePath } = useLocalePath();
  const { data: userData, isLoading } = useUserQuery({ id: userId });
  const { data: meData } = useMeQuery();

  const [changeRoleOpen, setChangeRoleOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [toggleVerifyOpen, setToggleVerifyOpen] = useState(false);
  const [deleteUserOpen, setDeleteUserOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [suspendedUntil, setSuspendedUntil] = useState<string>('');
  const [isPermanentSuspension, setIsPermanentSuspension] = useState(false);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const updateUserMutation = useAdminUpdateUserMutation();
  const deleteUserMutation = useAdminDeleteUserMutation();
  const suspendMutation = useAdminSuspendUserMutation();
  const unsuspendMutation = useAdminUnsuspendUserMutation();

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
  const isSuspended = !!user.suspendedAt;

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
    // ✅ Validate mandatory reason
    if (!deleteReason.trim()) {
      alert('Powód usunięcia jest wymagany.');
      return;
    }

    try {
      await deleteUserMutation.mutateAsync({
        id: userId,
        input: {
          deleteReason: deleteReason.trim(),
          anonymize: true, // Always anonymize for GDPR compliance
        },
      });
      setDeleteUserOpen(false);
      setDeleteReason('');
      onRefresh?.();
    } catch (error) {
      console.error('Failed to delete user:', error);
      setDeleteUserOpen(false);
    }
  };

  const handleSuspend = async () => {
    // ✅ Validate mandatory reason
    if (!suspendReason.trim()) {
      alert('Powód zawieszenia jest wymagany.');
      return;
    }

    // Validate suspendedUntil if not permanent
    if (!isPermanentSuspension && suspendedUntil) {
      const futureDate = new Date(suspendedUntil);
      const now = new Date();
      if (futureDate <= now) {
        alert('Data odwieszenia musi być w przyszłości.');
        return;
      }
    }

    try {
      await suspendMutation.mutateAsync({
        id: userId,
        input: {
          reason: suspendReason.trim(),
          suspendedUntil: isPermanentSuspension
            ? null
            : suspendedUntil
              ? new Date(suspendedUntil).toISOString()
              : null,
        },
      });
      setSuspendOpen(false);
      setSuspendReason('');
      setSuspendedUntil('');
      setIsPermanentSuspension(false);
      onRefresh?.();
    } catch (error) {
      console.error('Failed to suspend user:', error);
    }
  };

  const handleUnsuspend = async () => {
    const reason = prompt(
      'Powód odwieszenia (opcjonalnie):',
      'Odwieszenie przez administratora'
    );

    try {
      await unsuspendMutation.mutateAsync({
        id: userId,
        reason: reason || undefined,
      });
      onRefresh?.();
    } catch (error) {
      console.error('Failed to unsuspend user:', error);
    }
  };

  const handleSendPasswordReset = async () => {
    setResetPasswordLoading(true);
    // TODO: Implement adminSendPasswordReset mutation
    console.log('Send password reset:', userId);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setResetPasswordLoading(false);
    setResetPasswordOpen(false);
    setSuccessMessage('Email z resetem hasła został wysłany');
    setSuccessOpen(true);
  };

  return (
    <div className="space-y-8">
      {/* ============================================ */}
      {/* SEKCJA: INFORMACJE O UŻYTKOWNIKU */}
      {/* ============================================ */}

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

      {/* Account Details */}
      <div className="space-y-3">
        <h5 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Dane konta
        </h5>
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
        <div className="pt-2">
          <Link
            href={localePath(`/u/${user.name}`)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <ExternalLink className="h-4 w-4" />
            Podejrzyj profil publiczny
          </Link>
        </div>
      </div>

      {/* Separator */}
      <div className="border-t border-zinc-200 dark:border-zinc-700" />

      {/* ============================================ */}
      {/* SEKCJA: UPRAWNIENIA I WERYFIKACJA */}
      {/* ============================================ */}

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
        <p className="text-xs text-zinc-600 dark:text-zinc-400">
          Status weryfikacji użytkownika na platformie
        </p>
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

      {/* Separator */}
      <div className="border-t border-zinc-200 dark:border-zinc-700" />

      {/* ============================================ */}
      {/* SEKCJA: BEZPIECZEŃSTWO I ZARZĄDZANIE */}
      {/* ============================================ */}

      {/* Password Reset */}
      <div className="space-y-3">
        <h5 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Reset hasła
        </h5>
        <p className="text-xs text-zinc-600 dark:text-zinc-400">
          Wyślij użytkownikowi email z linkiem do resetowania hasła
        </p>
        <button
          onClick={() => setResetPasswordOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-blue-300 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-950/30"
        >
          <Mail className="h-4 w-4" />
          Wyślij email z resetem hasła
        </button>
      </div>

      {/* Account Suspension */}
      {!isSelf && (
        <div className="space-y-3">
          <h5 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Zawieszenie konta
          </h5>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            Zawieszenie konta uniemożliwia użytkownikowi jakiekolwiek działania
            na platformie
          </p>
          {isSuspended ? (
            <div className="space-y-2">
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/30">
                <div className="flex items-start gap-2 text-sm text-red-800 dark:text-red-300">
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium">Konto zawieszone</p>
                    {user.suspensionReason && (
                      <p className="mt-1 text-xs">
                        Powód: {user.suspensionReason}
                      </p>
                    )}
                    {user.suspendedAt && (
                      <p className="mt-1 text-xs">
                        Zawieszone:{' '}
                        {format(
                          new Date(user.suspendedAt),
                          'dd MMM yyyy, HH:mm',
                          { locale: pl }
                        )}
                      </p>
                    )}
                    {user.suspendedUntil ? (
                      <p className="mt-1 text-xs font-medium text-orange-700 dark:text-orange-300">
                        ⏱️ Automatyczne odwieszenie:{' '}
                        {format(
                          new Date(user.suspendedUntil),
                          'dd MMM yyyy, HH:mm',
                          { locale: pl }
                        )}
                      </p>
                    ) : (
                      <p className="mt-1 text-xs font-medium">
                        ⏳ Zawieszenie bezterminowe
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
              className="inline-flex items-center gap-2 rounded-lg border border-orange-300 px-4 py-2 text-sm font-medium text-orange-700 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-300 dark:hover:bg-orange-950/30"
            >
              <ShieldBan className="h-4 w-4" />
              Zawieś konto
            </button>
          )}
        </div>
      )}

      {/* Separator */}
      <div className="border-t border-zinc-200 dark:border-zinc-700" />

      {/* ============================================ */}
      {/* SEKCJA: DANGER ZONE */}
      {/* ============================================ */}

      {/* Danger Zone */}
      {canDelete && (
        <div className="space-y-3 rounded-lg border-2 border-red-300 bg-red-50 p-4 dark:border-red-700 dark:bg-red-950/30">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-700 dark:text-red-300" />
            <h5 className="text-sm font-semibold text-red-900 dark:text-red-100">
              Strefa niebezpieczna
            </h5>
          </div>
          <p className="text-xs text-red-700 dark:text-red-300">
            Usunięcie użytkownika jest nieodwracalne. Wszystkie dane zostaną
            zanonimizowane i konto zostanie oznaczone jako usunięte.
          </p>
          <button
            onClick={() => setDeleteUserOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-red-400 bg-red-100 px-4 py-2 text-sm font-medium text-red-800 hover:bg-red-200 dark:border-red-600 dark:bg-red-900/50 dark:text-red-200 dark:hover:bg-red-900/70"
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
        size="md"
        density="comfortable"
        title="Usunąć użytkownika?"
        subtitle="Ta akcja jest nieodwracalna. Wszystkie dane zostaną zanonimizowane."
        primaryLabel={deleteUserMutation.isPending ? 'Usuwanie...' : 'Usuń'}
        secondaryLabel="Anuluj"
        onPrimary={handleDeleteUser}
        onSecondary={() => setDeleteUserOpen(false)}
      >
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Powód usunięcia <span className="text-red-600">*</span>
            </label>
            <textarea
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              placeholder="Wpisz powód usunięcia użytkownika (wymagane)..."
              rows={3}
              required
              className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Powód zostanie zapisany w logach audytu. Dane użytkownika zostaną
              zanonimizowane zgodnie z GDPR.
            </p>
          </div>
        </div>
      </NoticeModal>

      {/* Suspend Modal */}
      <NoticeModal
        open={suspendOpen}
        onClose={() => setSuspendOpen(false)}
        variant="warning"
        size="md"
        title="Zawieś konto użytkownika"
        subtitle="Zawieszenie uniemożliwi użytkownikowi jakiekolwiek działania na platformie."
        primaryLabel={
          suspendMutation.isPending ? 'Zawieszanie...' : 'Zawieś konto'
        }
        secondaryLabel="Anuluj"
        onPrimary={handleSuspend}
        onSecondary={() => setSuspendOpen(false)}
      >
        <div className="space-y-4">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
            <p className="text-xs text-amber-800 dark:text-amber-300">
              <strong>Uwaga:</strong> Zawieszenie konta uniemożliwi
              użytkownikowi logowanie i jakiekolwiek działania na platformie.
            </p>
          </div>

          {/* ✅ MANDATORY: Reason */}
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Powód zawieszenia <span className="text-red-600">*</span>
            </label>
            <textarea
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              placeholder="Wpisz powód zawieszenia (wymagane)..."
              rows={3}
              required
              className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Powód zostanie zapisany w logach audytu i widoczny dla zespołu
            </p>
          </div>

          {/* Suspension Duration */}
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={isPermanentSuspension}
                onChange={(e) => setIsPermanentSuspension(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800"
              />
              Zawieszenie bezterminowe
            </label>
            <p className="mb-3 text-xs text-zinc-600 dark:text-zinc-400">
              Konto będzie zawieszone do czasu ręcznego odwieszenia
            </p>
          </div>

          {!isPermanentSuspension && (
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Data automatycznego odwieszenia
              </label>
              <input
                type="datetime-local"
                value={suspendedUntil}
                onChange={(e) => setSuspendedUntil(e.target.value)}
                min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
                className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Konto zostanie automatycznie odwieszone o tej dacie
              </p>
            </div>
          )}
        </div>
      </NoticeModal>

      {/* Password Reset Confirmation */}
      <NoticeModal
        open={resetPasswordOpen}
        onClose={() => setResetPasswordOpen(false)}
        variant="warning"
        size="sm"
        title="Wysłać email z resetem hasła?"
        subtitle={`Użytkownik ${user.name} otrzyma email z linkiem do resetowania hasła.`}
        primaryLabel="Wyślij"
        secondaryLabel="Anuluj"
        onPrimary={handleSendPasswordReset}
        onSecondary={() => setResetPasswordOpen(false)}
        primaryLoading={resetPasswordLoading}
      >
        <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/30">
          <p className="text-xs text-blue-800 dark:text-blue-300">
            <strong>TODO:</strong> Implementacja wymaga mutation:
            adminSendPasswordReset
          </p>
        </div>
      </NoticeModal>

      {/* Success */}
      <NoticeModal
        open={successOpen}
        onClose={() => setSuccessOpen(false)}
        variant="success"
        size="sm"
        title="Sukces"
        subtitle={successMessage}
        autoCloseMs={2000}
      >
        <></>
      </NoticeModal>
    </div>
  );
}
