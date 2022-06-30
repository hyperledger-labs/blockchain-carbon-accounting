// eslint-disable-next-line @typescript-eslint/no-unused-vars
import http from 'http';
import bodyParser from 'body-parser';
import { EmissionsFactorRepo } from './../../../../../../data/src/repositories/emissionsFactor.repo';
import { DataSource } from 'typeorm';
import express from 'express';

const AppDataSource = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'blockchain-carbon-accounting',
});

const app = express();
const port = 3001;

// const pool = new Pool({
//     user: process.env.DB_USER,
//     host: 'localhost',
//     database: 'blockchain-carbon-accounting',
//     password: process.env.DB_PASSWORD,
//     port: 5432,
// });

const getCO2EmissionFactor = (request, response) => {
    const a = new EmissionsFactorRepo(AppDataSource);
    const factor = JSON.parse(request.params.factor);
    const usage = Number(request.params.usage);
    const usageUom = request.params.usageUom;
    const m = a.getCO2EmissionFactor(factor, usage, usageUom);
    response.status(200).json(m);
};

app.use(bodyParser.json());
app.use(
    bodyParser.urlencoded({
        extended: true,
    }),
);

app.get('/', (request, response) => {
    response.json({ info: 'Node.js, Express, and Postgres API' });
});

app.post('/postgres', getCO2EmissionFactor);

app.listen(port, () => {
    console.log(`App running on port ${port}.`);
});
