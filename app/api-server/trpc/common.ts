import { PostgresDBService } from '@blockchain-carbon-accounting/data-postgres';
import superjson from 'superjson';
import * as trpc from '@trpc/server';
import * as trpcExpress from '@trpc/server/adapters/express';
import { TRPC_ERROR_CODE_KEY } from '@trpc/server/dist/declarations/src/rpc/codes';
import { z, ZodError } from 'zod';
import { OPTS } from '../server';
import { balanceRouter } from './balance.trpc';
import { emissionsFactorsRouter } from './emissions-factors.trpc';
import { emissionsRequestsRouter } from './emissions-requests.trpc';
import { walletRouter } from './wallet.trpc';
import { tokenRouter } from './token.trpc';
import { trackerRouter } from './tracker.trpc';
import { productTokenRouter } from './product-token.trpc';

export const zQueryBundles:any = z.array(z.object({
    field: z.string(),
    fieldType: z.string(),
    value: z.string().or(z.number()),
    op: z.string(),
    conjunction: z.boolean(),
}))

// created for each request, here set the DB connector
export const createContext = async ({ req }: trpcExpress.CreateExpressContextOptions) => {
  // get the client IP
  let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  console.log('Client IP:', ip);
  // if ip is an array take the first element
  if (ip instanceof Array) {
    ip = ip[0];
  }
  if (!ip) {
    console.warn('No client IP address found?', req.socket.remoteAddress, req.headers['x-forwarded-for']);
  }
  return {
    ip,
    db: await PostgresDBService.getInstance(),
    opts: OPTS
  }
}
export type TrpcContext = trpc.inferAsyncReturnType<typeof createContext>;

export const createRouter = () => {
  // this adds the zodError and domainError to the response which can then be
  // analyzed for input errors an user facing error messages
  return trpc.router<TrpcContext>()
    .transformer(superjson)
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
          error instanceof DomainError || error.cause instanceof DomainError
            ? error.message
            : null,
          domainErrorPath:
          error instanceof DomainInputError ? error.path : error.cause instanceof DomainInputError
            ? error.cause.path
            : null,
        }
      }
    })
}

const appRouter = createRouter()
  .merge('balance.', balanceRouter(zQueryBundles))
  .merge('token.', tokenRouter(zQueryBundles))
  .merge('wallet.', walletRouter(zQueryBundles))
  .merge('tracker.', trackerRouter(zQueryBundles))
  .merge('producToken.', productTokenRouter(zQueryBundles))
  .merge('emissionsFactors.', emissionsFactorsRouter(zQueryBundles))
  .merge('emissionsRequests.', emissionsRequestsRouter(zQueryBundles))

export type AppRouter = typeof appRouter

export const trpcMiddleware = trpcExpress.createExpressMiddleware({
  router: appRouter,
  createContext,
})

export class DomainError extends Error {
  status: TRPC_ERROR_CODE_KEY;
  details?: string;
  cause?: unknown;
  constructor(message: string, status: TRPC_ERROR_CODE_KEY = 'BAD_REQUEST', details?: string, cause?: unknown) {
    super(message);
    // Ensure the name of this error is the same as the class name
    this.name = this.constructor.name;
    this.status = status;
    this.details = details ?? message;
    this.cause = cause;
    // This clips the constructor invocation from the stack trace.
    // It's not absolutely essential, but it does make the stack trace a little nicer.
    //  @see Node.js reference (bottom)
    Error.captureStackTrace(this, this.constructor);
  }
}


export class DomainInputError extends DomainError {
  path: string
  constructor(path: string, message: string, status: TRPC_ERROR_CODE_KEY = 'BAD_REQUEST', details?: string, cause?: unknown) {
    super(message, status, details, cause);
    this.path = path
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

