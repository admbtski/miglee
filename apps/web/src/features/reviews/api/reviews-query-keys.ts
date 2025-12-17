import { GetReviewsQueryVariables } from '@/lib/api/__generated__/react-query-update';

export const reviewKeys = {
  all: ['reviews'] as const,
  lists: () => [...reviewKeys.all, 'list'] as const,
  list: (filters?: GetReviewsQueryVariables) =>
    [...reviewKeys.lists(), filters] as const,
  details: () => [...reviewKeys.all, 'detail'] as const,
  detail: (id: string) => [...reviewKeys.details(), id] as const,
  stats: (eventId: string) => [...reviewKeys.all, 'stats', eventId] as const,
  myReview: (eventId: string) => [...reviewKeys.all, 'my', eventId] as const,
};
