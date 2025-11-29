'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Mail, ArrowLeft } from 'lucide-react';
import {
  useRequestAccountRestorationMutation,
  useRestoreMyAccountMutation,
} from '@/lib/api/user-restore-account';
import { useI18n } from '@/lib/i18n/provider-ssr';
import { useLocalePath } from '@/hooks/use-locale-path';

function RestoreAccountContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useI18n();
  const { localePath } = useLocalePath();

  const token = searchParams.get('token');
  const emailParam = searchParams.get('email');

  const [email, setEmail] = useState(emailParam || '');
  const [hasRestoredSuccessfully, setHasRestoredSuccessfully] = useState(false);

  const requestRestoration = useRequestAccountRestorationMutation();
  const restoreAccount = useRestoreMyAccountMutation();

  const handleRequestRestoration = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await requestRestoration.mutateAsync({ email });
      toast.success(t.accountRestoration.request.success);
    } catch (error) {
      toast.error(t.accountRestoration.request.error);
    }
  };

  const handleRestoreAccount = async () => {
    if (!token || !email) {
      toast.error(t.accountRestoration.restore.error);
      return;
    }

    try {
      await restoreAccount.mutateAsync({ email, token });
      toast.success(t.accountRestoration.restore.success);
      setHasRestoredSuccessfully(true);

      // Redirect to home after 3 seconds
      setTimeout(() => {
        router.push(localePath('/'));
      }, 3000);
    } catch (error) {
      toast.error(t.accountRestoration.restore.error);
    }
  };

  // Auto-restore if token and email are present
  useEffect(() => {
    if (
      token &&
      email &&
      !hasRestoredSuccessfully &&
      !restoreAccount.isSuccess
    ) {
      handleRestoreAccount();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, email]);

  // If token present, show restore confirmation
  if (token && email) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950">
        <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-8 border border-zinc-200 dark:border-zinc-800">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 rounded-full bg-indigo-100 dark:bg-indigo-950/30">
                {restoreAccount.isPending ? (
                  <Loader2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin" />
                ) : (
                  <Mail className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                )}
              </div>
            </div>

            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
              {t.accountRestoration.restore.title}
            </h1>

            {restoreAccount.isPending && (
              <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                {t.accountRestoration.restore.restoring}
              </p>
            )}

            {restoreAccount.isError && (
              <>
                <p className="text-red-600 dark:text-red-400 mb-6">
                  {t.accountRestoration.restore.error}
                </p>
                <button
                  onClick={() => router.push(localePath('/'))}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  {t.accountRestoration.restore.backToLogin}
                </button>
              </>
            )}

            {restoreAccount.isSuccess && (
              <>
                <p className="text-green-600 dark:text-green-400 mb-6">
                  {t.accountRestoration.restore.success}
                </p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Redirecting...
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Request restoration form
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-8 border border-zinc-200 dark:border-zinc-800">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-full bg-indigo-100 dark:bg-indigo-950/30">
              <Mail className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
            {t.accountRestoration.request.title}
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            {t.accountRestoration.request.subtitle}
          </p>
        </div>

        <form onSubmit={handleRequestRestoration} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2"
            >
              {t.accountRestoration.request.emailLabel}
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.accountRestoration.request.emailPlaceholder}
              className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
              disabled={requestRestoration.isPending}
            />
          </div>

          <button
            type="submit"
            disabled={requestRestoration.isPending}
            className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:focus:ring-offset-zinc-900 font-semibold"
          >
            {requestRestoration.isPending ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                {t.accountRestoration.request.submitting}
              </span>
            ) : (
              t.accountRestoration.request.submit
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => router.push(localePath('/'))}
            className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            ← {t.accountRestoration.restore.backToLogin}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RestoreAccountPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      }
    >
      <RestoreAccountContent />
    </Suspense>
  );
}
