import { PostgresDBService } from '@blockchain-carbon-accounting/data-postgres';
import bodyParser from 'body-parser';
import cors from 'cors';
import { config } from 'dotenv';
import findConfig from "find-config";
config({ path: findConfig(".env") || '.' });
import { Contract } from 'ethers';

import express, { Application } from 'express';
import fileUpload from 'express-fileupload';
import expressContext from "express-request-context";
import morgan from 'morgan';
import { subscribeToEvents } from "./components/event.listener";
// import synchronizer
import { startupSync } from './controller/synchronizer';
import { queryProcessing } from "./middleware/query.middle";
import router from './router/router';
import { trpcMiddleware } from './trpc/common';

// sanity checks
const assertEnv = (key: string): string => {
  if (!process.env[key]) {
    console.error(`${key} must be set as an environment variable, check your .env`)
    process.exit(1);
  }
  return process.env[key] || '';
}
const contract_address = assertEnv('LEDGER_EMISSION_TOKEN_CONTRACT_ADDRESS')
const tracker_address = process.env['LEDGER_CARBON_TRACKER_ADDRESS']
const network_name = assertEnv('LEDGER_ETH_NETWORK')
const network_rpc_url = assertEnv('LEDGER_ETH_JSON_RPC_URL')
const network_ws_url = process.env['LEDGER_ETH_WS_URL']
export type OPTS_TYPE = {
  contract_address: string,
  tracker_address?: string,
  network_rpc_url: string,
  network_ws_url?: string,
  network_name: string,
  // for subscriptions
  use_web_socket?: boolean,
  // allow bypass of the RPC call when running in Hardhat test
  contract?: Contract
  trackerContract?: Contract
}
export const OPTS: OPTS_TYPE = { contract_address, tracker_address, network_name, network_rpc_url, network_ws_url }


// DB connector
const db = PostgresDBService.getInstance()

const app: Application = express();
const PORT: number | string = process.env.API_SERVER_PORT || 8000;
const CORS: string[] = (process.env.API_SERVER_CORS || 'http://localhost:3000').split(',');
const corsOptions = {
    origin: CORS
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

// router
app.use('/', queryProcessing, router);
app.use('/trpc', trpcMiddleware);

if ('true' !== process.env.SKIP_SYNC) {
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
} else {
  // in test environment, we do not want to sync
  // test runner will do the listen call
  console.log('Skipping sync, we are in test environment');

  if ('true' === process.env.START_SERVER) {
    // start the server when using to get data from postgres without sync
    console.log('Start the server without sync');
    app.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`Server is listening on ${PORT}\n`)
    });
  }
}
export default app