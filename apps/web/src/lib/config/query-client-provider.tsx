'use client';
import { QueryClientProvider as QueryClientProviderTankStack } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { PropsWithChildren } from 'react';
import { getQueryClient } from './query-client';

export const QueryClientProvider = ({ children }: PropsWithChildren<{}>) => {
  const client = getQueryClient();

  return (
    <QueryClientProviderTankStack client={client}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProviderTankStack>
  );
};
