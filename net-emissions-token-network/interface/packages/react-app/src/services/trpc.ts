import type { AppRouter } from '@blockchain-carbon-accounting/api-server/trpc/common';
import { createReactQueryHooks } from '@trpc/react';
import { useState } from 'react';
import { BASE_URL } from './api.config';

export const trpc = createReactQueryHooks<AppRouter>();
export const trpcClient = trpc.createClient({
    url: `${BASE_URL}/trpc`,
  })

export const useTrpcClient = () => useState(() => trpcClient);
