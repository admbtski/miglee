import type { MyFavouritesQuery } from '@/lib/api/__generated__/react-query-update';

export type FavouriteItem = NonNullable<
  MyFavouritesQuery['myFavourites']['items']
>[number];

export type FavouriteEvent = NonNullable<FavouriteItem['event']>;
