'use client';

import { useState } from 'react';
import { Mail, UserCog, AlertTriangle } from 'lucide-react';
import { NoticeModal } from '@/components/feedback/notice-modal';

type DiagnosticToolsProps = {
  userId: string;
  userName: string;
};

export function DiagnosticTools({ userId, userName }: DiagnosticToolsProps) {
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [impersonateOpen, setImpersonateOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleSendPasswordReset = async () => {
    setLoading(true);
    // TODO: Implement adminSendPasswordReset mutation
    console.log('Send password reset:', userId);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setLoading(false);
    setResetPasswordOpen(false);
    setSuccessMessage('Email z resetem hasła został wysłany');
    setSuccessOpen(true);
  };

  const handleImpersonate = async () => {
    setLoading(true);
    // TODO: Implement adminImpersonate mutation
    console.log('Impersonate user:', userId);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setLoading(false);
    setImpersonateOpen(false);
    // Redirect to main page as impersonated user
    window.location.href = '/';
  };

  return (
    <div className="space-y-6">
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

      {/* Impersonation */}
      <div className="space-y-3">
        <h5 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Impersonacja użytkownika
        </h5>
        <p className="text-xs text-zinc-600 dark:text-zinc-400">
          Zaloguj się jako ten użytkownik (tylko dla ADMIN, dev-only)
        </p>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
          <div className="flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <div>
              <p className="font-medium">Uwaga: Funkcja deweloperska</p>
              <p className="mt-1">
                Impersonacja jest logowana w audit log. Sesja wygasa po 1h.
                Używaj tylko w celach diagnostycznych.
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={() => setImpersonateOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-purple-300 px-4 py-2 text-sm font-medium text-purple-700 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-300 dark:hover:bg-purple-950/30"
        >
          <UserCog className="h-4 w-4" />
          Zaloguj się jako użytkownik
        </button>
      </div>

      {/* TODO Notice */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/30">
        <p className="text-xs text-blue-800 dark:text-blue-300">
          <strong>TODO:</strong> Implementacja wymaga mutations:
          adminSendPasswordReset, adminImpersonate
        </p>
      </div>

      {/* Password Reset Confirmation */}
      <NoticeModal
        open={resetPasswordOpen}
        onClose={() => setResetPasswordOpen(false)}
        variant="warning"
        size="sm"
        title="Wysłać email z resetem hasła?"
        subtitle={`Użytkownik ${userName} otrzyma email z linkiem do resetowania hasła.`}
        primaryLabel="Wyślij"
        secondaryLabel="Anuluj"
        onPrimary={handleSendPasswordReset}
        onSecondary={() => setResetPasswordOpen(false)}
        primaryLoading={loading}
      >
        <></>
      </NoticeModal>

      {/* Impersonate Confirmation */}
      <NoticeModal
        open={impersonateOpen}
        onClose={() => setImpersonateOpen(false)}
        variant="error"
        size="sm"
        title="Zalogować się jako użytkownik?"
        subtitle={`Ta akcja zostanie zapisana w audit log. Sesja wygaśnie po 1 godzinie.`}
        primaryLabel="Zaloguj się"
        secondaryLabel="Anuluj"
        onPrimary={handleImpersonate}
        onSecondary={() => setImpersonateOpen(false)}
        primaryLoading={loading}
      >
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
          <p className="text-xs text-amber-800 dark:text-amber-300">
            Zostaniesz przekierowany na stronę główną jako{' '}
            <strong>{userName}</strong>
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
