'use client';

import {
  UpdateUserTimezoneDocument,
  UpdateUserTimezoneMutation,
  UpdateUserTimezoneMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { getQueryClient } from '@/lib/config/query-client';
import { useMutation } from '@tanstack/react-query';
import { useMemo } from 'react';

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
