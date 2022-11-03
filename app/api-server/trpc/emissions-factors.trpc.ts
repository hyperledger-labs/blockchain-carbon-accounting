import * as trpc from '@trpc/server'
import { z } from 'zod'
import { handleError, TrpcContext, zQueryBundles } from './common';
import { ActivityInterface } from "@blockchain-carbon-accounting/data-common"
//import { UtilityLookupItemInterface } from "@blockchain-carbon-accounting/emissions_data_lib"
export const emissionsFactorsRouter = (zQueryBundles:any) => trpc
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
            handleError('emissionsFactorsRouter.getLevel1s', error)
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
            handleError('emissionsFactorsRouter.getLevel2s', error)
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
            handleError('emissionsFactorsRouter.getLevel3s', error)
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
            handleError('emissionsFactorsRouter.getLevel4s', error)
        }
    },
})
.query('getElectricityCountries', {
    input: z.object({
        scope: z.string().optional(),
        from_year: z.string().optional(),
        thru_year: z.string().optional(),
    }),
    async resolve({ input, ctx }) {
        try {
            const countries = await ctx.db.getEmissionsFactorRepo().getElectricityCountries(input);
            return {
                countries,
            }
        } catch (error) {
            handleError('emissionsFactorsRouter.getElectricityCountries', error)
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
            handleError('emissionsFactorsRouter.getElectricityUSAStates', error)
        }
    },
})
.query('getElectricityUSAUtilities', {
    input: z.object({
        state_province: z.string().optional(),
        from_year: z.string().optional(),
        thru_year: z.string().optional(),
    }),
    async resolve({ input, ctx }) {
        try {
            const utilities = await ctx.db.getEmissionsFactorRepo().getElectricityUSAUtilities(input);
            return {
                utilities,
            }
        } catch (error) {
            handleError('emissionsFactorsRouter.getElectricityUSAUtilities', error)
        }
    },
})
.query('get', {
    input: z.object({
        uuid: z.string(),
    }),
    async resolve({ input, ctx }) {
        try {
            const emissionsFactor = await ctx.db.getEmissionsFactorRepo().getEmissionFactor(input.uuid);
            return {
                emissionsFactor,
            }
        } catch (error) {
            handleError('emissionsFactorsRouter.get', error)
        }
    },
})
.query('getEmissions', {
    input: z.object({
        scope: z.string(),
        level_1: z.string(),
        level_2: z.string(),
        level_3: z.string(),
        level_4: z.string(),
        text: z.string(),
        activity_uom: z.string(),
        activity: z.number(),
    }),
    async resolve({ input, ctx }) {
        try {
            const activity: ActivityInterface = {
                scope : input.scope,
                level_1 : input.level_1,
                level_2 : input.level_2,
                level_3 : input.level_3,
                level_4 : input.level_4,
                text : input.text,
                activity : input.activity,
                activity_uom : input.activity_uom,
               }
            const emissionsFactor = await ctx.db.getEmissionsFactorRepo().getCO2EmissionByActivity(activity);
            return {
                emissionsFactor,
            }
        } catch (error) {
            handleError('emissionsFactorsRouter.getEmissions', error)
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
        activity_uom: z.string().optional(),
        from_year: z.string().optional(),
        thru_year: z.string().optional(),
        fallback: z.object({
            scope: z. string().optional(),
            level_1: z.string(),
            level_2: z.string().optional(),
            level_3: z.string().optional(),
            level_4: z.string().optional(),
            activity_uom: z.string().optional(),
            from_year: z.string().optional(),
            thru_year: z.string().optional(),
        }).optional(),
    }),
    async resolve({ input, ctx }) {
        try {
            const { fallback, ...query} = input;
            const emissionsFactors = await ctx.db.getEmissionsFactorRepo().getEmissionsFactors(query, fallback);
            return {
                emissionsFactors,
            }
        } catch (error) {
            handleError('emissionsFactorsRouter.lookup', error)
        }
    },
})
.query('getEmissionsByUtilityLookUpItem', {
    input: z.object({
        uuid: z.string(),
        usage: z.number(),
        usageUOM: z.string(),
        thruDate: z.string(),
    }),
    async resolve({ input, ctx }) {
        try {
            const lookup = await ctx.db.getUtilityLookupItemRepo()
                .getUtilityLookupItem(input.uuid)
            if(lookup){
                return await ctx.db.getEmissionsFactorRepo()
                    .getCO2EmissionFactorByLookup(
                        lookup,input.usage,input.usageUOM,input.thruDate);
            }
        } catch (error) {
            handleError('emissionsFactorsRouter.getEmissions', error)
        }
    },
})


// export type definition of API
export type EmissionsFactorsRouter = typeof emissionsFactorsRouter 

