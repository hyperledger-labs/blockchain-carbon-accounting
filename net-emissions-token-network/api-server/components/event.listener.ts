import { EventData } from 'web3-eth-contract';
import { CreatedToken } from "../models/commonTypes";
import { PostgresDBService } from "blockchain-accounting-data-postgres/src/postgresDbService";
import { getCreatedToken, handleTransferEvent, syncWalletRoles } from "../controller/synchronizer";
import { OPTS_TYPE } from "../server";
import { getContract } from "../utils/web3";

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const makeChangedHandler = (name: string) => (changed: any) => {
  console.log(`On changed for ${name} event`, changed);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const makeConnectedHandler = (name: string) => (str: any) => {
  console.log(`On connected for ${name} event`, str);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const makeEventHandler = (contractEvent:any, name: string, onData: (event: EventData)=>void) => {
  contractEvent({
    filter: { value: []},
    fromBlock: 'latest'
  })
    .on('data', async (event: EventData) => {
      console.log(`On ${name} event`, event)
      onData(event)
    })
    .on('changed', makeChangedHandler(name))
    .on('error', makeErrorHandler(name))
    .on('connected', makeConnectedHandler(name))
}


const rolesChanged = async (address: string, opts: OPTS_TYPE) => {
  await syncWalletRoles(address, opts)
}

/** Add event subsciptions.
Listens to:
 - TokenCreated -> save the token in the DB
 - TransferSingle -> sync the token balances in the DB
 - RegisteredX / UnregisteredX -> sync the wallet roles in the DB based on the current roles
TODO: should this save the lastBlock synced or could this run multiple times per block thus would
have to be resumable?
*/
export const subscribeToEvents = (opts: OPTS_TYPE) => {
  const contract = getContract({...opts, use_web_socket: true})

  makeEventHandler(contract.events.TokenCreated, 'TokenCreated', async (event: EventData) => {
    const createdToken = event.returnValues as CreatedToken;
    const token = getCreatedToken(createdToken)
    const db = await PostgresDBService.getInstance()
    await db.getTokenRepo().insertToken(token)
    console.log(`\n--- Newly Issued Token ${token.tokenId} has been detected and added to database.`);
  })

  // Single transfer event catch.
  // It can be used for checking balance for each address
  makeEventHandler(contract.events.TransferSingle, 'TransferSingle', async (event: EventData) => {
    const db = await PostgresDBService.getInstance()
    const transferred = event.returnValues
    handleTransferEvent(transferred, db)
  })

  // listen to role changes
  makeEventHandler(contract.events.RegisteredConsumer, 'RegisteredConsumer', async (event: EventData) => {
    rolesChanged(event.returnValues.account, opts)
  })
  makeEventHandler(contract.events.UnregisteredConsumer, 'UnregisteredConsumer', async (event: EventData) => {
    rolesChanged(event.returnValues.account, opts)
  })
  makeEventHandler(contract.events.RegisteredDealer, 'RegisteredDealer', async (event: EventData) => {
    rolesChanged(event.returnValues.account, opts)
  })
  makeEventHandler(contract.events.UnregisteredDealer, 'UnregisteredDealer', async (event: EventData) => {
    rolesChanged(event.returnValues.account, opts)
  })
  makeEventHandler(contract.events.RegisteredIndustry, 'RegisteredIndustry', async (event: EventData) => {
    rolesChanged(event.returnValues.account, opts)
  })
  makeEventHandler(contract.events.UnregisteredIndustry, 'UnregisteredIndustry', async (event: EventData) => {
    rolesChanged(event.returnValues.account, opts)
  })
}

