'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Loader2,
  Mail,
  ArrowLeft,
  CheckCircle,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import {
  useRequestAccountRestorationMutation,
  useRestoreMyAccountMutation,
} from '@/lib/api/user-restore-account';
import { useI18n } from '@/lib/i18n/provider-ssr';
import { useLocalePath } from '@/hooks/use-locale-path';
import { motion } from 'framer-motion';

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
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-zinc-50 via-indigo-50/30 to-violet-50/30 dark:from-zinc-950 dark:via-indigo-950/20 dark:to-violet-950/20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-8 border border-zinc-200 dark:border-zinc-800"
        >
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className={`p-5 rounded-2xl ${
                  restoreAccount.isSuccess
                    ? 'bg-emerald-100 dark:bg-emerald-900/30'
                    : restoreAccount.isError
                      ? 'bg-red-100 dark:bg-red-900/30'
                      : 'bg-indigo-100 dark:bg-indigo-900/30'
                }`}
              >
                {restoreAccount.isPending ? (
                  <Loader2 className="w-10 h-10 text-indigo-600 dark:text-indigo-400 animate-spin" />
                ) : restoreAccount.isSuccess ? (
                  <CheckCircle className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
                ) : restoreAccount.isError ? (
                  <XCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
                ) : (
                  <RefreshCw className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                )}
              </motion.div>
            </div>

            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-3">
              {t.accountRestoration.restore.title}
            </h1>

            {restoreAccount.isPending && (
              <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                {t.accountRestoration.restore.restoring}
              </p>
            )}

            {restoreAccount.isError && (
              <div className="space-y-4">
                <p className="text-red-600 dark:text-red-400">
                  {t.accountRestoration.restore.error}
                </p>
                <button
                  onClick={() => router.push(localePath('/'))}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-xl font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  {t.accountRestoration.restore.backToLogin}
                </button>
              </div>
            )}

            {restoreAccount.isSuccess && (
              <div className="space-y-4">
                <p className="text-emerald-600 dark:text-emerald-400 font-medium">
                  {t.accountRestoration.restore.success}
                </p>
                <div className="flex items-center justify-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Przekierowanie...</span>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  // Request restoration form
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-zinc-50 via-indigo-50/30 to-violet-50/30 dark:from-zinc-950 dark:via-indigo-950/20 dark:to-violet-950/20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-8 border border-zinc-200 dark:border-zinc-800"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="flex justify-center mb-6"
          >
            <div className="p-5 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30">
              <Mail className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
            </div>
          </motion.div>

          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-3">
            {t.accountRestoration.request.title}
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            {t.accountRestoration.request.subtitle}
          </p>
        </div>

        <form onSubmit={handleRequestRestoration} className="space-y-5">
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
              className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              required
              disabled={requestRestoration.isPending}
            />
          </div>

          <button
            type="submit"
            disabled={requestRestoration.isPending || !email}
            className="w-full px-6 py-3.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed dark:focus:ring-offset-zinc-900"
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

          {requestRestoration.isSuccess && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-900/20 p-4 text-center"
            >
              <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
              <p className="text-sm text-emerald-700 dark:text-emerald-300">
                Link do przywrócenia konta został wysłany na Twój adres email.
              </p>
            </motion.div>
          )}
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={() => router.push(localePath('/'))}
            className="inline-flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t.accountRestoration.restore.backToLogin}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function RestoreAccountPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-50 via-indigo-50/30 to-violet-50/30 dark:from-zinc-950 dark:via-indigo-950/20 dark:to-violet-950/20">
          <div className="text-center">
            <Loader2 className="w-10 h-10 text-indigo-600 dark:text-indigo-400 animate-spin mx-auto" />
            <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
              Ładowanie...
            </p>
          </div>
        </div>
      }
    >
      <RestoreAccountContent />
    </Suspense>
  );
}
