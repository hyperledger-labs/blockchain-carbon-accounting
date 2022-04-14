import * as trpc from '@trpc/server'
import * as trpcExpress from '@trpc/server/adapters/express';
import { PostgresDBService } from 'blockchain-accounting-data-postgres/src/postgresDbService';
import { balanceRouter } from './balance.trpc'
import { walletRouter } from './wallet.trpc';

// created for each request, here set the DB connector
const createContext = async () => ({
  db: await PostgresDBService.getInstance()
})
export type TrpcContext = trpc.inferAsyncReturnType<typeof createContext>;

const createRouter = () => {
  return trpc.router<TrpcContext>();
}

const appRouter = createRouter()
  .merge('balance.', balanceRouter)
  .merge('wallet.', walletRouter)

export type AppRouter = typeof appRouter

export const trpcMiddleware = trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext,
  })

