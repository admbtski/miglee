'use client';

import { Modal } from '@/components/feedback/modal';
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

    console.log('[PaymentResultModal]', {
      success,
      canceled,
      sessionId,
      context,
    });

    if (success === 'true' && sessionId) {
      console.log('[PaymentResultModal] Opening success modal');
      setStatus('success');
      setIsOpen(true);
    } else if (canceled === 'true') {
      console.log('[PaymentResultModal] Opening failed modal');
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
      header={
        <div className="text-center">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
            {isSuccess
              ? '✅ Płatność zakończona sukcesem!'
              : '❌ Płatność anulowana'}
          </h2>
        </div>
      }
      content={
        <div className="flex flex-col items-center gap-6 py-6">
          {/* Icon */}
          <div
            className={`flex items-center justify-center w-20 h-20 rounded-full ${
              isSuccess
                ? 'bg-emerald-100 dark:bg-emerald-900/30'
                : 'bg-red-100 dark:bg-red-900/30'
            }`}
          >
            {isSuccess ? (
              <CheckCircle2
                className="w-10 h-10 text-emerald-600 dark:text-emerald-400"
                strokeWidth={2}
              />
            ) : (
              <XCircle
                className="w-10 h-10 text-red-600 dark:text-red-400"
                strokeWidth={2}
              />
            )}
          </div>

          {/* Message */}
          <div className="space-y-2 text-center">
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
              {isSuccess ? 'Gotowe!' : 'Anulowano'}
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-[40ch]">
              {isSuccess
                ? context === 'account'
                  ? 'Twój plan użytkownika został aktywowany. Możesz teraz korzystać z nowych funkcji.'
                  : 'Plan sponsorowania wydarzenia został aktywowany. Możesz teraz używać podbić i lokalnych powiadomień push.'
                : 'Płatność została anulowana. Możesz spróbować ponownie w dowolnym momencie.'}
            </p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-[40ch]">
              {isSuccess
                ? context === 'account'
                  ? 'Twój nowy plan jest już aktywny. Sprawdź szczegóły w historii płatności.'
                  : 'Twoje wydarzenie zostało ulepszone. Zespół Miglee dziękuje za zaufanie!'
                : 'Nie martw się, możesz wrócić do wyboru planu i spróbować ponownie.'}
            </p>
          </div>
        </div>
      }
      footer={
        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleClose}
            className={`inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-white transition-colors rounded-2xl ${
              isSuccess
                ? 'bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400'
                : 'bg-zinc-600 hover:bg-zinc-500 dark:bg-zinc-500 dark:hover:bg-zinc-400'
            }`}
          >
            {isSuccess ? 'Zamknij' : 'Rozumiem'}
          </button>
        </div>
      }
    />
  );
}
