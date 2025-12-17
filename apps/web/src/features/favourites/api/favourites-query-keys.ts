import { MyFavouritesQueryVariables } from '@/lib/api/__generated__/react-query-update';

export const favouritesKeys = {
  all: ['Favourites'] as const,
  lists: () => [...favouritesKeys.all, 'list'] as const,
  list: (variables?: Omit<MyFavouritesQueryVariables, 'offset'>) =>
    [...favouritesKeys.lists(), variables] as const,
  listInfinite: (variables?: Omit<MyFavouritesQueryVariables, 'offset'>) =>
    [...favouritesKeys.lists(), 'infinite', variables] as const,
  details: () => [...favouritesKeys.all, 'detail'] as const,
  detail: (eventId: string) => [...favouritesKeys.details(), eventId] as const,
};
