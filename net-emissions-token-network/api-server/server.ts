import express, { Application } from 'express';
import fileUpload from 'express-fileupload';
import expressContext from "express-request-context";
import bodyParser from 'body-parser';
import cors from 'cors';
import 'dotenv/config';
import morgan from 'morgan';
// sanity checks
const assertEnv = (key: string): string => {
  if (!process.env[key]) {
    console.error(`${key} must be set as an environment variable, check your .env`)
    process.exit(1);
  }
  return process.env[key] || '';
}
// assertEnv('MORALIS_API_KEY')
const contract_address = assertEnv('LEDGER_EMISSION_TOKEN_CONTRACT_ADDRESS')
const network_name = assertEnv('LEDGER_ETH_NETWORK')
const network_rpc_url = assertEnv('LEDGER_ETH_JSON_RPC_URL')
const network_ws_url = process.env['LEDGER_ETH_WS_URL']
export type OPTS_TYPE = {
  contract_address: string,
  network_rpc_url: string,
  network_ws_url?: string,
  network_name: string,
  // for subscriptions
  use_web_socket?: boolean,
  // allow bypass of the RPC call when running in Hardhat test
  contract?: Contract
}
export const OPTS: OPTS_TYPE = { contract_address, network_name, network_rpc_url, network_ws_url }

// import synchronizer
import { fillBalances, fillTokens, syncWallets, truncateTable } from './controller/synchronizer';

import router from './router/router';
import { subscribeEvent } from "./components/event.listener";
import { queryProcessing } from "./middleware/query.middle";

// for hardhat test!
import { synchronizeTokens } from "./middleware/sync.middle";
import { PostgresDBService } from 'blockchain-accounting-data-postgres/src/postgresDbService';
import { trpcMiddleware } from './trpc/common';
import { Contract } from 'ethers';

// DB connector
const db = PostgresDBService.getInstance()

const app: Application = express();
const PORT: number | string = process.env.TOKEN_QUERY_PORT || 8000;
const corsOptions = {
    origin: "http://localhost:3000"
}

// express-winston logger makes sense BEFORE the router
app.use(morgan('dev'));

// pass some context to all requests
app.use(expressContext());
app.use('/', (req, _, next) => {
  req.context.opts = OPTS;
  next();
});
// middleware setting
app.use(cors(corsOptions));
// enable files upload
app.use(fileUpload({
  createParentPath: true,
  useTempFiles : true,
  safeFileNames: true,
  preserveExtension: true,
  limits: { fileSize: 50 * 1024 * 1024 },
  tempFileDir : '/tmp/'
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
// needed for rate limiting behind a proxy (since in production this is behind the Apache proxy)
// this should still work locally even if no proxy are used
app.set('trust proxy', 1)

// for hardhat test sync
if(network_name === 'hardhat') {
    app.use('/tokens', synchronizeTokens);
    app.use('/balances', synchronizeTokens);
}


// router
app.use('/', queryProcessing, router);
app.use('/trpc', trpcMiddleware);

/**
 * TODOs.
 * 1. must make sure sync issued tokens between fillToken & subscribeEvent!
 */
db.then(async () => {
  // add truncate
  try {
    await truncateTable();
  } catch (err) {
    console.error('An error occurred while truncating the table', err)
    throw err
  }
  let elapsed = 0;
  const started = Date.now();
  console.log('--- Synchronization started at: ', new Date().toLocaleString());
  let lastBlock = 0;
  try {
    lastBlock = await fillTokens(OPTS);
    console.log('--first last block: ', lastBlock);
  } catch (err) {
    console.error('An error occurred while fetching the tokens', err)
    throw err
  }
  try {
    await fillBalances(lastBlock, OPTS);
  } catch (err) {
    console.error('An error occurred while filling balances', err)
    throw err
  }

  elapsed = Date.now() - started;
  console.log(`elapsed ${elapsed / 1000} seconds.\n`);

  // sync wallet roles
  await syncWallets(lastBlock, OPTS);

  try {
    // for hardhat
    if(network_name === 'bsctestnet') {
      subscribeEvent(lastBlock, OPTS);
    }
  } catch (err) {
    console.error('An error occurred while setting up the blockchain event handlers', err)
    throw err
  }
  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server is listening on ${PORT}\n`)
  });
})
  .catch((err) => {
    console.log("Fatal Error: ", err);
    process.exit(1);
  });
