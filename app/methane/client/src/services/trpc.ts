import type { 
  AppRouter
} from '@blockchain-carbon-accounting/methane-server';
import superjson from 'superjson';
import { createReactQueryHooks } from '@trpc/react';
import { useState } from 'react';
import { BASE_URL_METHANE } from './api.config';

export const trpcMethane = createReactQueryHooks<AppRouter>();
export const trpcMethaneClient = trpcMethane.createClient({
  url: `${BASE_URL_METHANE}/trpc`,
  transformer: superjson
})

export const useTrpcMethaneClient = () => useState(() => trpcMethaneClient);
