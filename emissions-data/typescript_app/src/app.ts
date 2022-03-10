import express, { Express, json, urlencoded } from 'express';
import { appLogger } from './utils/logger';
import v1 from './routers/v1/index';
import openapiSpec from './static/openapi.json';
import { serve, setup } from 'swagger-ui-express';
import { setup as serviceSetup } from './service/service';
import multer from 'multer';

export default class App {
    private readonly app: Express = express();
    private readonly PORT: number;
    constructor() {
        this.PORT = +process.env.APP_PORT || 9000;
        this.app.use(json());
        this.app.use(urlencoded({ extended: true }));
        const upload = multer();
        this.app.use(upload.single('emissionsDoc'));
    }

    start(): void {
        this.__applyMiddleware();

        // setup all the service
        serviceSetup()
            .then(() => {
                this.app.listen(this.PORT, async () => {
                    appLogger.info(
                        `++++++++++++++++ Hyperledger CA2 SIG /// Carbon Accounting API ++++++++++++++++`,
                    );
                    appLogger.info(`++ REST API PORT : ${this.PORT}`);
                    appLogger.info(`++ ACCESS SWAGGER : http://localhost:${this.PORT}/api-docs/`);
                    appLogger.info(
                        `++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++`,
                    );
                });
            })
            .catch((err) => {
                console.error(err);
                process.exit(1);
            });
    }
    private __applyMiddleware() {
        openapiSpec.servers[0].url = `http://localhost:${this.PORT}/api/v1/utilityemissionchannel`;
        this.app.use('/api-docs', serve, setup(openapiSpec));
        this.app.use('/api/v1', v1);
    }
}
