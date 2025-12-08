'use client';

import { Download, ExternalLink, Shield } from 'lucide-react';
import { useState } from 'react';

// i18n & Layout
import { useI18n } from '@/lib/i18n/provider-ssr';
import { AccountPageHeader } from '../_components';

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
      <div className="bg-white border rounded-2xl dark:bg-[#10121a] dark:border-white/5">
        {/* Header with Icon */}
        <div className="p-6 border-b border-zinc-200 dark:border-white/5">
          <div className="flex items-start gap-4">
            <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
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
        <div className="p-6 border-b border-zinc-200 dark:border-white/5">
          <label className="block mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {t.privacyPolicy.selectLanguage}
          </label>
          <div className="grid grid-cols-3 gap-3">
            {(['en', 'pl', 'de'] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setSelectedLanguage(lang)}
                className={`
                  px-4 py-3 text-sm font-medium rounded-xl transition-all
                  ${
                    selectedLanguage === lang
                      ? 'bg-green-600 text-white shadow-md'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }
                `}
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
              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white transition-colors rounded-xl bg-green-600 hover:bg-green-700"
            >
              <Download className="w-4 h-4" />
              {t.privacyPolicy.downloadPdf}
            </a>
            <a
              href={pdfUrls[selectedLanguage]}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold transition-colors border-2 rounded-xl text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800"
            >
              <ExternalLink className="w-4 h-4" />
              {t.privacyPolicy.viewOnline}
            </a>
          </div>

          {/* Info Box */}
          <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30">
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
