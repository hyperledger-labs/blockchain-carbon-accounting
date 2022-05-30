import superjson from 'superjson';
import { createReactQueryHooks } from '@trpc/react';
import { useState } from 'react';
import type { AppRouter } from 'api-server/trpc/common';
import { BASE_URL } from './api.config';

export const trpc = createReactQueryHooks<AppRouter>();
export const trpcClient = trpc.createClient({
  url: `${BASE_URL}/trpc`,
  transformer: superjson
})

export const useTrpcClient = () => useState(() => trpcClient);
