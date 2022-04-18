import Web3 from "web3";
import { AbiItem } from 'web3-utils';
import NetEmissionsTokenNetwork from '../../interface/packages/contracts/src/abis/NetEmissionsTokenNetwork.json';
import { CreatedToken } from "../models/commonTypes";
import { TokenPayload, BalancePayload } from 'blockchain-accounting-data-postgres/src/repositories/common'
import { insertNewBalance } from "./balance.controller";
import { Balance } from "blockchain-accounting-data-postgres/src/models/balance";
import { PostgresDBService } from "blockchain-accounting-data-postgres/src/postgresDbService";
import { Wallet } from "blockchain-accounting-data-postgres/src/models/wallet";

const BURN = '0x0000000000000000000000000000000000000000';

const web3 = new Web3(process.env.LEDGER_ETH_JSON_RPC_URL as string);
const contract = new web3.eth.Contract(NetEmissionsTokenNetwork.abi as AbiItem[], process.env.LEDGER_EMISSION_TOKEN_CONTRACT_ADDRESS);

const FIRST_BLOCK = 17770812;

// setup wallets from hardhat name them based on the setTestAccountRoles
// roles should be auto set based on the blockchain data
const SEED_WALLETS: Record<string, Partial<Wallet>> = (process.env.LEDGER_ETH_NETWORK === 'hardhat') ? {
  '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266': {name: 'super user (Account 0)', organization: 'Test Hardhat'},
  '0x70997970C51812dc3A010C7d01b50e0d17dc79C8': {name: 'REC Dealer 1', organization: 'Test Hardhat'},
  '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC': {name: 'Emissions Auditor 1', organization: 'Test Hardhat'},
  '0x90F79bf6EB2c4f870365E785982E1f101E93b906': {name: 'Offset Dealer 1', organization: 'Test Hardhat'},
  '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65': {name: 'Emissions Auditor 2', organization: 'Test Hardhat'},
  '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199': {name: 'Consumer 1', organization: 'Test Hardhat'},
  '0xdD2FD4581271e230360230F9337D5c0430Bf44C0': {name: 'Consumer 2', organization: 'Test Hardhat'},
  '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc': {name: 'Emissions Auditor 3', organization: 'Test Hardhat'},
  '0x976EA74026E726554dB657fA54763abd0C3a0aa9': {name: 'Emissions Auditor 4', organization: 'Test Hardhat'},
  '0x14dC79964da2C08b23698B3D3cc7Ca32193d9955': {name: 'Offset Dealer 2', organization: 'Test Hardhat'},
  '0xcd3B766CCDd6AE721141F452C550Ca635964ce71': {name: 'Industry 1', organization: 'Test Hardhat'},
  '0x2546BcD3c84621e976D8185a91A922aE77ECEc30': {name: 'Industry 2', organization: 'Test Hardhat'},
} : {}

/* Read the event log and check the roles for each account, sync them into the Wallet DB (create entries if missing)
 * Note for the dealer events the actual role depends on the token.
 * Instead of relying on the event we just use them to collect the addresses of the accounts,
 * then use getRoles to get the final roles from the contract.
 */
export const syncWallets = async (currentBlock: number) => {
    try {
        // cleanup roles on Hardhat first
        if (process.env.LEDGER_ETH_NETWORK === 'hardhat') {
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
        let fromBlock: number = "hardhat" === process.env.LEDGER_ETH_NETWORK ? 0 : FIRST_BLOCK;
        let toBlock: number | string = fromBlock;
        while(toBlock != currentBlock) {
            if(fromBlock + 5000 > currentBlock) 
                toBlock = currentBlock;
            else 
                toBlock = fromBlock + 5000; 
            for (const {event} of events) {
                console.log("event: ", event);
                const logs = await contract.getPastEvents(event, {fromBlock, toBlock});
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
            await syncWalletRoles(address, SEED_WALLETS[address]);
        }
    } catch (err) {
        console.error(err)
        throw new Error('Error in getMembers: ' + err)
    }
}

export const getRoles = async (address: string) => {
  return await contract.methods.getRoles(address).call();
}

export const syncWalletRoles = async (address: string, data?: Partial<Wallet>) => {
    try {
        const db = await PostgresDBService.getInstance()
        console.log("getting roles for ", address);
        const rolesInfo = await getRoles(address);
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


export const checkSignedMessage = (message: string, signature: string) => {
  return web3.eth.accounts.recover(message, signature)
}


// get number of unique tokens
const getNumOfUniqueTokens = async (): Promise<number> => {
    try {
        const result = await contract.methods.getNumOfUniqueTokens().call();    
        return result;
    } catch (err) {
        console.error(err)
        throw new Error('Error in getNumOfUniqueTokens: ' + err)
    }
}

async function getTokenDetails(tokenId: number): Promise<TokenPayload> {
    try {
        const token: CreatedToken = await contract.methods.getTokenDetails(tokenId).call();
        console.log(token);

        // restructure 
        const _metadata = token.metadata as string;
        // eslint-disable-next-line
        let metaObj: any = {}
        try {
          metaObj = JSON.parse(_metadata);
        } catch (error) {
          console.error('Invalid JSON in token metadata:', _metadata);
          metaObj = {}
        }

        // extract scope and type
        let scope = null, type = null;
        if(Object.prototype.hasOwnProperty.call(metaObj,'Scope')) scope = metaObj['Scope']; 
        else if(Object.prototype.hasOwnProperty.call(metaObj,'scope')) scope = metaObj['scope'];
        if(Object.prototype.hasOwnProperty.call(metaObj,'Type')) type = metaObj['Type']; 
        else if(Object.prototype.hasOwnProperty.call(metaObj,'type')) type = metaObj['type'];

        // build token model
        // eslint-disable-next-line
        const { metadata, ..._tokenPayload } = { ...token };
        const tokenPayload: TokenPayload = {
            ..._tokenPayload,
            scope,
            type,
            metadata: metaObj
        };

        // reset totalIssued and totalRetired
        tokenPayload.totalIssued = 0;
        tokenPayload.totalRetired = 0;

        return tokenPayload;
    } catch (err) {
        console.error(err);
        throw new Error('Error in getTokenDetails: ' + err);
    }
}


export const truncateTable = async () => {
    const db = await PostgresDBService.getInstance()
    await db.getTokenRepo().truncateTokens();
    await db.getBalanceRepo().truncateBalances();
    console.log('--- Tables has been cleared. ----\n')
}

export const fillTokens = async (): Promise<number> => {
    
    const db = await PostgresDBService.getInstance()

    // get number tokens from database
    const numOfSavedTokens = await db.getTokenRepo().countTokens([]);

    // get number tokens from network
    const numOfIssuedTokens = await getNumOfUniqueTokens();

    // getting tokens from network
    // save to database
    if(numOfIssuedTokens > numOfSavedTokens) {
        for (let i = numOfSavedTokens + 1; i <= numOfIssuedTokens; i++) {
            // getting token details and store
            const token: TokenPayload = await getTokenDetails(i);
            await db.getTokenRepo().insertToken(token);
        }
    }
    console.log(`${numOfIssuedTokens - numOfSavedTokens} new tokens of ${numOfIssuedTokens} are stored into database.`);
    return await web3.eth.getBlockNumber();
}

/**
 * TODOs
 * 1. Cannot insert with available!
 */
export const fillBalances = async (currentBlock: number) => {

    const db = await PostgresDBService.getInstance()
    let fromBlock: number = "hardhat" === process.env.LEDGER_ETH_NETWORK ? 0 : FIRST_BLOCK;
    let toBlock: number | string = fromBlock;
    while(toBlock != currentBlock) {
        // target event is TokenRetired & TransferSingle
        if(fromBlock + 5000 > currentBlock) 
            toBlock = currentBlock;
        else 
            toBlock = fromBlock + 5000; 
        const singleTransfers = await contract.getPastEvents('TransferSingle', 
            {fromBlock, toBlock});
        const len = singleTransfers.length;
        for (let i = 0; i < len; i++) {
            
            const singleTransfer = singleTransfers[i].returnValues;
            const tokenId: number = singleTransfer.id;
            const from: string = singleTransfer.from;
            const to: string = singleTransfer.to;
            const amount: number = singleTransfer.value; // it must be divided by 10^3
            // issue case
            if(from == BURN) {
                const balancePayload: BalancePayload = {
                    tokenId,
                    issuedTo: to,
                    available: Number(amount),
                    retired: 0,
                    transferred: 0
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
                    available: Number(amount),
                    retired: 0,
                    transferred: 0
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
