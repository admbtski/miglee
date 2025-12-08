/**
 * Favourites Feature Types
 */

import type { MyFavouritesQuery } from '@/lib/api/__generated__/react-query-update';

/**
 * Single favourite item from the API response
 */
export type FavouriteItem = NonNullable<
  MyFavouritesQuery['myFavourites']['items']
>[number];

/**
 * Event data within a favourite item
 */
export type FavouriteEvent = NonNullable<FavouriteItem['event']>;
