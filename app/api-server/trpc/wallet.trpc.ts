import { Wallet } from '@blockchain-carbon-accounting/data-postgres';
import superjson from 'superjson';
import * as trpc from '@trpc/server';
import fetch from 'node-fetch';
import { ethers } from 'ethers';
import { z } from 'zod';
import { checkSignedMessage, getRoles } from '../controller/synchronizer';
import { changePassword, markPkExported, signinWallet, signupWallet } from '../controller/wallet.controller';
import { signinLimiter, signupAndResetLimiter } from '../utils/rateLimiter';
import { 
    DomainError, DomainInputError, handleError, TrpcContext
} from './common';

superjson.registerClass(Wallet);

const validAddress = z.string().refine((val) => ethers.utils.isAddress(val), {
    message: "Address must be a valid Ethereum address",
})

const validPassword = z.string().min(8).max(128)

export const walletRouter = (zQueryBundles:any) => trpc
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
                wallets: Wallet.toRaws(wallets)
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
                wallets: Wallet.toRaws(wallets)
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
                wallet: wallet ? Wallet.toRaw(wallet) : null
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
        captchaToken: z.string(),
        email: z.string().email(),
        password: validPassword,
        passwordConfirm: validPassword,
        name: z.string().optional(),
        organization: z.string().optional(),
    })
    .refine((data) => data.password === data.passwordConfirm, {
        message: "Passwords don't match",
        path: ["passwordConfirm"],
    }),
    async resolve({ input, ctx }) {
        try {
            if (process.env.RECAPTCHA_SECRET_KEY) {
                // Verify the Google reCapcha token v3
                const captchaResponse = await fetch(`https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${input.captchaToken}`);
                const captchaData = await captchaResponse.json() as {success: boolean};
                console.log('captchaToken was ', input.captchaToken);
                console.log('captchaData', captchaData);
                if (!captchaData.success) {
                    throw new DomainError('Invalid captcha token', 'BAD_REQUEST');
                }
            }

            try {
                await signupAndResetLimiter.consume(ctx.ip || 'unknown')
            } catch {
                throw new DomainError('Too many signup attempts from this IP address', 'BAD_REQUEST');
            }
            await signupWallet(input.email, input.password, input.name, input.organization);
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
            const private_key = await markPkExported(input.email, input.password);
            return { success: true, private_key }
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
        email: z.string().email().optional().or(z.literal('')),
        public_key: z.string().optional(),
        public_key_name: z.string().optional(),
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
            // check if is admin or self
            const isSelf = !!found && (account === found.address) || (account === input.address)
            const roles = await getRoles(account, ctx.opts)
            const isAdmin = roles && roles.isAdmin
            console.log(`Verified ${account} isSelf? ${isSelf} isAdmin? ${isAdmin}`)
            if (isSelf || isAdmin) {
                const toSave = found ? {...found, ...input, address: found.address} : {...input}
                // when saving, this could fail if one of the unique constraints is violated
                // here only `email` could cause an error
                const emailChanged = input.email && (found ? found.email?.toLowerCase() !== input.email.toLowerCase() : true)
                if (emailChanged) {
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    const emailWallet = await ctx.db.getWalletRepo().findWalletByEmail(input.email!)
                    if (emailWallet && emailWallet.address.toLowerCase() !== input.address.toLowerCase()) {
                        throw new DomainInputError('email', "This Email is already assigned to another user", "BAD_REQUEST")
                    }
                }

                const wallet = await ctx.db.getWalletRepo().getRepository().save(toSave)
                return { wallet: Wallet.toRaw(wallet) }
            }
            // deny access
            throw new DomainError("You don't have permission to update this wallet", 'FORBIDDEN')
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

            return { wallet: Wallet.toRaw(wallet) }
        } catch (error) {
            handleError('register', error)
        }
    },
})

// export type definition of API
export type WalletRouter = typeof walletRouter

