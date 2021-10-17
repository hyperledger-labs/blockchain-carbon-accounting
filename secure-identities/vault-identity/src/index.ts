import { config } from 'dotenv';
import { setup } from './utils/logger';
import App from './app';

config();

setup(process.env.APP_LOG_LEVEL || 'info');

new App().start();
