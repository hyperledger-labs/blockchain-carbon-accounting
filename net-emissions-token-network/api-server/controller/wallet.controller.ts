import { Response, Request } from 'express';
import { PostgresDBService } from "blockchain-accounting-data-postgres/src/postgresDbService";
import { QueryBundle } from 'blockchain-accounting-data-postgres/src/repositories/common';
import { ethers } from 'ethers';
import { Wallet } from 'blockchain-accounting-data-postgres/src/models/wallet';
import nodemailer from 'nodemailer';
import { DomainError } from '../trpc/common';
import handlebars from 'handlebars';
import { readFileSync } from 'fs';
import path from 'path';
import useragent from 'useragent';

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

export function getMailer() {
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
    console.log('getMailer', opts)
    return nodemailer.createTransport(opts)
}

export async function sendPasswordResetEmail(email: string, token: string, os?: string, browser?: string) {
    const transporter = getMailer();

    const link = new URL(`${process.env.APP_ROOT_URL}/reset-password`)
    link.searchParams.append('email', email)
    link.searchParams.append('token', token)

    const emailTemplateSourceHtml = readFileSync(path.join(__dirname, "../email/templates/reset-password.html"), "utf8")
    const emailTemplateSourceText = readFileSync(path.join(__dirname, "../email/templates/reset-password.txt"), "utf8")
    const templateHtml = handlebars.compile(emailTemplateSourceHtml)
    const templateText = handlebars.compile(emailTemplateSourceText)
    const tpl = {
        site_url: process.env.APP_ROOT_URL || 'http://localhost:3000',
        site_name: process.env.MAIL_SITE_NAME || 'Blockchain Accounting',
        company_name: process.env.MAIL_COMPANY_NAME || 'Blockchain Accounting',
        company_address_1: process.env.MAIL_COMPANY_ADDRESS_1 || '123 Main St.',
        company_address_2: process.env.MAIL_COMPANY_ADDRESS_2 || 'Suite 100',
        support_url: process.env.MAIL_SUPPORT_URL || 'mailto:support@opentaps.com',
        request_from_os: os || 'unknown OS',
        request_from_browser: browser || 'unknown browser',
        action_url: link.href,
    }
    const html = templateHtml(tpl)
    const text = templateText(tpl)

    const message = {
        from: 'noreply@opentaps.com',
        to: email,
        subject: 'Reset your password',
        html,
        text
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
    const transporter = getMailer();
    const link = new URL(`${process.env.VERIFY_ROOT_URL}/verify-email/${token}/${email}`)
    const emailTemplateSourceHtml = readFileSync(path.join(__dirname, "../email/templates/verify-email.html"), "utf8")
    const emailTemplateSourceText = readFileSync(path.join(__dirname, "../email/templates/verify-email.txt"), "utf8")
    const templateHtml = handlebars.compile(emailTemplateSourceHtml)
    const templateText = handlebars.compile(emailTemplateSourceText)
    const tpl = {
        site_url: process.env.APP_ROOT_URL || 'http://localhost:3000',
        site_name: process.env.MAIL_SITE_NAME || 'Blockchain Accounting',
        company_name: process.env.MAIL_COMPANY_NAME || 'Blockchain Accounting',
        company_address_1: process.env.MAIL_COMPANY_ADDRESS_1 || '123 Main St.',
        company_address_2: process.env.MAIL_COMPANY_ADDRESS_2 || 'Suite 100',
        support_url: process.env.MAIL_SUPPORT_URL || 'mailto:support@opentaps.com',
        action_url: link.href,
    }
    const html = templateHtml(tpl)
    const text = templateText(tpl)
    const message = {
        from: 'noreply@opentaps.com',
        to: email,
        subject: 'Verify your email',
        text,
        html
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

export async function changePassword(email: string, password: string, passwordConfirm: string, token?: string, currentPassword?: string) {

    const db = await PostgresDBService.getInstance();
    if (!token && !currentPassword) {
        throw new DomainError('You must provide either a token or current password');
    }
    if (token) console.log(`Changing password for ${email} with token ${token}`);
    else if (currentPassword) console.log(`Changing password for ${email} with current password`);

    // check that a wallet exists
    const w = await db.getWalletRepo().findWalletByEmail(email, true);

    // if a token was given it must match the wallet password_reset_token
    // else the current password must match the wallet password_hash
    // also password and passwordConfirm must match
    // password token must also be sent less than 24 hours ago
    if (!w || password.length < 8 || (password !== passwordConfirm) || (token && (w.password_reset_token !== token || !w.password_reset_token_sent_at || w.password_reset_token_sent_at.getTime() + (24 * 60 * 60 * 1000) < new Date().getTime() )) || (currentPassword && !w.checkPassword(currentPassword))) {
        console.error(!w ? 'No wallet found with that email: ' + email : 'Wrong token: ' + w.password_reset_token + ' vs ' + token);
        throw new DomainError('Invalid password change request');
    }

    // update the wallet password
    await db.getWalletRepo().changePassword(email, password);
    console.log(`Returning wallet`, w.email, w.address);
    return w;
}


export async function verify(email: string, token: string) {

    const db = await PostgresDBService.getInstance();
    console.log(`Verifying ${email} with token ${token}`);

    // check that a wallet exists
    const w = await db.getWalletRepo().findWalletByEmail(email, true);
    if (!w || w.verification_token !== token) {
        console.error(!w ? 'No wallet found with that email: ' + email : 'Wrong token: ' + w.verification_token + ' vs ' + token);
        throw new DomainError('Invalid verification request');
    }

    // update the wallet as verified
    await db.getWalletRepo().markEmailVerified(email);
    console.log(`Returning verified wallet`, w.email, w.address);
    return w;
}

export async function verifyWalletEmail(req: Request, res: Response) {
    try {
        const email = req.params.email;
        const token = req.params.token;

        const w = await verify(email, token);
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

export async function doPasswordRequest(req: Request, res: Response) {
    try {
        const email = req.params.email;
        // if we have a 
        const token = req.params.token;

        const w = await verify(email, token);
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

export async function passwordResetRequest(req: Request, res: Response) {
    try {
        const user_agent = useragent.parse(req.headers['user-agent'] || '');
        const email = req.params.email;
        await requestPasswordReset(email, user_agent.os.toString(), user_agent.toAgent());
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
export async function requestPasswordReset(email: string, os?: string, browser?: string) {

    const db = await PostgresDBService.getInstance();
    console.log(`Request password reset for ${email}`);

    // check that a wallet with this email does not already exist
    const w = await db.getWalletRepo().findWalletByEmail(email, true);
    if (!w || !w.email_verified) {
        console.error(!w ? 'No wallet found with that email: ' + email : 'Email not verified yet');
        // return "success" here so that we do not leak users email addresses
        // probably we could email the user if they registered but were not verified?
        return
    }

    // check that we did not send an email in the past 30 seconds
    // this leak is probably acceptable
    if (w.password_reset_token_sent_at && new Date().getTime() - w.password_reset_token_sent_at.getTime() < 30 * 1000) {
        throw new DomainError('You can only request a password reset every 30 seconds');
    }

    // send password reset email
    const reset_token = Wallet.generateVerificationToken();

    await sendPasswordResetEmail(email, reset_token, os, browser);

    // save the token
    await db.getWalletRepo().markPasswordResetRequested(email, reset_token);
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
