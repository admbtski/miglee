import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';

import { CookieScriptProvider } from '@/features/cookies';
import { ThemeProvider } from '@/features/theme/provider/theme-provider';
import { WebVitals } from '@/lib/config/web-vitals';
import { InlineThemeScript } from '../features/theme/scripts/inline-theme-script';
import '../styles/globals.css';

/**
 * Primary font configuration
 * Using Poppins for clean, modern aesthetics
 */
const poppinsFont = Inter({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-poppins',
  display: 'swap', // Optimize font loading
});

/**
 * Application metadata for SEO and social sharing
 */
const siteConfig = {
  title: 'Miglee - Connect Through Sports & Activities',
  description:
    'Discover and join sports events, activities, and meetups in your area. Connect with people who share your interests.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://miglee.com',
  siteName: 'Miglee',
  creator: '@migleeio',
};

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.siteName}`,
  },
  description: siteConfig.description,
  keywords: ['sports', 'events', 'activities', 'meetups', 'social', 'fitness'],
  authors: [{ name: 'Miglee Team' }],
  creator: siteConfig.creator,

  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteConfig.url,
    siteName: siteConfig.siteName,
    title: siteConfig.title,
    description: siteConfig.description,
    images: [
      {
        url: '/_static/meta-image.png',
        width: 1200,
        height: 630,
        alt: siteConfig.siteName,
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: siteConfig.title,
    description: siteConfig.description,
    creator: siteConfig.creator,
    images: ['/_static/meta-image.png'],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

/**
 * Root layout component
 * Wraps all pages with global providers and configuration
 *
 * Note: Language (locale) should NOT be set here.
 * The HTML lang attribute will be set by the [locale]/layout.tsx
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning>
      <head>
        <InlineThemeScript />
      </head>
      <body
        suppressHydrationWarning
        className={`${poppinsFont.className} w-full min-h-screen antialiased`}
      >
        {/* Performance monitoring */}
        <WebVitals />

        {/* Cookie Consent Banner */}
        <CookieScriptProvider />

        {/* Global theme provider - locale and timezone are in [locale]/layout.tsx */}
        <ThemeProvider>{children}</ThemeProvider>

        {/* Toast notifications */}
        <Toaster
          position="top-right"
          closeButton
          expand={false}
          duration={4000}
          toastOptions={{
            style: {
              fontFamily: 'var(--font-poppins)',
            },
          }}
        />

        {/* Portal root for modals, tooltips, etc. */}
        <div
          id="portal-root"
          className="bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100"
          aria-live="polite"
        />
      </body>
    </html>
  );
}
