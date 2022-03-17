import { ConnectionOptions } from "typeorm";
import { Token } from "../models/token.model";

const config: ConnectionOptions = {
  type: "postgres",
  host: process.env.PG_HOST || "localhost",
  port: Number(process.env.PG_PORT) || 5432,
  username: process.env.PG_USER || "postgres",
  password: process.env.PG_PASSWORD || "postgres",
  database: process.env.PG_DB || "postgres",
  entities: [Token],
  synchronize: true,
};

export default config;
