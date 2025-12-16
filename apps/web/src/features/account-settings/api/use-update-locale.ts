'use client';

import {
  UpdateUserLocaleDocument,
  UpdateUserLocaleMutation,
  UpdateUserLocaleMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { getQueryClient } from '@/lib/config/query-client';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';

export function useUpdateLocale() {
  const router = useRouter();
  const qc = getQueryClient();

  const { mutateAsync, isPending, ...rest } = useMutation({
    mutationKey: ['UpdateUserLocale'],
    mutationFn: async (variables: UpdateUserLocaleMutationVariables) =>
      gqlClient.request<
        UpdateUserLocaleMutation,
        UpdateUserLocaleMutationVariables
      >(UpdateUserLocaleDocument, variables),
    onSuccess: () => {
      // Invalidate all user-related queries to refetch with new locale
      qc.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) &&
          (q.queryKey[0] === 'Me' || q.queryKey[0] === 'GetUserProfile'),
      });
    },
  });

  const updateLocale = useMemo(
    () => async (newLocale: 'en' | 'pl' | 'de') => {
      try {
        // 1. Update locale in database
        await mutateAsync({ locale: newLocale });

        // 2. Navigate to new locale URL
        const currentPath = window.location.pathname;
        // Extract current locale from path (first segment after /)
        const pathSegments = currentPath.split('/').filter(Boolean);
        const currentLocale = pathSegments[0] || 'en';

        // Check if first segment is a valid locale
        if (['en', 'pl', 'de'].includes(currentLocale)) {
          // Replace locale in path
          const newPath = `/${newLocale}/${pathSegments.slice(1).join('/')}`;
          router.push(newPath);
        } else {
          // No locale in path, prepend it
          router.push(`/${newLocale}${currentPath}`);
        }
      } catch (error) {
        console.error('[useUpdateLocale] Failed to update locale:', error);
        throw error;
      }
    },
    [mutateAsync, router]
  );

  return {
    updateLocale,
    isPending,
    ...rest,
  };
}
