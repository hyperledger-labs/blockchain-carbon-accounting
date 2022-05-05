import * as trpc from '@trpc/server'
import { z } from 'zod'
import { handleError, TrpcContext } from './common';


export const emissionsFactorsRouter = trpc
.router<TrpcContext>()
.query('getLevel1s', {
    input: z.object({
        scope: z.string().optional(),
    }),
    async resolve({ input, ctx }) {
        try {
            const emissionsFactors = await ctx.db.getEmissionsFactorRepo().getEmissionsFactorsLevel1s(input);
            return {
                emissionsFactors, 
            }
        } catch (error) {
            handleError('emissionsFactorsRouter.lookup', error)
        }
    },
})
.query('getLevel2s', {
    input: z.object({
        scope: z.string().optional(),
        level_1: z.string(),
    }),
    async resolve({ input, ctx }) {
        try {
            const emissionsFactors = await ctx.db.getEmissionsFactorRepo().getEmissionsFactorsLevel2s(input);
            return {
                emissionsFactors, 
            }
        } catch (error) {
            handleError('emissionsFactorsRouter.lookup', error)
        }
    },
})
.query('getLevel3s', {
    input: z.object({
        scope: z.string().optional(),
        level_1: z.string(),
        level_2: z.string(),
    }),
    async resolve({ input, ctx }) {
        try {
            const emissionsFactors = await ctx.db.getEmissionsFactorRepo().getEmissionsFactorsLevel3s(input);
            return {
                emissionsFactors, 
            }
        } catch (error) {
            handleError('emissionsFactorsRouter.lookup', error)
        }
    },
})
.query('getLevel4s', {
    input: z.object({
        scope: z.string().optional(),
        level_1: z.string(),
        level_2: z.string(),
        level_3: z.string(),
    }),
    async resolve({ input, ctx }) {
        try {
            const emissionsFactors = await ctx.db.getEmissionsFactorRepo().getEmissionsFactorsLevel4s(input);
            return {
                emissionsFactors, 
            }
        } catch (error) {
            handleError('emissionsFactorsRouter.lookup', error)
        }
    },
})
.query('getElectricityCountries', {
    input: z.object({
        scope: z.string().optional(),
    }),
    async resolve({ input, ctx }) {
        try {
            const countries = await ctx.db.getEmissionsFactorRepo().getElectricityCountries(input);
            return {
                countries,
            }
        } catch (error) {
            handleError('emissionsFactorsRouter.lookup', error)
        }
    },
})
.query('getElectricityUSAStates', {
    async resolve({ ctx }) {
        try {
            const states = await ctx.db.getEmissionsFactorRepo().getElectricityUSAStates();
            return {
                states,
            }
        } catch (error) {
            handleError('emissionsFactorsRouter.lookup', error)
        }
    },
})
.query('getElectricityUSAUtilities', {
    input: z.object({
        state_province: z.string().optional(),
    }),
    async resolve({ input, ctx }) {
        try {
            const utilities = await ctx.db.getEmissionsFactorRepo().getElectricityUSAUtilities(input);
            return {
                utilities,
            }
        } catch (error) {
            handleError('emissionsFactorsRouter.lookup', error)
        }
    },
})
.query('lookup', {
    input: z.object({
        scope: z.string().optional(),
        level_1: z.string(),
        level_2: z.string().optional(),
        level_3: z.string().optional(),
        level_4: z.string().optional(),
    }),
    async resolve({ input, ctx }) {
        try {
            const emissionsFactors = await ctx.db.getEmissionsFactorRepo().getEmissionsFactors(input);
            return {
                emissionsFactors, 
            }
        } catch (error) {
            handleError('emissionsFactorsRouter.lookup', error)
        }
    },
})


// export type definition of API
export type EmissionsFactorsRouter = typeof emissionsFactorsRouter 

