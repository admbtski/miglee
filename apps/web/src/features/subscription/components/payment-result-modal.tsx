'use client';

import { Modal } from '@/components/ui/modal';
import { CheckCircle2, XCircle } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

interface PaymentResultModalProps {
  /** The context where payment happened: 'account' or 'event' */
  context: 'account' | 'event';
}

export function PaymentResultModal({ context }: PaymentResultModalProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<'success' | 'failed' | null>(null);

  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    const sessionId = searchParams.get('session_id');

    if (success === 'true' && sessionId) {
      setStatus('success');
      setIsOpen(true);
    } else if (canceled === 'true') {
      setStatus('failed');
      setIsOpen(true);
    }
  }, [searchParams, context]);

  const handleClose = () => {
    setIsOpen(false);

    // Remove query params from URL after closing modal
    const url = new URL(window.location.href);
    url.searchParams.delete('success');
    url.searchParams.delete('canceled');
    url.searchParams.delete('session_id');
    router.replace(url.pathname + url.search);
  };

  if (!status) return null;

  const isSuccess = status === 'success';

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      size="sm"
      header={null}
      content={
        <div className="flex flex-col items-center gap-6 px-4 py-8">
          {/* Icon with animation */}
          <div
            className={`relative flex items-center justify-center w-24 h-24 rounded-full ${
              isSuccess
                ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 dark:from-emerald-500 dark:to-emerald-700'
                : 'bg-gradient-to-br from-amber-400 to-amber-600 dark:from-amber-500 dark:to-amber-700'
            }`}
          >
            {isSuccess ? (
              <CheckCircle2
                className="text-white w-14 h-14 drop-shadow-lg"
                strokeWidth={2.5}
              />
            ) : (
              <XCircle
                className="text-white w-14 h-14 drop-shadow-lg"
                strokeWidth={2.5}
              />
            )}
            {/* Glow effect */}
            <div
              className={`absolute inset-0 rounded-full blur-xl opacity-40 ${
                isSuccess ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
          </div>

          {/* Message */}
          <div className="max-w-md space-y-4 text-center">
            <h3 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {/* TODO: Add i18n keys for payment result titles - use t.paymentResult.success.title and t.paymentResult.canceled.title */}
              {isSuccess
                ? 'Płatność zakończona sukcesem!'
                : 'Płatność anulowana'}
            </h3>

            <div className="space-y-3">
              <p className="text-base leading-relaxed text-zinc-700 dark:text-zinc-300">
                {/* TODO: Add i18n keys for payment result messages - use t.paymentResult.success.accountMessage, t.paymentResult.success.eventMessage, and t.paymentResult.canceled.message */}
                {isSuccess
                  ? context === 'account'
                    ? 'Twój plan użytkownika został aktywowany i jest już gotowy do użycia.'
                    : 'Plan sponsorowania wydarzenia został aktywowany. Możesz teraz korzystać z podbić i lokalnych powiadomień push.'
                  : 'Płatność została anulowana. Nic się nie stało – żadne środki nie zostały pobrane.'}
              </p>

              {isSuccess && (
                <div
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
                    context === 'account'
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300'
                      : 'bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300'
                  }`}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {/* TODO: Add i18n keys for success info messages - use t.paymentResult.success.accountInfo and t.paymentResult.success.eventInfo */}
                  {context === 'account'
                    ? 'Sprawdź szczegóły w historii płatności'
                    : 'Twoje funkcje premium są już aktywne'}
                </div>
              )}

              {!isSuccess && (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {/* TODO: Add i18n key for canceled message - use t.paymentResult.canceled.retryMessage */}
                  Możesz wrócić do wyboru planu i spróbować ponownie w dowolnym
                  momencie.
                </p>
              )}
            </div>
          </div>
        </div>
      }
      footer={
        <div className="flex justify-center gap-3 px-4 pb-6">
          <button
            type="button"
            onClick={handleClose}
            className={`inline-flex items-center justify-center gap-2 px-8 py-3 text-sm font-semibold text-white transition-all rounded-xl shadow-lg hover:shadow-xl active:scale-95 ${
              isSuccess
                ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 dark:from-emerald-500 dark:to-emerald-600'
                : 'bg-gradient-to-r from-zinc-600 to-zinc-500 hover:from-zinc-500 hover:to-zinc-400'
            }`}
          >
            {/* TODO: Add i18n keys for button labels - use t.paymentResult.success.button and t.paymentResult.canceled.button */}
            {isSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Super, zamknij
              </>
            ) : (
              'Rozumiem'
            )}
          </button>
        </div>
      }
    />
  );
}
