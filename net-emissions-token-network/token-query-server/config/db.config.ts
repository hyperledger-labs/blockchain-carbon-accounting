import { ConnectionOptions } from "typeorm";
import { Token } from "../models/token.model";

const config: ConnectionOptions = {
  type: "postgres",
  host: process.env.PG_HOST || "127.0.0.1",
  port: Number(process.env.PG_PORT) || 5432,
  username: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DB || "blockchain-carbon-accounting",
  entities: [Token],
  synchronize: true,
};

export default config;
