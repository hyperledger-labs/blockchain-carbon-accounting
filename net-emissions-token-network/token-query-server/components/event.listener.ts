import Web3 from "web3";
import { AbiItem } from 'web3-utils';
import { abi } from '../../interface/packages/contracts/src/abis/NetEmissionsTokenNetwork.json';
import { CreatedToken, TokenPayload } from "../models/commonTypes";
import { insert, updateTotalRetired } from "../repositories/token.repo";

const web3 = new Web3(new Web3.providers.WebsocketProvider(`wss://speedy-nodes-nyc.moralis.io/${process.env.MORALIS_API_KEY}/bsc/testnet/ws`));
const contract = new web3.eth.Contract(abi as AbiItem[], process.env.LEDGER_EMISSION_TOKEN_CONTRACT_ADDRESS);

export const subscribeEvent = () => {

    contract.events.TokenCreated({
        filter: { value: []},
        fromBlock: 'latest'
    })
        .on('data', async (event: any) => {
            const createdToken = event.returnValues;
            
            // build token
            const token: CreatedToken = {
                ...createdToken,
                totalIssued: createdToken.availableBalance,
                totalRetired: createdToken.retiredBalance
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

            await insert(tokenPayload);
            console.log(`\n--- Newly Issued Token ${token.tokenId} has been detected and added to database.`);
        })
        .on('changed', (changed: any) => console.log(changed))
        .on('error', (err: any) => {throw err})
        .on('connected', (str: any) => console.log(`Created Token event listener is connected: ${str}`));
    
    // Single transfer event catch.
    // It can be used for checking balance for each address
    contract.events.TransferSingle({
        filter: {value: []},
        fromBlock: 'latest'
    })
        .on('data', (event: any) => {
            const returnValues = event.returnValues;
            // console.log(returnValues);
        })
        .on('changed', (changed: any) => console.log(changed))
        .on('error', (err: any) => {throw err})
        .on('connected', (str: any) => console.log(`Token Transferred event listener is connected: ${str}`));

    contract.events.TokenRetired({
        filter: {value: []},
        fromBlock: 'latest'
    })
        .on('data', async (event: any) => {
            const retired = event.returnValues;
            
            // const sender: string = retired.account;
            const tokenId: number = retired.tokenId;
            const amount: number = retired.amount;

            // update totalRetired
            await updateTotalRetired(tokenId, amount);
            console.log(`\n--- ${amount / 1000} of Token ${tokenId} has been retired and updated database.`);
        })
        .on('changed', (changed: any) => console.log(changed))
        .on('error', (err: any) => {throw err})
        .on('connected', (str: any) => console.log(`Token Retired event listener is connected: ${str}`));
}

