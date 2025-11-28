import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { type Locale, I18nProviderSSR } from '@/lib/i18n/provider-ssr';

/**
 * Supported locales for static generation
 */
export function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'pl' }, { locale: 'de' }];
}

/**
 * Generate metadata for each locale including hreflang tags
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: localeStr } = await params;
  const locale = localeStr as Locale;

  // Validate locale
  if (!['en', 'pl', 'de'].includes(locale)) {
    return {};
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://miglee.com';

  // Localized metadata
  const titles: Record<Locale, string> = {
    en: 'Miglee - Connect Through Sports & Activities',
    pl: 'Miglee - Połącz się poprzez Sport i Aktywności',
    de: 'Miglee - Verbinde dich durch Sport & Aktivitäten',
  };

  const descriptions: Record<Locale, string> = {
    en: 'Discover and join sports events, activities, and meetups in your area. Connect with people who share your interests.',
    pl: 'Odkryj i dołącz do wydarzeń sportowych, aktywności i spotkań w Twojej okolicy. Połącz się z ludźmi, którzy dzielą Twoje zainteresowania.',
    de: 'Entdecke und nimm an Sportveranstaltungen, Aktivitäten und Treffen in deiner Nähe teil. Verbinde dich mit Menschen, die deine Interessen teilen.',
  };

  return {
    title: titles[locale],
    description: descriptions[locale],
    alternates: {
      canonical: `${baseUrl}/${locale}`,
      languages: {
        en: `${baseUrl}/en`,
        pl: `${baseUrl}/pl`,
        de: `${baseUrl}/de`,
        'x-default': `${baseUrl}/en`,
      },
    },
    openGraph: {
      locale: locale === 'en' ? 'en_US' : locale === 'pl' ? 'pl_PL' : 'de_DE',
      alternateLocale: ['en_US', 'pl_PL', 'de_DE'].filter(
        (l) => !l.startsWith(locale)
      ),
    },
  };
}

/**
 * Locale-specific layout
 * Provides locale and timezone context to all child pages
 *
 * Note: Sets HTML lang attribute via useEffect on mount
 */
export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeStr } = await params;
  const locale = localeStr as Locale;

  // Validate locale
  if (!['en', 'pl', 'de'].includes(locale)) {
    notFound();
  }

  return (
    <>
      {/* Set HTML lang attribute */}
      <script
        dangerouslySetInnerHTML={{
          __html: `document.documentElement.lang = '${locale}';`,
        }}
      />
      <I18nProviderSSR locale={locale}>{children}</I18nProviderSSR>
    </>
  );
}
