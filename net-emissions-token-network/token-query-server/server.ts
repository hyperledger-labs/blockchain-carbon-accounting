import "reflect-metadata";
import express, { Application } from 'express';
import { createConnection } from "typeorm";
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import dbConfig from './config/db.config';
dotenv.config();

// import synchronizer
import { fillTokens } from './controller/synchronizer';

const app: Application = express();
const PORT: number | string = process.env.PORT || 8000;

// middleware setting
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// router
app.use('/', () => {
    
});

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
