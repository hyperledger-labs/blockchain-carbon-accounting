import express, { Application } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { config } from 'dotenv';
import findConfig from "find-config";
config({ path: findConfig(".env") || '.' });

// import router
import { router } from './app/routers/router';

const app: Application = express();
const PORT: number | string = process.env.SUPPLY_CHAIN_API_PORT || 5000;

const corsOptions = {
    origin: "http://localhost:3000"
}

// middleware setting
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use('/', router);

app.listen(PORT, () => {
    console.log(`Server is listening on ${PORT}`);
});
