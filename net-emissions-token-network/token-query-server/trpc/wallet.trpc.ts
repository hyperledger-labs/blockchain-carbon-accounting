import * as trpc from '@trpc/server'
import { ethers } from 'ethers';
import { z } from 'zod'
import { TrpcContext } from './common';

export const zQueryBundles = z.array(z.object({
    field: z.string(),
    fieldType: z.string(),
    value: z.string().or(z.number()),
    op: z.string(),
}))


function handleError(method: string, error: unknown) {
    console.error(`Error in ${method} method`, error)
    throw new trpc.TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred, please try again later.',
        // optional: pass the oroginal error to retain stack trace
        cause: error,
    });
}

export const walletRouter = trpc
.router<TrpcContext>()
.query('count', {
    input: z.object({
        bundles: zQueryBundles.default([]),
    }).default({}),
    async resolve({ input, ctx }) {
        try {
            return {
                count: await ctx.db.getWalletRepo().countWallets(input.bundles) 
            }
        } catch (error) {
            handleError('count', error)
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
            const wallets = await ctx.db.getWalletRepo().selectPaginated(input.offset, input.limit, input.bundles);
            const count = await ctx.db.getWalletRepo().countWallets(input.bundles);
            return {
                count, 
                wallets
            }
        } catch (error) {
            handleError('list', error)
        }
    },
})
.query('lookup', {
    input: z.object({
        query: z.string(),
        offset: z.number().gte(0).default(0),
        limit: z.number().gt(0).default(10)
    }),
    async resolve({ input, ctx }) {
        try {
            const wallets = await ctx.db.getWalletRepo().lookupPaginated(input.offset, input.limit, input.query+'%');
            const count = await ctx.db.getWalletRepo().countLookupWallets(input.query);
            return {
                count, 
                wallets
            }
        } catch (error) {
            handleError('lookup', error)
        }
    },
})
.mutation('register', {
    input: z.object({
        address: z.string(),
        name: z.string().min(5),
        organization: z.string().optional(),
        public_key: z.string().optional(),
        public_key_name: z.string().optional(),
        roles: z.array(z.string()),
    }),
    async resolve({ input, ctx }) {
        try {
            // make sure the address is in the proper checksum format
            const address = ethers.utils.getAddress(input.address);
            // note: use mergeWallet which allows updating an existing entry
            const {address: _address, roles :_roles, ...data} = input
            const wallet = await ctx.db.getWalletRepo().ensureWalletWithRoles(address, input.roles, data);

            return {
                wallet
            }
        } catch (error) {
            handleError('register', error)
        }
    },
})
.mutation('registerRoles', {
    input: z.object({
        address: z.string(),
        roles: z.array(z.string()),
    }),
    async resolve({ input, ctx }) {
        try {
            // make sure the address is in the proper checksum format
            const address = ethers.utils.getAddress(input.address);
            // make sure the wallet exists
            const wallet = await ctx.db.getWalletRepo().ensureWalletHasRoles(address, input.roles)
            return {
                wallet
            }
        } catch (error) {
            handleError('registerRoles', error)
        }
    },
})
.mutation('unregisterRoles', {
    input: z.object({
        address: z.string(),
        roles: z.array(z.string()),
    }),
    async resolve({ input, ctx }) {
        try {
            // make sure the address is in the proper checksum format
            const address = ethers.utils.getAddress(input.address);
            // make sure the wallet exists
            const wallet = await ctx.db.getWalletRepo().ensureWalletHasNotRoles(address, input.roles)
            return {
                wallet
            }
        } catch (error) {
            handleError('unregisterRoles', error)
        }
    },
})

// export type definition of API
export type WalletRouter = typeof walletRouter 

