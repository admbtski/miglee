'use client';

import { useState } from 'react';
import { Globe, Clock, Palette, Check, Loader2 } from 'lucide-react';
import { useTheme } from '@/features/theme/provider/theme-provider';
import { useUpdateLocale, useUpdateTimezone } from '@/lib/api/user-preferences';
import { localeNames, useI18n } from '@/lib/i18n/provider-ssr';
import { commonTimezones } from '@/lib/i18n/timezone-provider';
import { toast } from 'sonner';
import { TimezoneDropdown } from '@/components/forms/timezone-dropdown';

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

  const { theme, setTheme } = useTheme();
  const { updateLocale, isPending: isLocaleLoading } = useUpdateLocale();
  const { updateTimezone, isPending: isTimezoneLoading } = useUpdateTimezone();

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

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
          {t.settings.title}
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          {t.settings.subtitle}
        </p>
      </div>

      {/* Language Section */}
      <section className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-950/30">
            <Globe className="w-5 h-5 text-orange-600 dark:text-orange-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {t.settings.language.title}
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {t.settings.language.description}
            </p>
          </div>
        </div>

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
      </section>

      {/* Timezone Section */}
      <section className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950/30">
            <Clock className="w-5 h-5 text-blue-600 dark:text-blue-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {t.settings.timezone.title}
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {t.settings.timezone.description}
            </p>
          </div>
        </div>

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
      </section>

      {/* Theme Section */}
      <section className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-950/30">
            <Palette className="w-5 h-5 text-purple-600 dark:text-purple-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {t.settings.theme.title}
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {t.settings.theme.description}
            </p>
          </div>
        </div>

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
      </section>

      {/* Info Box */}
      <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          <strong>{t.settings.info.tip}:</strong> {t.settings.info.tipMessage}
        </p>
      </div>
    </div>
  );
}
