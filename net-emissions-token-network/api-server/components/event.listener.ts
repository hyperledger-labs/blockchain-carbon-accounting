import { EventData } from 'web3-eth-contract';
import { CreatedToken } from "../models/commonTypes";
import { PostgresDBService } from "blockchain-accounting-data-postgres/src/postgresDbService";
import { getCreatedToken, handleTransferEvent, saveLastSync, syncWalletRoles } from "../controller/synchronizer";
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
const makeEventHandler = (opts: OPTS_TYPE, contractEvent:any, name: string, onData: (event: EventData)=>Promise<void>) => {
  contractEvent({
    filter: { value: []},
    fromBlock: 'latest'
  })
    .on('data', async (event: EventData) => {
      console.log(`On ${name} event`, event)
      await onData(event)
      // here we want to save the lastSync block number or events will be reprocessed during startup
      await saveLastSync(event.blockNumber, opts)
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
Every events also saves the lastSync block number in the DB
*/
export const subscribeToEvents = (opts: OPTS_TYPE) => {
  const contract = getContract({...opts, use_web_socket: true})
  const token_event_queue: Record<number, EventData[]> = {}

  makeEventHandler(opts, contract.events.TokenCreated, 'TokenCreated', async (event: EventData) => {
    const createdToken = event.returnValues as CreatedToken;
    const token = getCreatedToken(createdToken)
    const db = await PostgresDBService.getInstance()
    // here we should not have that token already in the DB
    const t = await db.getTokenRepo().selectToken(token.tokenId)
    if (t) {
      console.error(`Received a TokenCreated event for token ${token.tokenId} but it already exists in the DB !`)
    } else {
      await db.getTokenRepo().insertToken(token)
      console.log(`\n--- Newly Issued Token ${token.tokenId} has been detected and added to database.`);
    }
    // check for queued events relating to this token
    const q = token_event_queue[token.tokenId]
    if (q) {
      for (const event of q) {
        await handleTransferEvent(event, db)
      }
      // there should not have been any more events appended to the queue
      // since we created the token prior to checking it
      delete token_event_queue[token.tokenId]
    }
  })

  // Single transfer event catch.
  // It can be used for checking balance for each address
  makeEventHandler(opts, contract.events.TransferSingle, 'TransferSingle', async (event: EventData) => {
    const db = await PostgresDBService.getInstance()
    const transferred = event.returnValues
    // tis may fail if the Created event was not processed yet (because we received this event before the Created event)
    const token = await db.getTokenRepo().selectToken(transferred.id)
    if (token) {
      await handleTransferEvent(event, db)
    } else {
      console.log(`\n--- Transfer event for token ${transferred.id} has been detected but the token was not found in the database. Possible out-of-order event, queueing ...`);
      const q = token_event_queue[transferred.id] || []
      q.push(event)
      token_event_queue[transferred.id] = q
    }
  })

  // listen to role changes
  makeEventHandler(opts, contract.events.RegisteredConsumer, 'RegisteredConsumer', async (event: EventData) => {
    rolesChanged(event.returnValues.account, opts)
  })
  makeEventHandler(opts, contract.events.UnregisteredConsumer, 'UnregisteredConsumer', async (event: EventData) => {
    rolesChanged(event.returnValues.account, opts)
  })
  makeEventHandler(opts, contract.events.RegisteredDealer, 'RegisteredDealer', async (event: EventData) => {
    rolesChanged(event.returnValues.account, opts)
  })
  makeEventHandler(opts, contract.events.UnregisteredDealer, 'UnregisteredDealer', async (event: EventData) => {
    rolesChanged(event.returnValues.account, opts)
  })
  makeEventHandler(opts, contract.events.RegisteredIndustry, 'RegisteredIndustry', async (event: EventData) => {
    rolesChanged(event.returnValues.account, opts)
  })
  makeEventHandler(opts, contract.events.UnregisteredIndustry, 'UnregisteredIndustry', async (event: EventData) => {
    rolesChanged(event.returnValues.account, opts)
  })
}

