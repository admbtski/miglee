'use client';

import { useState } from 'react';
import {
  Globe,
  Clock,
  Palette,
  Check,
  Loader2,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { useTheme } from '@/features/theme/provider/theme-provider';
import { useUpdateLocale, useUpdateTimezone } from '@/features/users/api/user-preferences';
import { localeNames, useI18n } from '@/lib/i18n/provider-ssr';
import { commonTimezones } from '@/lib/i18n/timezone-provider';
import { toast } from 'sonner';
import { TimezoneDropdown } from '@/components/forms/timezone-dropdown';
import { DeleteAccountModal } from './_components/delete-account-modal';
import { useDeleteMyAccountMutation } from '@/features/users/api/user-delete-account';
import { AccountPageHeader } from '../_components';

// Get current timezone from browser
function getCurrentTimezone(): string {
  if (typeof window === 'undefined') return 'UTC';
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
}

export default function SettingsPage() {
  const currentTimezone = getCurrentTimezone();
  const { t, locale } = useI18n();

  const [selectedTimezone, setSelectedTimezone] =
    useState<string>(currentTimezone);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const { theme, setTheme } = useTheme();
  const { updateLocale, isPending: isLocaleLoading } = useUpdateLocale();
  const { updateTimezone, isPending: isTimezoneLoading } = useUpdateTimezone();
  const deleteAccount = useDeleteMyAccountMutation();

  const handleLocaleChange = async (newLocale: 'en' | 'pl' | 'de') => {
    if (newLocale === locale) return;

    try {
      await updateLocale(newLocale);
      // Toast will show after redirect in new locale
    } catch (error) {
      toast.error(t.settings.language.error);
    }
  };

  const handleTimezoneChange = async (newTimezone: string) => {
    if (newTimezone === selectedTimezone) return;

    setSelectedTimezone(newTimezone);
    try {
      await updateTimezone(newTimezone);
      toast.success(t.settings.timezone.changed);
    } catch (error) {
      toast.error(t.settings.timezone.error);
      setSelectedTimezone(currentTimezone); // Revert on error
    }
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    toast.success(t.settings.theme.changed);
  };

  const handleDeleteAccount = async (reason: string) => {
    try {
      await deleteAccount.mutateAsync({ reason: reason || undefined });
      toast.success(t.settings.deleteAccount.modal.success);
      setIsDeleteModalOpen(false);
      // Redirect to home or logout after a delay
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    } catch (error) {
      toast.error(t.settings.deleteAccount.modal.error);
    }
  };

  return (
    <div className="space-y-8">
      <AccountPageHeader
        title={t.settings.title}
        description={t.settings.subtitle}
      />

      {/* Language Section */}
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30">
              <Globe className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {t.settings.language.title}
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {t.settings.language.description}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(['en', 'pl', 'de'] as const).map((localeOption) => (
              <button
                key={localeOption}
                onClick={() => handleLocaleChange(localeOption)}
                disabled={isLocaleLoading}
                className={`
                  relative p-4 rounded-xl border-2 transition-all
                  ${
                    localeOption === locale
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20 shadow-sm'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-orange-300 dark:hover:border-orange-700'
                  }
                  ${isLocaleLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  disabled:opacity-50
                `}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {localeNames[localeOption]}
                  </span>
                  {localeOption === locale && !isLocaleLoading && (
                    <Check className="w-5 h-5 text-orange-600 dark:text-orange-500" />
                  )}
                  {isLocaleLoading && localeOption === locale && (
                    <Loader2 className="w-5 h-5 text-orange-600 dark:text-orange-500 animate-spin" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Timezone Section */}
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {t.settings.timezone.title}
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {t.settings.timezone.description}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <TimezoneDropdown
            value={selectedTimezone}
            onChange={handleTimezoneChange}
            timezones={commonTimezones}
            disabled={isTimezoneLoading}
            loading={isTimezoneLoading}
            placeholder="Select timezone..."
          />

          <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-500">
            {t.settings.timezone.detected}: {getCurrentTimezone()}
          </p>
        </div>
      </div>

      {/* Theme Section */}
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <Palette className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {t.settings.theme.title}
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {t.settings.theme.description}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(['light', 'dark', 'system'] as const).map((themeOption) => (
              <button
                key={themeOption}
                onClick={() => handleThemeChange(themeOption)}
                className={`
                  relative p-4 rounded-xl border-2 transition-all
                  ${
                    themeOption === theme
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/20 shadow-sm'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-purple-300 dark:hover:border-purple-700'
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {themeOption === 'light'
                      ? t.settings.theme.light
                      : themeOption === 'dark'
                        ? t.settings.theme.dark
                        : t.settings.theme.system}
                  </span>
                  {themeOption === theme && (
                    <Check className="w-5 h-5 text-purple-600 dark:text-purple-500" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Delete Account Section */}
      <div className="bg-white border border-red-200 rounded-2xl shadow-sm dark:bg-zinc-900 dark:border-red-900/50">
        <div className="p-6 border-b border-red-200 dark:border-red-900/50">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {t.settings.deleteAccount.title}
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {t.settings.deleteAccount.description}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50">
            <p className="text-sm text-red-800 dark:text-red-300">
              {t.settings.deleteAccount.warning}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsDeleteModalOpen(true)}
            className="px-6 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors dark:focus:ring-offset-zinc-900"
          >
            {t.settings.deleteAccount.button}
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 dark:bg-blue-900/10 dark:border-blue-900/30">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
              {t.settings.info.tip}
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
              {t.settings.info.tipMessage}
            </p>
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      <DeleteAccountModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteAccount}
        isDeleting={deleteAccount.isPending}
      />
    </div>
  );
}
