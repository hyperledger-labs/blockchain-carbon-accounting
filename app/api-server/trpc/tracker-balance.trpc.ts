import * as trpc from '@trpc/server'
import { TrackerBalance } from '@blockchain-carbon-accounting/data-postgres';
import { z } from 'zod'
import { TrpcContext } from './common';

export const trackerBalanceRouter = (zQueryBundles:any) => trpc
.router<TrpcContext>()
.query('count', {
    input: z.object({
        bundles: zQueryBundles.default([]),
    }).default({}),
    async resolve({ input, ctx }) {
        try {
            return {
                status: 'success',
                count: await ctx.db.getTrackerBalanceRepo().count(input.bundles) 
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
            const balances = await ctx.db.getTrackerBalanceRepo().selectPaginated(input.offset, input.limit, input.bundles);
            const count = await ctx.db.getTrackerBalanceRepo().count(input.bundles);
            return {
                status: 'success',
                count,
                balances: TrackerBalance.toRaws(balances)
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
.query('get', {
    input: z.object({
        trackerId: z.number().gte(0).default(0),
        issuedTo: z.string().default('0x0000000000000000000000000000000000000000')
    }).default({}),
    async resolve({ input, ctx }) {
        try {
            const balance = await ctx.db.getTrackerBalanceRepo().selectBalance(input.issuedTo,input.trackerId);
            return {
                status: 'success',
                balance: TrackerBalance.toRaw(balance!)
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
export type TrackerBalanceRouter = typeof trackerBalanceRouter 

