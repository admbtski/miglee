'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { NoticeModal } from '@/components/ui/notice-modal';
import { Role } from '@/lib/api/__generated__/react-query-update';
import { UserPlus, Mail, AlertCircle } from 'lucide-react';
import {
  useAdminInviteUserMutation,
  useAdminCreateUserMutation,
} from '@/features/users';

type AddUserModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

type Mode = 'invite' | 'create';

export function AddUserModal({ open, onClose, onSuccess }: AddUserModalProps) {
  const [mode, setMode] = useState<Mode>('invite');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>(Role.User);
  const [verified, setVerified] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inviteMutation = useAdminInviteUserMutation();
  const createMutation = useAdminCreateUserMutation();

  const loading = inviteMutation.isPending || createMutation.isPending;

  const handleSubmit = async () => {
    setError(null);

    try {
      if (mode === 'invite') {
        await inviteMutation.mutateAsync({
          input: {
            email,
            name: name || undefined,
            role,
          },
        });
      } else {
        await createMutation.mutateAsync({
          input: {
            email,
            name: name || undefined,
            role,
            verified,
          },
        });
      }

      setSuccessOpen(true);
      setTimeout(() => {
        setSuccessOpen(false);
        handleClose();
        onSuccess?.();
      }, 1500);
    } catch (err: any) {
      setError(
        err?.response?.errors?.[0]?.message ||
          'Wystąpił błąd podczas dodawania użytkownika'
      );
    }
  };

  const handleClose = () => {
    setEmail('');
    setName('');
    setRole(Role.User);
    setVerified(false);
    setMode('invite');
    onClose();
  };

  return (
    <>
      <Modal
        open={open}
        onClose={handleClose}
        variant="centered"
        size="md"
        labelledById="add-user-title"
        ariaLabel="Dodaj użytkownika"
        header={
          <h3
            id="add-user-title"
            className="text-lg font-semibold text-zinc-900 dark:text-zinc-100"
          >
            Dodaj użytkownika
          </h3>
        }
        content={
          <div className="space-y-4">
            {/* Mode Selection */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setMode('invite')}
                className={`rounded-lg border p-3 text-left transition-colors ${
                  mode === 'invite'
                    ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/30'
                    : 'border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      Zaproś
                    </p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                      Wyślij email
                    </p>
                  </div>
                </div>
              </button>
              <button
                onClick={() => setMode('create')}
                className={`rounded-lg border p-3 text-left transition-colors ${
                  mode === 'create'
                    ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/30'
                    : 'border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  <div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      Utwórz
                    </p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                      Ręcznie
                    </p>
                  </div>
                </div>
              </button>
            </div>

            {/* Form */}
            <div className="space-y-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Imię i nazwisko
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jan Kowalski"
                  className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Rola
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                >
                  <option value={Role.User}>User</option>
                  <option value={Role.Moderator}>Moderator</option>
                  <option value={Role.Admin}>Admin</option>
                </select>
              </div>

              {mode === 'create' && (
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={verified}
                    onChange={(e) => setVerified(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">
                    Oznacz jako zweryfikowany
                  </span>
                </label>
              )}
            </div>

            {/* Info */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/30">
              <p className="text-xs text-blue-800 dark:text-blue-300">
                {mode === 'invite' ? (
                  <>
                    <strong>Tryb zaproszenia:</strong> Użytkownik otrzyma email
                    z linkiem aktywacyjnym. Konto zostanie utworzone po
                    akceptacji zaproszenia.
                  </>
                ) : (
                  <>
                    <strong>Tryb ręczny:</strong> Konto zostanie utworzone
                    natychmiast. Jeśli nie zaznaczysz weryfikacji, użytkownik
                    będzie musiał zweryfikować email.
                  </>
                )}
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/30">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <p className="text-xs text-red-800 dark:text-red-300">
                    {error}
                  </p>
                </div>
              </div>
            )}
          </div>
        }
        footer={
          <div className="flex justify-end gap-2">
            <button
              onClick={handleClose}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Anuluj
            </button>
            <button
              onClick={handleSubmit}
              disabled={!email || loading}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? 'Przetwarzanie...'
                : mode === 'invite'
                  ? 'Wyślij zaproszenie'
                  : 'Utwórz konto'}
            </button>
          </div>
        }
      />

      <NoticeModal
        open={successOpen}
        onClose={() => setSuccessOpen(false)}
        variant="success"
        size="sm"
        title={mode === 'invite' ? 'Zaproszenie wysłane' : 'Konto utworzone'}
        subtitle={
          mode === 'invite'
            ? 'Użytkownik otrzyma email z linkiem aktywacyjnym'
            : 'Użytkownik może teraz zalogować się do platformy'
        }
        autoCloseMs={1500}
      >
        <></>
      </NoticeModal>
    </>
  );
}
