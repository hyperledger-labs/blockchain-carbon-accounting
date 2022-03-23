import "reflect-metadata";
import express, { Application } from 'express';
import { createConnection } from "typeorm";
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

import dbConfig from './config/db.config';

// import synchronizer
import { fillTokens, truncateTable } from './controller/synchronizer';

import tokenRouter from './router/router';
import { synchronize } from "./middleware/sync.middle";
import { subscribeEvent } from "./components/event.listener";

const app: Application = express();
const PORT: number | string = process.env.TOKEN_QUERY_PORT || 8000;
const corsOptions = {
    origin: "http://localhost:3000"
}

// middleware setting
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
// app.use(synchronize);

// router
app.use('/', tokenRouter);

createConnection(dbConfig)
    .then(async (_connection) => {
        // add truncate
        try {
            await truncateTable();
        } catch (err) {
            console.error('An error occurred while truncating the table', err)
            throw err
        }
        try {
            await fillTokens();
        } catch (err) {
            console.error('An error occurred while fetching the tokens', err)
            throw err
        }
        try {
            subscribeEvent();
        } catch (err) {
            console.error('An error occurred while setting up the blockchain event handlers', err)
            throw err
        }
        app.listen(PORT, () => {
            console.log(`Server is listening on ${PORT}\n`)
        });
    })
    .catch((err) => {
        console.log("Fatal Error: ", err);
        process.exit(1);
    });
