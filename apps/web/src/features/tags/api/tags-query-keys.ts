import { GetTagsQueryVariables } from '@/lib/api/__generated__/react-query-update';

export const GET_TAGS_LIST_KEY = (variables?: GetTagsQueryVariables) =>
  variables ? (['GetTags', variables] as const) : (['GetTags'] as const);
