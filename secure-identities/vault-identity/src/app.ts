import express, { Application, json } from 'express';
import { log } from './utils/logger';
import { serve, setup } from 'swagger-ui-express';
import openAPI from './static/openapi.json';
import RouterV1 from './delivery/http/v1/v1';
import { VaultIdentityBackend } from './service/vault';
import cors from 'cors';

export default class App {
    private port: string;
    private app: Application;
    start(): void {
        this.port = process.env.APP_PORT || '9090';
        this.app = express();
        this.app.use(json());
        this.app.use(cors());

        this.__routers();

        this.app.listen(this.port, () => {
            log.info(`Server Started on port : ${this.port}`);
            log.info(`Server API Docs at : http://localhost:${this.port}/api-docs`);
        });
    }
    private __routers() {
        // fix link of openapi server
        openAPI.servers[0].url = `http://localhost:${this.port}/api/v1`;
        this.app.use('/api-docs', serve, setup(openAPI));

        const vaultBackend = new VaultIdentityBackend();
        this.app.use('/api/v1', new RouterV1(vaultBackend).router);
    }
}
