import { GetCategoriesQueryVariables } from '@/lib/api/__generated__/react-query-update';

export const GET_CATEGORIES_LIST_KEY = (
  variables?: GetCategoriesQueryVariables
) =>
  variables
    ? (['GetCategories', variables] as const)
    : (['GetCategories'] as const);
