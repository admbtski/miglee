import type {
  GetCategoriesQueryVariables,
  GetCategoryQueryVariables,
} from '@/lib/api/__generated__/react-query-update';

export const categoriesKeys = {
  all: ['categories'] as const,
  lists: () => [...categoriesKeys.all, 'list'] as const,
  list: (variables?: GetCategoriesQueryVariables) =>
    [...categoriesKeys.lists(), variables] as const,
  details: () => [...categoriesKeys.all, 'detail'] as const,
  detail: (variables?: GetCategoryQueryVariables) =>
    [...categoriesKeys.details(), variables] as const,
};
