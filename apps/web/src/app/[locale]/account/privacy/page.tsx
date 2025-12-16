/**
 * Privacy Policy Page
 *
 * Displays privacy policy documents in multiple languages.
 * All text uses i18n via useI18n hook.
 *
 * TODO: format date/time with user.timezone + locale (i18n) - "lastUpdated" date
 */

'use client';

import { useState } from 'react';
import { Download, ExternalLink, Shield } from 'lucide-react';

import { useI18n } from '@/lib/i18n/provider-ssr';

import { AccountPageHeader } from '@/features/account/components';

export default function PrivacyPolicyPage() {
  const { t, locale } = useI18n();
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'pl' | 'de'>(
    locale as 'en' | 'pl' | 'de'
  );

  // PDF URLs for static documents
  const pdfUrls = {
    en: '/docs/privacy-policy-en.pdf',
    pl: '/docs/privacy-policy-pl.pdf',
    de: '/docs/privacy-policy-de.pdf',
  };

  const languageNames = {
    en: t.privacyPolicy.english,
    pl: t.privacyPolicy.polish,
    de: t.privacyPolicy.german,
  };

  return (
    <div className="space-y-8">
      <AccountPageHeader
        title={t.privacyPolicy.title}
        description={t.privacyPolicy.subtitle}
      />

      {/* Main Content Card */}
      <div className="rounded-3xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        {/* Header with Icon */}
        <div className="border-b border-zinc-200 p-6 dark:border-zinc-800">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-green-100 bg-white text-green-600 shadow-sm dark:border-green-900/40 dark:bg-zinc-900 dark:text-green-400">
              <Shield className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                {t.privacyPolicy.title}
              </h2>
              {/* TODO: Add i18n for date format - use date-fns with locale */}
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {t.privacyPolicy.lastUpdated} November 29, 2024
              </p>
            </div>
          </div>
        </div>

        {/* Language Selection */}
        <div className="border-b border-zinc-200 p-6 dark:border-zinc-800">
          <label className="block mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {t.privacyPolicy.selectLanguage}
          </label>
          <div className="grid grid-cols-3 gap-3">
            {(['en', 'pl', 'de'] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setSelectedLanguage(lang)}
                className={`px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
                  selectedLanguage === lang
                    ? 'bg-green-600 text-white shadow-sm'
                    : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
                }`}
              >
                {languageNames[lang]}
              </button>
            ))}
          </div>
        </div>

        {/* PDF Actions - external static files, keep as <a> */}
        <div className="p-6 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href={pdfUrls[selectedLanguage]}
              download
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-700"
            >
              <Download className="w-4 h-4" />
              {t.privacyPolicy.downloadPdf}
            </a>
            <a
              href={pdfUrls[selectedLanguage]}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-300 px-6 py-3 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <ExternalLink className="w-4 h-4" />
              {t.privacyPolicy.viewOnline}
            </a>
          </div>

          {/* Info Box */}
          <div className="rounded-xl border border-green-100 bg-green-50 p-4 dark:border-green-900/30 dark:bg-green-900/20">
            <div className="flex items-start gap-3">
              <Shield className="flex-shrink-0 w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-green-900 dark:text-green-100">
                  {t.privacyPolicy.title}
                </h4>
                {/* TODO: Add i18n key for t.privacyPolicy.infoDescription */}
                <p className="mt-1 text-sm text-green-700 dark:text-green-300">
                  We take your privacy seriously. Learn how we collect, use, and
                  protect your personal information.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
