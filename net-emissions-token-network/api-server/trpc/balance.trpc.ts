import * as trpc from '@trpc/server'
import { z } from 'zod'
import { TrpcContext } from './common';

export const zQueryBundles = z.array(z.object({
    field: z.string(),
    fieldType: z.string(),
    value: z.string().or(z.number()),
    op: z.string(),
}))

export const balanceRouter = trpc
.router<TrpcContext>()
.query('count', {
    input: z.object({
        bundles: zQueryBundles.default([]),
    }).default({}),
    async resolve({ input, ctx }) {
        try {
            return {
                status: 'success',
                count: await ctx.db.getBalanceRepo().count(input.bundles) 
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
            const balances = await ctx.db.getBalanceRepo().selectPaginated(input.offset, input.limit, input.bundles);
            const count = await ctx.db.getBalanceRepo().count(input.bundles);
            return {
                status: 'success',
                count, 
                balances
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
export type BalanceRouter = typeof balanceRouter 

