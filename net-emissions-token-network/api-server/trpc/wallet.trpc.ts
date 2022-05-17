import * as trpc from '@trpc/server'
import { ethers } from 'ethers';
import { z } from 'zod'
import { checkSignedMessage } from '../controller/synchronizer';
import { DomainError, handleError, TrpcContext } from './common';
import { Wallet } from 'blockchain-accounting-data-postgres/src/models/wallet';
import { changePassword, markPkExported, signinWallet, signupWallet } from '../controller/wallet.controller';
import { signinLimiter, signupAndResetLimiter } from '../utils/rateLimiter';

export const zQueryBundles = z.array(z.object({
    field: z.string(),
    fieldType: z.string(),
    value: z.string().or(z.number()),
    op: z.string(),
}))


const validAddress = z.string().refine((val) => ethers.utils.isAddress(val), {
    message: "Address must be a valid Ethereum address",
})

const validPassword = z.string().min(8).max(128)

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
            const wallets: Wallet[] = await ctx.db.getWalletRepo().selectPaginated(input.offset, input.limit, input.bundles);
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
.query('get', {
    input: z.object({
        address: validAddress,
    }),
    async resolve({ input, ctx }) {
        try {
            const wallet = await ctx.db.getWalletRepo().findWalletByAddress(input.address);
            return {
                wallet
            }
        } catch (error) {
            handleError('get', error)
        }
    },
})
.mutation('signin', {
    input: z.object({
        email: z.string().email(),
        password: validPassword,
    }),
    async resolve({ input, ctx }) {
        try {
            try {
                await signinLimiter.consume(ctx.ip || 'unknown')
            } catch {
                throw new DomainError('Too many signin attempts from this IP address', 'BAD_REQUEST');
            }
            const wallet = await signinWallet(input.email, input.password);
            return { wallet }
        } catch (error) {
            handleError('signin', error)
        }
    },
})
.mutation('signup', {
    input: z.object({
        email: z.string().email(),
        password: validPassword,
        passwordConfirm: validPassword,
    })
    .refine((data) => data.password === data.passwordConfirm, {
        message: "Passwords don't match",
        path: ["passwordConfirm"],
    }),
    async resolve({ input, ctx }) {
        try {
            try {
                await signupAndResetLimiter.consume(ctx.ip || 'unknown')
            } catch {
                throw new DomainError('Too many signup attempts from this IP address', 'BAD_REQUEST');
            }
            await signupWallet(input.email, input.password);
            return { success: true }
        } catch (error) {
            handleError('signup', error)
        }
    },
})
.mutation('changePassword', {
    input: z.object({
        email: z.string().email(),
        password: validPassword,
        passwordConfirm: validPassword,
        currentPassword: z.string().optional(),
        token: z.string().optional(),
    })
    .refine((data) => data.password === data.passwordConfirm, {
        message: "Passwords don't match",
        path: ["passwordConfirm"],
    })
    .refine((data) => data.token || data.currentPassword, {
        message: "Current password was not given",
        path: ["currentPassword"],
    }),
    async resolve({ input, ctx }) {
        try {
            try {
                await signupAndResetLimiter.consume(ctx.ip || 'unknown')
            } catch {
                throw new DomainError('Too many password requests attempts from this IP address', 'BAD_REQUEST');
            }
            await changePassword(input.email, input.password, input.passwordConfirm, input.token, input.currentPassword);
            return { success: true }
        } catch (error) {
            handleError('changePassword', error)
        }
    },
})
.mutation('markPkExported', {
    input: z.object({
        email: z.string().email(),
        password: validPassword,
    }),
    async resolve({ input }) {
        try {
            await markPkExported(input.email, input.password);
            return { success: true }
        } catch (error) {
            handleError('markPkExported', error)
        }
    },
})
.mutation('update', {
    input: z.object({
        address: validAddress,
        name: z.string().optional(),
        organization: z.string().optional(),
        public_key: z.string().optional(),
        metamask_encrypted_public_key: z.string().optional(),
        signature: z.string(),
    }),
    async resolve({ input, ctx }) {
        try {
            // check the signature
            const { signature, ...msg} = input;
            const message = JSON.stringify(msg)
            console.log('Verifying message', message)
            console.log('Verifying signature', signature)
            const account = checkSignedMessage(message, signature, ctx.opts)
            if (!account) {
                throw new Error("Failed to verify signature!")
            }
            console.log(`Verified signature from ${account}`)
            const found = await ctx.db.getWalletRepo().findWalletByAddress(input.address)
            if (found) {
                if (found.address !== account) {
                    throw new Error("Failed to verify signature!")
                }
                const wallet = await ctx.db.getWalletRepo().getRepository().save({
                    ...found,
                    ...input,
                    address: found.address
                })
                return {
                    wallet
                }
            } else {
                handleError('get', 'Wallet not found')
            }
        } catch (error) {
            handleError('get', error)
        }
    },
})
.mutation('register', {
    input: z.object({
        address: validAddress,
        name: z.string().optional(),
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
        address: validAddress,
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
        address: validAddress,
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

