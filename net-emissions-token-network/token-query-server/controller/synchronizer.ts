import Web3 from "web3";
import { AbiItem } from 'web3-utils';
import NetEmissionsTokenNetwork from '../../interface/packages/contracts/src/abis/NetEmissionsTokenNetwork.json';
import { CreatedToken, TokenPayload, BalancePayload } from "../models/commonTypes";
import { countTokens, insertToken, truncateTokens, updateTotalIssued, updateTotalRetired } from "../repositories/token.repo";
import { addAvailableBalance, retireBalance, transferBalance, select, truncateBalances } from "../repositories/balance.repo";
import { insertNewBalance } from "./balance.controller";

const BURN = '0x0000000000000000000000000000000000000000';

const web3 = new Web3(process.env.LEDGER_ETH_JSON_RPC_URL as string);
const contract = new web3.eth.Contract(NetEmissionsTokenNetwork.abi as AbiItem[], process.env.LEDGER_EMISSION_TOKEN_CONTRACT_ADDRESS);

const FIRST_BLOCK: number = 17770812;

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
        if (metaObj.hasOwnProperty('Scope'))
            scope = metaObj['Scope'];
        else if (metaObj.hasOwnProperty('scope'))
            scope = metaObj['scope'];
        if (metaObj.hasOwnProperty('Type'))
            type = metaObj['Type'];
        else if (metaObj.hasOwnProperty('type'))
            type = metaObj['type'];

        // build token model
        let { metadata, ..._tokenPayload } = { ...token };
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

async function getBalances(issuee: string, tokenId: number): Promise<BalancePayload> {
    try {
        // const balances: Array<number> = await contract.methods.getAvailableRetiredAndTransferred(issuee, tokenId).call();
        const balancePayload: BalancePayload = {
            tokenId,
            issuee,
            available: 0,
            retired: 0,
            transferred: 0
        };
        return balancePayload;
    } catch (err) {
        console.error(err);
        throw new Error('Error in getTokenDetails: ' + err);
    }
}

export const truncateTable = async () => {
    await truncateTokens();
    await truncateBalances();
    console.log('--- Tables has been cleared. ----\n')
}

export const fillTokens = async () => {
    
    // get number tokens from database
    const numOfSavedTokens = await countTokens([]);

    // get number tokens from network
    const numOfIssuedTokens = await getNumOfUniqueTokens();

    // getting tokens from network
    // save to database
    if(numOfIssuedTokens > numOfSavedTokens) {
        for (let i = numOfSavedTokens + 1; i <= numOfIssuedTokens; i++) {
            // getting token details and store
            const token: TokenPayload = await getTokenDetails(i);
            await insertToken(token);
        }
    }
    console.log(`${numOfIssuedTokens} tokens are stored into database.`);
}

/**
 * TODOs
 * 1. Cannot insert with available!
 */
export const fillBalances = async () => {

    const currentBlock: number = await web3.eth.getBlockNumber();
    console.log('current block: ', currentBlock);
    console.log('block difference: ', currentBlock - FIRST_BLOCK);

    let fromBlock: number = FIRST_BLOCK;
    let toBlock: number | string = fromBlock;
    while(true) {
        // target event is TokenRetired & TransferSingle
        if(fromBlock + 5000 > currentBlock) toBlock = 'latest';
        else toBlock = fromBlock + 5000; 
        const singleTransfers = await contract.getPastEvents('TransferSingle', 
            {fromBlock, toBlock: fromBlock + 5000});
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
                await insertNewBalance(balancePayload);
                await addAvailableBalance(to, tokenId, amount);
                await updateTotalIssued(tokenId, amount);
                continue;
            }

            // retire case
            if(to == BURN) {
                // update issuee balance
                await retireBalance(from, tokenId, amount);
                
                // update token balance
                await updateTotalRetired(tokenId, amount);
                continue;
            }
            // general transfer!
            // 1) deduct 'from' balance
            await transferBalance(from, tokenId, amount);

            // 2) add available 'to' balance
            const balance = await select(to, tokenId);
            if(balance.length == 0) {
                const balancePayload: BalancePayload = {
                    tokenId,
                    issuee: to,
                    available: Number(amount),
                    retired: 0,
                    transferred: 0
                }
                await insertNewBalance(balancePayload);
                await addAvailableBalance(to, tokenId, amount);
            } else {
                await addAvailableBalance(to, tokenId, amount);
            }
        }

        if(toBlock == 'latest') break;
        fromBlock += 5000;
    }

}
