import express, { Application } from 'express';
import expressContext from "express-request-context";
import bodyParser from 'body-parser';
import cors from 'cors';
import path from "path";
import { 
  parseCommonYargsOptions,
  PostgresDBService,
  QueryBundle,
} from "@blockchain-carbon-accounting/data-postgres"
import { trpcMiddleware } from './trpc/common';

import { config } from 'dotenv';
import findConfig from "find-config";
import morgan from 'morgan';

config({ path: findConfig(".env") || '.' });

// DB connector
const db = PostgresDBService.getInstance()

const app: Application = express();
const PORT: number | string = process.env.METHANE_SERVER_PORT || 8007;
const CORS: string[] = (process.env.METHANE_SERVER_CORS || 'http://localhost:3007').split(',');
const corsOptions = {
    origin: CORS
}
// pass some context to all requests
app.use(expressContext());

// middleware setting
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// router
app.use('/trpc', trpcMiddleware);

// Serve the React static files after build
//app.use(express.static("../client/build"));


app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Server is listening on ${PORT}\n`)
});

app.get('/', function (req, res) {
  res.sendFile(
    path.join(path.resolve("./client/", 'build', 'index.html'))
  );
});


app.get("/api/hello", (req, res) => {
  res.send({ message: "Hello" });
});

app.post("/api/query/operators", async(req, res) => { 
  const queryBundles: Array<QueryBundle> = req.body.queryBundles;
  const db = await PostgresDBService.getInstance(parseCommonYargsOptions({}))
  const lookup = await db.getOperatorRepo().selectPaginated(
    req.body.offset,req.body.limit,req.body.queryBundles)
  console.log(lookup)

  res.send(lookup);
});

export default app
