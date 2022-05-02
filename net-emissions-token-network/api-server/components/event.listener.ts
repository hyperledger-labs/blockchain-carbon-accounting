import { EventData } from 'web3-eth-contract';
import { insertNewBalance } from "../controller/balance.controller";
import { CreatedToken } from "../models/commonTypes";
import { PostgresDBService } from "blockchain-accounting-data-postgres/src/postgresDbService";
import { BalancePayload, TokenPayload } from 'blockchain-accounting-data-postgres/src/repositories/common';
import { syncWalletRoles } from "../controller/synchronizer";
import { OPTS_TYPE } from "../server";
import { BURN, getContract } from "../utils/web3";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  return String(error)
}

const makeErrorHandler = (name: string) => (err: unknown) => {
  const message = getErrorMessage(err);
  if (message.indexOf('connection not open on send') > -1) {
    throw new Error(`Error in ${name} event: ${message} -> Check your MORALIS_API_KEY is correctly setup.`)
  } else {
    console.error(`Error in ${name} event: ${message}`)
    throw err
  }
}

const rolesChanged = async (address: string, opts: OPTS_TYPE) => {
  await syncWalletRoles(address, opts);
}

export const subscribeEvent = (fromBlock: number, opts: OPTS_TYPE) => {
  const contract = getContract(opts)

  contract.events.TokenCreated({
    filter: { value: []},
    fromBlock
  })
    .on('data', async (event: EventData) => {
      const createdToken = event.returnValues as CreatedToken;

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
      if(Object.prototype.hasOwnProperty.call(metaObj,'Scope')) scope = metaObj['Scope']; 
      else if(Object.prototype.hasOwnProperty.call(metaObj,'scope')) scope = metaObj['scope'];
      if(Object.prototype.hasOwnProperty.call(metaObj,'Type')) type = metaObj['Type']; 
      else if(Object.prototype.hasOwnProperty.call(metaObj,'type')) type = metaObj['type'];

      // build token model
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { metadata, ..._tokenPayload } = { ...token };
      const tokenPayload: TokenPayload = {
        ..._tokenPayload,
        scope,
        type,
        metadata: metaObj
      }

      const db = await PostgresDBService.getInstance()
      await db.getTokenRepo().insertToken(tokenPayload);
      console.log(`\n--- Newly Issued Token ${token.tokenId} has been detected and added to database.`);
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .on('changed', (changed: any) => console.log('TokenCreated event changed', changed))
    .on('error', makeErrorHandler('TokenCreated'))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .on('connected', (str: any) => console.log(`Created Token event listener is connected: ${str}`));

  // Single transfer event catch.
  // It can be used for checking balance for each address
  contract.events.TransferSingle({
    filter: {value: []},
    fromBlock: 'latest'
  })
    .on('data', async (event: EventData) => {
      const db = await PostgresDBService.getInstance()
      const transferred = event.returnValues;

      const tokenId: number = transferred.id;
      const from: string = transferred.from;
      const to: string = transferred.to;
      const amount: number = transferred.value; // it must be divided by 10^3

      // issue case
      if(from == BURN) {
        const balancePayload: BalancePayload = {
          tokenId,
          issuedTo: to,
          available: Number(amount),
          retired: 0,
          transferred: 0
        }
        await insertNewBalance(balancePayload);
        await db.getTokenRepo().updateTotalIssued(tokenId, amount);
        return;
      }

      // retire case
      if(to == BURN) {
        // update total retired
        await db.getTokenRepo().updateTotalRetired(tokenId, amount);

        // update issuee balance 
        await db.getBalanceRepo().retireBalance(from, tokenId, amount);
        console.log(`--- ${amount} of Token ${tokenId} Retired from ${from}`);
        return;
      }

      // general transfer!
      // 1) deduct 'from' balance
      await db.getBalanceRepo().transferBalance(from, tokenId, amount);

      // transfer case
      const balance = await db.getBalanceRepo().selectBalance(to, tokenId);
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
      console.log(`--- ${amount} of Token ${tokenId} transferred from ${from} to ${to}`);
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .on('changed', (changed: any) => console.log('TransferSingle event changed', changed))
    .on('error', makeErrorHandler('TransferSingle'))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .on('connected', (str: any) => console.log(`Token Transferred event listener is connected: ${str}`));


  // listen to role changes
  contract.events.RegisteredConsumer({
    filter: {value: []},
    fromBlock: 'latest'
  })
    .on('data', async (event: EventData) => { rolesChanged(event.returnValues.account, opts) })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .on('changed', (changed: any) => console.log(changed))
    .on('error', makeErrorHandler('RegisteredConsumer'))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .on('connected', (str: any) => console.log(`RegisteredConsumer event listener is connected: ${str}`));
  contract.events.UnregisteredConsumer({
    filter: {value: []},
    fromBlock: 'latest'
  })
    .on('data', async (event: EventData) => { rolesChanged(event.returnValues.account, opts) })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .on('changed', (changed: any) => console.log(changed))
    .on('error', makeErrorHandler('UnregisteredConsumer'))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .on('connected', (str: any) => console.log(`UnregisteredConsumer event listener is connected: ${str}`));

  contract.events.RegisteredDealer({
    filter: {value: []},
    fromBlock: 'latest'
  })
    .on('data', async (event: EventData) => { rolesChanged(event.returnValues.account, opts) })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .on('changed', (changed: any) => console.log(changed))
    .on('error', makeErrorHandler('RegisteredDealer'))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .on('connected', (str: any) => console.log(`RegisteredDealer event listener is connected: ${str}`));
  contract.events.UnregisteredDealer({
    filter: {value: []},
    fromBlock: 'latest'
  })
    .on('data', async (event: EventData) => { rolesChanged(event.returnValues.account, opts) })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .on('changed', (changed: any) => console.log(changed))
    .on('error', makeErrorHandler('UnregisteredDealer'))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .on('connected', (str: any) => console.log(`UnregisteredDealer event listener is connected: ${str}`));

  contract.events.RegisteredIndustry({
    filter: {value: []},
    fromBlock: 'latest'
  })
    .on('data', async (event: EventData) => { rolesChanged(event.returnValues.account, opts) })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .on('changed', (changed: any) => console.log(changed))
    .on('error', makeErrorHandler('RegisteredIndustry'))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .on('connected', (str: any) => console.log(`RegisteredIndustry event listener is connected: ${str}`));
  contract.events.UnregisteredIndustry({
    filter: {value: []},
    fromBlock: 'latest'
  })
    .on('data', async (event: EventData) => { rolesChanged(event.returnValues.account, opts) })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .on('changed', (changed: any) => console.log(changed))
    .on('error', makeErrorHandler('UnregisteredIndustry'))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .on('connected', (str: any) => console.log(`UnregisteredIndustry event listener is connected: ${str}`));
}


