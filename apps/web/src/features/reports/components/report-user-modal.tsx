'use client';

// TODO i18n: All Polish strings need translation keys
// - Report reasons, modal titles, descriptions, button labels, warnings

import { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { NoticeModal } from '@/components/ui/notice-modal';
import { Flag } from 'lucide-react';
import { ReportEntity } from '@/lib/api/__generated__/react-query-update';
import { useCreateReport } from '../api/use-create-report';

type ReportUserModalProps = {
  open: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
};

const REPORT_REASONS = [
  { value: 'SPAM', label: 'Spam lub fałszywe konto' },
  { value: 'INAPPROPRIATE', label: 'Nieodpowiednie treści lub zachowanie' },
  { value: 'HARASSMENT', label: 'Nękanie lub zastraszanie' },
  { value: 'IMPERSONATION', label: 'Podszywanie się pod kogoś' },
  { value: 'HATE_SPEECH', label: 'Mowa nienawiści' },
  { value: 'SCAM', label: 'Oszustwo lub wyłudzenie' },
  { value: 'VIOLENCE', label: 'Przemoc lub groźby' },
  { value: 'ILLEGAL', label: 'Nielegalna działalność' },
  { value: 'OTHER', label: 'Inne' },
] as const;

export function ReportUserModal({
  open,
  onClose,
  userId,
  userName,
}: ReportUserModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [customReason, setCustomReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { mutateAsync: createReport } = useCreateReport();

  const handleSubmit = async () => {
    if (!selectedReason) {
      return;
    }

    const reasonLabel =
      REPORT_REASONS.find((r) => r.value === selectedReason)?.label || '';
    const finalReason =
      selectedReason === 'OTHER' && customReason.trim()
        ? customReason.trim()
        : reasonLabel;

    if (!finalReason) {
      return;
    }

    try {
      setLoading(true);
      await createReport({
        input: {
          entity: ReportEntity.User,
          entityId: userId,
          reason: finalReason,
        },
      });

      // Reset form
      setSelectedReason('');
      setCustomReason('');
      onClose();

      // Show success modal
      setSuccessOpen(true);
    } catch (error: any) {
      console.error('Error creating report:', error);
      setErrorMessage(
        error?.response?.errors?.[0]?.message ||
          'Nie udało się wysłać zgłoszenia. Spróbuj ponownie.'
      );
      onClose();
      setErrorOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setSelectedReason('');
      setCustomReason('');
      onClose();
    }
  };

  const canSubmit =
    selectedReason &&
    (selectedReason !== 'OTHER' || customReason.trim().length > 0);

  return (
    <>
      <Modal
        open={open}
        onClose={handleClose}
        variant="centered"
        size="md"
        labelledById="report-user-modal-title"
        ariaLabel="Zgłoś użytkownika"
        header={
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <Flag className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3
                id="report-user-modal-title"
                className="text-lg font-semibold text-zinc-900 dark:text-zinc-100"
              >
                Zgłoś użytkownika
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {userName}
              </p>
            </div>
          </div>
        }
        content={
          <div className="space-y-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Jeśli ten użytkownik narusza regulamin lub prowadzi nieodpowiednią
              działalność, możesz go zgłosić. Twoje zgłoszenie zostanie
              sprawdzone przez moderatorów.
            </p>

            <div>
              <label
                htmlFor="report-reason"
                className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Powód zgłoszenia *
              </label>
              <div className="space-y-2">
                {REPORT_REASONS.map((reason) => (
                  <label
                    key={reason.value}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-zinc-200 p-3 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                  >
                    <input
                      type="radio"
                      name="report-reason"
                      value={reason.value}
                      checked={selectedReason === reason.value}
                      onChange={(e) => setSelectedReason(e.target.value)}
                      className="h-4 w-4 text-red-600 focus:ring-2 focus:ring-red-500"
                      disabled={loading}
                    />
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">
                      {reason.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {selectedReason === 'OTHER' && (
              <div>
                <label
                  htmlFor="custom-reason"
                  className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Opisz problem *
                </label>
                <textarea
                  id="custom-reason"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Opisz szczegółowo, dlaczego zgłaszasz tego użytkownika..."
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  rows={4}
                  maxLength={1000}
                  disabled={loading}
                />
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {customReason.length}/1000 znaków
                </p>
              </div>
            )}

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
              <p className="text-xs text-amber-800 dark:text-amber-200">
                <strong>Uwaga:</strong> Fałszywe zgłoszenia mogą skutkować
                zablokowaniem Twojego konta. Zgłaszaj tylko rzeczywiste
                naruszenia regulaminu.
              </p>
            </div>
          </div>
        }
        footer={
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Anuluj
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit || loading}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-red-700 dark:hover:bg-red-800"
            >
              {loading ? 'Wysyłanie...' : 'Wyślij zgłoszenie'}
            </button>
          </div>
        }
      />

      {/* Success Modal */}
      <NoticeModal
        open={successOpen}
        onClose={() => setSuccessOpen(false)}
        variant="success"
        size="sm"
        title="Zgłoszenie wysłane"
        subtitle="Dziękujemy za zgłoszenie. Nasz zespół sprawdzi je w ciągu 24-48 godzin."
        actionClassName="justify-center"
        autoCloseMs={5000}
        onPrimary={() => setSuccessOpen(false)}
      >
        <></>
      </NoticeModal>

      {/* Error Modal */}
      <NoticeModal
        open={errorOpen}
        onClose={() => setErrorOpen(false)}
        variant="error"
        size="sm"
        title="Błąd"
        subtitle={errorMessage}
        actionClassName="justify-center"
        autoCloseMs={5000}
        onPrimary={() => setErrorOpen(false)}
      >
        <></>
      </NoticeModal>
    </>
  );
}
