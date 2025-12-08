'use client';

import {
  UpdateUserLocaleMutation,
  UpdateUserLocaleMutationVariables,
  UpdateUserTimezoneMutation,
  UpdateUserTimezoneMutationVariables,
  UpdateUserLocaleDocument,
  UpdateUserTimezoneDocument,
} from '@/lib/api/__generated__/react-query-update';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { useMutation } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/config/query-client';
import { gqlClient } from '@/lib/api/client';

/**
 * Hook to update user locale with automatic navigation
 *
 * @example
 * ```tsx
 * const { updateLocale, isPending } = useUpdateLocale();
 *
 * await updateLocale('pl'); // Updates DB and navigates to /pl/...
 * ```
 */
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

/**
 * Hook to update user timezone
 *
 * @example
 * ```tsx
 * const { updateTimezone, isPending } = useUpdateTimezone();
 *
 * await updateTimezone('Europe/Warsaw'); // Updates DB
 * ```
 */
export function useUpdateTimezone() {
  const qc = getQueryClient();

  const { mutateAsync, isPending, ...rest } = useMutation({
    mutationKey: ['UpdateUserTimezone'],
    mutationFn: async (variables: UpdateUserTimezoneMutationVariables) =>
      gqlClient.request<
        UpdateUserTimezoneMutation,
        UpdateUserTimezoneMutationVariables
      >(UpdateUserTimezoneDocument, variables),
    onSuccess: () => {
      // Invalidate all user-related queries to refetch with new timezone
      qc.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) &&
          (q.queryKey[0] === 'Me' || q.queryKey[0] === 'GetUserProfile'),
      });
    },
  });

  const updateTimezone = useMemo(
    () => async (timezone: string) => {
      try {
        // Validate IANA timezone format
        try {
          Intl.DateTimeFormat(undefined, { timeZone: timezone });
        } catch {
          throw new Error(`Invalid IANA timezone: ${timezone}`);
        }

        // Update timezone in database
        await mutateAsync({ timezone });
      } catch (error) {
        console.error('[useUpdateTimezone] Failed to update timezone:', error);
        throw error;
      }
    },
    [mutateAsync]
  );

  return {
    updateTimezone,
    isPending,
    ...rest,
  };
}
