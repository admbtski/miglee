'use client';

import { useState } from 'react';
import { Modal } from '@/components/feedback/modal';
import { NoticeModal } from '@/components/feedback/notice-modal';
import { useAdminBulkUpdateIntentsMutation } from '@/lib/api/admin-intents';
import { Visibility } from '@/lib/api/__generated__/react-query-update';
import { EyeOff, Eye, Lock, Unlock, AlertCircle } from 'lucide-react';

type BulkActionsModalProps = {
  open: boolean;
  onClose: () => void;
  selectedIds: string[];
  onSuccess?: () => void;
};

export function BulkActionsModal({
  open,
  onClose,
  selectedIds,
  onSuccess,
}: BulkActionsModalProps) {
  const [action, setAction] = useState<'visibility' | 'joinLock' | null>(null);
  const [visibility, setVisibility] = useState<Visibility | undefined>();
  const [joinManuallyClosed, setJoinManuallyClosed] = useState<
    boolean | undefined
  >();
  const [joinManualCloseReason, setJoinManualCloseReason] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bulkUpdateMutation = useAdminBulkUpdateIntentsMutation();

  const handleClose = () => {
    setAction(null);
    setVisibility(undefined);
    setJoinManuallyClosed(undefined);
    setJoinManualCloseReason('');
    setError(null);
    onClose();
  };

  const handleConfirm = async () => {
    setError(null);
    try {
      const result = await bulkUpdateMutation.mutateAsync({
        ids: selectedIds,
        input: {
          visibility,
          joinManuallyClosed,
          joinManualCloseReason:
            joinManuallyClosed && joinManualCloseReason
              ? joinManualCloseReason
              : undefined,
        },
      });

      setConfirmOpen(false);

      if (result.adminBulkUpdateIntents.failed > 0) {
        setError(
          `Zaktualizowano ${result.adminBulkUpdateIntents.success} wydarzeń. Błędy: ${result.adminBulkUpdateIntents.failed}`
        );
      } else {
        setSuccessOpen(true);
        setTimeout(() => {
          setSuccessOpen(false);
          handleClose();
          onSuccess?.();
        }, 1500);
      }
    } catch (err: any) {
      setError(
        err?.response?.errors?.[0]?.message ||
          'Wystąpił błąd podczas aktualizacji wydarzeń'
      );
      setConfirmOpen(false);
    }
  };

  const canProceed = () => {
    if (action === 'visibility') return visibility !== undefined;
    if (action === 'joinLock') return joinManuallyClosed !== undefined;
    return false;
  };

  const ModalComponent = Modal as any;
  return (
    <>
      <ModalComponent
        open={open}
        onClose={handleClose}
        title="Akcje masowe"
        subtitle={`Wybrano ${selectedIds.length} wydarzeń`}
        content={
          <div className="space-y-6">
            {/* Action Selection */}
            <div className="space-y-3">
              <h5 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Wybierz akcję
              </h5>
              <div className="grid gap-3 md:grid-cols-2">
                <button
                  onClick={() => setAction('visibility')}
                  className={`flex items-center gap-3 rounded-lg border p-4 text-left transition-colors ${
                    action === 'visibility'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                      : 'border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'
                  }`}
                >
                  <Eye className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Zmień widoczność
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Publiczne / Ukryte
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => setAction('joinLock')}
                  className={`flex items-center gap-3 rounded-lg border p-4 text-left transition-colors ${
                    action === 'joinLock'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                      : 'border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'
                  }`}
                >
                  <Lock className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Zamknij/otwórz zapisy
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Ręczne zarządzanie
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Visibility Options */}
            {action === 'visibility' && (
              <div className="space-y-3">
                <h5 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Widoczność
                </h5>
                <div className="grid gap-3 md:grid-cols-2">
                  <button
                    onClick={() => setVisibility(Visibility.Public)}
                    className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                      visibility === Visibility.Public
                        ? 'border-green-500 bg-green-50 dark:bg-green-950/30'
                        : 'border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Eye className="h-4 w-4" />
                    <span className="text-sm font-medium">Publiczne</span>
                  </button>
                  <button
                    onClick={() => setVisibility(Visibility.Hidden)}
                    className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                      visibility === Visibility.Hidden
                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/30'
                        : 'border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'
                    }`}
                  >
                    <EyeOff className="h-4 w-4" />
                    <span className="text-sm font-medium">Ukryte</span>
                  </button>
                </div>
              </div>
            )}

            {/* Join Lock Options */}
            {action === 'joinLock' && (
              <div className="space-y-3">
                <h5 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Zapisy
                </h5>
                <div className="grid gap-3 md:grid-cols-2">
                  <button
                    onClick={() => setJoinManuallyClosed(true)}
                    className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                      joinManuallyClosed === true
                        ? 'border-red-500 bg-red-50 dark:bg-red-950/30'
                        : 'border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Lock className="h-4 w-4" />
                    <span className="text-sm font-medium">Zamknij zapisy</span>
                  </button>
                  <button
                    onClick={() => setJoinManuallyClosed(false)}
                    className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                      joinManuallyClosed === false
                        ? 'border-green-500 bg-green-50 dark:bg-green-950/30'
                        : 'border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Unlock className="h-4 w-4" />
                    <span className="text-sm font-medium">Otwórz zapisy</span>
                  </button>
                </div>

                {joinManuallyClosed === true && (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Powód zamknięcia (opcjonalnie)
                    </label>
                    <textarea
                      value={joinManualCloseReason}
                      onChange={(e) => setJoinManualCloseReason(e.target.value)}
                      placeholder="Wpisz powód zamknięcia zapisów..."
                      rows={3}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                    />
                  </div>
                )}
              </div>
            )}

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
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Anuluj
            </button>
            <button
              onClick={() => setConfirmOpen(true)}
              disabled={!canProceed() || bulkUpdateMutation.isPending}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {bulkUpdateMutation.isPending ? 'Przetwarzanie...' : 'Zastosuj'}
            </button>
          </div>
        }
      />

      <NoticeModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        variant="warning"
        size="sm"
        title="Potwierdź akcję masową"
        subtitle={`Czy na pewno chcesz zaktualizować ${selectedIds.length} wydarzeń?`}
        primaryLabel={
          bulkUpdateMutation.isPending ? 'Aktualizowanie...' : 'Potwierdź'
        }
        secondaryLabel="Anuluj"
        onPrimary={handleConfirm}
        onSecondary={() => setConfirmOpen(false)}
      >
        <></>
      </NoticeModal>

      <NoticeModal
        open={successOpen}
        onClose={() => setSuccessOpen(false)}
        variant="success"
        size="sm"
        title="Sukces"
        subtitle="Wydarzenia zostały zaktualizowane"
        primaryLabel="OK"
        onPrimary={() => setSuccessOpen(false)}
      >
        <></>
      </NoticeModal>
    </>
  );
}
