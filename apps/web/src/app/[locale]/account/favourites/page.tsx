/**
 * Favourites Page
 * Displays user's saved/favourite events
 */

import { FavouritesPageClient } from './_components/favourites-page-client';

// TODO: Add i18n for metadata - title and description are hardcoded in Polish
export const metadata = {
  title: 'Zapisane wydarzenia | miglee.pl',
  description: 'Twoje zapisane wydarzenia',
};

export default function FavouritesPage() {
  return <FavouritesPageClient />;
}
