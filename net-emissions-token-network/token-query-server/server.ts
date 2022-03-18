import "reflect-metadata";
import express, { Application } from 'express';
import { createConnection } from "typeorm";
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
dotenv.config();

import dbConfig from './config/db.config';

// import synchronizer
import { fillTokens } from './controller/synchronizer';

import tokenRouter from './router/router';
import { synchronize } from "./middleware/sync.middle";

const app: Application = express();
const PORT: number | string = process.env.TOKEN_QUERY_PORT || 8000;

// middleware setting
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(synchronize);

// router
app.use('/', tokenRouter);

createConnection(dbConfig)
    .then(async (_connection) => {
        await fillTokens();
        app.listen(PORT, () => {
            console.log(`Server is listening on ${PORT}`)
        });
    })
    .catch((err) => {
        console.log("Unable to connect to db", err);
        process.exit(1);
    });
