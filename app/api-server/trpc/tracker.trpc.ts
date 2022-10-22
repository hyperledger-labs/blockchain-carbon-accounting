import * as trpc from '@trpc/server'
import { Tracker } from '@blockchain-carbon-accounting/data-postgres';
import { z } from 'zod'
import { TrpcContext } from './common';

export const trackerRouter = (zQueryBundles:any) => trpc
.router<TrpcContext>()
.query('count', {
    input: z.object({
        bundles: zQueryBundles.default([]),
    }).default({}),
    async resolve({ input, ctx }) {
        try {
            return {
                status: 'success',
                count: await ctx.db.getTrackerRepo().countTrackers(input.bundles) 
            }
        } catch (error) {
            console.error(error)
            return {
                status: 'failed',
                error
            }
        }
    },
})
.query('list', {
    input: z.object({
        bundles: zQueryBundles.default([]),
        offset: z.number().gte(0).default(0),
        limit: z.number().gt(0).default(10)
    }).default({}),
    async resolve({ input, ctx }) {
        try {
            const trackers = await ctx.db.getTrackerRepo().selectPaginated(input.offset, input.limit, input.bundles);
            const count = await ctx.db.getTrackerRepo().countTrackers(input.bundles);
            return {
                status: 'success',
                count,
                trackers: Tracker.toRaws(trackers)
            }
        } catch (error) {
            console.error(error)
            return {
                status: 'failed',
                error
            }
        }
    },
})

// export type definition of API
export type TokenRouter = typeof trackerRouter


