import * as trpc from '@trpc/server'
import * as trpcExpress from '@trpc/server/adapters/express';
import { TRPC_ERROR_CODE_KEY } from '@trpc/server/dist/declarations/src/rpc/codes';
import { PostgresDBService } from 'blockchain-accounting-data-postgres/src/postgresDbService';
import { ZodError } from 'zod';
import { OPTS } from '../server';
import { balanceRouter } from './balance.trpc'
import { emissionsFactorsRouter } from './emissions-factors.trpc';
import { emissionsRequestsRouter } from './emissions-requests.trpc';
import { walletRouter } from './wallet.trpc';

// created for each request, here set the DB connector
const createContext = async () => ({
  db: await PostgresDBService.getInstance(),
  opts: OPTS
})
export type TrpcContext = trpc.inferAsyncReturnType<typeof createContext>;

const createRouter = () => {
  // this adds the zodError and domainError to the response which can then be
  // analyzed for input errors an user facing error messages
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
          domainError:
          error.cause instanceof DomainError
            ? error.message
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

export class DomainError extends Error {
  status: TRPC_ERROR_CODE_KEY;
  constructor(message: string, status: TRPC_ERROR_CODE_KEY = 'BAD_REQUEST') {
    super(message);
    // Ensure the name of this error is the same as the class name
    this.name = this.constructor.name;
    this.status = status;
    // This clips the constructor invocation from the stack trace.
    // It's not absolutely essential, but it does make the stack trace a little nicer.
    //  @see Node.js reference (bottom)
    Error.captureStackTrace(this, this.constructor);
  }
}

export function handleError(method: string, error: unknown) {
  console.error(`Error in ${method} method`, error)
  if (error instanceof DomainError) {
    throw new trpc.TRPCError({
      code: error.status,
      message: error.message,
      cause: error
    });
  }
  throw new trpc.TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: (typeof error === 'string') ? error : 'An unexpected error occurred, please try again later.',
    // optional: pass the original error to retain stack trace
    cause: error,
  });
}

