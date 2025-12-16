/**
 * Cookie Settings Page
 *
 * Allows users to manage cookie preferences and view cookie categories.
 * All text uses i18n via useI18n hook.
 */

'use client';

import {
  BarChart3,
  CheckCircle2,
  Cookie,
  ExternalLink,
  Eye,
  Info,
  Settings2,
  Shield,
} from 'lucide-react';

import { showCookieBanner } from '@/components/cookie-consent';
import { useI18n } from '@/lib/i18n/provider-ssr';

import { AccountPageHeader } from '@/features/account/components';

export default function CookieSettingsPage() {
  const { t } = useI18n();

  const COOKIE_INFO = [
    {
      icon: Shield,
      title: t.cookies.categories.essential.name,
      description: t.cookies.categories.essential.description,
      color: 'indigo',
    },
    {
      icon: BarChart3,
      title: t.cookies.categories.analytics.name,
      description: t.cookies.categories.analytics.description,
      color: 'blue',
    },
    {
      icon: Eye,
      title: t.cookies.categories.marketing.name,
      description: t.cookies.categories.marketing.description,
      color: 'purple',
    },
    {
      icon: Cookie,
      title: t.cookies.categories.preferences.name,
      description: t.cookies.categories.preferences.description,
      color: 'green',
    },
  ];

  return (
    <div className="space-y-8">
      <AccountPageHeader
        title={t.cookies.title}
        description={t.cookies.subtitle}
      />

      {/* Main Card - Manage Cookies */}
      <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-indigo-200 bg-white text-indigo-600 shadow-sm dark:border-indigo-800/60 dark:bg-zinc-900 dark:text-indigo-400">
            <Cookie className="w-7 h-7" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-3">
              {t.cookies.about.title}
            </h2>
            <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">
              {t.cookies.about.description}
            </p>
            <button
              onClick={showCookieBanner}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"
            >
              <Settings2 className="w-5 h-5" />
              {/* TODO: Add i18n key t.cookies.managePreferences */}
              Manage Cookie Preferences
            </button>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="rounded-xl border border-blue-100 bg-blue-50 p-5 dark:border-blue-900/30 dark:bg-blue-900/10">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
              {t.cookies.howItWorks.title}
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
              {t.cookies.howItWorks.description}
            </p>
          </div>
        </div>
      </div>

      {/* Cookie Categories Info */}
      <div>
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
          {t.cookies.categoriesTitle}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {COOKIE_INFO.map((category) => {
            const Icon = category.icon;

            type ColorKey = 'indigo' | 'blue' | 'purple' | 'green';
            const colorClasses: Record<ColorKey, { bg: string; text: string }> =
              {
                indigo: {
                  bg: 'bg-indigo-100 dark:bg-indigo-900/30',
                  text: 'text-indigo-600 dark:text-indigo-400',
                },
                blue: {
                  bg: 'bg-blue-100 dark:bg-blue-900/30',
                  text: 'text-blue-600 dark:text-blue-400',
                },
                purple: {
                  bg: 'bg-purple-100 dark:bg-purple-900/30',
                  text: 'text-purple-600 dark:text-purple-400',
                },
                green: {
                  bg: 'bg-green-100 dark:bg-green-900/30',
                  text: 'text-green-600 dark:text-green-400',
                },
              };

            const colorClass = colorClasses[category.color as ColorKey];

            return (
              <div
                key={category.title}
                className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-lg shrink-0 ${colorClass.bg}`}
                  >
                    <Icon className={`w-5 h-5 ${colorClass.text}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                      {category.title}
                    </h4>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      {category.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400 text-center">
          {t.cookies.clickManage}
        </p>
      </div>

      {/* GDPR Info */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-start gap-4">
          <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
              {t.cookies.gdprCompliant}
            </h4>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3">
              {t.cookies.gdprDescription}
            </p>
            <a
              href="https://cookie-script.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
            >
              {/* TODO: Add i18n key t.cookies.poweredBy */}
              Powered by CookieScript
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
