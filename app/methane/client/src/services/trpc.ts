import type { 
  AppRouter 
} from '@blockchain-carbon-accounting/api-server';
import type { 
  AppRouter as MethaneAppRouter
} from '@blockchain-carbon-accounting/methane-server';
import superjson from 'superjson';
import { createReactQueryHooks } from '@trpc/react';
import { useState } from 'react';
import { BASE_URL, BASE_URL_METHANE } from './api.config';

export const trpc = createReactQueryHooks<AppRouter>();
export const trpcClient = createReactQueryHooks<AppRouter>().createClient({
  url: `${BASE_URL}/trpc`,
  transformer: superjson
})
export const trpcMethane = createReactQueryHooks<MethaneAppRouter>();
export const trpcMethaneClient = trpcMethane.createClient({
  url: `${BASE_URL_METHANE}/trpc`,
  transformer: superjson
})

export const useTrpcClient = () => useState(() => trpcClient);
export const useTrpcMethaneClient = () => useState(() => trpcMethaneClient);
