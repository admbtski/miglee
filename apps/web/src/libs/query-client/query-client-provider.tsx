'use client';

import { QueryClientProvider as QueryClientProviderTankStack } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { PropsWithChildren, useRef } from 'react';
import { getQueryClient } from './query-client';

export const QueryClientProvider = ({ children }: PropsWithChildren<{}>) => {
  const refClient = useRef(getQueryClient());

  return (
    <QueryClientProviderTankStack client={refClient.current}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProviderTankStack>
  );
};
