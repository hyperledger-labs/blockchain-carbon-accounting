import { createReactQueryHooks } from '@trpc/react';
import { useState } from 'react';
import type { AppRouter } from '../../../../../token-query-server/trpc/common';
import { BASE_URL } from './api.service';

export const trpc = createReactQueryHooks<AppRouter>();
export const trpcClient = trpc.createClient({
    url: `${BASE_URL}/trpc`,
  })

export const useTrpcClient = () => useState(() => trpcClient);

