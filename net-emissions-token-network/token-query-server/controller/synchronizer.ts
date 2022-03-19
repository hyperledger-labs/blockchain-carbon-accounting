import Web3 from "web3";
import { AbiItem } from 'web3-utils';
import NetEmissionsTokenNetwork from '../../interface/packages/contracts/src/abis/NetEmissionsTokenNetwork.json';
import { CreatedToken, TokenPayload } from "../models/commonTypes";
import { count, insert, selectAll, selectPaginated } from "../repositories/token.repo";

const web3 = new Web3(process.env.LEDGER_ETH_JSON_RPC_URL as string);
const contract = new web3.eth.Contract(NetEmissionsTokenNetwork.abi as AbiItem[], process.env.LEDGER_EMISSION_TOKEN_CONTRACT_ADDRESS);

// get number of unique tokens
const getNumOfUniqueTokens = async (): Promise<number> => {
    const result = await contract.methods.getNumOfUniqueTokens().call();    
    return result;
}

const getTokenDetails = async (tokenId: number): Promise<CreatedToken> => {
    const token: CreatedToken = await contract.methods.getTokenDetails(tokenId).call();
    return token;
}

export const fillTokens = async () => {
    
    // get number tokens from database
    const numOfSavedTokens = await count();

    // get number tokens from network
    const numOfIssuedTokens = await getNumOfUniqueTokens();

    // getting tokens from network
    // save to database
    if(numOfIssuedTokens > numOfSavedTokens) {
        for (let i = numOfSavedTokens + 1; i <= numOfIssuedTokens; i++) {
            const token: CreatedToken = await getTokenDetails(i);

            // restructure 
            const _metadata = token.metadata as string;
            const metaObj = JSON.parse(_metadata);

            // extract scope and type
            let scope = null, type = null;
            if(metaObj.hasOwnProperty('Scope') || metaObj.hasOwnProperty('scope')) scope = metaObj['Scope'];
            if(metaObj.hasOwnProperty('Type') || metaObj.hasOwnProperty('type')) type = metaObj['Type'];
            
            // build token model
            let { metadata, ..._tokenPayload } = { ...token };
            const tokenPayload: TokenPayload = {
                ..._tokenPayload,
                scope,
                type,
                metadata: metaObj
            }

            await insert(tokenPayload);
        }
    }
}
