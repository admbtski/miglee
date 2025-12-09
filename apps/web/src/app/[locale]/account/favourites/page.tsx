/**
 * Favourites Page
 * Displays user's saved/favourite events
 */

import type { Metadata } from 'next';

import { FavouritesPageClient } from './_components/favourites-page-client';

// TODO i18n: metadata title/description
export const metadata: Metadata = {
  title: 'Zapisane wydarzenia | miglee.pl',
  description: 'Twoje zapisane wydarzenia',
};

export default function FavouritesPage() {
  return <FavouritesPageClient />;
}
