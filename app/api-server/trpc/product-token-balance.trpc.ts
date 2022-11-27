import * as trpc from '@trpc/server'
import { ProductTokenBalance } from '@blockchain-carbon-accounting/data-postgres';
import { z } from 'zod'
import { TrpcContext } from './common';

export const productTokenBalanceRouter = (zQueryBundles:any) => trpc
.router<TrpcContext>()
.query('count', {
    input: z.object({
        bundles: zQueryBundles.default([]),
    }).default({}),
    async resolve({ input, ctx }) {
        try {
            return {
                status: 'success',
                count: await ctx.db.getProductTokenBalanceRepo().count(input.bundles) 
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
            const balances = await ctx.db.getProductTokenBalanceRepo().selectPaginated(input.offset, input.limit, input.bundles);
            const count = await ctx.db.getProductTokenBalanceRepo().count(input.bundles);
            return {
                status: 'success',
                count,
                balances: ProductTokenBalance.toRaws(balances)
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
        productId: z.number().gte(0).default(0),
        issuedTo: z.string().default('0x0000000000000000000000000000000000000000')
    }).default({}),
    async resolve({ input, ctx }) {
        try {
            const balance = await ctx.db.getProductTokenBalanceRepo().selectBalance(input.issuedTo,input.productId);
            return {
                status: 'success',
                balance: ProductTokenBalance.toRaw(balance!)
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
export type ProductTokenBalanceRouter = typeof productTokenBalanceRouter 

