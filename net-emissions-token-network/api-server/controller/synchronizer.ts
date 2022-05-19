import { CreatedToken } from "../models/commonTypes";
import { TokenPayload, BalancePayload } from 'blockchain-accounting-data-postgres/src/repositories/common'
import { insertNewBalance } from "./balance.controller";
import { Balance } from "blockchain-accounting-data-postgres/src/models/balance";
import { PostgresDBService } from "blockchain-accounting-data-postgres/src/postgresDbService";
import { Wallet } from "blockchain-accounting-data-postgres/src/models/wallet";
import { OPTS_TYPE } from "../server";
import { BURN, getContract, getWeb3 } from "../utils/web3";

// set to block number of contract creation from the explorer such as https://testnet.bscscan.com/
const FIRST_BLOCK = 18656095;

/* Read the event log and check the roles for each account, sync them into the Wallet DB (create entries if missing)
 * Note for the dealer events the actual role depends on the token.
 * Instead of relying on the event we just use them to collect the addresses of the accounts,
 * then use getRoles to get the final roles from the contract.
 */
export const syncWallets = async (currentBlock: number, opts: OPTS_TYPE) => {
    try {
        // cleanup roles on Hardhat first
        if (opts.network_name === 'hardhat') {
            const db = await PostgresDBService.getInstance()
            await db.getWalletRepo().clearWalletsRoles()
        }

        const events = [
            {event: 'RegisteredConsumer', role: 'Consumer'},
            {event: 'UnregisteredConsumer', role: 'Consumer'},
            {event: 'RegisteredDealer', role: 'Dealer'},
            {event: 'UnregisteredDealer', role: 'Dealer'},
            {event: 'RegisteredIndustry', role: 'Industry'},
            {event: 'UnregisteredIndustry', role: 'Industry'},
        ];
        const accountAddresses: Record<string, boolean> = {};
        const members: Record<string, Record<string, number>> = {};
        let fromBlock: number = "hardhat" === opts.network_name ? 0 : FIRST_BLOCK;
        let toBlock: number | string = fromBlock;
        while(toBlock != currentBlock) {
            if(fromBlock + 5000 > currentBlock) 
                toBlock = currentBlock;
            else 
                toBlock = fromBlock + 5000; 
            for (const {event} of events) {
                console.log("event: ", event);
                const logs = await getContract(opts).getPastEvents(event, {fromBlock, toBlock});
                for (const {returnValues} of logs) {
                    const account = returnValues.account
                    accountAddresses[account] = true
                }
            }

            if(toBlock == currentBlock) break;
            fromBlock += 5000;
        }

        const accountsWithRoles: Record<string, string[]> = {};
        for (const role in members) {
            for (const account in members[role]) {
                console.log('Account',account,'should have role',role);
                accountsWithRoles[account] = accountsWithRoles[account] || [];
                accountsWithRoles[account].push(role);
            }
        }

        for (const address in accountAddresses) {
            await syncWalletRoles(address, opts);
        }
    } catch (err) {
        console.error(err)
        throw new Error('Error in getMembers: ' + err)
    }
}

export const getRoles = async (address: string, opts: OPTS_TYPE) => {
  return await getContract(opts).methods.getRoles(address).call();
}

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


// get number of unique tokens
const getNumOfUniqueTokens = async (opts: OPTS_TYPE): Promise<number> => {
    try {
        const result = await getContract(opts).methods.getNumOfUniqueTokens().call();    
        return result;
    } catch (err) {
        console.error(err)
        throw new Error('Error in getNumOfUniqueTokens: ' + err)
    }
}

async function getTokenDetails(tokenId: number, opts: OPTS_TYPE): Promise<TokenPayload> {
    try {
        const token: CreatedToken = await getContract(opts).methods.getTokenDetails(tokenId).call();

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
        const { metadata, manifest, totalIssued, totalRetired, ..._tokenPayload } = { ...token };
        const tokenPayload: TokenPayload = {
            ..._tokenPayload,
            scope,
            type,
            // reset totalIssued and totalRetired
            totalIssued: "0",
            totalRetired: "0",
//**            totalIssued: 0n,
//**            totalRetired: 0n,
            metadata: metaObj,
            manifest: manifestObj
        };

        return tokenPayload;
    } catch (err) {
        console.error(err);
        throw new Error('Error in getTokenDetails: ' + err);
    }
}


export const truncateTable = async () => {
    const db = await PostgresDBService.getInstance()
    await db.getTokenRepo().truncateTokens();
    // truncate balances is also done by truncate tokens
    console.log('--- Tables has been cleared. ----\n')
}

export const fillTokens = async (opts: OPTS_TYPE): Promise<number> => {
    const db = await PostgresDBService.getInstance()

    // get number tokens from database
    const numOfSavedTokens = await db.getTokenRepo().countTokens([]);

    // get number tokens from network
    const numOfIssuedTokens = await getNumOfUniqueTokens(opts);
    // getting tokens from network
    // save to database
    if(numOfIssuedTokens > numOfSavedTokens) {
        for (let i = numOfSavedTokens + 1; i <= numOfIssuedTokens; i++) {
            // getting token details and store
            const token: TokenPayload = await getTokenDetails(i, opts);
            await db.getTokenRepo().insertToken(token);
        }
    }
    console.log(`${numOfIssuedTokens - numOfSavedTokens} new tokens of ${numOfIssuedTokens} are stored into database.`);
    return await getWeb3(opts).eth.getBlockNumber();
}

/**
 * TODOs
 * 1. Cannot insert with available!
 */
export const fillBalances = async (currentBlock: number, opts: OPTS_TYPE) => {

    const db = await PostgresDBService.getInstance()
    let fromBlock: number = "hardhat" === process.env.LEDGER_ETH_NETWORK ? 0 : FIRST_BLOCK;
    let toBlock: number | string = fromBlock;
    while(toBlock != currentBlock) {
        // target event is TokenRetired & TransferSingle
        if(fromBlock + 5000 > currentBlock) 
            toBlock = currentBlock;
        else
            toBlock = fromBlock + 5000;
        const singleTransfers = await getContract(opts).getPastEvents('TransferSingle', 
            {fromBlock, toBlock});
        const len = singleTransfers.length;
        for (let i = 0; i < len; i++) {
            const singleTransfer = singleTransfers[i].returnValues;
            const tokenId: number = singleTransfer.id;
            const from: string = singleTransfer.from;
            const to: string = singleTransfer.to;
            const amount: string = singleTransfer.value; // it must be divided by 10^3
//**            const amount = BigInt(singleTransfer.value); // it must be divided by 10^3
            // issue case
            if(from == BURN) {
                const balancePayload: BalancePayload = {
                    tokenId,
                    issuedTo: to,
                    available: amount,
                    retired: "0",
                    transferred: "0"
//**                    retired: 0n,
//**                    transferred: 0n
                }

                // resolve conflicts
                const balance: Balance | null = await db.getBalanceRepo().selectBalance(to, tokenId);
                if(balance != undefined) continue;

                await insertNewBalance(balancePayload);
                await db.getTokenRepo().updateTotalIssued(tokenId, amount);
                continue;
            }

            // retire case
            if(to == BURN) {
                // update issuee balance
                await db.getBalanceRepo().retireBalance(from, tokenId, amount);

                // update token balance
                await db.getTokenRepo().updateTotalRetired(tokenId, amount);
                continue;
            }
            // general transfer!
            // 1) deduct 'from' balance
            await db.getBalanceRepo().transferBalance(from, tokenId, amount);

            // 2) add available 'to' balance
            const balance: Balance | null = await db.getBalanceRepo().selectBalance(to, tokenId);
            if(balance == undefined) {
                const balancePayload: BalancePayload = {
                    tokenId,
                    issuedTo: to,
                    available: amount,
                    retired: "0",
                    transferred: "0"
//**                    retired: 0n,
//**                    transferred: 0n
                }
                await insertNewBalance(balancePayload);
            } else {
                await db.getBalanceRepo().addAvailableBalance(to, tokenId, amount);
            }
        }

        if(toBlock == currentBlock) break;
        fromBlock += 5000;
    }
}
