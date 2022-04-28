import * as trpc from '@trpc/server'
import * as trpcExpress from '@trpc/server/adapters/express';
import { PostgresDBService } from 'blockchain-accounting-data-postgres/src/postgresDbService';
import { ZodError } from 'zod';
import { balanceRouter } from './balance.trpc'
import { emissionsFactorsRouter } from './emissions-factors.trpc';
import { emissionsRequestsRouter } from './emissions-requests.trpc';
import { walletRouter } from './wallet.trpc';

// created for each request, here set the DB connector
const createContext = async () => ({
  db: await PostgresDBService.getInstance()
})
export type TrpcContext = trpc.inferAsyncReturnType<typeof createContext>;

const createRouter = () => {
  // this adds the zodError to the response which can then be
  // analyzed for input errors
  return trpc.router<TrpcContext>()
    .formatError(({ shape, error }) => {
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
  .merge('emissionsFactors.', emissionsFactorsRouter)
  .merge('emissionsRequests.', emissionsRequestsRouter)

export type AppRouter = typeof appRouter

export const trpcMiddleware = trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext,
  })

export function handleError(method: string, error: unknown) {
    console.error(`Error in ${method} method`, error)
    throw new trpc.TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred, please try again later.',
        // optional: pass the oroginal error to retain stack trace
        cause: error,
    });
}

