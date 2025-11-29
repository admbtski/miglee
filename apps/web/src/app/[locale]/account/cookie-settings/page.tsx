'use client';

import { AccountPageHeader } from '../_components';
import { Cookie, Shield, Eye, BarChart3, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n/provider-ssr';

type CookieCategory = 'essential' | 'analytics' | 'marketing' | 'preferences';

interface CookieSettings {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

export default function CookieSettingsPage() {
  const { t } = useI18n();
  const [settings, setSettings] = useState<CookieSettings>({
    essential: true,
    analytics: true,
    marketing: false,
    preferences: true,
  });
  const [isSaving, setIsSaving] = useState(false);

  const COOKIE_CATEGORIES = [
    {
      id: 'essential' as CookieCategory,
      name: t.cookies.categories.essential.name,
      icon: Shield,
      description: t.cookies.categories.essential.description,
      examples: [
        t.cookies.categories.essential.examples.session,
        t.cookies.categories.essential.examples.security,
        t.cookies.categories.essential.examples.loadBalancing,
      ],
      disabled: true,
      required: t.cookies.categories.essential.required,
    },
    {
      id: 'analytics' as CookieCategory,
      name: t.cookies.categories.analytics.name,
      icon: BarChart3,
      description: t.cookies.categories.analytics.description,
      examples: [
        t.cookies.categories.analytics.examples.googleAnalytics,
        t.cookies.categories.analytics.examples.pageViews,
        t.cookies.categories.analytics.examples.userBehavior,
      ],
      disabled: false,
    },
    {
      id: 'marketing' as CookieCategory,
      name: t.cookies.categories.marketing.name,
      icon: Eye,
      description: t.cookies.categories.marketing.description,
      examples: [
        t.cookies.categories.marketing.examples.adTargeting,
        t.cookies.categories.marketing.examples.socialMedia,
        t.cookies.categories.marketing.examples.remarketing,
      ],
      disabled: false,
    },
    {
      id: 'preferences' as CookieCategory,
      name: t.cookies.categories.preferences.name,
      icon: Cookie,
      description: t.cookies.categories.preferences.description,
      examples: [
        t.cookies.categories.preferences.examples.language,
        t.cookies.categories.preferences.examples.theme,
        t.cookies.categories.preferences.examples.region,
      ],
      disabled: false,
    },
  ];

  const handleToggle = (category: CookieCategory) => {
    if (category === 'essential') return; // Cannot toggle essential cookies

    setSettings((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Save to localStorage
    localStorage.setItem('cookieSettings', JSON.stringify(settings));

    toast.success(t.cookies.actions.saved);
    setIsSaving(false);
  };

  const handleAcceptAll = () => {
    setSettings({
      essential: true,
      analytics: true,
      marketing: true,
      preferences: true,
    });
  };

  const handleRejectAll = () => {
    setSettings({
      essential: true,
      analytics: false,
      marketing: false,
      preferences: false,
    });
  };

  return (
    <div className="space-y-8">
      <AccountPageHeader
        title={t.cookies.title}
        description={t.cookies.subtitle}
      />

      {/* Overview Card */}
      <div className="bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 rounded-2xl p-6 dark:from-indigo-900/20 dark:to-violet-900/20 dark:border-indigo-800">
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 dark:bg-indigo-500">
            <Cookie className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
              {t.cookies.about.title}
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {t.cookies.about.description}
            </p>
          </div>
        </div>
      </div>

      {/* Cookie Categories */}
      <div className="space-y-4">
        {COOKIE_CATEGORIES.map((category) => {
          const Icon = category.icon;
          const isEnabled = settings[category.id];

          return (
            <div
              key={category.id}
              className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden dark:bg-zinc-900 dark:border-zinc-800"
            >
              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div
                      className={`flex items-center justify-center w-10 h-10 rounded-lg ${
                        isEnabled
                          ? 'bg-indigo-100 dark:bg-indigo-900/30'
                          : 'bg-zinc-100 dark:bg-zinc-800'
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 ${
                          isEnabled
                            ? 'text-indigo-600 dark:text-indigo-400'
                            : 'text-zinc-400 dark:text-zinc-600'
                        }`}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                          {category.name}
                        </h3>
                        {category.disabled && category.required && (
                          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                            {category.required}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
                        {category.description}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {category.examples.map((example) => (
                          <span
                            key={example}
                            className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                          >
                            {example}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <button
                    type="button"
                    onClick={() => handleToggle(category.id)}
                    disabled={category.disabled}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                      isEnabled
                        ? 'bg-indigo-600'
                        : 'bg-zinc-200 dark:bg-zinc-700'
                    } ${category.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    role="switch"
                    aria-checked={isEnabled}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        isEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-6 dark:bg-zinc-900 dark:border-zinc-800">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleAcceptAll}
              className="px-4 py-2 text-sm font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100 transition-colors"
            >
              {t.cookies.actions.acceptAll}
            </button>
            <button
              type="button"
              onClick={handleRejectAll}
              className="px-4 py-2 text-sm font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100 transition-colors"
            >
              {t.cookies.actions.rejectAll}
            </button>
          </div>

          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors dark:focus:ring-offset-zinc-900"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {t.cookies.actions.saving}
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                {t.cookies.actions.savePreferences}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
