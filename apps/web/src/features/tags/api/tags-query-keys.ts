import type {
  GetTagQueryVariables,
  GetTagsQueryVariables,
} from '@/lib/api/__generated__/react-query-update';

export const tagsKeys = {
  all: ['tags'] as const,
  lists: () => [...tagsKeys.all, 'list'] as const,
  list: (variables?: GetTagsQueryVariables) =>
    [...tagsKeys.lists(), variables] as const,
  details: () => [...tagsKeys.all, 'detail'] as const,
  detail: (variables?: GetTagQueryVariables) =>
    [...tagsKeys.details(), variables] as const,
};
