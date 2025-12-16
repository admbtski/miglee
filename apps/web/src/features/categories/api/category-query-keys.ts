import { GetCategoryQueryVariables } from '@/lib/api/__generated__/react-query-update';

export const GET_CATEGORY_ONE_KEY = (variables?: GetCategoryQueryVariables) =>
  variables
    ? (['GetCategory', variables] as const)
    : (['GetCategory'] as const);
