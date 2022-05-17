import { Response, Request } from 'express';
import { PostgresDBService } from "blockchain-accounting-data-postgres/src/postgresDbService";
import { QueryBundle } from 'blockchain-accounting-data-postgres/src/repositories/common';
import { ethers } from 'ethers';
import { Wallet } from 'blockchain-accounting-data-postgres/src/models/wallet';
import nodemailer from 'nodemailer';
import { DomainError } from '../trpc/common';

export async function getWallets(req: Request, res: Response) {
    try {
        // getting query from req body
        const db = await PostgresDBService.getInstance()
        const limit = req.body.limit;
        const offset = req.body.offset;
        const query = req.body.query || req.query.query;

        if (query) {
            const q = `${query}%`;
            const wallets = await db.getWalletRepo().lookupPaginated(offset, limit, q);
            const count = await db.getWalletRepo().countLookupWallets(q);
            return res.status(200).json({
                status: 'success',
                wallets,
                count
            });
        } else if (req.body.queryBundles) {
            const queryBundles: Array<QueryBundle> = req.body.queryBundles;
            if(offset != undefined && limit != undefined && limit != 0) {
                const wallets = await db.getWalletRepo().selectPaginated(offset, limit, queryBundles);
                const count = await db.getWalletRepo().countWallets(queryBundles);
                return res.status(200).json({
                    status: 'success',
                    wallets,
                    count
                });
            }
        }

        return res.status(400).json({
            status: 'failed',
            error: 'Bad query request'
        });
    } catch (error) {
        console.error(error)
        return res.status(500).json({
            status: 'failed',
            error
        });
    }
}

export async function insertNewWallet(req: Request, res: Response) {
    try {
        const db = await PostgresDBService.getInstance()
        // use mergeWallet to either create or just update based on non-empty values given
        // make sure the address is in the proper checksum format
        const address = ethers.utils.getAddress(req.body.address);
        const wallet = await db.getWalletRepo().mergeWallet({
            ...req.body,
            address
        });
        return res.status(200).json({
            status: 'success',
            wallet,
        });

    } catch (error) {
        console.error(error)
        return res.status(500).json({
            status: 'failed',
            error
        });
    }
}

export async function getNumOfWallets(req: Request, res: Response) {
    try {
        const db = await PostgresDBService.getInstance()
        const queryBundles: Array<QueryBundle> = req.body.queryBundles;
        const numOfWallets = await db.getWalletRepo().countWallets(queryBundles);
        return res.status(200).json({
            status: 'success',
            count: numOfWallets
        });
    } catch (error) {
        console.error(error)
        return res.status(500).json({
            status: 'failed',
            count: 0
        });
    }
}


export async function sendVerificationEmail(email: string, token?: string) {
    if (!token) {
        // generate one again (this is a resend)
        const db = await PostgresDBService.getInstance();
        const w = await db.getWalletRepo().findWalletByEmail(email);
        if (!w) {
            throw new DomainError('No wallet found with that email');
        }
        token = Wallet.generateVerificationToken();
        w.verification_token = token;
        w.verification_token_sent_at = new Date();
        await db.getWalletRepo().getRepository().save(w);
    }
    const opts = {
        host: process.env.MAILER_HOST || '',
        port: Number(process.env.MAILER_PORT),
        auth: {}
    }
    if (process.env.MAILER_USER && process.env.MAILER_PASS) {
        opts.auth = {
            user: process.env.MAILER_USER,
            pass: process.env.MAILER_PASS
        }
    }
    console.log('sendVerificationEmail', opts)
    const transporter = nodemailer.createTransport(opts)
    const link = new URL(`${process.env.VERIFY_ROOT_URL}/verify-email`)
    link.searchParams.append('token', token)
    link.searchParams.append('email', email)
    const message = {
        from: 'noreply@opentaps.com',
        to: email,
        subject: 'Verify your email',
        text: `Please verify your email by clicking on the following link: ${link.href}`,
        html: `<p>Please verify your email by clicking on the following link: <a href="${link.href}">verification link</a></p>`,
    }
    return new Promise((resolve, reject) => {
        transporter.sendMail(message, (err, info) => {
            if (err) {
                console.error('Error while sending the email:' ,err)
                reject(err)
            } else {
                console.log('Send email result:', info)
                resolve(info)
            }
        })
    });
}


export async function signupWallet(email: string, password: string) {

    const db = await PostgresDBService.getInstance();

    // check that a wallet with this email does not already exist
    const w = await db.getWalletRepo().findWalletByEmail(email);
    if (w) {
        throw new DomainError('Wallet already exists, try signing in instead');
    }

    const { password_hash, password_salt } = Wallet.generateHash(password);
    const verification_token = Wallet.generateVerificationToken();

    // check we can send the email first
    try {
        await sendVerificationEmail(email, verification_token);
    } catch (err){
        throw new DomainError('We could not send your verification email, please try again later.', 'INTERNAL_SERVER_ERROR');
    }

    // generate the ETH wallet
    const newAccount = ethers.Wallet.createRandom();
    console.log('address ', newAccount.address);
    console.log('mnemonic: ', newAccount.mnemonic.phrase);
    console.log('privateKey', newAccount.privateKey);

    await db.getWalletRepo().insertWallet({
        address: newAccount.address,
        private_key: newAccount.privateKey,
        public_key: newAccount.publicKey,
        email,
        password_hash,
        password_salt,
        verification_token,
        verification_token_sent_at: new Date(),
        email_verified: false
    });
}

export async function generateWalletWithCredentials(req: Request, res: Response) {
    try {
        await signupWallet(req.body.mailAddress, req.body.password);
        return res.status(200).json({
            status: 'success',
        });

    } catch (error) {
        console.error(error)
        return res.status(500).json({
            status: 'failed',
            error
        });
    }
}

export async function verify(email: string, token: string) {

    const db = await PostgresDBService.getInstance();

    // check that a wallet with this email does not already exist
    const w = await db.getWalletRepo().findWalletByEmail(email);
    if (!w || w.verification_token !== token) {
        throw new DomainError('Wallet not found');
    }

    // update the wallet as verified
    w.verification_token = undefined;
    w.email_verified = true;
    return await db.getWalletRepo().getRepository().save(w);
}

export async function verifyWalletEmail(req: Request, res: Response) {
    try {

        const w = await verify(req.body.email, req.body.token);
        if (w) {
            // redirect to sign-in page
            const url = new URL(`${process.env.APP_ROOT_URL}/sign-in`)
            url.searchParams.append('email', w.email || '')
            return res.status(302).redirect(url.href);
        }

        return res.status(404);

    } catch (error) {
        console.error(error)
        return res.status(500).json({
            status: 'failed',
            error
        });
    }
}


export async function signinWallet(email: string, password: string) {
    const db = await PostgresDBService.getInstance();
    const wallet = await db.getWalletRepo().findWalletByEmail(email, true);
    console.log('wallet?', wallet)
    if (!wallet || !wallet.email_verified || !wallet.checkPassword(password)) {
        if (!wallet) console.error('!! The email has no wallet yet');
        else if (!wallet.email_verified) console.error('!! The email has not been verified yet');
        else console.error('!! The password is incorrect');
        // return access denied in all cases in order not to leak any information
        throw new DomainError('Invalid credentials', 'UNAUTHORIZED');
    }
    // remove someof the properties the client should not have access to
    delete wallet.password_hash;
    delete wallet.password_salt;
    return wallet;
}

export async function getWalletWithCredentials(req: Request, res: Response) {
    try {
        const wallet = await signinWallet(req.body.mailAddress, req.body.password);
        return res.status(200).json({
            status: 'success',
            wallet,
        });

    } catch (error) {
        console.error(error)
        return res.status(401).json({
            status: 'failed',
            error
        });
    }
}
