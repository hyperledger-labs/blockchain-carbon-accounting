import { PostgresDBService } from "@blockchain-carbon-accounting/data-postgres";
import EventEmitter from 'node:events';
import { EventData } from 'web3-eth-contract';
import { getCreatedToken, getLastSync, handleTransferEvent, runSync, saveLastSync, syncWalletRoles } from "../controller/synchronizer";
import { CreatedToken } from "../models/commonTypes";
import { OPTS_TYPE } from "../server";
import { getContract, getCurrentBlock } from "../utils/web3";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  return String(error)
}


/** Keep queue of out-of-order events. */
const token_event_queue: Record<number, EventData[]> = {}

const add_event_to_queue = (tokenId: number, event: EventData) => {
  const q = token_event_queue[tokenId] || []
  q.push(event)
  token_event_queue[tokenId] = q
}

const process_token_queued_events = async (tokenId: number) => {
  const q = token_event_queue[tokenId]
  if (q) {
    const db = await PostgresDBService.getInstance()
    for (const event of q) {
      await handleTransferEvent(event, db)
    }
    // there should not have been any more events appended to the queue
    // since we created the token prior to checking it
    delete token_event_queue[tokenId]
  }
}

const process_queued_events = async () => {
  for (const tokenId in token_event_queue) {
    // check tokenId is a number
    if (typeof tokenId !== 'number') continue
    await process_token_queued_events(tokenId)
  }
}

// because the events may not always be emitted from the WS, we want to manually sync
// the past events at given intervals
// optimal parameters dpend on the blockchain, but for example the BSC makes a block every ~3 seconds
// so we can run every 20 blocks or about 1 minute
const task_runner = {
  /** Must pass around the OPTS_TYPE used for web3 connectors */
  opts: {} as OPTS_TYPE,
  /** If the manual sync is running */
  isRunning: false,
  /** If an eventHandler is running */
  eventsRunning: 0,
  /** For more verbose logging */
  verbose: false,
  /** Interval between the last sync event and running a manual sync */
  runInterval: 65000,
  /** Interval used when a normal run cannot proceed right away */
  retryInterval: 5000,
  /** Minimum amount of blocks before a manual sync */
  minBlockDiff: 20,
  /** Stores the setTimeout handle */
  handle: undefined as ReturnType<typeof setTimeout> | undefined,
  /** Stores the current event handlers of the web3 Contract so they can be deactivated */
  eventHandlers: [] as EventEmitter[],
  /** Add an event handlers of the web3 Contract to the internal list */
  addEventHandler: (eventHandler: EventEmitter) => {
    task_runner.verbose && console.log('!!! added event handler to task_runner')
    task_runner.eventHandlers.push(eventHandler)
  },
  /** Deactivate all the web3 Contract event handlers */
  discardEventHandlers: () => {
    task_runner.verbose && console.log('!!! discarding event handlers')
    task_runner.eventHandlers.forEach(eh => eh.removeAllListeners())
    task_runner.eventHandlers = []
  },
  /** Recreate all the web3 Contract event handlers, creating new connections */
  reattachEventHandlers: () => {
    task_runner.verbose && console.log('!!! reattaching event handlers')
    subscribeToEvents(task_runner.opts)
  },
  /** Run the manual sync process, includes getting new Tokens, Balances and Wallet roles */
  runManualSync: async () => {
    // if isRunning is set do nothing as we might be in the middle of a sync or an eventHandler
    if (task_runner.reschedule_if_running()) {
      return
    }

    // check the lastSync block number, only run a sync if it's more than 10 blocks behind
    const syncFromBlock = await getLastSync(task_runner.opts) + 1;
    const currentBlock = await getCurrentBlock(task_runner.opts)
    task_runner.verbose && console.log(`??? current is ${currentBlock} lastSync ${syncFromBlock-1} and would sync from ${syncFromBlock}`)
    const blockDiff = currentBlock - syncFromBlock
    if (blockDiff < task_runner.minBlockDiff) {
      task_runner.verbose && console.log(`!!! not enough blocks behind, current is ${currentBlock} and would sync from ${syncFromBlock} (only ${blockDiff} but limit currently at ${task_runner.minBlockDiff}), not running sync`)
      // schedule the next run
      task_runner.reschedule(task_runner.retryInterval)
      return
    }

    if (task_runner.reschedule_if_running()) {
      return
    }
    task_runner.isRunning = true
    task_runner.discardEventHandlers()
    task_runner.verbose && console.log('---> task_runner now running')
    try {
      await runSync(syncFromBlock, task_runner.opts, true);
      // also run any queued event here
      await process_queued_events()
    } catch (err) {
      console.error('!!! task_runner error during sync', err)
    }
    task_runner.isRunning = false
    task_runner.verbose && console.log('<--- task_runner done')
    task_runner.reattachEventHandlers()
  },
  /** Cancel the previous setTimeout handle and reschedule for the next runInterval or a given delay */
  reschedule: (delay?: number) => {
    if (task_runner.handle) {
      task_runner.verbose && console.log('!!! cancel previous schedule of task_runner')
      clearTimeout(task_runner.handle)
    }
    const nextRun = delay || task_runner.runInterval
    task_runner.verbose && console.log('!!! scheduling task_runner to run in ' + nextRun + 'ms')
    task_runner.handle = setTimeout(async () => {
      await task_runner.runManualSync()
    }, nextRun)
  },
  reschedule_if_running: (delay?: number) => {
    if (task_runner.isRunning || task_runner.eventsRunning) {
      if (task_runner.isRunning)  console.error('!!! task_runner is already running, skipping')
      if (task_runner.eventsRunning)  console.error(`!!! task_runner ${task_runner.eventsRunning} events are running, skipping`)
      // schedule the next run
      task_runner.reschedule(delay || task_runner.retryInterval)
      return true
    }
    return false
  }
}


const makeErrorHandler = (name: string) => (err: unknown) => {
  const message = getErrorMessage(err);
  if (message.indexOf('connection not open on send') > -1) {
    console.error(`Error in ${name} event: ${message} -> Check your LEDGER_ETH_WS_URL is correctly setup.`)
  } else {
    console.error(`Error in ${name} event: ${message}`)
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
  const eh = contractEvent({
    filter: { value: []},
    fromBlock: 'latest'
  })
  .on('data', async (event: EventData) => {
    console.log(`On ${name} event`, event)
    // do not run if we are running the task_runner
    if (task_runner.isRunning) {
      console.error('!!! task_runner is running, skipping event', name)
      return
    }
    // mark it as running
    task_runner.eventsRunning++
    try {
      await onData(event)
      // here we want to save the lastSync block number or events will be reprocessed during startup
      await saveLastSync(event.blockNumber, opts)
    } catch (err) {
      console.error('!!! error in event handler', err)
    }
    // reschedule the task_runner
    task_runner.reschedule()
    task_runner.eventsRunning--
  })
  .on('changed', makeChangedHandler(name))
  .on('error', makeErrorHandler(name))
  .on('connected', makeConnectedHandler(name))
  task_runner.addEventHandler(eh)
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
  task_runner.opts = opts
  // for blockchains that support events subscriptions
  if (opts.network_name === 'bsctestnet' || opts.network_name === 'avalanchetestnet') {
    try {
      const contract = getContract({...opts, use_web_socket: true})

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
        process_token_queued_events(token.tokenId)
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
          add_event_to_queue(transferred.id, event)
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
      makeEventHandler(opts, contract.events.UnregisteredIndustry, 'RoleGranted', async (event: EventData) => {
        rolesChanged(event.returnValues.account, opts)
      })
      makeEventHandler(opts, contract.events.UnregisteredIndustry, 'RoleRevoked', async (event: EventData) => {
        rolesChanged(event.returnValues.account, opts)
      })
    } catch (err) {
      console.error('!!! error in subscribeToEvents, scheduling task_runner should try to subscsribe again after the next sync', err)
    }
  } else {
    console.log(`NOTE: subscribeToEvents is not supported for this network (${opts.network_name}), but will still use the fallback polling methods (every ${task_runner.runInterval}ms)`)
    if (opts.network_name === 'hardhat') {
      // some peculiarities of hardhat is that it will auto mine blocks when transactions are sent
      // so we need to adjust the minBlockDiff to zero (immediate next block)
      // also we can poll at regular intervals here since we have no expected events
      task_runner.minBlockDiff = 0
      task_runner.runInterval = task_runner.retryInterval
    }
  }

  // reschedule a run of the sync
  task_runner.reschedule()
}

