import { GetCommentsQueryVariables } from '@/lib/api/__generated__/react-query-update';

export const commentKeys = {
  all: ['comments'] as const,
  lists: () => [...commentKeys.all, 'list'] as const,
  list: (filters?: GetCommentsQueryVariables) =>
    [...commentKeys.lists(), filters] as const,
  details: () => [...commentKeys.all, 'detail'] as const,
  detail: (id: string) => [...commentKeys.details(), id] as const,
};
