import { config } from 'dotenv';
import App from './app';
import { setup } from './utils/logger';

config();

const appLogLevel = process.env.APP_LOG_LEVEL || 'INFO';
const ledgerLogLevel = process.env.LEDGER_LOG_LEVEL || 'INFO';

setup(appLogLevel, ledgerLogLevel);

const app = new App();
app.start();
