import * as trpc from '@trpc/server'
import { Operator, OilAndGasAsset, Wallet } from '@blockchain-carbon-accounting/data-postgres';
import { z } from 'zod'
import { TrpcContext } from './common';

export const operatorRouter = (zQueryBundles:any) => trpc
.router<TrpcContext>()
.query('count', {
    input: z.object({
        bundles: zQueryBundles.default([]),
    }).default({}),
    async resolve({ input, ctx }) {
        try {
            return {
                status: 'success',
                count: await ctx.db.getOperatorRepo().count(input.bundles) 
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
        limit: z.number().gt(0).default(10),
        withTrackers: z.boolean().default(false)
    }).default({}),
    async resolve({ input, ctx }) {
        try {
            const operators = await ctx.db.getOperatorRepo()
                .selectPaginated(input.offset, input.limit, input.bundles, input.withTrackers);
            const count = await ctx.db.getOperatorRepo()
                .count(input.bundles);
            return {
                status: 'success',
                count,
                operators: Operator.toRaws(operators)
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
        uuid: z.string().default('')
    }).default({}),
    async resolve({ input, ctx }) {
        try {
            let operator = await ctx.db.getOperatorRepo()
                .getOperator(input.uuid);
            return {
                status: 'success',
                operator: Operator.toRaw(operator!),
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
.query('assets', {
    input: z.object({
        bundles: zQueryBundles.default([]),
        offset: z.number().gte(0).default(0),
        limit: z.number().gt(0).default(10)
    }).default({}),
    async resolve({ input, ctx }) {
        try {
            const assets = await ctx.db.getOilAndGasAssetRepo()
                .selectPaginated(input.offset, input.limit, input.bundles);
            const count = await ctx.db.getOilAndGasAssetRepo()
                .countAssets(input.bundles);
            return {
                status: 'success',
                count,
                assets: OilAndGasAsset.toRaws(assets)
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
export type OperatorRouter = typeof operatorRouter 

