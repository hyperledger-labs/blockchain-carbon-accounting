import Web3 from "web3";
import { AbiItem } from 'web3-utils';
import NetEmissionsTokenNetwork from '../../interface/packages/contracts/src/abis/NetEmissionsTokenNetwork.json';
import { CreatedToken } from "../models/commonTypes";
import { TokenPayload, BalancePayload } from 'blockchain-accounting-data-postgres/src/repositories/common'
import { insertNewBalance } from "./balance.controller";
import { Balance } from "blockchain-accounting-data-postgres/src/models/balance";
import { PostgresDBService } from "blockchain-accounting-data-postgres/src/postgresDbService";

const BURN = '0x0000000000000000000000000000000000000000';

const web3 = new Web3(process.env.LEDGER_ETH_JSON_RPC_URL as string);
const contract = new web3.eth.Contract(NetEmissionsTokenNetwork.abi as AbiItem[], process.env.LEDGER_EMISSION_TOKEN_CONTRACT_ADDRESS);

const FIRST_BLOCK = 17770812;

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

        // restructure 
        const _metadata = token.metadata as string;
        const metaObj = JSON.parse(_metadata);

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
    console.log(`${numOfIssuedTokens - numOfSavedTokens} tokens are stored into database.`);
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
                    issuee: to,
                    available: Number(amount),
                    retired: 0,
                    transferred: 0
                }

                // resolve conflicts
                const balance: Balance | undefined = await db.getBalanceRepo().selectBalance(to, tokenId);
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
            const balance: Balance | undefined = await db.getBalanceRepo().selectBalance(to, tokenId);
            if(balance == undefined) {
                const balancePayload: BalancePayload = {
                    tokenId,
                    issuee: to,
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
