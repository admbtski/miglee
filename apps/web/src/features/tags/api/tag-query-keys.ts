import { GetTagQueryVariables } from '@/lib/api/__generated__/react-query-update';

export const GET_TAG_ONE_KEY = (variables?: GetTagQueryVariables) =>
  variables ? (['GetTag', variables] as const) : (['GetTag'] as const);
