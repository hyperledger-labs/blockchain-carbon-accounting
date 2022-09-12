import { Wallet } from '@blockchain-carbon-accounting/data-postgres/src/models/wallet';
import nodemailer from 'nodemailer';

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

export function getSiteAndAddress() {
    const tpl = {
        site_url: process.env.APP_ROOT_URL || 'http://localhost:3000',
        site_name: process.env.MAIL_SITE_NAME || 'Blockchain Accounting',
        company_name: process.env.MAIL_COMPANY_NAME || 'Blockchain Accounting',
        company_address_1: process.env.MAIL_COMPANY_ADDRESS_1 || '123 Main St.',
        company_address_2: process.env.MAIL_COMPANY_ADDRESS_2 || 'Suite 100',
        support_url: process.env.MAIL_SUPPORT_URL || 'mailto:support@opentaps.com',
        contact_us_url: process.env.MAIL_CONTACT_US_URL,
    }

    return tpl;
}

export function getWalletInfo(w?: Partial<Wallet> | null) {
    const tpl = {
        wallet_name: w?.name || 'user',
    }
    return tpl;
}
