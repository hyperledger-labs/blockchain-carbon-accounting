import type { 
  AppRouter 
} from '@blockchain-carbon-accounting/api-server';
import superjson from 'superjson';
import { createReactQueryHooks } from '@trpc/react';
import { useState } from 'react';
import { BASE_URL } from './api.config';

export const trpc = createReactQueryHooks<AppRouter>();
export const trpcClient = trpc.createClient({
  url: `${BASE_URL}/trpc`,
  transformer: superjson
})

export const useTrpcClient = () => useState(() => trpcClient);
