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
import { startupSync } from './controller/synchronizer';

import router from './router/router';
import { subscribeToEvents } from "./components/event.listener";
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

  async function sync() {
    const lastBlock = await startupSync(OPTS);

    try {
      console.log('Subscribing to events starting from block:', lastBlock);
      subscribeToEvents(OPTS);
    } catch (err) {
      console.error('An error occurred while setting up the blockchain event handlers', err);
      throw err;
    }
  }
  // call this without await so the server can sync but also serve other requests in the meantime
  // unless we are on hardhat where to would conflict with the auto sync middleware
  // this means we do not throw 500 errors while this is still loading but the tokens
  // will show up with out of date or 0 balances until they are done loading
  if (network_name !== 'hardhat') {
    sync();
  } else {
    await sync();
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server is listening on ${PORT}\n`)
  });
})
  .catch((err) => {
    console.log("Fatal Error: ", err);
    process.exit(1);
  });
