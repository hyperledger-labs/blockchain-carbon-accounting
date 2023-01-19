import { 
    Balance, Sync, Wallet, PostgresDBService,
    Tracker,TrackerBalance,ProductTokenBalance,TrackedProduct,
    TokenPayload, ProductTokenPayload, TrackerPayload, TrackedProductPayload, TrackedTokenPayload,
    BalancePayload,TrackerBalancePayload, ProductTokenBalancePayload, 
} from '@blockchain-carbon-accounting/data-postgres';
import { readFileSync } from 'fs';
import handlebars from 'handlebars';
import path from 'path';
import { EventData } from 'web3-eth-contract';
import { CreatedToken } from "../models/commonTypes";
import { OPTS_TYPE } from "../server";
import { getMailer, getSiteAndAddress, getWalletInfo } from "../utils/email";
import { BURN, getContract, getTrackerContract, getCurrentBlock, getWeb3 } from "../utils/web3";
import { insertNewBalance } from "./balance.controller";
import { insertNewTrackerBalance } from "./trackerBalance.controller";
import { insertNewProductTokenBalance } from "./productTokenBalance.controller";

import helpers from 'handlebars-helpers';

helpers({ handlebars })

// set to block number of contract creation from the explorer such as https://testnet.bscscan.com/
const FIRST_BLOCK = Number(process.env['LEDGER_FIRST_BLOCK']) || 0;
const EVENTS_BLOCK_INTERVAL = Number(process.env['LEDGER_EVENTS_BLOCK_INTERVAL']) || 2048;

/** Perform the startup synchronization with the blockchain and returns the current block number. */
export const startupSync = async(opts: OPTS_TYPE) => {
    // FIRST_BLOCK is the block number of the contract deployment as set in .env
    const fromBlock = "hardhat" === opts.network_name ? 0 : FIRST_BLOCK;
    console.log('-> Starting synchronization from block ' + fromBlock);
    let syncFromBlock = fromBlock;

    // if we do not have a Sync entry or we are on Hardhat local network
    // we clear the data and resync from the beginning.
    if ("hardhat" !== opts.network_name) {
        // get the last synced block
        const lastSync = await getLastSync(opts);
        if (lastSync && lastSync != FIRST_BLOCK) {
            syncFromBlock = lastSync + 1;
        }
    } else {
        console.log('* Running on Hardhat local network. Clearing data and resyncing.');
    }
    console.log('-> syncFromBlock ' + syncFromBlock);

    // so only clear if we want to start from fresh
    if (syncFromBlock == fromBlock) {
        console.log('* Clearing data and resyncing.');
        try {
            await clearTokensDBData();
            await clearWalletsRolesDBData();
            await clearTrackersDBData();
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
        await fillTrackers(opts, sendEmail);
        await fillProductTokens(opts, sendEmail);

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
            {event: 'RoleGranted'},
            {event: 'RoleRevoked'},
            {event: 'RegisteredConsumer', role: 'Consumer'},
            {event: 'UnregisteredConsumer', role: 'Consumer'},
            {event: 'RegisteredDealer', role: 'Dealer'},
            {event: 'UnregisteredDealer', role: 'Dealer'},
            {event: 'RegisteredIndustry', role: 'Industry'},
            {event: 'UnregisteredIndustry', role: 'Industry'},
        ];

        const tracker_events = [
            {event: 'TrackerEvent'},
            //{event: 'TrackerIssued'},
            {event: 'ProductsIssued'},
            {event: 'TransferProducts'},
            {event: 'VerifierApproval'},
            {event: 'ApproveProductTransfer'}
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

            const trackerEvents = await getTrackerContract(opts).getPastEvents("allEvents", {fromBlock, toBlock});
            for (const event of trackerEvents) {
                const eventName = event.event;
                console.log("? event: ", event);

                const block = await getWeb3(opts).eth.getBlock(event.blockNumber);
                if(eventName === 'TransferProducts'){
                    handleTransferProductEvent(event,db)
                }else if (['TransferSingle','TransferBatch'].includes(eventName)) {
                    // handle the transfers for calculating balances here as well
                    await handleTransferTrackerEvent(event, db, opts);
                } else if (eventName === 'TrackTokens'){
                    const trackerId = Number(event.returnValues.trackerId);
                    const tracker = await getTrackerDetails(trackerId, opts, db);
                    // update trackerDetails
                    if(tracker) await db.getTrackerRepo().insertTracker(tracker);
                    tracker?.dateCreated ?
                        await db.getTrackerRepo().setDateUpdated(trackerId,Number(block.timestamp))
                        :await db.getTrackerRepo().setDateCreated(trackerId,Number(block.timestamp)) 
                    const tokenIds = event.returnValues.tokenIds.map(Number);
                    const tokenAmounts = event.returnValues.tokenAmounts.map(BigInt);
                    for(let i=0; i<tokenIds.length; i++){
                        // insert/update TrackedProduct
                        const trackedTokenPayload: TrackedTokenPayload = {trackerId, tokenId: tokenIds[i], amount: tokenAmounts[i]}
                        await db.getTrackedTokenRepo().insert(trackedTokenPayload)
                    }
                }else if (eventName === 'TrackProduct'){
                    const trackerId = Number(event.returnValues.trackerId);
                    const productId = Number(event.returnValues.productId);
                    const amount = BigInt(event.returnValues.productAmount);
                    
                    // update trackerDetails totalEmissions
                    const tracker = await getTrackerDetails(trackerId, opts, db);
                    if(tracker) await db.getTrackerRepo().insertTracker(tracker)

                    // insert/update TrackedProduct
                    const trackedProductPayload: TrackedProductPayload = {trackerId, productId, amount}
                    await db.getTrackedProductRepo().insert(trackedProductPayload)

                }else if (eventName === 'ProductsIssued'){
                    const trackerId = Number(event.returnValues.trackerId);
                    const tracker = await getTrackerDetails(trackerId, opts, db);
                    // update trackerDetails totalProductAmount
                    if(tracker) await db.getTrackerRepo().insertTracker(tracker)
                    // update issued product details
                    event.returnValues.productIds.map(async(productId:number) => {
                        const product = await getProductDetails(productId, opts);
                        if(product) await db.getProductTokenRepo().insertProductToken(product);
                        product?.dateCreated ?
                            await db.getProductTokenRepo().setDateUpdated(productId,Number(block.timestamp))
                            :await db.getProductTokenRepo().setDateCreated(productId,Number(block.timestamp)) 
                    });
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
        if (rolesInfo.isAeDealer) roles.push('Emissions Auditor');
        if (rolesInfo.isIndustry) roles.push('Industry');
        if (rolesInfo.isIndustryDealer) roles.push('Industry Dealer');

        // get the current wallet roles, so we can notify of roles that changed
        const w0 = await db.getWalletRepo().findWalletByAddress(address);
        if (w0) {
            const addedRoles = []
            const removedRoles = []
            const currentRoles = w0.roles?.split(',') ?? []
            for (const r of roles) {
                if (currentRoles.indexOf(r) === -1) {
                    addedRoles.push(r)
                }
            }
            for (const r of currentRoles) {
                if (r === '') continue;
                if (roles.indexOf(r) === -1) {
                    removedRoles.push(r)
                }
            }
            if (addedRoles.length > 0 || removedRoles.length > 0) {
                sendRolesChangedEmail(w0, addedRoles, removedRoles)
            }
        }

        const w = await db.getWalletRepo().ensureWalletWithRoles(address, roles, data);
        console.log('saved wallet address: ', w.address)
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
        const result = await getTrackerContract(opts).methods.getNumOfUniqueProducts().call();
        return result;
    } catch (err) {
        console.error(err)
        throw new Error('Error in getNumOfProductTokens: ' + err)
    }
}

/** Get number of unique trackers on the blockchain. */
const getNumOfTrackers = async (opts: OPTS_TYPE): Promise<number> => {
    try {
        const result = await getTrackerContract(opts).methods.getNumOfUniqueTrackers().call();
        return result;
    } catch (err) {
        console.error(err)
        throw new Error('Error in getNumOfUniqueTrackers: ' + err)
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
async function getProductDetails(productId: number, opts: OPTS_TYPE): Promise<ProductTokenPayload|undefined> {
    try {
        const productData = await getTrackerContract(opts).methods._productData(productId).call();
        
        productData.trackerId = Number(productData.trackerId);
        productData.tokenId = Number(productData.tokenId);
        if(productData.trackerId===0){
            console.warn('Skipping product with no assigned trackerId!')
            return
        }else{
        }
        const tokenDetails: any = await getTrackerContract(opts).methods._tokenDetails(productData.tokenId).call();
        if(tokenDetails.metadata.length>0){
            tokenDetails.metadata = JSON.parse(tokenDetails.metadata) as any
        }
        if(tokenDetails.manifest.length>0){
            tokenDetails.manifest = JSON.parse(tokenDetails.manifest) as any
        }
        const block = await getWeb3(opts).eth.getBlock(await getCurrentBlock(opts));
        const product:ProductTokenPayload = {
            ...tokenDetails, ...productData, ...{
                productId: Number(productId),
                issued: BigInt(productData.issued),
                available: BigInt(productData.available),
                retired: 0n,
                name: tokenDetails.metadata.name,
                unitAmount: Number(tokenDetails.metadata.unitAmount!) || Number(productData.issued),
                unit: tokenDetails.metadata.unit!,
            }
        }

        return product;
    } catch (error) {
        console.error(error);
        throw new Error(`Error in getProductDetails: ${error}`);
    }
}

/** Get the product details from the blockchain */
async function getTrackerDetails(trackerId: number, opts: OPTS_TYPE, db: PostgresDBService): Promise<TrackerPayload | undefined> {
    try {
        const trackerDetails: any = await getTrackerContract(opts).methods.getTrackerDetails(Number(trackerId)).call();
        console.log('trackerDetails',trackerDetails)

        const _tracker = trackerDetails[0];
        const productIds = trackerDetails[3].map(Number);
        const netTotals = trackerDetails[5];
        const decimals = Number(await getTrackerContract(opts).methods.decimalsCt().call());
        //console.log(Number(trackerDetails[0].tokenId))
        const tokenDetails: any = await getTrackerContract(opts).methods._tokenDetails(Number(trackerDetails[0].tokenId)).call();
        
        if(tokenDetails.metadata.length>0){
            tokenDetails.metadata = JSON.parse(tokenDetails.metadata) as any
        }
        if(tokenDetails.manifest.length>0){
            tokenDetails.manifest = JSON.parse(tokenDetails.manifest) as any
        }

        const tracker: TrackerPayload = {
            ...tokenDetails,
            ..._tracker,
            ...{
                tokenId: Number(_tracker.tokenId),
                trackerId,
                totalEmissions: Number(netTotals.emissions)/decimals,
                totalOffsets: Number(netTotals.offsets)/decimals,
                totalREC: Number(netTotals.rec)/decimals,
                operatorUuid: tokenDetails.metadata.operator_uuid!,
                totalProductAmounts: BigInt(_tracker.totalProductAmounts),
            }
        };
        //console.log(tracker)
        console.log(`Adding trackerId ${trackerId} to postgres`)
        return tracker;
    } catch (err) {
        console.error(err);
        throw new Error(`Error in getTrackerDetails: ${err}`);
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
    console.log('--- Token tables have been cleared. ----\n')
}

/** Clear the token and balance tables. */
export const clearTrackersDBData = async () => {
    const db = await PostgresDBService.getInstance()
    await db.getTrackerRepo().truncateTrackers();
    // truncate balances is also done by truncate tokens
    console.log('--- Tracker & Product tables have been cleared. ----\n')
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
    let numOfIssuedTokens = 0;
    try {
        numOfIssuedTokens = await getNumOfUniqueTokens(opts);
    } catch (err) {
        console.error(err);
        numOfIssuedTokens = 0;
    }

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
                const product = await getProductDetails(productId, opts);
                if(!product) continue;
                //console.log('new prod', product)

                await db.getProductTokenRepo().insertProductToken(product);
                // TO-DO sendProductIssuedEmail ?
                //if (sendEmail) await sendTokenIssuedEmail(token);
            }
        }
    }
    console.log(`${numOfIssuedProducts - numOfSavedProducts} new product tokens of ${numOfIssuedProducts} are stored into database.`);
    return await getCurrentBlock(opts);
}

/** Sync the trackers from the blockchain and returns the blockchain current block number.
This does not depend on a starting block as we rely on the fact that token ids are sequential.
*/
export const fillTrackers = async (opts: OPTS_TYPE, sendEmail: boolean) => {
    const db = await PostgresDBService.getInstance()

    // get number tokens from database
    const numOfSavedTrackers = await db.getTrackerRepo().countTrackers([],'',0);
    //console.log(numOfSavedTrackers)
    // get number tokens from network
    let numOfIssuedTrackers = 0;
    try {
        numOfIssuedTrackers = await getNumOfTrackers(opts);
    } catch (err) {
        console.error(err);
        numOfIssuedTrackers = 0;
    }
    //console.log('num of trackers', numOfIssuedTrackers);
    // get the token details from the network
    if (numOfIssuedTrackers > numOfSavedTrackers) {
        // note: this should only get NEW trackers as tokenId auto-increments, but double check anyway
        for (let trackerId = numOfSavedTrackers + 1; trackerId <= numOfIssuedTrackers; trackerId++) {
            // if the token is not in the database, get the initial details and save it
            const t = await db.getTrackerRepo().select(trackerId);
            if (!t) {
                const tracker = await getTrackerDetails(trackerId, opts, db);
                if(tracker) await db.getTrackerRepo().insertTracker(tracker);
                // TO-DO sendTrackerIssuedEmail ?
                //if (sendEmail) await sendTrackerIssuedEmail(tracker);
            }
        }
    }
    console.log(`${numOfIssuedTrackers - numOfSavedTrackers} new trackers of ${numOfIssuedTrackers} are stored into database.`);
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

// eslint-disable-next-line
export const handleTransferTrackerEvent = async (event: EventData, db: PostgresDBService, opts: OPTS_TYPE) => {
    const transfer = event.returnValues;

    const from: string = transfer.from;
    const to: string = transfer.to;

    let tokenIds: number[]=[];
    // check for ids from TransferBatch or id for TransferSingle event
    if(transfer.ids){tokenIds=transfer.ids.map(Number)}
    else if(transfer.id){tokenIds=[Number(transfer.id)]};


    let amounts: bigint[]=[];
    // check for values from TransferBatch or value for TransferSingle event
    if(transfer.values){amounts=transfer.values.map(BigInt)}
    else if(transfer.value){amounts=[BigInt(transfer.value)]};
    
    const block = await getWeb3(opts).eth.getBlock(event.blockNumber);

    for (let i =0; i< tokenIds.length; i++){
        const tokenDetails: any = await getTrackerContract(opts).methods._tokenDetails(tokenIds[i]).call();
        if(Number(tokenDetails.tokenTypeId)==1){
            const trackerId = Number(tokenDetails.sourceId);

            // issue/mint case
            if (from == BURN) {
                // resolve conflicts
                const balance: TrackerBalance | null = await db.getTrackerBalanceRepo().selectBalance(to, trackerId);
                if (balance != undefined) {
                    console.error(`Error in handleTransferTrackerEvent: balance already exists for ${to} and trackerId ${trackerId}.`);
                    return;
                }
                const balancePayload: TrackerBalancePayload = {
                    trackerId,
                    issuedTo: to,
                    status: 'available'
                }    
                await insertNewTrackerBalance(balancePayload);
                await db.getTrackerRepo().setIssuedBy(trackerId,tokenDetails.issuedBy)
                await db.getTrackerRepo().setDateIssued(trackerId,Number(block.timestamp))

                console.log(`--- ${amounts[i]} of Tracker ${trackerId} Issued to ${to}`);
                return;
            } 
            // retire case
            else if (to == BURN) {
                // update issuee balance
                await db.getTrackerBalanceRepo().updateStatus(from, trackerId, 'retired');
                await db.getTrackerRepo().setRetired(trackerId); 
                console.log(`--- ${amounts[i]} of Tracker ${trackerId} Retired from ${from}`);
                return;
            }else{
                // general transfer!
                // 1) set from address balance to transferred 
                await db.getTrackerBalanceRepo().updateStatus(from, trackerId, 'transferred');
    
                // set status of 'to' address to available
                const balance: TrackerBalance | null = await db.getTrackerBalanceRepo().selectBalance(to, trackerId);
                if (balance == undefined) {
                    const balancePayload: TrackerBalancePayload = {
                        trackerId,
                        issuedTo: to,
                        status: 'available'
                    }    
                    await insertNewTrackerBalance(balancePayload);    
                }
            }
        }else if(Number(tokenDetails.tokenTypeId)==2){
            const productId = Number(tokenDetails.sourceId);
            const productDetails: any = await getTrackerContract(opts).methods._productData(productId).call();
            const balance: ProductTokenBalance | null = await db.getProductTokenBalanceRepo().selectBalance(to, productId);
            //issue case
            if (from == BURN) {
                if(balance){
                    await db.getProductTokenBalanceRepo().updateAvailable(to,productId,amounts[i]);
                }           
                console.log(`--- ${amounts[i]} of ProductToken ${productId} Issued to ${to}`);
                return;
            }  
            // retire case
            if (to == BURN) {
                if(from !== opts.tracker_address){
                    // update issued token retired balance
                    // only update retired excluding corrections submitted by the CarbonTracker contract address
                    await db.getProductTokenRepo().updateRetired(productId, amounts[i]);
                }   
                // update issued token retired balance
                await db.getProductTokenBalanceRepo().retireBalance(from, productId, amounts[i]);
                console.log(`--- ${amounts[i]} of ProductToken ${productId} Retired from ${from}`);
                return;
            }
            // general transfer!
            // 1) deduct 'from' available balance
            await db.getProductTokenBalanceRepo().transferBalance(from, productId, amounts[i]);

            // 2) add available 'to' balance
            if (balance == undefined) {
                const balancePayload: ProductTokenBalancePayload = {
                    productId,
                    issuedTo: to,
                    available: amounts[i],
                    retired: 0n,
                    transferred: 0n
                }
                await insertNewProductTokenBalance(balancePayload);
            } else {
                await db.getProductTokenBalanceRepo().addAvailableBalance(to, productId, amounts[i]);
            }
        }
        console.log(`--- ${amounts[i]} of Token ${tokenIds[i]} transferred from ${from} to ${to}`);
    }
}


export const handleTransferProductEvent = async (event: EventData, db: PostgresDBService) => {
    const productIds = event.returnValues.productIds.map(Number);
    const productAmounts = event.returnValues.productAmounts.map(BigInt);
    for(let i=0; i<productIds.length; i++){
        await db.getProductTokenRepo().updateAvailable(productIds[i], productAmounts[i]);
    }
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
    // if no last sync or mismatched config, return FIRST_BLOCK
    return FIRST_BLOCK;
}

export const sendRolesChangedEmail = async(w: Wallet, added_roles: string[], removed_roles: string[]) => {
    if (w && w.email) {
        const transporter = getMailer();
        const emailTemplateSourceHtml = readFileSync(path.join(__dirname, "../email/templates/roles-changed.html"), "utf8")
        const emailTemplateSourceText = readFileSync(path.join(__dirname, "../email/templates/roles-changed.txt"), "utf8")
        const templateHtml = handlebars.compile(emailTemplateSourceHtml)
        const templateText = handlebars.compile(emailTemplateSourceText)
        console.log('?? sendRolesChangedEmail ', w.email, w.roles, added_roles, removed_roles)
        const tpl = {
            ...getSiteAndAddress(),
            ...getWalletInfo(w),
            added_roles,
            removed_roles,
        }

        const html = templateHtml(tpl);
        const text = templateText(tpl);
        const message = {
            from: process.env.MAILER_FROM_ADDRESS,
            to: w.email,
            bcc: process.env.VERIFICATION_EMAIL_BCC,
            subject: 'Your roles have been updated!',
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
        console.warn(`Wallet ${w.address} email address is not set.`);
    }
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
                    ...getWalletInfo(w),
                    token_url: link.href,
                    dashboard_url: link_all.href,
                }

                const html = templateHtml(tpl);
                const text = templateText(tpl);
                const message = {
                    from: process.env.MAILER_FROM_ADDRESS,
                    to: w.email,
                    bcc: process.env.VERIFICATION_EMAIL_BCC,
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
