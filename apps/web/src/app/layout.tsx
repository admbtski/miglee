import type { Metadata } from 'next';
// import { Inter } from 'next/font/google';
import {
  Mulish,
  Work_Sans,
  Inter,
  Nunito,
  DM_Sans,
  Nunito_Sans,
  Poppins,
  Plus_Jakarta_Sans,
} from 'next/font/google';

import '../styles/globals.css';

// const nextFont = Inter({ subsets: ['latin'] });
const nextFont = Poppins({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-poppins',
});
// const nextFont = Nunito({
//   weight: ['400', '500', '600', '700'],
//   subsets: ['latin'],
//   variable: '--font-poppins',
// });
// const nextFont = Nunito_Sans({
//   weight: ['400', '500', '600', '700'],
//   subsets: ['latin'],
//   variable: '--font-poppins',
// });
// const nextFont = Work_Sans({
//   weight: ['400', '500', '600', '700'],
//   subsets: ['latin'],
//   variable: '--font-poppins',
// });
// const nextFont = DM_Sans({
//   weight: ['400', '500', '600', '700'],
//   subsets: ['latin'],
//   variable: '--font-poppins',
// });
// const nextFont = Mulish({
//   weight: ['400', '500', '600', '700'],
//   subsets: ['latin'],
//   variable: '--font-poppins',
// });
// const nextFont = Plus_Jakarta_Sans({
//   weight: ['400', '500', '600', '700'],
//   subsets: ['latin'],
//   variable: '--font-poppins',
// });

const data = {
  title: 'Miglee - Sports Events',
  description: 'View the latest sports events',
  url: '/',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://www.google.com'),
  title: data.title,
  description: data.description,
  openGraph: {
    title: data.title,
    description: data.description,
    url: data.url,
    siteName: 'Miglee',
    images: [
      {
        url: '/_static/meta-image.png',
        width: 800,
        height: 600,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: data.title,
    description: data.description,
    creator: '@migleeio',
    images: ['/_static/meta-image.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className={nextFont.className}>
        {children}
      </body>
    </html>
  );
}
