import Web3 from "web3";
import { AbiItem } from 'web3-utils';
import { abi } from '../../interface/packages/contracts/src/abis/NetEmissionsTokenNetwork.json';
import { insertNewBalance } from "../controller/balance.controller";
import { BalancePayload, CreatedToken, TokenPayload } from "../models/commonTypes";
import { addAvailableBalance, retireBalance, selectBalance, transferBalance } from "../repositories/balance.repo";
import { insertToken, updateTotalIssued, updateTotalRetired } from "../repositories/token.repo";

const web3 = new Web3(new Web3.providers.WebsocketProvider(`wss://speedy-nodes-nyc.moralis.io/${process.env.MORALIS_API_KEY}/bsc/testnet/ws`));
const contract = new web3.eth.Contract(abi as AbiItem[], process.env.LEDGER_EMISSION_TOKEN_CONTRACT_ADDRESS);

// burn address 
const BURN = '0x0000000000000000000000000000000000000000';

const makeErrorHandler = (name: string) => (err: any) => {
  if (err.message.indexOf('connection not open on send') > -1) {
    throw new Error(`Error in ${name} event: ${err.message} -> Check your MORALIS_API_KEY is correctly setup.`)
  } else {
    console.error(`Error in ${name} event: ${err.message}`)
    throw err
  }
}

export const subscribeEvent = (fromBlock: number) => {

    contract.events.TokenCreated({
        filter: { value: []},
        fromBlock
    })
        .on('data', async (event: any) => {
            const createdToken = event.returnValues;
            
            // build token
            const token: CreatedToken = {
                ...createdToken,
                totalIssued: 0,
                totalRetired: 0
            };

            // metadata conversion
            const _metadata = token.metadata as string;
            const metaObj = JSON.parse(_metadata);

            // extract scope and type
            let scope = null, type = null;
            if(metaObj.hasOwnProperty('Scope')) scope = metaObj['Scope']; 
            else if(metaObj.hasOwnProperty('scope')) scope = metaObj['scope'];
            if(metaObj.hasOwnProperty('Type')) type = metaObj['Type']; 
            else if(metaObj.hasOwnProperty('type')) type = metaObj['type'];

            // build token model
            let { metadata, ..._tokenPayload } = { ...token };
            const tokenPayload: TokenPayload = {
                ..._tokenPayload,
                scope,
                type,
                metadata: metaObj
            }

            await insertToken(tokenPayload);
            console.log(`\n--- Newly Issued Token ${token.tokenId} has been detected and added to database.`);
        })
        .on('changed', (changed: any) => console.log(changed))
        .on('error', makeErrorHandler('TokenCreated'))
        .on('connected', (str: any) => console.log(`Created Token event listener is connected: ${str}`));
    
    // Single transfer event catch.
    // It can be used for checking balance for each address
    contract.events.TransferSingle({
        filter: {value: []},
        fromBlock: 'latest'
    })
        .on('data', async (event: any) => {
            const transferred = event.returnValues;

            const tokenId: number = transferred.id;
            const from: string = transferred.from;
            const to: string = transferred.to;
            const amount: number = transferred.value; // it must be divided by 10^3

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
                await updateTotalIssued(tokenId, amount);
                return;
            }

            // retire case
            if(to == BURN) {
                // update total retired
                await updateTotalRetired(tokenId, amount);

                // update issuee balance 
                await retireBalance(from, tokenId, amount);
                console.log(`--- ${amount} of Token ${tokenId} Retired from ${from}`);
                return;
            }

            // general transfer!
            // 1) deduct 'from' balance
            await transferBalance(from, tokenId, amount);

            // transfer case
            const balance = await selectBalance(to, tokenId);
            if(balance.length == 0) {
                const balancePayload: BalancePayload = {
                    tokenId,
                    issuee: to,
                    available: Number(amount),
                    retired: 0,
                    transferred: 0
                }
                await insertNewBalance(balancePayload);
                // await addAvailableBalance(to, tokenId, amount);
            } else {
                await addAvailableBalance(to, tokenId, amount);
            }
            console.log(`--- ${amount} of Token ${tokenId} transferred from ${from} to ${to}`);
        })
        .on('changed', (changed: any) => console.log(changed))
        .on('error', makeErrorHandler('TransferSingle'))
        .on('connected', (str: any) => console.log(`Token Transferred event listener is connected: ${str}`));
}


