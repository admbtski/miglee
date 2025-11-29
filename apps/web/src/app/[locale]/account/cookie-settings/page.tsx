'use client';

import { AccountPageHeader } from '../_components';
import {
  Cookie,
  Shield,
  Eye,
  BarChart3,
  Settings2,
  ExternalLink,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n/provider-ssr';
import { showCookieBanner } from '@/components/cookie-consent';

export default function CookieSettingsPage() {
  const { t } = useI18n();

  const handleOpenCookieBanner = () => {
    showCookieBanner();
  };

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
      <div className="bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 rounded-2xl p-8 dark:from-indigo-900/20 dark:to-violet-900/20 dark:border-indigo-800">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 dark:bg-indigo-500 shrink-0">
            <Cookie className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-3">
              {t.cookies.about.title}
            </h2>
            <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">
              {t.cookies.about.description}
            </p>
            <button
              onClick={handleOpenCookieBanner}
              className="inline-flex items-center gap-2 px-6 py-3 text-base font-semibold text-white bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors rounded-xl shadow-lg hover:shadow-xl"
            >
              <Settings2 className="w-5 h-5" />
              Manage Cookie Preferences
            </button>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 dark:bg-blue-900/10 dark:border-blue-900/30">
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
                className="bg-white border border-zinc-200 rounded-xl p-5 dark:bg-zinc-900 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
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
      <div className="bg-white border border-zinc-200 rounded-xl p-6 dark:bg-zinc-900 dark:border-zinc-800">
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
              Powered by CookieScript
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
