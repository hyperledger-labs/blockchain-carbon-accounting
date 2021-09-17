import express, { Express, json, urlencoded } from "express";
import {
  Logger,
  LogLevelDesc,
  LoggerProvider,
} from "@hyperledger/cactus-common";
import v1 from "./routers/v1/index";
import openapiSpec from "./static/openapi.json";
import { serve, setup } from "swagger-ui-express";

export default class App {
  private readonly app: Express = express();
  private readonly log: Logger;
  private readonly PORT: number;
  constructor() {
    const level: LogLevelDesc =
      (process.env.APP_LOG_LEVEL as LogLevelDesc) || "INFO";
    this.log = LoggerProvider.getOrCreate({ label: "App", level: level });
    this.PORT = +process.env.APP_PORT || 9000;
  }

  start() {
    this.app.use(json());
    this.app.use(urlencoded({ extended: true }));

    this.__applyMiddleware();

    this.app.listen(this.PORT, async () => {
      this.log.info(
        `++++++++++++++++ Hyperledger CA2 SIG /// Carbon Accounting API ++++++++++++++++`
      );
      this.log.info(`++ REST API PORT : ${this.PORT}`);
      this.log.info(
        `++ ACCESS SWAGGER : http://localhost:${this.PORT}/api-docs/`
      );
      this.log.info(
        `++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++`
      );
    });
  }
  private __applyMiddleware() {
    openapiSpec.servers[0].url = `http://localhost:${this.PORT}/api/v1/utilityemissionchannel`;
    this.app.use("/api-docs", serve, setup(openapiSpec));
    this.app.use("/api/v1", v1);
  }
}
