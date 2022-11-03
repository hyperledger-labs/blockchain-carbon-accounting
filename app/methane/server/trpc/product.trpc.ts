import * as trpc from '@trpc/server'
import { Product } from '@blockchain-carbon-accounting/data-postgres';
import { z } from 'zod'
import { TrpcContext } from './common';

export const productRouter = (zQueryBundles:any) => trpc
.router<TrpcContext>()
.query('list', {
    input: z.object({
        bundles: zQueryBundles.default([]),
        offset: z.number().gte(0).default(0),
        limit: z.number().gt(0).default(10),
        fromAssets: z.boolean().default(false),
    }).default({}),
    async resolve({ input, ctx }) {
        try {
            const products = await ctx.db.getProductRepo()
                .selectPaginated(input.offset, input.limit, 
                    input.bundles, input.fromAssets);
            const count = await ctx.db.getProductRepo()
                .count(input.bundles, input.fromAssets);
            return {
                status: 'success',
                count,
                products: Product.toRaws(products)
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
            const product = await ctx.db.getProductRepo()
                .getProduct(input.uuid);
            return {
                status: 'success',
                product: Product.toRaw(product!)
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
.query('distinctAttributes', {
    input: z.object({
        bundles: zQueryBundles.default([]),
        field: z.string().default('name'),
        fromAssets: z.boolean().default(false),
    }).default({}),
    async resolve({input, ctx}){
        try{
            const attributes = await ctx.db.getProductRepo()
                .getDistinctAttributes(input.bundles,input.field,input.fromAssets);
            return {
                status: 'success',
                attributes,
            }
        } catch (error){
            console.error(error)
            return {
                status: 'failed',
                error
            }
        }
    }
})
.query('totals', {
    input: z.object({
        offset: z.number().gte(0).default(0),
        limit: z.number().gt(0).default(10),
        bundles: zQueryBundles.default([]),
        fromAssets: z.boolean().default(false),
    }).default({}),
    async resolve({input, ctx}){
        try{
            const products = await ctx.db.getProductRepo()
                .getTotals(input.offset, input.limit,
                    input.bundles, input.fromAssets);
            const count = (await ctx.db.getProductRepo()
                .getTotals(0,0,input.bundles, input.fromAssets)).length;
            return {
                status: 'success',
                products: Product.toRaws(products),
                count
            }
        } catch (error){
            console.error(error)
            return {
                status: 'failed',
                error
            }
        }
    }
})
// export type definition of API
export type ProductRouter = typeof productRouter 

