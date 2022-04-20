import * as trpc from '@trpc/server'
import * as trpcExpress from '@trpc/server/adapters/express';
import { PostgresDBService } from 'blockchain-accounting-data-postgres/src/postgresDbService';
import { ZodError } from 'zod';
import { balanceRouter } from './balance.trpc'
import { walletRouter } from './wallet.trpc';

// created for each request, here set the DB connector
const createContext = async () => ({
  db: await PostgresDBService.getInstance()
})
export type TrpcContext = trpc.inferAsyncReturnType<typeof createContext>;

const createRouter = () => {
    // this adds the zodError to the response which can then be
    // analyzed for input errors
    return trpc.router<TrpcContext>().formatError(({ shape, error }) => {
        return {
            ...shape,
            data: {
                ...shape.data,
                zodError:
                error.code === 'BAD_REQUEST' &&
                    error.cause instanceof ZodError
                    ? error.cause.flatten()
                    : null,
            }
        }
    })
}

const appRouter = createRouter()
  .merge('balance.', balanceRouter)
  .merge('wallet.', walletRouter)

export type AppRouter = typeof appRouter

export const trpcMiddleware = trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext,
  })

