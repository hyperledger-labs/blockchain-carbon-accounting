import { Balance } from "@blockchain-carbon-accounting/data-postgres/src/models/balance";
import { Sync } from "@blockchain-carbon-accounting/data-postgres/src/models/sync";
import { Wallet } from "@blockchain-carbon-accounting/data-postgres/src/models/wallet";
import { PostgresDBService } from "@blockchain-carbon-accounting/data-postgres/src/postgresDbService";
import { BalancePayload, TokenPayload, ProductPayload, TrackerPayload } from '@blockchain-carbon-accounting/data-postgres/src/repositories/common';
import { readFileSync } from 'fs';
import handlebars from 'handlebars';
import path from 'path';
import { EventData } from 'web3-eth-contract';
import { CreatedToken } from "../models/commonTypes";
import { OPTS_TYPE } from "../server";
import { getMailer, getSiteAndAddress } from "../utils/email";
import { BURN, getContract, getTrackerContract, getCurrentBlock, getWeb3 } from "../utils/web3";
import { insertNewBalance } from "./balance.controller";

// set to block number of contract creation from the explorer such as https://testnet.bscscan.com/
const FIRST_BLOCK = Number(process.env['LEDGER_FIRST_BLOCK']) || 0;
const EVENTS_BLOCK_INTERVAL = Number(process.env['LEDGER_EVENTS_BLOCK_INTERVAL']) || 2048;

/** Perform the startup synchronization with the blockchain and returns the current block number. */
export const startupSync = async(opts: OPTS_TYPE) => {
    // FIRST_BLOCK is the block number of the contract deployment as set in .env
    const fromBlock = "hardhat" === opts.network_name ? 0 : FIRST_BLOCK;
    let syncFromBlock = fromBlock;

    // if we do not have a Sync entry or we are on Hardhat local network
    // we clear the data and resync from the beginning.
    if ("hardhat" !== opts.network_name) {
        // get the last synced block
        const lastSync = await getLastSync(opts);
        if (lastSync) {
            syncFromBlock = lastSync + 1;
        }
    } else {
        console.log('* Running on Hardhat local network. Clearing data and resyncing.');
    }

    // so only clear if we want to start from fresh
    if (syncFromBlock == fromBlock) {
        try {
            await clearTokensDBData();
            await clearWalletsRolesDBData();
        } catch (err) {
            console.error('An error occurred while truncating the table', err)
            throw err
        }
    }

    // run the sync process
    return await runSync(syncFromBlock, opts);
}

/** Runs token and events synchronization from the given block then saves the lastSync block in the DB. */
export const runSync = async (syncFromBlock: number, opts: OPTS_TYPE, sendEmail = false) => {
    console.log(`--- Synchronization from block ${syncFromBlock} started at: `, new Date().toLocaleString());
    const started = Date.now();
    let lastBlock = 0;

    try {
        await fillProductTokens(opts, sendEmail);
        await fillTrackers(opts, sendEmail);
        lastBlock = await fillTokens(opts, sendEmail);
        console.log('-- blockchain last block: ', lastBlock);
    } catch (err) {
        console.error('An error occurred while fetching the tokens', err)
        throw err
    }

    // check if we are already synced up to the current block
    if (lastBlock < syncFromBlock) {
        console.log('* Already synced up to the current block.');
        return lastBlock;
    }

    try {
        console.log('-- checking blockchain events for blocks: ', syncFromBlock, lastBlock);
        await syncEvents(syncFromBlock, lastBlock, opts);
    } catch (err) {
        console.error('An error occurred while filling balances', err)
        throw err
    }

    const elapsed = Date.now() - started;
    console.log(`--- Synchronization completed in ${elapsed / 1000} seconds.\n`);
    return lastBlock;
}


/** Read the event log and process events.
 * - For wallet: check the roles for each account, sync them into the Wallet DB (create entries if missing)
 *  Note for the dealer events the actual role depends on the token.
 *  Instead of relying on the event we just use them to collect the addresses of the accounts,
 *  then use getRoles to get the final roles from the contract.
 * - For balances: check transfers and update the balances in the DB
 *
 * Finally saves the lastSync block in the DB
 */
export const syncEvents = async (fromBlock: number, currentBlock: number, opts: OPTS_TYPE) => {
    try {
        const db = await PostgresDBService.getInstance()

        const account_events = [
            {event: 'RegisteredConsumer', role: 'Consumer'},
            {event: 'UnregisteredConsumer', role: 'Consumer'},
            {event: 'RegisteredDealer', role: 'Dealer'},
            {event: 'UnregisteredDealer', role: 'Dealer'},
            {event: 'RegisteredIndustry', role: 'Industry'},
            {event: 'UnregisteredIndustry', role: 'Industry'},
        ];
        const accountAddresses: Record<string, boolean> = {};
        const syncedAccountAddresses: Record<string, boolean> = {};
        let toBlock = fromBlock;
        while (toBlock <= currentBlock) {
            if (fromBlock + EVENTS_BLOCK_INTERVAL > currentBlock) {
                toBlock = currentBlock;
            } else {
                toBlock = fromBlock + EVENTS_BLOCK_INTERVAL;
            }
            console.log(`Syncing events from block ${fromBlock} to ${toBlock} ...`);
            const events = await getContract(opts).getPastEvents("allEvents", {fromBlock, toBlock});
            for (const event of events) {
                const eventName = event.event;
                console.log("? event: ", event);
                if (account_events.find(ev => ev.event === eventName)) {
                    const account = event.returnValues.account
                    if (!accountAddresses[account]) {
                      accountAddresses[account] = true
                      console.log("- found account: ", account);
                    }
                } else if ('TransferSingle' === eventName) {
                    // handle the transfers for calculating balances here as well
                    await handleTransferEvent(event, db);
                }
            }

            // save the sync status so it can be resumed later
            // the wallet roles should be saved as well before that or
            // those addresses may be forgotten if we crash in this loop ...
            for (const address in accountAddresses) {
                if (!syncedAccountAddresses[address]) {
                    await syncWalletRoles(address, opts);
                    syncedAccountAddresses[address] = true;
                }
            }
            await saveLastSync(toBlock, opts);

            if (toBlock == currentBlock) break;
            fromBlock += EVENTS_BLOCK_INTERVAL;
        }
    } catch (err) {
        console.error(err)
        throw new Error('Error in syncEvents: ' + err)
    }
}

export const getRoles = async (address: string, opts: OPTS_TYPE) => {
  return await getContract(opts).methods.getRoles(address).call();
}

/** Update a Wallet in the DB with the current roles from the contract. */
export const syncWalletRoles = async (address: string, opts: OPTS_TYPE, data?: Partial<Wallet>) => {
    try {
        const db = await PostgresDBService.getInstance()
        console.log("getting roles for ", address);
        const rolesInfo = await getRoles(address, opts);
        console.log("roles for ", address, rolesInfo);
        const roles = [];
        if (rolesInfo.isAdmin) roles.push('Admin');
        if (rolesInfo.isConsumer) roles.push('Consumer');
        if (rolesInfo.isRecDealer) roles.push('REC Dealer');
        if (rolesInfo.isCeoDealer) roles.push('Offset Dealer');
        if (rolesInfo.isAeDealer) roles.push('Emission Auditor');
        if (rolesInfo.isIndustry) roles.push('Industry');
        if (rolesInfo.isIndustryDealer) roles.push('Industry Dealer');

        const w = await db.getWalletRepo().ensureWalletWithRoles(address, roles, data);
        console.log('saved wallet',w)
    } catch (err) {
        console.error(err)
        throw new Error('Error in getNumOfUniqueTokens: ' + err)
    }
}


export const checkSignedMessage = (message: string, signature: string, opts: OPTS_TYPE) => {
  return getWeb3(opts).eth.accounts.recover(message, signature)
}


/** Get number of unique tokens on the blockchain. */
const getNumOfUniqueTokens = async (opts: OPTS_TYPE): Promise<number> => {
    try {
        const result = await getContract(opts).methods.getNumOfUniqueTokens().call();
        return result;
    } catch (err) {
        console.error(err)
        throw new Error('Error in getNumOfUniqueTokens: ' + err)
    }
}

/** Get number of unique tokens on the blockchain. */
const getNumOfProductTokens = async (opts: OPTS_TYPE): Promise<number> => {
    try {
        const result = await getTrackerContract(opts).methods._numOfProducts().call();
        return result;
    } catch (err) {
        console.error(err)
        throw new Error('Error in _numOfProducts: ' + err)
    }
}

/** Get number of unique tokens on the blockchain. */
const getNumOfTrackers = async (opts: OPTS_TYPE): Promise<number> => {
    try {
        const result = await getTrackerContract(opts).methods._numOfUniqueTrackers().call();
        return result;
    } catch (err) {
        console.error(err)
        throw new Error('Error in _numOfUniqueTrackers: ' + err)
    }
}

/** Get the token details from the blockchain, but totalIssued and totalRetired are set to 0. */
async function getTokenDetails(tokenId: number, opts: OPTS_TYPE): Promise<TokenPayload> {
    try {
        const token: CreatedToken = await getContract(opts).methods.getTokenDetails(tokenId).call();
        return getCreatedToken(token);
    } catch (err) {
        console.error(err);
        throw new Error('Error in getTokenDetails: ' + err);
    }
}

/** Get the product details from the blockchain */
async function getProductDetails(productId: number, opts: OPTS_TYPE): Promise<ProductPayload> {
    try {
        const product: ProductPayload = await getTrackerContract(opts).methods._productData(productId).call();
        //getProductOptionalDetails
        product.productId = productId;
        return product;
    } catch (err) {
        console.error(err);
        throw new Error('Error in getProductDetails: ' + err);
    }
}

/** Get the product details from the blockchain */
async function getTrackerDetails(trackerId: number, opts: OPTS_TYPE): Promise<TrackerPayload> {
    try {
        const result: any = await getTrackerContract(opts).methods.getTrackerDetails(trackerId).call();
        const tracker: TrackerPayload = Object.assign({}, result[0]);
        console.log(result);
        tracker.totalEmissions = result[1];
        return tracker;
    } catch (err) {
        console.error(err);
        throw new Error('Error in getTrackerDetails: ' + err);
    }
}


export const getCreatedToken = (token: CreatedToken) => {

    // restructure
    const _metadata = token.metadata as string;
    // eslint-disable-next-line
    let metaObj: any = {};
    try {
        if (_metadata) metaObj = JSON.parse(_metadata);
    } catch (error) {
        console.error('Invalid JSON in token metadata:', _metadata);
        metaObj = {}
    }
    const _manifest = token.manifest as string;
    // eslint-disable-next-line
    let manifestObj: any = {};
    try {
        if (_manifest) manifestObj = JSON.parse(_manifest);
    } catch (error) {
        console.error('Invalid JSON in token manifest:', _manifest);
        manifestObj = {}
    }

    // extract scope and type
    let scope = null, type = null;
    if(Object.prototype.hasOwnProperty.call(metaObj,'Scope')) scope = metaObj['Scope'];
    else if(Object.prototype.hasOwnProperty.call(metaObj,'scope')) scope = metaObj['scope'];
    if(Object.prototype.hasOwnProperty.call(metaObj,'Type')) type = metaObj['Type'];
    else if(Object.prototype.hasOwnProperty.call(metaObj,'type')) type = metaObj['type'];

    // build token model
    // eslint-disable-next-line
    const { metadata, manifest, totalIssued, totalRetired, issuedFrom, ..._tokenPayload } = { ...token };
    let issuedFromAddr = '';
    if (issuedFrom && issuedFrom !== '0') {
        issuedFromAddr = '0x' + BigInt(issuedFrom).toString(16);
    }
    const tokenPayload: TokenPayload = {
        ..._tokenPayload,
        scope,
        type,
        issuedFrom: issuedFromAddr,
        // reset totalIssued and totalRetired
        totalIssued: 0n,
        totalRetired: 0n,
        metadata: metaObj,
        manifest: manifestObj
    };

    return tokenPayload;
}

/** Clear the token and balance tables. */
export const clearTokensDBData = async () => {
    const db = await PostgresDBService.getInstance()
    await db.getTokenRepo().truncateTokens();
    // truncate balances is also done by truncate tokens
    console.log('--- Tables has been cleared. ----\n')
}

/** Clear the wallet roles data. */
export const clearWalletsRolesDBData = async () => {
    const db = await PostgresDBService.getInstance()
    await db.getWalletRepo().clearWalletsRoles()
    console.log('--- Wallets roles have been cleared. ----\n')
}

/** Sync the tokens from the blockchain and returns the blockchain current block number.
This does not depend on a starting block as we rely on the fact that token ids are sequential.
*/
export const fillTokens = async (opts: OPTS_TYPE, sendEmail: boolean): Promise<number> => {
    const db = await PostgresDBService.getInstance()

    // get number tokens from database
    const numOfSavedTokens = await db.getTokenRepo().countTokens([]);
    // get number tokens from network
    const numOfIssuedTokens = await getNumOfUniqueTokens(opts);

    // get the token details from the network
    if (numOfIssuedTokens > numOfSavedTokens) {
        // note: this should only get NEW tokens as tokenId auto-increments, but double check anyway
        for (let tokenId = numOfSavedTokens + 1; tokenId <= numOfIssuedTokens; tokenId++) {
            // if the token is not in the database, get the initial details and save it
            const t = await db.getTokenRepo().selectToken(tokenId);
            if (!t) {
                const token: TokenPayload = await getTokenDetails(tokenId, opts);
                await db.getTokenRepo().insertToken(token);
                if (sendEmail) await sendTokenIssuedEmail(token);
            }
        }
    }
    console.log(`${numOfIssuedTokens - numOfSavedTokens} new tokens of ${numOfIssuedTokens} are stored into database.`);
    return await getCurrentBlock(opts);
}

/** Sync the tokens from the blockchain and returns the blockchain current block number.
This does not depend on a starting block as we rely on the fact that token ids are sequential.
*/
export const fillProductTokens = async (opts: OPTS_TYPE, sendEmail: boolean) => {
    const db = await PostgresDBService.getInstance()

    // get number tokens from database
    const numOfSavedProducts = await db.getProductTokenRepo().countProducts([]);
    // get number tokens from network
    let numOfIssuedProducts = 0;
    try {
        numOfIssuedProducts = await getNumOfProductTokens(opts);
    } catch (err) {
        console.error(err);
        numOfIssuedProducts = 0;
    }

    // get the token details from the network
    if (numOfIssuedProducts > numOfSavedProducts) {
        // note: this should only get NEW tokens as tokenId auto-increments, but double check anyway
        for (let productId = numOfSavedProducts + 1; productId <= numOfIssuedProducts; productId++) {
            // if the token is not in the database, get the initial details and save it
            const t = await db.getProductTokenRepo().selectProduct(productId);
            if (!t) {
                const product: ProductPayload = await getProductDetails(productId, opts);
                await db.getProductTokenRepo().insertProductToken(product);
                // TO-DO sendProductIssuedEmail ?
                //if (sendEmail) await sendTokenIssuedEmail(token);
            }
        }
    }
    console.log(`${numOfIssuedProducts - numOfSavedProducts} new tokens of ${numOfIssuedProducts} are stored into database.`);
    return await getCurrentBlock(opts);
}

/** Sync the tokens from the blockchain and returns the blockchain current block number.
This does not depend on a starting block as we rely on the fact that token ids are sequential.
*/
export const fillTrackers = async (opts: OPTS_TYPE, sendEmail: boolean) => {
    const db = await PostgresDBService.getInstance()

    // get number tokens from database
    const numOfSavedTrackers = await db.getTrackerRepo().countTrackers([]);
    console.log(numOfSavedTrackers)
    // get number tokens from network
    let numOfIssuedTrackers = 0;
    try {
        numOfIssuedTrackers = await getNumOfTrackers(opts);
    } catch (err) {
        console.error(err);
        numOfIssuedTrackers = 0;
    }
    console.log(numOfIssuedTrackers)
    console.log('num of trackers');
    // get the token details from the network
    if (numOfIssuedTrackers > numOfSavedTrackers) {
        // note: this should only get NEW tokens as tokenId auto-increments, but double check anyway
        for (let trackerId = numOfSavedTrackers + 1; trackerId <= numOfIssuedTrackers; trackerId++) {
            // if the token is not in the database, get the initial details and save it
            const t = await db.getTrackerRepo().selectTracker(trackerId);
            if (!t) {
                const tracker: TrackerPayload = await getTrackerDetails(trackerId, opts);
                // TO-DO get metaObj from result[0]
                console.log('save tracker to postgres');
                console.log(trackerId);
                console.log(tracker);
                await db.getTrackerRepo().insertTracker(tracker);
                // TO-DO sendTrackerIssuedEmail ?
                //if (sendEmail) await sendTrackerIssuedEmail(tracker);
            }
        }
    }
    console.log(`${numOfIssuedTrackers - numOfSavedTrackers} new tokens of ${numOfIssuedTrackers} are stored into database.`);
    return await getCurrentBlock(opts);
}

// eslint-disable-next-line
const handleTransferEvents = async (singleTransfers: any[]) => {
    const db = await PostgresDBService.getInstance()
    const len = singleTransfers.length;
    for (let i = 0; i < len; i++) {
        handleTransferEvent(singleTransfers[i], db);
    }
}

// eslint-disable-next-line
export const handleTransferEvent = async (event: EventData, db: PostgresDBService) => {
    const singleTransfer = event.returnValues;
    const tokenId: number = singleTransfer.id;
    const from: string = singleTransfer.from;
    const to: string = singleTransfer.to;
    const amount = BigInt(singleTransfer.value); // it must be divided by 10^3
    // issue case
    if (from == BURN) {
        const balancePayload: BalancePayload = {
            tokenId,
            issuedTo: to,
            available: amount,
            retired: 0n,
            transferred: 0n
        }

        // resolve conflicts
        const balance: Balance | null = await db.getBalanceRepo().selectBalance(to, tokenId);
        if (balance != undefined) {
            console.error(`Error in handleTransferEvent: balance already exists for ${to} and tokenId ${tokenId} and token was just issued.`);
            return;
        }

        await insertNewBalance(balancePayload);
        await db.getTokenRepo().updateTotalIssued(tokenId, amount);
        console.log(`--- ${amount} of Token ${tokenId} Issued to ${to}`);
        return;
    }

    // retire case
    if (to == BURN) {
        // update issuee balance
        await db.getBalanceRepo().retireBalance(from, tokenId, amount);

        // update token balance
        await db.getTokenRepo().updateTotalRetired(tokenId, amount);
        console.log(`--- ${amount} of Token ${tokenId} Retired from ${from}`);
        return;
    }

    // general transfer!
    // 1) deduct 'from' balance
    await db.getBalanceRepo().transferBalance(from, tokenId, amount);

    // 2) add available 'to' balance
    const balance: Balance | null = await db.getBalanceRepo().selectBalance(to, tokenId);
    if (balance == undefined) {
        const balancePayload: BalancePayload = {
            tokenId,
            issuedTo: to,
            available: amount,
            retired: 0n,
            transferred: 0n
        }
        await insertNewBalance(balancePayload);
    } else {
        await db.getBalanceRepo().addAvailableBalance(to, tokenId, amount);
    }
    console.log(`--- ${amount} of Token ${tokenId} transferred from ${from} to ${to}`);
}

/** Updates the token balances since the last Sync. **Only for use in the synchronizeTokens middleware**. */
export const fillBalances = async (currentBlock: number, opts: OPTS_TYPE) => {
    const fromBlock: number = "hardhat" === process.env.LEDGER_ETH_NETWORK ? 0 : FIRST_BLOCK;
    let syncFromBlock = fromBlock;
    let toBlock: number | string = fromBlock;

    // we do not have to resync from scratch since this was done during startup
    // so we should always have a lastSync here.
    // get the last synced block
    const lastSync = await getLastSync(opts);
    if (lastSync) {
        syncFromBlock = lastSync + 1;
    }
    // check if we are already synced up to the current block
    if (currentBlock < syncFromBlock) {
        console.log('* Already synced up to the current block.');
        return;
    }

    while (toBlock < currentBlock) {
        // target event is TokenRetired & TransferSingle
        if (syncFromBlock + EVENTS_BLOCK_INTERVAL > currentBlock) {
            toBlock = currentBlock;
        } else {
            toBlock = syncFromBlock + EVENTS_BLOCK_INTERVAL;
        }
        console.log(`Syncing balances from block ${syncFromBlock} to ${toBlock} ...`);
        const singleTransfers = await getContract(opts).getPastEvents('TransferSingle', {syncFromBlock, toBlock});
        await handleTransferEvents(singleTransfers);

        if (toBlock == currentBlock) break;
        syncFromBlock += EVENTS_BLOCK_INTERVAL;
    }

    // save the lastSync
    await saveLastSync(currentBlock, opts);
}

/** Save the current block in `Sync` with the contract network and address. */
export const saveLastSync = async (currentBlock: number, opts: OPTS_TYPE) => {
    const db = await PostgresDBService.getInstance();
    await db.getConnection().getRepository(Sync).save({
        id: 1,
        block: currentBlock,
        network: opts.network_name,
        contract: opts.contract_address
    });
}

/** Get the last block number in `Sync` for the contract network and address. */
export const getLastSync = async (opts: OPTS_TYPE) => {
    const db = await PostgresDBService.getInstance();
    const lastSync = await db.getConnection().getRepository(Sync).findOneBy({id: 1});
    if (lastSync && lastSync.block) {
        // also check that the network and contract matches the record
        // in case we changed or configuration (ie: when switching from local tests to deployed contracts)
        if (lastSync.network === opts.network_name && lastSync.contract === opts.contract_address) {
            return lastSync.block;
        } else {
            console.log('* Network or contract mismatch. Will be resyncing.');
        }
    } else {
        console.log('* No last sync block found. Will be resyncing.');
    }
    // if no last sync or mistmatched config, return FIRST_BLOCK
    return FIRST_BLOCK;
}

export const sendTokenIssuedEmail = async(token: TokenPayload) => {
    // send email if token is Audited Emissions token
    if (token.tokenTypeId == 3) {
        console.log(`sendTokenIssuedEmail to address ${token.issuedTo}`);
        // check wallet has email
        const db = await PostgresDBService.getInstance();
        const w = await db.getWalletRepo().selectWallet(token.issuedTo);
        if (w) {
            if (w.email) {
                const transporter = getMailer();
                const site_url = process.env.APP_ROOT_URL || 'http://localhost:3000';
                const link = new URL(`${site_url}/dashboard/token/${token.tokenId}`);
                const link_all = new URL(`${site_url}/dashboard`);
                const emailTemplateSourceHtml = readFileSync(path.join(__dirname, "../email/templates/issue-token.html"), "utf8")
                const emailTemplateSourceText = readFileSync(path.join(__dirname, "../email/templates/issue-token.txt"), "utf8")
                const templateHtml = handlebars.compile(emailTemplateSourceHtml)
                const templateText = handlebars.compile(emailTemplateSourceText)
                const tpl = {
                    ...getSiteAndAddress(),
                    token_url: link.href,
                    dashboard_url: link_all.href,
                }

                const html = templateHtml(tpl);
                const text = templateText(tpl);
                const message = {
                    from: process.env.MAILER_FROM_ADDRESS,
                    to: w.email,
                    subject: 'An audited emissions token has been issued to you!',
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
            } else {
                console.warn(`Wallet ${token.issuedTo} email address is not set.`);
            }
        } else {
            console.warn(`There are no wallet ${token.issuedTo} in the database`);
        }
    }
}
